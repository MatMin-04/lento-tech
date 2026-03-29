import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { FootballApiService } from '../../core/services/football-api.service';
import { Match } from '../../core/models/football.models';

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.scss']
})
export class LeagueComponent implements OnInit {
  leagueId!: number;
  matches$!: Observable<Match[]>;

  constructor(private route: ActivatedRoute, private api: FootballApiService) {}

  ngOnInit(): void {
    this.matches$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.leagueId = Number(params.get('id'));
        return this.api.getMatchesByLeague(this.leagueId);
      })
    );
  }
}
