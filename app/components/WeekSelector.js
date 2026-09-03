"use client";
// app/components/WeekSelector.js

import { useRouter } from "next/navigation";

export default function WeekSelector({ options, current, leagueId }) {
  const router = useRouter();

  function handleChange(e) {
    router.push(`/schedule?league=${leagueId}&week=${e.target.value}`);
  }

  return (
    <select
      value={current.real_week}
      onChange={handleChange}
      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-medium"
    >
      {options.map((opt) => (
        <option key={opt.real_week} value={opt.real_week}>
          Week {opt.real_week}
        </option>
      ))}
    </select>
  );
}
