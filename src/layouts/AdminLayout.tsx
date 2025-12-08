import { BaseLayout } from "./BaseLayout";
import { adminNavItems } from "@/config/navigation";

export function AdminLayout() {
  return <BaseLayout navItems={adminNavItems} />;
}
