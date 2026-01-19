import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'channel-management',
  imports: [RouterModule],
  templateUrl: './channel-management.html',
  styleUrl: './channel-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagement { }
