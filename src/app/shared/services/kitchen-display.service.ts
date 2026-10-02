import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KdsStatusCatalog } from '../models/station.model';

/**
 * Back-office only configures the kitchen display (station status flows);
 * orders are run from the standalone shopbot-kds board.
 */
@Injectable({ providedIn: 'root' })
export class KitchenDisplayService {
  private http = inject(HttpClient);
  private hostServer: string = environment.apiUrl;

  /**
   * The fixed, backend-defined status list, allowed shortcut keys (F1–F12)
   * and default flow. Single source of truth for the station status editor.
   */
  getStatusCatalog(): Observable<KdsStatusCatalog> {
    return this.http.get<KdsStatusCatalog>(`${this.hostServer}/kitchen-display/statuses`);
  }
}
