import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import {
  GitHubReleaseService,
  ParsedRelease,
  PlatformAsset,
} from './github-release.service';

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './downloads.html',
  styleUrl: './downloads.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Downloads implements OnInit {
  private releaseService = inject(GitHubReleaseService);

  readonly releases = signal<ParsedRelease[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly userPlatform = signal<'windows' | 'macos' | 'linux'>('windows');

  readonly latestRelease = computed<ParsedRelease | null>(() => {
    const all = this.releases();
    return all.length > 0 ? all[0] : null;
  });

  readonly olderReleases = computed<ParsedRelease[]>(() => {
    const all = this.releases();
    return all.length > 1 ? all.slice(1) : [];
  });

  readonly recommendedAsset = computed<PlatformAsset | null>(() => {
    const latest = this.latestRelease();
    if (!latest) return null;
    const platform = this.userPlatform();
    // Prefer installer over portable
    const match = latest.assets.find(
      (a) => a.platform === platform && a.label.toLowerCase().includes('installer')
    );
    return match || latest.assets.find((a) => a.platform === platform) || null;
  });

  readonly otherLatestAssets = computed<PlatformAsset[]>(() => {
    const latest = this.latestRelease();
    const recommended = this.recommendedAsset();
    if (!latest) return [];
    return latest.assets.filter((a) => a !== recommended);
  });

  readonly platformLabel = computed<string>(() => {
    const p = this.userPlatform();
    switch (p) {
      case 'windows':
        return 'Windows';
      case 'macos':
        return 'macOS';
      case 'linux':
        return 'Linux';
    }
  });

  readonly platformIcon = computed<string>(() => {
    const p = this.userPlatform();
    switch (p) {
      case 'windows':
        return 'desktop_windows';
      case 'macos':
        return 'laptop_mac';
      case 'linux':
        return 'computer';
    }
  });

  ngOnInit(): void {
    this.userPlatform.set(this.releaseService.detectUserPlatform());
    this.loadReleases();
  }

  loadReleases(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.releaseService.getReleases().subscribe({
      next: (releases) => {
        this.releases.set(releases);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch releases:', err);
        this.error.set('Unable to load releases. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  formatBytes(bytes: number): string {
    return this.releaseService.formatBytes(bytes);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getPlatformIcon(platform: string): string {
    switch (platform) {
      case 'windows':
        return 'desktop_windows';
      case 'macos':
        return 'laptop_mac';
      case 'linux':
        return 'computer';
      default:
        return 'download';
    }
  }

  getAssetsForPlatform(release: ParsedRelease, platform: string): PlatformAsset[] {
    return release.assets.filter((a) => a.platform === platform);
  }

  getUniquePlatforms(release: ParsedRelease): string[] {
    return [...new Set(release.assets.map((a) => a.platform))];
  }

  getPlatformLabel(platform: string): string {
    switch (platform) {
      case 'windows':
        return 'Windows';
      case 'macos':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return platform;
    }
  }
}
