import { Component, EventEmitter, Input, Output } from '@angular/core';
import { League } from '../../../core/models/football.models';

@Component({
  selector: 'app-league-nav',
  templateUrl: './league-nav.component.html',
  styleUrls: ['./league-nav.component.scss']
})
export class LeagueNavComponent {
  @Input() leagues: League[] = [];
  @Input() selectedLeagueId?: number;
  @Output() leagueSelected = new EventEmitter<number>();

  selectLeague(id: number): void {
    this.leagueSelected.emit(id);
  }
}
