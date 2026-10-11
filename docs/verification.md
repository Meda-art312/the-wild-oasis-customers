# Verification — 2026-10-11

## Completed checks

- Production build succeeds with Next.js 16.4.0 and React 19.
- Eight validation tests cover prices, night counts across Cairo daylight-saving changes, adjoining stays, overlap, dates, stay lengths, capacity, note length and edit eligibility.
- Live Supabase integration checks verify atomic identity provisioning, separate guests for different Google IDs with a shared email, concurrent overlap rejection, database-derived prices/status, ownership checks, capacity checks, and valid owner updates/cancellation.
- Generated QA bookings, guests and identity mappings were removed after the integration check.
- Customer migration applied successfully to the shared project. The original cabins, guests, bookings, settings and staff access policies were preserved.
- Production dependency audit reports zero known vulnerabilities.

## Fixes

- Replaced the dead image hostname with the configured Supabase host.
- Upgraded Next.js/React, updated async route APIs, and replaced obsolete lint configuration.
- Finished reservation submission and added the missing confirmation page.
- Moved all Supabase access behind a server-only client and private environment variables.
- Added explicit customer identity mappings; email alone cannot claim existing guest records.
- Protected every account page and mutation; edit queries are scoped to the signed-in guest.
- Added server/database validation and atomic customer reservation creation.
- Fixed missing cancellation imports and error handling.
- Corrected night counts, minimum stay configuration, availability boundaries and guest limits.
- Replaced the external countries API dependency with a local region list.
- Fixed image quality configuration and improved public layouts for smaller screens.

## Limitations

- Google OAuth client credentials are not configured. Real Google login, authenticated browser forms and logout still need an end-to-end check after the owner follows the README setup steps.
- No Vercel deployment has been created. Runtime environment variables and Google callback URLs must be configured there.
- Full npm audit still reports development-tool advisories in the ESLint/Tailwind glob-processing dependency trees; production dependencies pass. These should be revisited when compatible upstream updates are available.
- Customer writes use a privileged server key. Keep it private; the server code performs customer authorization, while anonymous/direct browser database access remains disabled.
- The staff dashboard can still enter overlapping bookings through its existing management permissions. Customer booking creation serializes its own availability check and insert; it does not add an exclusion constraint to historical staff data.
- Cancellation removes an upcoming unconfirmed booking instead of retaining an audit/cancellation history. Payments, emails and availability notifications are not implemented.
- Supabase Free may pause after inactivity; resume it in the dashboard if connections fail.

## Browser and route checks

- Public production pages load: home, About, cabin catalogue, cabin details and login.
- All nine existing cabin photos and the logo loaded from the configured project.
- Large-capacity filtering showed cabins 007 and 008.
- Selecting November 20–23 displayed three nights and a $1,500 total for cabin 007.
- Guest-area navigation redirected to login. Direct profile, reservation, edit and confirmation requests also returned login redirects.
- Without OAuth credentials, the login page displays a clear availability message.
- The public cabin endpoint exposes only occupied start/end date intervals, and a nonexistent cabin returns HTTP 404.
- No new browser warnings or errors appeared in the final catalogue check.
- ESLint passes with zero warnings. The production source scan found no private credentials; environment files remain ignored.

The existing database includes the prior staff test cabin named QA cabin (id 9); it remains visible because the customer site shares that catalogue. No existing hotel records were removed.
