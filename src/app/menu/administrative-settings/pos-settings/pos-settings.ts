import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pos-settings',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule, MatCardModule],
  templateUrl: './pos-settings.html',
  styleUrl: './pos-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosSettings {
  readonly navLinks = [
    { path: 'receipt', label: 'Receipt', icon: 'receipt_long' },
    { path: 'printers', label: 'Printer', icon: 'print' },
  ];
}
