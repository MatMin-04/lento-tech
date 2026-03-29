import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { FootballApiService } from '../../core/services/football-api.service';
import { Match } from '../../core/models/football.models';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {
  match$!: Observable<Match | undefined>;

  constructor(
    private route: ActivatedRoute, 
    private api: FootballApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.match$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return this.api.getMatchById(id);
      })
    );
  }

  goBack(): void {
    this.location.back();
  }
}
