import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive: boolean; label?: string };
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, iconBg = "bg-blue-50", iconColor = "text-[#155dfc]", trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-[14px] border border-gray-200 p-6 flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-sm text-[#6a7282] font-normal">{title}</p>
          <p className="text-3xl font-semibold text-[#101828]">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn("text-sm font-medium", trend.positive ? "text-[#00a63e]" : "text-[#e7000b]")}>
                {trend.value}
              </span>
              {trend.label && <span className="text-xs text-[#6a7282]">{trend.label}</span>}
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
}
