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

const teamNames: Record<string, string> = {
  MEX: "México", RSA: "África do Sul", KOR: "Coreia do Sul", CZE: "Tchéquia",
  CAN: "Canadá", BIH: "Bósnia", USA: "EUA", PAR: "Paraguai",
  HAI: "Haiti", SCO: "Escócia", QAT: "Catar", SUI: "Suíça",
  BRA: "Brasil", MAR: "Marrocos", AUS: "Austrália", TUR: "Turquia",
  GER: "Alemanha", CUW: "Curaçao", NED: "Holanda", JPN: "Japão",
  CIV: "Costa do Marfim", ECU: "Equador", SWE: "Suécia", TUN: "Tunísia",
  KSA: "Arábia Saudita", URU: "Uruguai", ESP: "Espanha", CPV: "Cabo Verde",
  IRN: "Irã", NZL: "Nova Zelândia", BEL: "Bélgica", EGY: "Egito",
  FRA: "França", SEN: "Senegal", IRQ: "Iraque", NOR: "Noruega",
  ARG: "Argentina", ALG: "Argélia", AUT: "Áustria", JOR: "Jordânia",
  POR: "Portugal", COD: "RD Congo", ENG: "Inglaterra", CRO: "Croácia",
  GHA: "Gana", PAN: "Panamá", UZB: "Uzbequistão", COL: "Colômbia",
};

const teamFlags: Record<string, string> = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿",
  CAN: "🇨🇦", BIH: "🇧🇦", USA: "🇺🇸", PAR: "🇵🇾",
  HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", QAT: "🇶🇦", SUI: "🇨🇭",
  BRA: "🇧🇷", MAR: "🇲🇦", AUS: "🇦🇺", TUR: "🇹🇷",
  GER: "🇩🇪", CUW: "🇨🇼", NED: "🇳🇱", JPN: "🇯🇵",
  CIV: "🇨🇮", ECU: "🇪🇨", SWE: "🇸🇪", TUN: "🇹🇳",
  KSA: "🇸🇦", URU: "🇺🇾", ESP: "🇪🇸", CPV: "🇨🇻",
  IRN: "🇮🇷", NZL: "🇳🇿", BEL: "🇧🇪", EGY: "🇪🇬",
  FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  POR: "🇵🇹", COD: "🇨🇩", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷",
  GHA: "🇬🇭", PAN: "🇵🇦", UZB: "🇺🇿", COL: "🇨🇴",
};

function getName(code: string): string {
  return teamNames[code] || code;
}
function getFlag(code: string): string {
  return teamFlags[code] || "🏳️";
}

export type PhaseKey = "Grupos" | "32avos" | "Oitavas" | "Quartas" | "Semis" | "Final";

export const phases: PhaseKey[] = ["Grupos", "32avos", "Oitavas", "Quartas", "Semis", "Final"];

const raw: Array<[number, string, string, string, string, string, string, string]> = [
  [1,"2026-06-11","16:00","Group Stage","A","Mexico City","MEX","RSA"],
  [2,"2026-06-11","23:00","Group Stage","A","Guadalajara","KOR","CZE"],
  [3,"2026-06-12","16:00","Group Stage","B","Toronto","CAN","BIH"],
  [4,"2026-06-12","22:00","Group Stage","D","Los Angeles","USA","PAR"],
  [5,"2026-06-13","14:00","Group Stage","C","Boston","HAI","SCO"],
  [6,"2026-06-13","16:00","Group Stage","B","San Francisco","QAT","SUI"],
  [7,"2026-06-13","19:00","Group Stage","C","New York/NJ","BRA","MAR"],
  [8,"2026-06-14","01:00","Group Stage","D","Vancouver","AUS","TUR"],
  [9,"2026-06-14","14:00","Group Stage","E","Houston","GER","CUW"],
  [10,"2026-06-14","17:00","Group Stage","F","Dallas","NED","JPN"],
  [11,"2026-06-14","20:00","Group Stage","E","Philadelphia","CIV","ECU"],
  [12,"2026-06-14","23:00","Group Stage","F","Monterrey","SWE","TUN"],
  [13,"2026-06-15","19:00","Group Stage","H","Miami","KSA","URU"],
  [14,"2026-06-15","13:00","Group Stage","H","Atlanta","ESP","CPV"],
  [15,"2026-06-15","22:00","Group Stage","G","Los Angeles","IRN","NZL"],
  [16,"2026-06-15","16:00","Group Stage","G","Seattle","BEL","EGY"],
  [17,"2026-06-16","16:00","Group Stage","I","New York/NJ","FRA","SEN"],
  [18,"2026-06-16","19:00","Group Stage","I","Boston","IRQ","NOR"],
  [19,"2026-06-16","22:00","Group Stage","J","Kansas City","ARG","ALG"],
  [20,"2026-06-17","01:00","Group Stage","J","San Francisco","AUT","JOR"],
  [21,"2026-06-17","14:00","Group Stage","K","Houston","POR","COD"],
  [22,"2026-06-17","17:00","Group Stage","L","Dallas","ENG","CRO"],
  [23,"2026-06-17","20:00","Group Stage","L","Toronto","GHA","PAN"],
  [24,"2026-06-17","23:00","Group Stage","K","Mexico City","UZB","COL"],
  [25,"2026-06-18","13:00","Group Stage","A","Atlanta","CZE","RSA"],
  [26,"2026-06-18","16:00","Group Stage","B","Los Angeles","SUI","BIH"],
  [27,"2026-06-18","19:00","Group Stage","B","Vancouver","CAN","QAT"],
  [28,"2026-06-18","22:00","Group Stage","A","Guadalajara","MEX","KOR"],
  [29,"2026-06-19","16:00","Group Stage","D","Seattle","USA","AUS"],
  [30,"2026-06-19","19:00","Group Stage","C","Boston","SCO","MAR"],
  [31,"2026-06-19","21:30","Group Stage","C","Philadelphia","BRA","HAI"],
  [32,"2026-06-20","01:00","Group Stage","D","San Francisco","TUR","PAR"],
  [33,"2026-06-20","14:00","Group Stage","F","Houston","NED","SWE"],
  [34,"2026-06-20","17:00","Group Stage","E","Toronto","GER","CIV"],
  [35,"2026-06-20","21:00","Group Stage","E","Kansas City","ECU","CUW"],
  [36,"2026-06-21","01:00","Group Stage","F","Monterrey","TUN","JPN"],
  [37,"2026-06-21","13:00","Group Stage","H","Atlanta","ESP","KSA"],
  [38,"2026-06-21","16:00","Group Stage","G","Los Angeles","BEL","IRN"],
  [39,"2026-06-21","19:00","Group Stage","H","Miami","URU","CPV"],
  [40,"2026-06-21","22:00","Group Stage","G","Vancouver","NZL","EGY"],
  [41,"2026-06-22","22:00","Group Stage","I","Philadelphia","FRA","IRQ"],
  [42,"2026-06-22","14:00","Group Stage","J","Dallas","ARG","AUT"],
  [43,"2026-06-23","04:00","Group Stage","J","San Francisco","JOR","ALG"],
  [44,"2026-06-23","01:00","Group Stage","I","Toronto","NOR","SEN"],
  [45,"2026-06-23","17:00","Group Stage","L","Boston","ENG","GHA"],
  [46,"2026-06-23","18:00","Group Stage","K","Houston","POR","UZB"],
  [47,"2026-06-23","20:30","Group Stage","K","Miami","COL","COD"],
  [48,"2026-06-23","20:00","Group Stage","L","Toronto","PAN","CRO"],
  [49,"2026-06-24","19:00","Group Stage","C","Miami","SCO","BRA"],
  [50,"2026-06-24","19:00","Group Stage","C","Atlanta","MAR","HAI"],
  [51,"2026-06-24","16:00","Group Stage","B","Vancouver","SUI","CAN"],
  [52,"2026-06-24","16:00","Group Stage","B","Seattle","BIH","QAT"],
  [53,"2026-06-24","22:00","Group Stage","A","Mexico City","CZE","MEX"],
  [54,"2026-06-24","22:00","Group Stage","A","Monterrey","RSA","KOR"],
  [55,"2026-06-25","17:00","Group Stage","E","Philadelphia","CUW","CIV"],
  [56,"2026-06-25","17:00","Group Stage","E","New York/NJ","ECU","GER"],
  [57,"2026-06-25","20:00","Group Stage","F","Dallas","JPN","SWE"],
  [58,"2026-06-25","20:00","Group Stage","F","Kansas City","TUN","NED"],
  [59,"2026-06-25","23:00","Group Stage","D","Los Angeles","TUR","USA"],
  [60,"2026-06-25","23:00","Group Stage","D","San Francisco","PAR","AUS"],
  [61,"2026-06-26","15:00","Group Stage","I","Boston","NOR","FRA"],
  [62,"2026-06-26","15:00","Group Stage","I","New York/NJ","SEN","IRQ"],
  [63,"2026-06-26","18:00","Group Stage","H","Miami","CPV","KSA"],
  [64,"2026-06-26","18:00","Group Stage","H","Guadalajara","URU","ESP"],
  [65,"2026-06-26","22:00","Group Stage","G","Seattle","NZL","BEL"],
  [66,"2026-06-26","22:00","Group Stage","G","Vancouver","EGY","IRN"],
  [67,"2026-06-27","18:00","Group Stage","L","New York/NJ","PAN","ENG"],
  [68,"2026-06-27","18:00","Group Stage","L","Philadelphia","CRO","GHA"],
  [69,"2026-06-27","23:00","Group Stage","J","Kansas City","ALG","AUT"],
  [70,"2026-06-27","23:00","Group Stage","J","Dallas","JOR","ARG"],
  [71,"2026-06-27","20:30","Group Stage","K","Miami","COL","POR"],
  [72,"2026-06-27","20:30","Group Stage","K","Atlanta","COD","UZB"],
  [73,"2026-06-28","16:00","Round of 32","R32","Los Angeles","2A","2B"],
  [74,"2026-06-29","13:00","Round of 32","R32","Boston","1E","3ABCDF"],
  [75,"2026-06-29","22:00","Round of 32","R32","Seattle","1F","2C"],
  [76,"2026-06-30","14:00","Round of 32","R32","New York/NJ","1C","2F"],
  [77,"2026-06-30","17:00","Round of 32","R32","Houston","1I","3CDEFG"],
  [78,"2026-06-30","22:00","Round of 32","R32","Dallas","2E","2I"],
  [79,"2026-06-30","22:00","Round of 32","R32","Mexico City","1A","3CEFHI"],
  [80,"2026-07-01","13:00","Round of 32","R32","Atlanta","1L","2K"],
  [81,"2026-07-01","21:00","Round of 32","R32","San Francisco","1D","3BEFIJ"],
  [82,"2026-07-01","17:00","Round of 32","R32","Seattle","1G","3AEHIJ"],
  [83,"2026-07-02","14:00","Round of 32","R32","Toronto","2H","2L"],
  [84,"2026-07-02","16:00","Round of 32","R32","Miami","1H","2J"],
  [85,"2026-07-03","00:00","Round of 32","R32","New York/NJ","1B","3EFGIJ"],
  [86,"2026-07-03","13:00","Round of 32","R32","Kansas City","1J","2H"],
  [87,"2026-07-03","16:00","Round of 32","R32","Dallas","1K","3DGHJK"],
  [88,"2026-07-03","15:00","Round of 32","R32","San Francisco","2D","2G"],
  [89,"2026-07-04","19:00","Round of 16","R16","Philadelphia","W74","W77"],
  [90,"2026-07-05","14:00","Round of 16","R16","Houston","W73","W75"],
  [91,"2026-07-05","17:00","Round of 16","R16","New York/NJ","W76","W78"],
  [92,"2026-07-05","21:00","Round of 16","R16","Mexico City","W79","W80"],
  [93,"2026-07-06","16:00","Round of 16","R16","Dallas","W83","W84"],
  [94,"2026-07-06","21:00","Round of 16","R16","Seattle","W81","W82"],
  [95,"2026-07-07","14:00","Round of 16","R16","Atlanta","W86","W88"],
  [96,"2026-07-07","17:00","Round of 16","R16","New York/NJ","W85","W87"],
  [97,"2026-07-09","17:00","Quarter-finals","QF","Boston","W89","W90"],
  [98,"2026-07-10","16:00","Quarter-finals","QF","Los Angeles","W93","W94"],
  [99,"2026-07-11","14:00","Quarter-finals","QF","Miami","W91","W92"],
  [100,"2026-07-11","17:00","Quarter-finals","QF","Kansas City","W95","W96"],
  [101,"2026-07-14","21:00","Semi-finals","SF","Dallas","W97","W98"],
  [102,"2026-07-15","21:00","Semi-finals","SF","Atlanta","W99","W100"],
  [103,"2026-07-18","16:00","Bronze Final","Bronze","Miami","L101","L102"],
  [104,"2026-07-19","17:00","Final","Final","New York/NJ","W101","W102"],
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
  return "Final"; // Final + Bronze Final
}

export const allMatches: MatchData[] = raw.map(([num, date, time, stage, group, city, t1, t2]) => ({
  matchNumber: num,
  date: formatDate(date),
  time,
  stage,
  group: stage === "Group Stage" ? `Grupo ${group}` : group,
  city,
  teamA: getName(t1),
  teamB: getName(t2),
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
