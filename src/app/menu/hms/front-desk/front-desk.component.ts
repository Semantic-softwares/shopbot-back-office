import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-front-desk',
  imports: [RouterOutlet],
  templateUrl: './front-desk.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './front-desk.component.scss',
})
export class FrontDeskComponent { }
