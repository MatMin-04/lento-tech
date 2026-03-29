import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LeagueComponent } from './features/league/league.component';
import { MatchDetailComponent } from './features/match-detail/match-detail.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'league/:id', component: LeagueComponent },
  { path: 'match/:id', component: MatchDetailComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
