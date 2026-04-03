export interface MatchData {
  matchNumber: number;
  date: string;
  time: string;
  stage: string;
  group: string;
  city: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
}

const teamFlags: Record<string, string> = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "USA": "🇺🇸", "Paraguay": "🇵🇾",
  "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "Spain": "🇪🇸", "Cape Verde": "🇨🇻",
  "Iran": "🇮🇷", "New Zealand": "🇳🇿", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷",
  "Ghana": "🇬🇭", "Panama": "🇵🇦", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
};

function getFlag(name: string): string {
  return teamFlags[name] || "🏳️";
}

export type PhaseKey = "Grupos" | "32avos" | "Oitavas" | "Quartas" | "Semis" | "Final";

export const phases: PhaseKey[] = ["Grupos", "32avos", "Oitavas", "Quartas", "Semis", "Final"];

// [matchNum, date, time, stage, group, city, team1, team2]
const raw: Array<[number, string, string, string, string, string, string, string]> = [
  [1,"2026-06-11","16:00","Group Stage","A","Mexico City","Mexico","South Africa"],
  [2,"2026-06-11","23:00","Group Stage","A","Guadalajara","South Korea","Czechia"],
  [3,"2026-06-12","16:00","Group Stage","B","Toronto","Canada","Bosnia and Herzegovina"],
  [4,"2026-06-12","22:00","Group Stage","D","Los Angeles","USA","Paraguay"],
  [5,"2026-06-13","22:00","Group Stage","C","Boston","Haiti","Scotland"],
  [6,"2026-06-14","01:00","Group Stage","D","Vancouver","Australia","Turkey"],
  [7,"2026-06-13","19:00","Group Stage","C","New York/NJ","Brazil","Morocco"],
  [8,"2026-06-13","16:00","Group Stage","B","San Francisco","Qatar","Switzerland"],
  [9,"2026-06-14","20:00","Group Stage","E","Philadelphia","Ivory Coast","Ecuador"],
  [10,"2026-06-14","14:00","Group Stage","E","Houston","Germany","Curaçao"],
  [11,"2026-06-14","17:00","Group Stage","F","Dallas","Netherlands","Japan"],
  [12,"2026-06-14","23:00","Group Stage","F","Monterrey","Sweden","Tunisia"],
  [13,"2026-06-15","19:00","Group Stage","H","Miami","Saudi Arabia","Uruguay"],
  [14,"2026-06-15","13:00","Group Stage","H","Atlanta","Spain","Cape Verde"],
  [15,"2026-06-15","22:00","Group Stage","G","Los Angeles","Iran","New Zealand"],
  [16,"2026-06-15","16:00","Group Stage","G","Seattle","Belgium","Egypt"],
  [17,"2026-06-16","16:00","Group Stage","I","New York/NJ","France","Senegal"],
  [18,"2026-06-16","19:00","Group Stage","I","Boston","Iraq","Norway"],
  [19,"2026-06-16","22:00","Group Stage","J","Kansas City","Argentina","Algeria"],
  [20,"2026-06-17","01:00","Group Stage","J","San Francisco","Austria","Jordan"],
  [21,"2026-06-17","20:00","Group Stage","L","Toronto","Ghana","Panama"],
  [22,"2026-06-17","17:00","Group Stage","L","Dallas","England","Croatia"],
  [23,"2026-06-17","14:00","Group Stage","K","Houston","Portugal","Congo DR"],
  [24,"2026-06-17","23:00","Group Stage","K","Mexico City","Uzbekistan","Colombia"],
  [25,"2026-06-18","13:00","Group Stage","A","Atlanta","Czechia","South Africa"],
  [26,"2026-06-18","16:00","Group Stage","B","Los Angeles","Switzerland","Bosnia and Herzegovina"],
  [27,"2026-06-18","19:00","Group Stage","B","Vancouver","Canada","Qatar"],
  [28,"2026-06-18","22:00","Group Stage","A","Guadalajara","Mexico","South Korea"],
  [29,"2026-06-19","22:00","Group Stage","C","Philadelphia","Brazil","Haiti"],
  [30,"2026-06-19","19:00","Group Stage","C","Boston","Scotland","Morocco"],
  [31,"2026-06-20","01:00","Group Stage","D","San Francisco","Turkey","Paraguay"],
  [32,"2026-06-19","16:00","Group Stage","D","Seattle","USA","Australia"],
  [33,"2026-06-20","17:00","Group Stage","E","Toronto","Germany","Ivory Coast"],
  [34,"2026-06-20","21:00","Group Stage","E","Kansas City","Ecuador","Curaçao"],
  [35,"2026-06-20","14:00","Group Stage","F","Houston","Netherlands","Sweden"],
  [36,"2026-06-21","01:00","Group Stage","F","Monterrey","Tunisia","Japan"],
  [37,"2026-06-21","19:00","Group Stage","H","Miami","Uruguay","Cape Verde"],
  [38,"2026-06-21","13:00","Group Stage","H","Atlanta","Spain","Saudi Arabia"],
  [39,"2026-06-21","16:00","Group Stage","G","Los Angeles","Belgium","Iran"],
  [40,"2026-06-21","22:00","Group Stage","G","Vancouver","New Zealand","Egypt"],
  [41,"2026-06-22","21:00","Group Stage","I","New York/NJ","Norway","Senegal"],
  [42,"2026-06-22","18:00","Group Stage","I","Philadelphia","France","Iraq"],
  [43,"2026-06-22","14:00","Group Stage","J","Dallas","Argentina","Austria"],
  [44,"2026-06-23","00:00","Group Stage","J","San Francisco","Jordan","Algeria"],
  [45,"2026-06-23","17:00","Group Stage","L","Boston","England","Ghana"],
  [46,"2026-06-23","20:00","Group Stage","L","Toronto","Panama","Croatia"],
  [47,"2026-06-23","14:00","Group Stage","K","Houston","Portugal","Uzbekistan"],
  [48,"2026-06-23","23:00","Group Stage","K","Guadalajara","Colombia","Congo DR"],
  [49,"2026-06-24","19:00","Group Stage","C","Miami","Scotland","Brazil"],
  [50,"2026-06-24","19:00","Group Stage","C","Atlanta","Morocco","Haiti"],
  [51,"2026-06-24","16:00","Group Stage","B","Vancouver","Switzerland","Canada"],
  [52,"2026-06-24","16:00","Group Stage","B","Seattle","Bosnia and Herzegovina","Qatar"],
  [53,"2026-06-24","22:00","Group Stage","A","Mexico City","Czechia","Mexico"],
  [54,"2026-06-24","22:00","Group Stage","A","Monterrey","South Africa","South Korea"],
  [55,"2026-06-25","17:00","Group Stage","E","Philadelphia","Curaçao","Ivory Coast"],
  [56,"2026-06-25","17:00","Group Stage","E","New York/NJ","Ecuador","Germany"],
  [57,"2026-06-25","20:00","Group Stage","F","Dallas","Japan","Sweden"],
  [58,"2026-06-25","20:00","Group Stage","F","Kansas City","Tunisia","Netherlands"],
  [59,"2026-06-25","23:00","Group Stage","D","Los Angeles","Turkey","USA"],
  [60,"2026-06-25","23:00","Group Stage","D","San Francisco","Paraguay","Australia"],
  [61,"2026-06-26","16:00","Group Stage","I","Boston","Norway","France"],
  [62,"2026-06-26","16:00","Group Stage","I","Toronto","Senegal","Iraq"],
  [63,"2026-06-27","00:00","Group Stage","G","Seattle","Egypt","Iran"],
  [64,"2026-06-27","00:00","Group Stage","G","Vancouver","New Zealand","Belgium"],
  [65,"2026-06-26","21:00","Group Stage","H","Houston","Cape Verde","Saudi Arabia"],
  [66,"2026-06-26","21:00","Group Stage","H","Guadalajara","Uruguay","Spain"],
  [67,"2026-06-27","18:00","Group Stage","L","New York/NJ","Panama","England"],
  [68,"2026-06-27","18:00","Group Stage","L","Philadelphia","Croatia","Ghana"],
  [69,"2026-06-27","23:00","Group Stage","J","Kansas City","Algeria","Austria"],
  [70,"2026-06-27","23:00","Group Stage","J","Dallas","Jordan","Argentina"],
  [71,"2026-06-27","20:30","Group Stage","K","Miami","Colombia","Portugal"],
  [72,"2026-06-27","20:30","Group Stage","K","Atlanta","Congo DR","Uzbekistan"],
  [73,"2026-06-28","16:00","Round of 32","R32","Los Angeles","2A","2B"],
  [74,"2026-06-29","17:30","Round of 32","R32","Boston","1E","3ABCDF"],
  [75,"2026-06-29","22:00","Round of 32","R32","Monterrey","1F","2C"],
  [76,"2026-06-29","14:00","Round of 32","R32","Houston","1C","2F"],
  [77,"2026-06-30","18:00","Round of 32","R32","New York/NJ","1I","3CDFGH"],
  [78,"2026-06-30","14:00","Round of 32","R32","Dallas","2E","2I"],
  [79,"2026-06-30","22:00","Round of 32","R32","Mexico City","1A","3CEFHI"],
  [80,"2026-07-01","13:00","Round of 32","R32","Atlanta","1L","3EHIJK"],
  [81,"2026-07-01","21:00","Round of 32","R32","San Francisco","1D","3BEFIJ"],
  [82,"2026-07-01","17:00","Round of 32","R32","Seattle","1G","3AEHIJ"],
  [83,"2026-07-02","20:00","Round of 32","R32","Toronto","2K","2L"],
  [84,"2026-07-02","16:00","Round of 32","R32","Los Angeles","1H","2J"],
  [85,"2026-07-03","00:00","Round of 32","R32","Vancouver","1B","3EFGIJ"],
  [86,"2026-07-03","19:00","Round of 32","R32","Miami","1J","2H"],
  [87,"2026-07-03","22:30","Round of 32","R32","Kansas City","1K","3DEIJL"],
  [88,"2026-07-03","15:00","Round of 32","R32","Dallas","2D","2G"],
  [89,"2026-07-04","18:00","Round of 16","R16","Philadelphia","W74","W77"],
  [90,"2026-07-04","14:00","Round of 16","R16","Houston","W73","W75"],
  [91,"2026-07-05","17:00","Round of 16","R16","New York/NJ","W76","W78"],
  [92,"2026-07-05","21:00","Round of 16","R16","Mexico City","W79","W80"],
  [93,"2026-07-06","16:00","Round of 16","R16","Dallas","W83","W84"],
  [94,"2026-07-06","21:00","Round of 16","R16","Seattle","W81","W82"],
  [95,"2026-07-07","13:00","Round of 16","R16","Atlanta","W86","W88"],
  [96,"2026-07-07","17:00","Round of 16","R16","Vancouver","W85","W87"],
  [97,"2026-07-09","17:00","Quarter-finals","QF","Boston","W89","W90"],
  [98,"2026-07-10","16:00","Quarter-finals","QF","Los Angeles","W93","W94"],
  [99,"2026-07-11","18:00","Quarter-finals","QF","Miami","W91","W92"],
  [100,"2026-07-11","22:00","Quarter-finals","QF","Kansas City","W95","W96"],
  [101,"2026-07-14","16:00","Semi-finals","SF","Dallas","W97","W98"],
  [102,"2026-07-15","16:00","Semi-finals","SF","Atlanta","W99","W100"],
  [103,"2026-07-18","18:00","Third Place","3rd","Miami","L101","L102"],
  [104,"2026-07-19","16:00","Final","Final","New York/NJ","W101","W102"],
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${parseInt(d)} ${months[parseInt(m)]} ${y}`;
}

function stageToPhase(stage: string): PhaseKey {
  if (stage === "Group Stage") return "Grupos";
  if (stage === "Round of 32") return "32avos";
  if (stage === "Round of 16") return "Oitavas";
  if (stage === "Quarter-finals") return "Quartas";
  if (stage === "Semi-finals") return "Semis";
  return "Final";
}

export const allMatches: MatchData[] = raw.map(([num, date, time, stage, group, city, t1, t2]) => ({
  matchNumber: num,
  date: formatDate(date),
  time,
  stage,
  group: stage === "Group Stage" ? `Grupo ${group}` : group,
  city,
  teamA: t1,
  teamB: t2,
  flagA: getFlag(t1),
  flagB: getFlag(t2),
}));

export function getMatchesByPhase(phase: PhaseKey): MatchData[] {
  return allMatches.filter(m => stageToPhase(m.stage) === phase);
}

export interface MatchDay {
  date: string;
  matches: MatchData[];
}

export function groupByDate(matches: MatchData[]): MatchDay[] {
  const map = new Map<string, MatchData[]>();
  for (const m of matches) {
    if (!map.has(m.date)) map.set(m.date, []);
    map.get(m.date)!.push(m);
  }
  return Array.from(map.entries()).map(([date, matches]) => ({ date, matches }));
}
