import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Settings,
  Truck,
  Package,
  CheckSquare,
  PlusCircle,
  ListChecks,
  LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  end?: boolean; // For exact route matching
}

// Admin navigation items
export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Create Task", href: "/tasks/create", icon: PlusCircle, end: true },
  { label: "All Tasks", href: "/tasks", icon: ClipboardList, end: true },
  { label: "Submissions", href: "/submissions", icon: FileText, end: true },
  { label: "Documents", href: "/documents", icon: Package, end: true },
  { label: "Users", href: "/users", icon: Users, end: true },
  { label: "Checklist Templates", href: "/checklist-templates", icon: ListChecks, end: true },
  { label: "Settings", href: "/settings", icon: Settings, end: true },
];

// Driver navigation items
export const driverNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My Tasks", href: "/tasks", icon: Truck, end: true },
  { label: "My Checklists", href: "/checklists", icon: CheckSquare },
  { label: "Documents", href: "/documents", icon: Package, end: true },
];

// Warehouse navigation items
export const warehouseNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Tasks", href: "/tasks", icon: ClipboardList, end: true },
  { label: "My Checklists", href: "/checklists", icon: CheckSquare },
  { label: "Submissions", href: "/submissions", icon: FileText, end: true },
  { label: "Documents", href: "/documents", icon: Package, end: true },
];

// Executive & Operational Lead navigation items
export const executiveNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "All Tasks", href: "/tasks", icon: ClipboardList, end: true },
  { label: "Submissions", href: "/submissions", icon: FileText, end: true },
  { label: "Documents", href: "/documents", icon: Package, end: true },
  { label: "Users", href: "/users", icon: Users, end: true },
];

// Get navigation items by role
export function getNavItemsByRole(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNavItems;
    case "driver":
      return driverNavItems;
    case "warehouse":
      return warehouseNavItems;
    case "executive":
    case "operational_lead":
      return executiveNavItems;
    default:
      return [];
  }
}

// Get mobile nav items (excludes Dashboard, limited to 4 to leave room for "More")
export function getMobileNavItems(role: UserRole): NavItem[] {
  return getNavItemsByRole(role)
    .filter((item) => item.label !== "Dashboard")
    .slice(0, 4);
}
