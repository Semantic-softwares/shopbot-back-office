import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Store } from '../../models';
import { RolesService } from '../../services/roles.service';

export interface NavItem {
  icon: string;
  label: string;
  link: string;
  permission?: string;
  permissions?: string[];
}

export interface NavGroup {
  name: string;
  icon?: string;
  children: NavItem[];
  permission?: string;
  permissions?: string[];
}

export type NavConfig = NavItem | NavGroup;

export interface StoreInfo {
  logo?: string;
  name?: string;
  type?: string;
}

export interface UserInfo {
  roleName?: string;
}

export type SidenavMode = 'over' | 'push' | 'side';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private rolesService = inject(RolesService);
  private breakpointObserver = inject(BreakpointObserver);

  // Inputs
  navItems = input<NavConfig[]>([]);
  showStoreSelector = input<boolean>(true);
  stores = input<Store[]>([]);
  storeInfo = input<StoreInfo | undefined>(undefined);
  userInfo = input<UserInfo | undefined>(undefined);
  settingsLink = input<string[] | string>(['../settings']);
  defaultIcon = input<string>('store');
  
  // Responsive behavior inputs
  defaultCollapsed = input<boolean>(true); // Icon-only by default on desktop/tablet
  
  // Two-way binding for opened state (allows parent to control if needed)
  opened = model<boolean>(true);
  
  // Outputs
  storeSelected = output<Store>();

  // Internal state for expanded/collapsed
  private _isExpanded = signal(false);

  // Responsive breakpoints using CDK
  private isMobile$ = this.breakpointObserver
    .observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(map(result => result.matches));
  
  isMobile = toSignal(this.isMobile$, { initialValue: false });

  // Computed: Determine if sidebar is in collapsed (icon-only) mode
  isCollapsed = computed(() => {
    // Mobile: never collapsed (either hidden or full when shown)
    if (this.isMobile()) {
      return false;
    }
    // Desktop/Tablet: collapsed unless expanded
    return this.defaultCollapsed() && !this._isExpanded();
  });

  // Computed: Sidenav mode based on device
  sidenavMode = computed((): SidenavMode => {
    if (this.isMobile()) {
      return 'over';
    }
    return 'side'; // Push content on desktop/tablet
  });

  // Computed: Sidenav width based on collapsed state
  sidenavWidth = computed(() => {
    if (this.isMobile()) {
      return '280px';
    }
    return this.isCollapsed() ? '72px' : '280px';
  });

  // Toggle expanded state (for desktop/tablet)
  toggleExpanded(): void {
    this._isExpanded.update(v => !v);
  }

  // Toggle sidenav - handles both mobile (show/hide) and desktop (expand/collapse)
  toggle(): void {
    if (this.isMobile()) {
      this.opened.update(v => !v);
    } else {
      this.toggleExpanded();
    }
  }

  // Close sidenav (for mobile overlay)
  close(): void {
    if (this.isMobile()) {
      this.opened.set(false);
    }
  }

  // Expand the sidebar (used when clicking grouped items in collapsed mode)
  expand(): void {
    this._isExpanded.set(true);
  }

  // Check if fully expanded (not collapsed)
  isExpanded = computed(() => !this.isCollapsed());

  // Computed: Check if nav items are grouped (have children)
  isGrouped = computed(() => {
    const items = this.navItems();
    return items.length > 0 && 'children' in items[0];
  });

  // Helper to check item permissions
  private hasPermission(item: NavItem | NavGroup): boolean {
    // Check single permission
    if (item.permission) {
      return this.rolesService.hasAny([item.permission]);
    }
    // Check array of permissions
    if (item.permissions?.length) {
      return this.rolesService.hasAny(item.permissions);
    }
    // No permissions required
    return true;
  }

  // Computed: Filtered nav items based on permissions
  filteredNavItems = computed(() => {
    const items = this.navItems();
    
    if (this.isGrouped()) {
      // Filter grouped items
      return (items as NavGroup[])
        .map(group => ({
          ...group,
          children: group.children.filter(item => this.hasPermission(item)),
        }))
        .filter(group => group.children.length > 0);
    } else {
      // Filter flat items
      return (items as NavItem[]).filter(item => this.hasPermission(item));
    }
  });

  // Type guards for template
  isNavGroup(item: NavConfig): item is NavGroup {
    return 'children' in item;
  }

  selectStore(store: Store): void {
    this.storeSelected.emit(store);
  }
}
