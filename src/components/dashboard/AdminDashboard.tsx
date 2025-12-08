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
  TrendingUp,
  Plus,
  ChevronRight,
  Clock,
} from "lucide-react";

// Demo data
const recentSubmissions = [
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
  {
    id: "SUB-003",
    taskId: "TASK-154",
    type: "Decant Checklist",
    submittedBy: "Mike Brown",
    date: "18 Nov 2025",
    status: "flagged" as const,
  },
];

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}
          </p>
        </div>
        <Link to="/tasks/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Tasks"
          value={8}
          icon={ClipboardList}
          variant="primary"
        />
        <StatCard
          title="New Tasks"
          value={5}
          icon={TrendingUp}
          variant="info"
        />
        <StatCard
          title="In Progress"
          value={2}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Total Users"
          value={23}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Recent Submissions</CardTitle>
          <Link to="/submissions">
            <Button variant="ghost" size="sm" className="text-accent">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Task ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
                    Submitted By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {submission.taskId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{submission.type}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">
                      {submission.submittedBy}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {submission.date}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={submission.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/users">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Manage Users</p>
                <p className="text-xs text-muted-foreground">23 users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/documents">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Documents</p>
                <p className="text-xs text-muted-foreground">12 files</p>
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
                <p className="text-xs text-muted-foreground">8 tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/submissions">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Submissions</p>
                <p className="text-xs text-muted-foreground">45 total</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
