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
    { id: 2014, name: 'La Liga', country: 'Spain', logo: 'assets/laliga.png', themeColor: 'laliga' }
  ];

  private readonly headers = new HttpHeaders({
    'X-Auth-Token': environment.footballApiKey
  });

  // Simple cache for rate limiting fallback
  private liveMatchesCache = new BehaviorSubject<Match[]>([]);
  private allMatchesCache = new Map<number, Match[]>();
  private upcomingMatchesCache = new Map<number, Match[]>(); // Cache per le prossime partite

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
        dateTo.setDate(today.getDate() + 30); // Look ahead 1 month just in case

        const fromStr = dateFrom.toISOString().split('T')[0];
        const toStr = dateTo.toISOString().split('T')[0];

        return this.http.get<any>(`${environment.footballApiUrl}/competitions/${leagueId}/matches?dateFrom=${fromStr}&dateTo=${toStr}`, { headers: this.headers }).pipe(
          map(res => {
            if (!res || !res.matches || res.matches.length === 0) return [];
            
            // Filtriamo via le partite concluse o live per mantenere solo quelle future
            const futureMatches = res.matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED');
            if (futureMatches.length === 0) return [];

            const nextMatchday = futureMatches[0].matchday;
            const nextMatchdayMatches = futureMatches.filter((m: any) => m.matchday === nextMatchday);
            
            return nextMatchdayMatches.map(this.mapMatch.bind(this));
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
