import { BaseLayout } from "./BaseLayout";
import { executiveNavItems } from "@/config/navigation";

export function ExecutiveLayout() {
  return <BaseLayout navItems={executiveNavItems} />;
}
