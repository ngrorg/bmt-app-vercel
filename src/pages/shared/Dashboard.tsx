import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DriverDashboard } from "@/components/dashboard/DriverDashboard";
import { WarehouseDashboard } from "@/components/dashboard/WarehouseDashboard";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { OperationalLeadDashboard } from "@/components/dashboard/OperationalLeadDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const dashboardComponents = {
    admin: AdminDashboard,
    driver: DriverDashboard,
    warehouse: WarehouseDashboard,
    executive: ExecutiveDashboard,
    operational_lead: OperationalLeadDashboard,
  };

  const DashboardComponent = dashboardComponents[user.role];

  return <DashboardComponent />;
}
