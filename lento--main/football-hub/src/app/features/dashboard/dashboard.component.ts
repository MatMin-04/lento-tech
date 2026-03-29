import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FootballApiService } from '../../core/services/football-api.service';
import { League, Match } from '../../core/models/football.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  leagues$!: Observable<League[]>;
  matches$!: Observable<Match[]>;
  upcomingSerieAMatches$!: Observable<Match[]>;
  
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

    // Fetch upcoming Serie A matches (League ID 2019) for the next matchday
    this.upcomingSerieAMatches$ = this.api.getUpcomingMatches(2019);
  }

  onLeagueSelected(leagueId: number): void {
    this.selectedLeagueIdSubject.next(leagueId);
  }
}
