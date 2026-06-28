"use client";

import Link from "next/link";

export function HomeButton({
  color = "slate",
}: {
  color?: "slate" | "white" | "green";
}) {
  const styles = {
    slate:
      "text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200",
    white:
      "text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border-white/20",
    green:
      "text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 border-green-200",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${styles[color]}`}
    >
      ← ホーム
    </Link>
  );
}
