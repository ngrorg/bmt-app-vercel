import { BaseLayout } from "./BaseLayout";
import { warehouseNavItems } from "@/config/navigation";

export function WarehouseLayout() {
  return <BaseLayout navItems={warehouseNavItems} />;
}
