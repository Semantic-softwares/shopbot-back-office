import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'shopbot-back-office';
}
