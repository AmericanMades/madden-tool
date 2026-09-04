"use client";
// app/components/PositionFilter.js

import { useRouter, usePathname } from "next/navigation";

export default function PositionFilter({ positions, current, extraParams = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e) {
    const pos = e.target.value;
    const posParam = pos === "ALL" ? "" : `&position=${pos}`;
    router.push(`${pathname}?${extraParams}${posParam}`);
  }

  return (
    <select
      value={current || "ALL"}
      onChange={handleChange}
      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-medium"
    >
      <option value="ALL">All Positions</option>
      {positions.map((pos) => (
        <option key={pos} value={pos}>
          {pos}
        </option>
      ))}
    </select>
  );
}
