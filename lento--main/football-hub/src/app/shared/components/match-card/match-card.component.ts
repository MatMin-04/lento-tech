import { Component, Input } from '@angular/core';
import { Match } from '../../../core/models/football.models';

@Component({
  selector: 'app-match-card',
  templateUrl: './match-card.component.html',
  styleUrls: ['./match-card.component.scss']
})
export class MatchCardComponent {
  @Input() match!: Match;
}
