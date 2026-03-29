import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Standing } from '../../../core/models/football.models';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nexo-glass rounded-[2.5rem] p-8 mt-12 overflow-hidden relative group">
      <!-- Glow Effect -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-nexo-glow-green/5 blur-[120px] rounded-full group-hover:bg-nexo-glow-green/10 transition-all duration-1000"></div>
      
      <div class="relative z-10">
        <h3 class="text-2xl font-serif font-bold text-white mb-8 pl-4 border-l-2 border-nexo-glow-green">League Standings</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th class="pb-4 pl-4">Pos</th>
                <th class="pb-4">Squadra</th>
                <th class="pb-4 text-center">PG</th>
                <th class="pb-4 text-center">V</th>
                <th class="pb-4 text-center">P</th>
                <th class="pb-4 text-center">S</th>
                <th class="pb-4 text-center hidden md:table-cell">GF</th>
                <th class="pb-4 text-center hidden md:table-cell">GS</th>
                <th class="pb-4 text-center">DR</th>
                <th class="pb-4 text-center pr-4">PT</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of standings" class="group/row transition-all duration-300 hover:bg-white/[0.03]">
                <td class="py-4 pl-4 first:rounded-l-2xl">
                  <span class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                    [ngClass]="{
                      'bg-nexo-glow-magenta/20 text-nexo-glow-magenta shadow-[0_0_15px_rgba(217,70,239,0.2)]': row.position <= 4,
                      'text-white/60': row.position > 4
                    }">
                    {{ row.position }}
                  </span>
                </td>
                <td class="py-4">
                  <div class="flex items-center gap-4">
                    <img [src]="row.team.logo" alt="" class="w-8 h-8 object-contain drop-shadow-md group-hover/row:scale-110 transition-transform">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-white/90 group-hover/row:text-white transition-colors">{{ row.team.shortName }}</span>
                      <span class="text-[10px] text-white/40 font-medium">{{ row.team.name }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-4 text-center text-sm font-medium text-white/70">{{ row.playedGames }}</td>
                <td class="py-4 text-center text-sm font-medium text-white/70">{{ row.won }}</td>
                <td class="py-4 text-center text-sm font-medium text-white/70">{{ row.draw }}</td>
                <td class="py-4 text-center text-sm font-medium text-white/70">{{ row.lost }}</td>
                <td class="py-4 text-center text-sm font-medium text-white/40 hidden md:table-cell">{{ row.goalsFor }}</td>
                <td class="py-4 text-center text-sm font-medium text-white/40 hidden md:table-cell">{{ row.goalsAgainst }}</td>
                <td class="py-4 text-center text-sm font-bold" 
                    [ngClass]="row.goalDifference > 0 ? 'text-nexo-glow-green/80' : row.goalDifference < 0 ? 'text-red-400/80' : 'text-white/40'">
                  {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                </td>
                <td class="py-4 text-center text-sm font-black text-white pr-4 last:rounded-r-2xl">{{ row.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nexo-glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
  `]
})
export class StandingsComponent {
  @Input() standings: Standing[] = [];
}
