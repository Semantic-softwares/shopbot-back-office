import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  mobileMenuOpen = signal(false);
  navbarTransparent = signal(false);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.navbarTransparent.set(window.scrollY > 20);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.navbarTransparent.set(window.scrollY > 20);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  scrollToFeatures(): void {
    this.mobileMenuOpen.set(false);
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToPricing(): void {
    this.mobileMenuOpen.set(false);
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToProducts(): void {
    this.mobileMenuOpen.set(false);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToMenuItems(productId: string): void {
    this.mobileMenuOpen.set(false);
    document.getElementById(productId)?.scrollIntoView({ behavior: 'smooth' });
  }

  navigateToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }
}
