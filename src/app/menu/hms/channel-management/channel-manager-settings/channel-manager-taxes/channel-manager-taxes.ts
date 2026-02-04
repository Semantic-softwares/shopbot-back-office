import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-channel-manager-taxes',
  imports: [RouterModule],
  templateUrl: './channel-manager-taxes.html',
  styleUrl: './channel-manager-taxes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerTaxes { }
