import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-channel-manager-policies',
  imports: [RouterModule],
  templateUrl: './channel-manager-policies.html',
  styleUrl: './channel-manager-policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerPolicies { }
