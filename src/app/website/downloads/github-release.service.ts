import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  assets: GitHubAsset[];
}

export interface PlatformAsset {
  platform: 'windows' | 'macos' | 'linux';
  label: string;
  icon: string;
  fileName: string;
  downloadUrl: string;
  size: number;
  downloadCount: number;
}

export interface ParsedRelease {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  isLatest: boolean;
  assets: PlatformAsset[];
}

const REPO_OWNER = 'Semantic-softwares';
const REPO_NAME = 'shopbot-printer-agent';
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`;

@Injectable({
  providedIn: 'root',
})
export class GitHubReleaseService {
  private http = inject(HttpClient);

  private releases$: Observable<ParsedRelease[]> | null = null;

  getReleases(): Observable<ParsedRelease[]> {
    if (!this.releases$) {
      this.releases$ = this.http
        .get<GitHubRelease[]>(API_URL, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        })
        .pipe(
          map((releases) =>
            releases
              .filter((r) => !r.draft)
              .map((release, index) => this.parseRelease(release, index === 0))
          ),
          shareReplay(1)
        );
    }
    return this.releases$;
  }

  private parseRelease(release: GitHubRelease, isLatest: boolean): ParsedRelease {
    return {
      version: release.tag_name,
      name: release.name || release.tag_name,
      body: release.body || '',
      publishedAt: release.published_at,
      isLatest,
      assets: this.classifyAssets(release.assets),
    };
  }

  private classifyAssets(assets: GitHubAsset[]): PlatformAsset[] {
    const platformAssets: PlatformAsset[] = [];

    for (const asset of assets) {
      const name = asset.name.toLowerCase();

      // Skip blockmap and yml metadata files
      if (name.endsWith('.blockmap') || name.endsWith('.yml') || name.endsWith('.yaml')) {
        continue;
      }

      const platform = this.detectPlatform(name);
      if (platform) {
        platformAssets.push({
          platform: platform.platform,
          label: platform.label,
          icon: platform.icon,
          fileName: asset.name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
          downloadCount: asset.download_count,
        });
      }
    }

    return platformAssets;
  }

  private detectPlatform(
    fileName: string
  ): { platform: 'windows' | 'macos' | 'linux'; label: string; icon: string } | null {
    // Windows
    if (fileName.endsWith('.exe') && fileName.toLowerCase().includes('setup')) {
      return { platform: 'windows', label: 'Windows Installer (.exe)', icon: 'desktop_windows' };
    }
    if (fileName.endsWith('.exe') && !fileName.toLowerCase().includes('setup')) {
      return { platform: 'windows', label: 'Windows Portable (.exe)', icon: 'desktop_windows' };
    }
    if (fileName.endsWith('.msi')) {
      return { platform: 'windows', label: 'Windows Installer (.msi)', icon: 'desktop_windows' };
    }

    // macOS
    if (fileName.endsWith('.dmg')) {
      return { platform: 'macos', label: 'macOS Installer (.dmg)', icon: 'laptop_mac' };
    }
    if (fileName.endsWith('.zip') && fileName.includes('mac')) {
      return { platform: 'macos', label: 'macOS Archive (.zip)', icon: 'laptop_mac' };
    }

    // Linux
    if (fileName.endsWith('.appimage')) {
      return { platform: 'linux', label: 'Linux AppImage', icon: 'computer' };
    }
    if (fileName.endsWith('.deb')) {
      return { platform: 'linux', label: 'Linux Debian (.deb)', icon: 'computer' };
    }
    if (fileName.endsWith('.rpm')) {
      return { platform: 'linux', label: 'Linux RPM (.rpm)', icon: 'computer' };
    }
    if (fileName.endsWith('.snap')) {
      return { platform: 'linux', label: 'Linux Snap', icon: 'computer' };
    }

    return null;
  }

  detectUserPlatform(): 'windows' | 'macos' | 'linux' {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || '';

    if (platform.includes('mac') || userAgent.includes('mac')) {
      return 'macos';
    }
    if (platform.includes('win') || userAgent.includes('win')) {
      return 'windows';
    }
    return 'linux';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
