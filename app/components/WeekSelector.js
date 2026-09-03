"use client";
// app/components/WeekSelector.js

import { useRouter } from "next/navigation";

const SEASON_TYPE_LABELS = {
  pre: "Preseason",
  preseason: "Preseason",
  reg: "Regular Season",
  regular: "Regular Season",
  post: "Postseason",
  postseason: "Postseason",
  playoffs: "Postseason",
};

function optionLabel(opt) {
  const seasonLabel = SEASON_TYPE_LABELS[opt.season_type] || opt.season_type;
  return `${seasonLabel} — Week ${opt.week}`;
}

export default function WeekSelector({ options, current, leagueId }) {
  const router = useRouter();

  function handleChange(e) {
    const [seasonType, week] = e.target.value.split("|");
    router.push(`/schedule?league=${leagueId}&seasonType=${seasonType}&week=${week}`);
  }

  return (
    <select
      value={`${current.season_type}|${current.week}`}
      onChange={handleChange}
      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-medium"
    >
      {options.map((opt) => (
        <option key={`${opt.season_type}|${opt.week}`} value={`${opt.season_type}|${opt.week}`}>
          {optionLabel(opt)}
        </option>
      ))}
    </select>
  );
}
