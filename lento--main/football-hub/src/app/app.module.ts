import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatchCardComponent } from './shared/components/match-card/match-card.component';
import { LiveIndicatorComponent } from './shared/components/live-indicator/live-indicator.component';
import { LeagueNavComponent } from './shared/components/league-nav/league-nav.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LeagueComponent } from './features/league/league.component';
import { MatchDetailComponent } from './features/match-detail/match-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    MatchCardComponent,
    LiveIndicatorComponent,
    LeagueNavComponent,
    DashboardComponent,
    LeagueComponent,
    MatchDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
