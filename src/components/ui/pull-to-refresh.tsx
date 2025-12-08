import { ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  progress: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  progress,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const isReady = progress >= 1;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
      style={{ height: pullDistance }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 transition-all duration-200",
          isReady && !isRefreshing && "bg-primary/20 scale-110",
          isRefreshing && "bg-primary/20"
        )}
        style={{
          opacity: Math.min(progress * 1.5, 1),
          transform: `rotate(${progress * 180}deg)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <ArrowDown
            className={cn(
              "h-5 w-5 text-primary transition-transform duration-200",
              isReady && "rotate-180"
            )}
          />
        )}
      </div>
    </div>
  );
}

interface PullToRefreshContainerProps {
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  pullDistance: number;
  progress: number;
  isRefreshing: boolean;
}

export function PullToRefreshContainer({
  children,
  containerRef,
  pullDistance,
  progress,
  isRefreshing,
}: PullToRefreshContainerProps) {
  return (
    <div ref={containerRef} className="min-h-full">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        progress={progress}
        isRefreshing={isRefreshing}
      />
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
