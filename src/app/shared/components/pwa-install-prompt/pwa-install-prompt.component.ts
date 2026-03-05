import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pwa-install-prompt.component.html',
  styleUrl: './pwa-install-prompt.component.scss',
})
export class PwaInstallPromptComponent {
  protected installService = inject(PwaInstallService);

  get shouldShow(): boolean {
    return (this.installService.canInstall() || this.installService.showIosInstall())
      && !this.installService.isInstalled()
      && !this.installService.wasRecentlyDismissed();
  }

  async onInstall(): Promise<void> {
    await this.installService.promptInstall();
  }

  onDismiss(): void {
    this.installService.dismissInstall();
  }
}
