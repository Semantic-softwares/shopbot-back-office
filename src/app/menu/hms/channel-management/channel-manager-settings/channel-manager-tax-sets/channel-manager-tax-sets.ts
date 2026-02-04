import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-channel-manager-tax-sets',
  imports: [RouterModule],
  templateUrl: './channel-manager-tax-sets.html',
  styleUrl: './channel-manager-tax-sets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerTaxSets { }
