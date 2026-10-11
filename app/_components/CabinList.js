import { getCabins } from "../_lib/data-service.js";
// import { unstable_noStore as noStore } from "next/cache.js";
import CabinCard from "./CabinCard.js";

async function CabinList({ filter }) {
  // noStore();
  const cabins = await getCabins();
  if (!cabins.length) return <p>No cabins are available yet.</p>;

  let displayedCabins = cabins;
  if (filter === "all") displayedCabins = cabins;
  if (filter === "small")
    displayedCabins = cabins.filter((cabin) => cabin.maxCapacity <= 3);
  if (filter === "medium")
    displayedCabins = cabins.filter(
      (cabin) => cabin.maxCapacity >= 4 && cabin.maxCapacity <= 7,
    );
  if (filter === "large")
    displayedCabins = cabins.filter((cabin) => cabin.maxCapacity >= 8);

  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-14">
      {displayedCabins.length === 0 && <p>No cabins match this filter.</p>}
      {displayedCabins.map((cabin) => (
        <CabinCard cabin={cabin} key={cabin.id} />
      ))}
    </div>
  );
}

export default CabinList;
