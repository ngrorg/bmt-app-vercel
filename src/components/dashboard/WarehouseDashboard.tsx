import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "./StatCard";
import { Link } from "react-router-dom";
import {
  Package,
  ClipboardCheck,
  FileText,
  ChevronRight,
  Clock,
} from "lucide-react";

// Demo data
const pendingDecants = [
  {
    id: "TASK-155",
    customer: "ARDEX AUSTRALIA",
    product: "Industrial Resin",
    decantDate: "24 Nov 2025",
    status: "in_progress" as const,
    cleanlinessVerified: true,
  },
  {
    id: "TASK-157",
    customer: "XYZ Industries",
    product: "High Alumina Cement",
    decantDate: "25 Nov 2025",
    status: "new" as const,
    cleanlinessVerified: false,
  },
];

export function WarehouseDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Pending Decants"
          value={2}
          icon={Package}
          variant="warning"
        />
        <StatCard
          title="Completed Today"
          value={3}
          icon={ClipboardCheck}
          variant="success"
        />
        <StatCard
          title="My Submissions"
          value={15}
          icon={FileText}
          variant="default"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Quick Action */}
      <Link to="/checklists/decant">
        <Card className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Submit Decant Checklist</p>
                <p className="text-sm opacity-80">
                  Complete decant documentation
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6" />
          </CardContent>
        </Card>
      </Link>

      {/* Pending Tasks for Decant */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Tasks Pending Decant</CardTitle>
          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="text-accent">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {pendingDecants.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {task.id}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="font-medium truncate">{task.customer}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {task.product}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Decant: {task.decantDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cleanliness</p>
                    <p
                      className={`text-sm font-medium ${
                        task.cleanlinessVerified
                          ? "text-success"
                          : "text-warning"
                      }`}
                    >
                      {task.cleanlinessVerified ? "Verified" : "Pending"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Submissions */}
      <Link to="/submissions">
        <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">View Submissions</p>
                <p className="text-sm text-muted-foreground">
                  All checklist submissions
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
