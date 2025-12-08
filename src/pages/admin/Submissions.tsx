import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Download, Eye, CheckCircle, XCircle, Flag } from "lucide-react";
import { ChecklistStatus } from "@/types";

// Demo data
const submissions = [
  {
    id: "SUB-001",
    taskId: "TASK-156",
    type: "Certificate of Cleanliness",
    submittedBy: "John Smith",
    department: "Logistics",
    date: "19 Nov 2025",
    status: "pending" as ChecklistStatus,
  },
  {
    id: "SUB-002",
    taskId: "TASK-155",
    type: "Pre-Start Declaration",
    submittedBy: "Sarah Johnson",
    department: "Logistics",
    date: "19 Nov 2025",
    status: "approved" as ChecklistStatus,
  },
  {
    id: "SUB-003",
    taskId: "TASK-154",
    type: "Decant Checklist",
    submittedBy: "Mike Brown",
    department: "Warehouse",
    date: "18 Nov 2025",
    status: "flagged" as ChecklistStatus,
  },
  {
    id: "SUB-004",
    taskId: "TASK-153",
    type: "Certificate of Cleanliness",
    submittedBy: "Emma Davis",
    department: "Logistics",
    date: "18 Nov 2025",
    status: "pending" as ChecklistStatus,
  },
  {
    id: "SUB-005",
    taskId: "TASK-152",
    type: "Pre-Start Declaration",
    submittedBy: "David Wilson",
    department: "Logistics",
    date: "17 Nov 2025",
    status: "rejected" as ChecklistStatus,
  },
];

export default function Submissions() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const canReview = ["admin", "executive", "operational_lead"].includes(
    user?.role || ""
  );

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.taskId.toLowerCase().includes(search.toLowerCase()) ||
      sub.type.toLowerCase().includes(search.toLowerCase()) ||
      sub.submittedBy.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground">
            {filteredSubmissions.length} checklist submissions
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, type, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-11">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredSubmissions.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-sm font-semibold text-accent">
                    {sub.taskId}
                  </span>
                  <p className="font-medium mt-1">{sub.type}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                <p>{sub.submittedBy}</p>
                <p>
                  {sub.department} • {sub.date}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {canReview && sub.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" className="text-success">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-warning">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submissions Table - Desktop */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Task ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Department
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Checklist Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Submitted By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                    Date
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
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {sub.taskId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{sub.department}</td>
                    <td className="px-4 py-3 text-sm">{sub.type}</td>
                    <td className="px-4 py-3 text-sm">{sub.submittedBy}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sub.date}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canReview && sub.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success hover:text-success"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
