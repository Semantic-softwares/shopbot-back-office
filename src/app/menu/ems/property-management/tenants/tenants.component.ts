import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './tenants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantsComponent {}
