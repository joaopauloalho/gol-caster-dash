/**
 * Mapa de tradução: displayName da API ESPN → português brasileiro
 * Fonte: jogos_copa_2026.json + nomes oficiais em pt-BR
 */
const ESPN_TO_PTBR: Record<string, string> = {
  "Afghanistan": "Afeganistão",
  "Albania": "Albânia",
  "Algeria": "Argélia",
  "Argentina": "Argentina",
  "Australia": "Austrália",
  "Austria": "Áustria",
  "Belgium": "Bélgica",
  "Bolivia": "Bolívia",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Brazil": "Brasil",
  "Cameroon": "Camarões",
  "Canada": "Canadá",
  "Cape Verde": "Cabo Verde",
  "Chile": "Chile",
  "China": "China",
  "Colombia": "Colômbia",
  "Congo": "Congo",
  "Croatia": "Croácia",
  "Cuba": "Cuba",
  "Curaçao": "Curaçao",
  "Czech Republic": "República Tcheca",
  "Denmark": "Dinamarca",
  "DR Congo": "Congo RD",
  "Ecuador": "Equador",
  "Egypt": "Egito",
  "England": "Inglaterra",
  "Estonia": "Estônia",
  "France": "França",
  "Germany": "Alemanha",
  "Ghana": "Gana",
  "Greece": "Grécia",
  "Haiti": "Haiti",
  "Honduras": "Honduras",
  "Hungary": "Hungria",
  "Iran": "Irã",
  "Iraq": "Iraque",
  "Israel": "Israel",
  "Italy": "Itália",
  "Ivory Coast": "Costa do Marfim",
  "Jamaica": "Jamaica",
  "Japan": "Japão",
  "Jordan": "Jordânia",
  "Kenya": "Quênia",
  "Mexico": "México",
  "Morocco": "Marrocos",
  "Netherlands": "Holanda",
  "New Zealand": "Nova Zelândia",
  "Nigeria": "Nigéria",
  "Norway": "Noruega",
  "Panama": "Panamá",
  "Paraguay": "Paraguai",
  "Peru": "Peru",
  "Poland": "Polônia",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "Romania": "Romênia",
  "Russia": "Rússia",
  "Saudi Arabia": "Arábia Saudita",
  "Scotland": "Escócia",
  "Senegal": "Senegal",
  "Serbia": "Sérvia",
  "Slovakia": "Eslováquia",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Spain": "Espanha",
  "Sweden": "Suécia",
  "Switzerland": "Suíça",
  "Tunisia": "Tunísia",
  "Turkey": "Turquia",
  "Ukraine": "Ucrânia",
  "United States": "Estados Unidos",
  "Uruguay": "Uruguai",
  "USA": "Estados Unidos",
  "Uzbekistan": "Uzbequistão",
  "Venezuela": "Venezuela",
  "Wales": "País de Gales",
};

/**
 * Traduz o displayName da ESPN para português brasileiro.
 * Se não encontrar no mapa, retorna o nome original (fallback seguro).
 */
export function toPortuguese(espnName: string): string {
  return ESPN_TO_PTBR[espnName] ?? espnName;
}

/**
 * Traduz um array de objetos com displayName.
 * Retorna o mesmo array com displayName substituído pelo nome em pt-BR.
 */
export function translateTeams<T extends { displayName: string }>(teams: T[]): T[] {
  return teams.map(t => ({ ...t, displayName: toPortuguese(t.displayName) }));
}
