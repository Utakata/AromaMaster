"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { alertLevel } from "@/domain/inventory";
import { useAppData } from "@/lib/store";

const LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/blend", label: "調合する" },
  { href: "/inventory", label: "在庫" },
  { href: "/recipes", label: "レシピ" },
  { href: "/library", label: "精油" },
  { href: "/settings", label: "設定" },
];

export function Nav() {
  const path = usePathname();
  const { inventory } = useAppData();
  const alerts = inventory.filter((i) => alertLevel(i)).length;

  const link = (l: (typeof LINKS)[number], mobile: boolean) => {
    const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={
          mobile
            ? `relative flex flex-1 flex-col items-center py-2 text-[11px] ${active ? "text-primary font-bold" : "text-muted"}`
            : `relative rounded-md px-3 py-2 text-sm ${active ? "bg-surface-2 text-primary font-bold" : "text-muted hover:text-fg"}`
        }
      >
        {l.label}
        {l.href === "/inventory" && alerts > 0 && (
          <span aria-label={`要確認 ${alerts} 件`} className="absolute right-1 top-1 rounded-full bg-danger px-1.5 text-[10px] leading-4 text-white">
            {alerts}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-bold text-primary">
            AromaMaster
          </Link>
          <nav aria-label="メイン" className="hidden gap-1 sm:flex">
            {LINKS.map((l) => link(l, false))}
          </nav>
        </div>
      </header>
      <nav aria-label="メイン（モバイル）" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface sm:hidden">
        {LINKS.map((l) => link(l, true))}
      </nav>
    </>
  );
}
