import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  info: "bg-info/10 border-info/20",
};

const iconStyles = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  info: "bg-info/20 text-info",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5 shadow-card transition-shadow hover:shadow-elevated",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              variant === "primary"
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconStyles[variant])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
