import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  currentYear = signal<number>(new Date().getFullYear());

  scrollToMenuItems(productId: string): void {
    document.getElementById(productId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
