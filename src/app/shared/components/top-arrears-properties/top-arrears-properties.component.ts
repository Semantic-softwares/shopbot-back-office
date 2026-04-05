import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TopArrearsProperty } from '../../models/arrears.model';

@Component({
  selector: 'app-top-arrears-properties',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    CurrencyPipe,
  ],
  templateUrl: './top-arrears-properties.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopArrearsPropertiesComponent {
  @Input() properties: TopArrearsProperty[] = [];

  private router = inject(Router);

  viewProperty(propertyId: string): void {
    this.router.navigate(['/menu/ems/properties/properties', propertyId]);
  }
}
