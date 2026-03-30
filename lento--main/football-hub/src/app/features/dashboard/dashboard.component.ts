import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FootballApiService } from '../../core/services/football-api.service';
import { League, Match, Standing } from '../../core/models/football.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  leagues$!: Observable<League[]>;
  matches$!: Observable<Match[]>;
  upcomingMatches$!: Observable<Match[]>;
  standings$!: Observable<Standing[] | null>;
  selectedLeagueLabel$!: Observable<string>;
  
  private selectedLeagueIdSubject = new BehaviorSubject<number>(0);
  selectedLeagueId$ = this.selectedLeagueIdSubject.asObservable();

  constructor(private api: FootballApiService) {}

  ngOnInit(): void {
    this.leagues$ = this.api.getLeagues();
    
    // Combine polling live matches and selected league filter
    this.matches$ = combineLatest([
      this.api.getLiveMatches(), // Here we would normally fetch a wider set. For mock, it's fine.
      this.selectedLeagueId$
    ]).pipe(
      map(([matches, leagueId]) => {
        if (leagueId === 0) return matches;
        return matches.filter(m => m.leagueId === leagueId);
      })
    );

    // Reactive upcoming matches based on selection
    this.upcomingMatches$ = this.selectedLeagueId$.pipe(
      switchMap(leagueId => this.api.getUpcomingMatches(leagueId))
    );

    this.standings$ = this.selectedLeagueId$.pipe(
      switchMap(id => this.api.getStandings(id))
    );

    // Dynamic label for the Next Matchday section
    this.selectedLeagueLabel$ = this.selectedLeagueId$.pipe(
      switchMap(id => {
        if (id === 0) return of('All Matches');
        return this.leagues$.pipe(
          map(leagues => leagues.find(l => l.id === id)?.name || 'Matches')
        );
      })
    );
  }

  onLeagueSelected(leagueId: number): void {
    this.selectedLeagueIdSubject.next(leagueId);
    
    // Update Global Background Glow (Aurora Effect)
    const root = document.documentElement;
    let bg = '';
    
    switch (leagueId) {
      case 2019: // Serie A
        bg = 'radial-gradient(circle, rgba(0, 170, 255, 0.8) 0%, rgba(0, 170, 255, 0.4) 50%, transparent 100%)';
        break;
      case 2021: // Premier League
        bg = 'radial-gradient(circle, rgba(107, 33, 168, 0.8) 0%, rgba(107, 33, 168, 0.4) 50%, transparent 100%)';
        break;
      case 2014: // La Liga
        bg = 'radial-gradient(circle, rgba(250, 204, 21, 0.8) 0%, rgba(250, 204, 21, 0.4) 50%, transparent 100%)';
        break;
      default: // All Matches / Default (Green-Yellow Gradient)
        bg = 'radial-gradient(circle, rgba(22, 163, 74, 0.8) 0%, rgba(132, 204, 22, 0.5) 45%, rgba(132, 204, 22, 0.2) 70%, transparent 100%)';
    }
    
    root.style.setProperty('--aurora-bg', bg);
  }
}
