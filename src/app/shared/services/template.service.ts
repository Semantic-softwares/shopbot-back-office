import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Template } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getPublishedTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.baseUrl}/templates`);
  }
}
