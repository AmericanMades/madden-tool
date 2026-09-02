// lib/madden.js
//
// Helpers for working with the real standings export shape confirmed
// from a live Madden Companion App export:
//   { message, success, teamStandingInfoList: [ {..fields..}, ... ] }
//
// winLossStreak decoding: values 1-5 seen as plain positive numbers
// for winning streaks, and 251-255 seen for losing streaks. This
// matches a signed 8-bit byte where negative numbers wrap around
// (256 + n). Decoded as: value > 128 -> losing streak of (256 -
// value) games; otherwise -> winning streak of `value` games.
// Genuinely inferred from the pattern in this one real sample, not
// confirmed against any Madden documentation (there isn't any) —
// worth double-checking against a team you know is on a losing
// streak once more export data comes in.

export function decodeStreak(value) {
  if (value == null) return null;
  if (value > 128) {
    const losses = 256 - value;
    return { type: "L", count: losses, label: `L${losses}` };
  }
  return { type: "W", count: value, label: `W${value}` };
}

// Real hex colors for each team's primary color, used for small
// badge accents next to team names throughout the app.
export const TEAM_COLORS = {
  Ravens: "#241773", Steelers: "#FFB612", Bengals: "#FB4F14", Browns: "#311D00",
  Jaguars: "#006778", Titans: "#4B92DB", Texans: "#03202F", Colts: "#002C5F",
  Dolphins: "#008E97", Jets: "#125740", Patriots: "#002244", Bills: "#00338D",
  Raiders: "#A5ACAF", Broncos: "#FB4F14", Chargers: "#0080C6", Chiefs: "#E31837",
  Lions: "#0076B6", Packers: "#203731", Vikings: "#4F2683", Bears: "#0B162A",
  Falcons: "#A71930", Panthers: "#0085CA", Saints: "#D3BC8D", Buccaneers: "#D50A0A",
  Cowboys: "#041E42", Eagles: "#004C54", Giants: "#0B2265", Commanders: "#5A1414",
  "49ers": "#AA0000", Rams: "#003594", Seahawks: "#69BE28", Cardinals: "#97233F",
};

export function groupByDivision(teams) {
  const out = { AFC: {}, NFC: {} };
  for (const t of teams) {
    const conf = t.conferenceName;
    const div = t.divisionName;
    if (!out[conf]) out[conf] = {};
    if (!out[conf][div]) out[conf][div] = [];
    out[conf][div].push(t);
  }
  for (const conf of Object.keys(out)) {
    for (const div of Object.keys(out[conf])) {
      out[conf][div].sort((a, b) => b.winPct - a.winPct);
    }
  }
  return out;
}

export function getPlayoffRace(teams, conferenceName, count = 10) {
  return teams
    .filter((t) => t.conferenceName === conferenceName)
    .sort((a, b) => (a.seed || 99) - (b.seed || 99))
    .slice(0, count);
}
