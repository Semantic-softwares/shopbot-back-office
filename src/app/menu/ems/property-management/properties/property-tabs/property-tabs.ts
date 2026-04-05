import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-property-tabs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  templateUrl: './property-tabs.html',
  styleUrl: './property-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyTabs {
  readonly tabs = [
    { label: 'Properties', link: 'properties', icon: 'domain' },
    { label: 'Units', link: 'units', icon: 'apartment' },
  ];
}
