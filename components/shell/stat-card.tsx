import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon: Icon,
  children,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="bg-card border-border flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11.5px]">{label}</span>
        <span className="bg-muted flex size-6 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground size-3.5" />
        </span>
      </div>
      <span className="text-[25px] leading-none font-semibold tracking-[-0.6px]">
        {value}
      </span>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-border text-muted-foreground flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description ? <p className="text-xs">{description}</p> : null}
    </div>
  );
}
