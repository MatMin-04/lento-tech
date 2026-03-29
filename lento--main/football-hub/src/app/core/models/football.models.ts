export interface Team {
  id: number;
  name: string;
  shortName: string;
  logo: string;
}

export interface Match {
  id: number;
  leagueId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  startTime: string; // ISO 8601
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  minute?: number; // For live matches
  stadium?: string;
  referee?: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  themeColor: string; // Tailwind class like bg-serie-a
}

export interface Standing {
  team: Team;
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
