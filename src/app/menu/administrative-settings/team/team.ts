import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-team',
  imports: [RouterModule],
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './team.scss',
})
export class Team { }
