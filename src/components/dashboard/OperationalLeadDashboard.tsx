import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "./StatCard";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  Users,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// Demo data
const teamSubmissions = [
  {
    id: "SUB-001",
    taskId: "TASK-156",
    type: "Certificate of Cleanliness",
    submittedBy: "John Smith",
    date: "19 Nov 2025",
    status: "pending" as const,
  },
  {
    id: "SUB-002",
    taskId: "TASK-155",
    type: "Pre-Start Declaration",
    submittedBy: "Sarah Johnson",
    date: "19 Nov 2025",
    status: "approved" as const,
  },
];

export function OperationalLeadDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Team Members"
          value={8}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Pending Reviews"
          value={3}
          icon={ClipboardList}
          variant="warning"
        />
        <StatCard
          title="Exceptions"
          value={1}
          icon={AlertCircle}
          variant="info"
        />
        <StatCard
          title="Completed Today"
          value={5}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Team Submissions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Team Submissions</CardTitle>
          <Link to="/submissions">
            <Button variant="ghost" size="sm" className="text-accent">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {teamSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {submission.taskId}
                      </span>
                      <StatusBadge status={submission.status} />
                    </div>
                    <p className="font-medium truncate">{submission.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.submittedBy} • {submission.date}
                    </p>
                  </div>
                  {submission.status === "pending" && (
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/users">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Team Members</p>
                <p className="text-xs text-muted-foreground">Manage team</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tasks">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">All Tasks</p>
                <p className="text-xs text-muted-foreground">View tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
