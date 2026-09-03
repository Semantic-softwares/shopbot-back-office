import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** One field a store can customize on a QR card design. */
export interface QrTemplateSettingField {
  key: string;
  label: string;
  type: 'color' | 'text' | 'select' | 'image' | 'font';
  default?: any;
  options?: any[];
}

/** A printed QR card design — distinct from a storefront web theme. */
export interface QrTemplate {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  previewImage?: string;
  isBuiltIn: boolean;
  status: 'draft' | 'published';
  supportedSizes: string[];
  settingsSchema: QrTemplateSettingField[];
}

export interface QrPageSize {
  key: string;
  label: string;
  width: string;
  height: string;
  widthMm: number;
  heightMm: number;
}

export interface QrOptions {
  sizes: QrPageSize[];
  languages: { code: string; label: string }[];
}

export interface QrPreviewRequest {
  templateSlug?: string;
  size?: string;
  language?: string;
  settingsOverride?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class QrTemplateService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getTemplates(): Observable<QrTemplate[]> {
    return this.http.get<QrTemplate[]>(`${this.baseUrl}/qr-templates`);
  }

  /**
   * Sizes and languages come from the server rather than being hardcoded here,
   * so the picker can never offer a combination the renderer doesn't support.
   */
  getOptions(): Observable<QrOptions> {
    return this.http.get<QrOptions>(`${this.baseUrl}/qr-templates/options`);
  }

  /** The real PDF, rendered against unsaved form values — embedded in an iframe. */
  preview(storeId: string, request: QrPreviewRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/qr-templates/${storeId}/preview`, request, {
      responseType: 'blob',
    });
  }

  uploadBackground(storeId: string, file: File): Observable<{ photo: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ photo: string }>(
      `${this.baseUrl}/stores/upload/${storeId}/qr-background`,
      formData,
    );
  }
}
