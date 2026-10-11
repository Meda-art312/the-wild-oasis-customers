import { requireGuest } from "../_lib/auth";
import SideNavigation from "../_components/SideNavigation.js";

export default async function Layout({ children }) {
  await requireGuest();
  return (
    <div className="grid md:grid-cols-[14rem_1fr] h-full gap-6 md:gap-12">
      <SideNavigation />

      <div className="py-1">{children}</div>
    </div>
  );
}
