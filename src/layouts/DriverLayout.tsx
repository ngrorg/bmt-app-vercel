import { BaseLayout } from "./BaseLayout";
import { driverNavItems } from "@/config/navigation";

export function DriverLayout() {
  return <BaseLayout navItems={driverNavItems} />;
}
