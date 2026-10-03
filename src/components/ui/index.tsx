/*
 * 基本 UI コンポーネント。見た目は tokens.css のトークンのみに依存させ、Claude Design の成果物で差し替えやすくしている。
 */
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes, ReactNode } from "react";
import type { EvidenceLevel, InventoryStatus } from "@/domain/types";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  secondary: "bg-surface text-fg border border-line hover:bg-surface-2",
  ghost: "text-primary hover:bg-surface-2",
  danger: "bg-surface text-danger border border-danger/40 hover:bg-danger/10",
};
const BTN = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium min-h-11 transition disabled:opacity-40 disabled:cursor-not-allowed";

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cx(BTN, VARIANT[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BTN, VARIANT[variant], className)} {...props} />;
}

export function ExternalButton({ variant = "primary", className, ...props }: ComponentProps<"a"> & { variant?: Variant }) {
  return <a target="_blank" rel="noopener noreferrer sponsored" className={cx(BTN, VARIANT[variant], className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-lg border border-line bg-surface p-4 shadow-card", className)} {...props} />;
}

export function Chip({ selected, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "rounded-full border px-3 py-1.5 text-sm min-h-9 transition",
        selected ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-fg hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-2 text-xs" aria-label="進行状況">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? "step" : undefined}
          className={cx(
            "flex-1 rounded-full px-2 py-1 text-center border",
            i === current ? "border-primary bg-primary text-on-primary" : i < current ? "border-primary text-primary" : "border-line text-muted",
          )}
        >
          {s}
        </li>
      ))}
    </ol>
  );
}

export function Meter({ value, max, label }: { value: number | null; max: number; label: string }) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const tone = value === null ? "bg-muted/40" : pct <= 20 ? "bg-danger" : pct <= 40 ? "bg-warning" : "bg-success";
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value ?? undefined} className="h-2 w-full rounded-full bg-surface-2">
      <div className={cx("h-2 rounded-full", tone)} style={{ width: value === null ? "100%" : `${pct}%`, opacity: value === null ? 0.4 : 1 }} />
    </div>
  );
}

const EV_CLASS: Record<EvidenceLevel, string> = { A: "bg-ev-a", B: "bg-ev-b", C: "bg-ev-c" };
const EV_TITLE: Record<EvidenceLevel, string> = {
  A: "根拠レベル A: 系統的レビュー・複数のヒト試験",
  B: "根拠レベル B: 小規模なヒト研究",
  C: "根拠レベル C: 動物研究・伝統的使用",
};
export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <span title={EV_TITLE[level]} className={cx("inline-block rounded-sm px-1.5 py-0.5 text-xs font-bold text-white", EV_CLASS[level])}>
      根拠{level}
    </span>
  );
}

const STATUS_CLASS: Record<InventoryStatus, string> = {
  new: "border-success text-success",
  in_use: "border-primary text-primary",
  unknown: "border-warning text-warning",
  empty: "border-danger text-danger",
};
export function StatusBadge({ status, children }: { status: InventoryStatus; children: ReactNode }) {
  return <span className={cx("inline-block rounded-full border px-2 py-0.5 text-xs", STATUS_CLASS[status])}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass = "w-full rounded-md border border-line bg-surface px-3 py-2 text-base min-h-11";

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "success"; children: ReactNode }) {
  const t = { info: "border-line bg-surface-2", warning: "border-warning/50 bg-warning/10", danger: "border-danger/50 bg-danger/10", success: "border-success/50 bg-success/10" }[tone];
  return <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-md border px-3 py-2 text-sm", t)}>{children}</div>;
}

export function PageTitle({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold">{title}</h1>
      {lead && <p className="text-sm text-muted">{lead}</p>}
    </header>
  );
}
