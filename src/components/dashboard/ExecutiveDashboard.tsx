import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "./StatCard";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Download,
} from "lucide-react";

// Demo data
const pendingApprovals = [
  {
    id: "SUB-001",
    taskId: "TASK-156",
    type: "Certificate of Cleanliness",
    submittedBy: "John Smith",
    department: "Logistics",
    date: "19 Nov 2025",
    status: "pending" as const,
  },
  {
    id: "SUB-003",
    taskId: "TASK-154",
    type: "Decant Checklist",
    submittedBy: "Mike Brown",
    department: "Warehouse",
    date: "18 Nov 2025",
    status: "flagged" as const,
  },
  {
    id: "SUB-005",
    taskId: "TASK-153",
    type: "Certificate of Cleanliness",
    submittedBy: "Emma Davis",
    department: "Logistics",
    date: "18 Nov 2025",
    status: "pending" as const,
  },
];

export function ExecutiveDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Submissions"
          value={45}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Pending Review"
          value={8}
          icon={ClipboardList}
          variant="warning"
        />
        <StatCard
          title="Flagged"
          value={2}
          icon={AlertTriangle}
          variant="info"
        />
        <StatCard
          title="Approved Today"
          value={12}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Pending Review</CardTitle>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">
                    Submitted By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingApprovals.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {submission.taskId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">
                      {submission.type}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        <p className="text-sm">{submission.submittedBy}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.department}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/documents">
          <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Documents</p>
                <p className="text-xs text-muted-foreground">
                  Policies & procedures
                </p>
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
                <p className="text-xs text-muted-foreground">View all tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
