import { cn } from "@/lib/utils";
import { ChecklistStatus, TaskStatus } from "@/types";

interface StatusBadgeProps {
  status: ChecklistStatus | TaskStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Checklist statuses
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  submitted: {
    label: "Submitted",
    className: "bg-info/10 text-info border-info/20",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  flagged: {
    label: "Flagged",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  // Task statuses
  new: {
    label: "New",
    className: "bg-info/10 text-info border-info/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
