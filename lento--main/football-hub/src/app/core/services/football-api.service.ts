import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay, switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { League, Match, Standing } from '../models/football.models';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FootballApiService {

  private readonly leagues: League[] = [
    { id: 2019, name: 'Serie A', country: 'Italy', logo: 'assets/serie-a.png', themeColor: 'serie-a' },
    { id: 2021, name: 'Premier League', country: 'England', logo: 'assets/premier.png', themeColor: 'premier' },
    { id: 2014, name: 'La Liga', country: 'Spain', logo: 'assets/laliga.png', themeColor: 'laliga' },
    { id: 2002, name: 'Bundesliga', country: 'Germany', logo: 'assets/bundesliga.png', themeColor: 'bundesliga' },
    { id: 2015, name: 'Ligue 1', country: 'France', logo: 'assets/ligue1.png', themeColor: 'ligue1' }
  ];

  private readonly headers = new HttpHeaders({
    'X-Auth-Token': environment.footballApiKey
  });

  // Simple cache for rate limiting fallback
  private liveMatchesCache = new BehaviorSubject<Match[]>([]);
  private upcomingMatchesCache = new Map<number, Match[]>();
  private standingsCache = new Map<number, Standing[]>();
  private allMatchesCache = new Map<number, Match[]>();

  constructor(private http: HttpClient) { }

  getLeagues(): Observable<League[]> {
    return of(this.leagues).pipe(shareReplay(1));
  }

  // Polling every 60 seconds for live matches
  getLiveMatches(): Observable<Match[]> {
    return timer(0, 60000).pipe(
      switchMap(() => this.http.get<any>(`${environment.footballApiUrl}/matches?status=IN_PLAY,PAUSED`, { headers: this.headers }).pipe(
        map(res => {
          if (!res || !res.matches) return [];
          return res.matches.map(this.mapMatch.bind(this));
        }),
        tap(matches => this.liveMatchesCache.next(matches)), // Update cache
        catchError(() => {
          console.warn('Rate limit or error fetching live matches. Serving from cache.');
          return this.liveMatchesCache.asObservable(); // Fallback to last known state
        })
      )),
      shareReplay(1)
    );
  }

  getMatchesByLeague(leagueId: number): Observable<Match[]> {
      const today = new Date();
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 3);
      const dateTo = new Date(today);
      dateTo.setDate(today.getDate() + 3);

      const fromStr = dateFrom.toISOString().split('T')[0];
      const toStr = dateTo.toISOString().split('T')[0];

      return this.http.get<any>(`${environment.footballApiUrl}/competitions/${leagueId}/matches?dateFrom=${fromStr}&dateTo=${toStr}`, { headers: this.headers }).pipe(
        map(res => {
          if (!res || !res.matches) return [];
          return res.matches.map(this.mapMatch.bind(this));
        }),
        tap(matches => this.allMatchesCache.set(leagueId, matches)),
        catchError(() => {
            console.warn(`Rate limit fetching matches for league ${leagueId}. Using cache if available.`);
            return of(this.allMatchesCache.get(leagueId) || []);
        })
      );
  }

  getUpcomingMatches(leagueId: number): Observable<Match[]> {
    // Poll every 60 seconds to auto-recover from 429 rate limits without manual refresh
    return timer(0, 60000).pipe(
      switchMap(() => {
        const today = new Date();
        const dateFrom = new Date(today);
        const dateTo = new Date(today);
        // Se leagueId è 0, siamo costretti ad usare l'endpoint globale con range di 10 giorni (limite free tier).
        // Se leagueId è specifico, usiamo l'endpoint della competizione che permette range più ampi (es. 21 giorni).
        let url: string;
        if (leagueId === 0) {
          dateTo.setDate(today.getDate() + 10);
          const competitionsParam = this.leagues.map(l => l.id).join(',');
          url = `${environment.footballApiUrl}/matches?competitions=${competitionsParam}&dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
        } else {
          dateTo.setDate(today.getDate() + 21);
          url = `${environment.footballApiUrl}/competitions/${leagueId}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
        }

        return this.http.get<any>(url, { headers: this.headers }).pipe(
          map(res => {
            if (!res || !res.matches || res.matches.length === 0) return [];
            
            // Filtra solo i match programmati
            let futureMatches = res.matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED');
            
            if (futureMatches.length === 0) return [];

            // Ordina per data per garantire coerenza
            futureMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

            // Se è una lega specifica, prendiamo solo le partite del primo matchday disponibile
            if (leagueId !== 0) {
                const nextMatchday = futureMatches[0].matchday;
                return futureMatches
                  .filter((m: any) => m.matchday === nextMatchday)
                  .map(this.mapMatch.bind(this));
            }

            // Per "All Matches", mostriamo le prossime 8 partite in ordine cronologico
            return futureMatches.slice(0, 8).map(this.mapMatch.bind(this));
          }),
          tap(matches => this.upcomingMatchesCache.set(leagueId, matches)),
          catchError(() => {
             console.warn('Rate limit or error fetching upcoming matches, retrying next cycle.');
             return of(this.upcomingMatchesCache.get(leagueId) || []);
          })
        );
      }),
      shareReplay(1)
    );
  }

  getStandings(leagueId: number): Observable<Standing[] | null> {
    if (leagueId === 0) return of(null);
    
    return this.http.get<any>(`${environment.footballApiUrl}/competitions/${leagueId}/standings`, { headers: this.headers }).pipe(
      map(res => {
        if (!res || !res.standings || res.standings.length === 0) return [];
        const totalStanding = res.standings.find((s: any) => s.type === 'TOTAL');
        if (!totalStanding || !totalStanding.table) return [];
        
        return totalStanding.table.map((s: any) => ({
          position: s.position,
          team: {
            id: s.team.id,
            name: s.team.name,
            shortName: s.team.shortName,
            tla: s.team.tla,
            logo: s.team.crest
          },
          playedGames: s.playedGames,
          won: s.won,
          draw: s.draw,
          lost: s.lost,
          points: s.points,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference
        }));
      }),
      tap(standings => this.standingsCache.set(leagueId, standings)),
      catchError(() => {
        return of(this.standingsCache.get(leagueId) || []);
      }),
      shareReplay(1)
    );
  }

  getMatchById(matchId: number): Observable<Match | undefined> {
      return this.http.get<any>(`${environment.footballApiUrl}/matches/${matchId}`, { headers: this.headers }).pipe(
        map(res => this.mapMatch(res)),
        catchError(() => of(undefined))
      );
  }

  private mapMatch(apiMatch: any): Match {
    return {
      id: apiMatch.id,
      leagueId: apiMatch.competition?.id || 0,
      homeTeam: {
        id: apiMatch.homeTeam?.id,
        name: apiMatch.homeTeam?.name || 'Sconosciuto',
        shortName: apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.tla || apiMatch.homeTeam?.name || '?',
        logo: apiMatch.homeTeam?.crest
      },
      awayTeam: {
        id: apiMatch.awayTeam?.id,
        name: apiMatch.awayTeam?.name || 'Sconosciuto',
        shortName: apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.tla || apiMatch.awayTeam?.name || '?',
        logo: apiMatch.awayTeam?.crest
      },
      homeScore: apiMatch.score?.fullTime?.home !== null && apiMatch.score?.fullTime?.home !== undefined ? apiMatch.score.fullTime.home : null,
      awayScore: apiMatch.score?.fullTime?.away !== null && apiMatch.score?.fullTime?.away !== undefined ? apiMatch.score.fullTime.away : null,
      startTime: apiMatch.utcDate,
      status: this.mapStatus(apiMatch.status),
      minute: undefined // Not cleanly provided by standard free api
    };
  }

  private mapStatus(status: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' {
    switch (status) {
      case 'IN_PLAY':
      case 'PAUSED':
        return 'LIVE';
      case 'FINISHED':
      case 'AWARDED':
        return 'FINISHED';
      case 'POSTPONED':
      case 'CANCELLED':
      case 'SUSPENDED':
        return 'POSTPONED';
      default:
        return 'SCHEDULED';
    }
  }
}
