import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatExpansionModule,
    // HasPermissionDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  public isMobile = signal(window.innerWidth < 768);
  public opened = signal(true);
  public currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  hasAllRequiredPermissions = this.authService.hasAnyPermission([
    'manage_users',
    'manage_events',
    'manage_companies',
    'manage_dashboard',
    'manage_settings'
  ]);

  public navItems = [
    {
      name:  'Reports',
      children: [
        { icon: 'leaderboard', label: 'Sales summary', link: './reports/summary', permission: 'view_company' },
        { icon: 'shop', label: 'Sales by item', link: './reports/sales-by-item', permission: 'view_timeline' },
        { icon: 'category', label: 'Sales by category', link: './reports/sales-by-category', permission: 'view_company' },
        { icon: 'diversity_1', label: 'Sales by employee', link: './reports/sales-by-employee', permission: 'manage_home' },
        { icon: 'payments', label: 'Sales by payment type', link: './reports/sales-by-payment-type', permission: 'manage_home' },
        { icon: 'description', label: 'Receipts', link: './reports/receipts', permission: 'manage_home' },
      ]
    },
    {
      name:  'Items',
      children: [
        { icon: 'local_mall', label: 'Products', link: './items/products', permission: 'view_company' },
        { icon: 'category_search', label: 'Categories', link: './items/categories', permission: 'view_timeline' },
        { icon: 'palette', label: 'Modifiers', link: './items/variants', permission: 'view_company' },
        { icon: 'check_box', label: 'Options', link: './items/options', permission: 'view_company' },
        // { icon: 'loyalty', label: 'Discount', link: './items/options', permission: 'view_company' },
      ]
    },
    // {
    //   name:  'Inventory',
    //   children: [
    //     { icon: 'warehouse', label: 'Inventory Management', link: './inventory/products', permission: 'view_company' },
    //   ]
    // },
    {
      name:  'Employees',
      children: [
        { icon: 'groups', label: 'Employees', link: './employees/list', permission: 'view_company' },
        // { icon: 'security', label: 'Access Rights', link: './items/categories', permission: 'view_timeline' },
      ]
    },
    // {
    //   name:  'Application Settings',
    //   children: [
    //     { icon: 'settings', label: 'Settings', link: './settings', permission: 'view_company' },
    //   ]
    // },
  ];

  public openLink(link: string): void { 
    this.router.navigate([link], { relativeTo: this.route });
  }

  toggleSidenav() {
    this.opened.set(!this.opened());
  }

  goToProfile() {
    this.router.navigate(['dashboard', 'general', 'profile']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
