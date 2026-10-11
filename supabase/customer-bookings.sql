-- Apply once to the EXISTING Wild Oasis staff database.
-- Customer sessions use Google/Auth.js, not Supabase Auth.
-- No customer/anonymous table access is added. Only the trusted server key
-- can execute these functions; server actions supply the signed-in guest ID.
begin;

-- Link Google identities explicitly. Do not claim existing guest records by email:
-- tutorial data and staff-created guests can share the same email address.
create table if not exists public.customer_profiles (
  google_subject text primary key,
  guest_id bigint not null unique references public.guests(id) on delete cascade
);
alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from public, anon, authenticated;
grant select, insert, update, delete on public.customer_profiles to service_role;

create or replace function public.ensure_customer_guest(p_google_subject text, p_email text, p_full_name text)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare result_id bigint;
begin
  if p_google_subject is null or length(p_google_subject) < 1
    or p_email is null or length(p_email) < 3 then raise exception 'Verified Google identity is required.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_google_subject,0));
  select guest_id into result_id from public.customer_profiles where google_subject = p_google_subject;
  if found then return result_id; end if;
  insert into public.guests(email,"fullName") values(lower(trim(p_email)),coalesce(nullif(trim(p_full_name),''),p_email))
    returning id into result_id;
  insert into public.customer_profiles(google_subject,guest_id) values(p_google_subject,result_id);
  return result_id;
end;
$$;
revoke all on function public.ensure_customer_guest(text,text,text) from public, anon, authenticated;
grant execute on function public.ensure_customer_guest(text,text,text) to service_role;

create or replace function public.create_customer_booking(
  p_guest_id bigint, p_cabin_id bigint, p_start_date date, p_end_date date,
  p_num_guests integer, p_observations text default ''
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  cabin public.cabins%rowtype;
  rules public.settings%rowtype;
  nights integer;
  price numeric;
  result_id bigint;
begin
  -- Serialize the availability check and insert, including concurrent table writers.
  lock table public.bookings in share row exclusive mode;
  select * into cabin from public.cabins where id = p_cabin_id for share;
  if not found then raise exception 'Cabin no longer exists.'; end if;
  select * into rules from public.settings where id = 1 for share;
  if not found then raise exception 'Booking settings are unavailable.'; end if;
  if not exists(select 1 from public.guests where id = p_guest_id) then
    raise exception 'Guest profile is unavailable.';
  end if;
  if p_start_date is null or p_end_date is null
    or p_start_date < (current_timestamp at time zone 'UTC')::date then
    raise exception 'Please select valid future arrival and departure dates.';
  end if;
  nights := p_end_date - p_start_date;
  if nights < rules."minBookingLength" or nights > rules."maxBookingLength" then
    raise exception 'Stay length is outside the allowed range.';
  end if;
  if p_num_guests is null or p_num_guests < 1
    or p_num_guests > least(cabin."maxCapacity", rules."maxGuestsPerBooking") then
    raise exception 'Guest count exceeds the allowed capacity.';
  end if;
  if length(coalesce(p_observations, '')) > 1000 then
    raise exception 'Please keep your notes under 1,000 characters.';
  end if;
  if exists(select 1 from public.bookings b where b."cabinId" = p_cabin_id
    and b.status <> 'checked-out'
    and (b."startDate" at time zone 'UTC')::date < p_end_date
    and (b."endDate" at time zone 'UTC')::date > p_start_date) then
    raise exception 'Those dates are no longer available. Please choose another stay.';
  end if;
  price := nights * (cabin."regularPrice" - cabin.discount);
  insert into public.bookings (
    "startDate","endDate","numNights","numGuests","cabinPrice","extrasPrice","totalPrice",
    status,"hasBreakfast","isPaid",observations,"cabinId","guestId"
  ) values (
    p_start_date::timestamp at time zone 'UTC', p_end_date::timestamp at time zone 'UTC',
    nights,p_num_guests,price,0,price,'unconfirmed',false,false,coalesce(p_observations,''),p_cabin_id,p_guest_id
  ) returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.update_customer_booking(
  p_booking_id bigint, p_guest_id bigint, p_num_guests integer, p_observations text default ''
) returns void language plpgsql security invoker set search_path = '' as $$
declare reservation public.bookings%rowtype; capacity integer;
begin
  select * into reservation from public.bookings
    where id = p_booking_id and "guestId" = p_guest_id for update;
  if not found then raise exception 'Reservation not found.'; end if;
  if reservation.status <> 'unconfirmed'
    or (reservation."startDate" at time zone 'UTC')::date < (current_timestamp at time zone 'UTC')::date then
    raise exception 'Only upcoming, unconfirmed reservations can be changed.';
  end if;
  select least(c."maxCapacity", s."maxGuestsPerBooking") into capacity
    from public.cabins c cross join public.settings s where c.id = reservation."cabinId" and s.id = 1;
  if p_num_guests is null or p_num_guests < 1 or p_num_guests > capacity then
    raise exception 'Guest count exceeds the allowed capacity.';
  end if;
  if length(coalesce(p_observations,'')) > 1000 then raise exception 'Please keep your notes under 1,000 characters.'; end if;
  update public.bookings set "numGuests" = p_num_guests, observations = coalesce(p_observations,'')
    where id = p_booking_id and "guestId" = p_guest_id;
end;
$$;

create or replace function public.cancel_customer_booking(p_booking_id bigint, p_guest_id bigint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.bookings where id = p_booking_id and "guestId" = p_guest_id
    and status = 'unconfirmed'
    and ("startDate" at time zone 'UTC')::date >= (current_timestamp at time zone 'UTC')::date;
  if not found then raise exception 'Only your upcoming, unconfirmed reservations can be cancelled.'; end if;
end;
$$;

revoke all on function public.create_customer_booking(bigint,bigint,date,date,integer,text) from public, anon, authenticated;
revoke all on function public.update_customer_booking(bigint,bigint,integer,text) from public, anon, authenticated;
revoke all on function public.cancel_customer_booking(bigint,bigint) from public, anon, authenticated;
grant execute on function public.create_customer_booking(bigint,bigint,date,date,integer,text) to service_role;
grant execute on function public.update_customer_booking(bigint,bigint,integer,text) to service_role;
grant execute on function public.cancel_customer_booking(bigint,bigint) to service_role;

commit;
