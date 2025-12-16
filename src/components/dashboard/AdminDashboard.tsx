import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "./StatCard";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  ClipboardList,
  FileText,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
  Clock,
} from "lucide-react";

type SubmissionStatus = "pending" | "submitted" | "approved" | "rejected" | "flagged";

interface RecentSubmission {
  id: string;
  status: SubmissionStatus;
  created_at: string;
  submitted_by_name: string | null;
  task_attachment: {
    title: string;
    task: {
      docket_number: string;
      customer_name: string;
      delivery_address: string;
    } | null;
  } | null;
}

export function AdminDashboard() {
  const { user } = useAuth();

  // Fetch recent submissions
  const { data: recentSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["recent-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select(`
          id,
          status,
          created_at,
          submitted_by_name,
          task_attachment:task_attachment_id (
            title,
            task:task_id (
              docket_number,
              customer_name,
              delivery_address
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent submissions:", error);
        throw error;
      }

      return (data || []) as unknown as RecentSubmission[];
    },
  });

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
            {submissionsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No submissions yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Task Docket
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
                        {submission.task_attachment?.task?.docket_number ? `Docket# ${submission.task_attachment?.task?.docket_number}` : ""}
                        <br/>{submission.task_attachment?.task?.customer_name ? `Customer# ${submission.task_attachment?.task?.customer_name}` : ""}
                        <br/>{submission.task_attachment?.task?.delivery_address ? `Delivery# ${submission.task_attachment?.task?.delivery_address}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {submission.task_attachment?.title || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {submission.submitted_by_name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {format(new Date(submission.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={submission.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
