import { getCountries } from "../_lib/data-service";
export default async function SelectCountry({
  defaultCountry,
  name,
  id,
  className,
}) {
  const countries = await getCountries();
  return (
    <select
      name={name}
      id={id}
      defaultValue={defaultCountry ?? ""}
      className={className}
    >
      <option value="">Select country...</option>
      {countries.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
