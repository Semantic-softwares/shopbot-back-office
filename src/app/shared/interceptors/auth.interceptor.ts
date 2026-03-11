import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStorageService } from '../services/session-storage.service';
import { StoreStore } from '../stores/store.store';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Skip auth headers for external API calls (e.g. GitHub)
    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    const sessionStorage = inject(SessionStorageService);
    const token = sessionStorage.getItem<string>('auth_token');
    const storeStore = inject(StoreStore);

    if (token) {
        const authReq = req.clone({
            headers: req.headers
                .set('Authorization', `Bearer ${token}`)
                .set('storeId', storeStore.selectedStore()?._id || ''),
        });
        return next(authReq);
    }
    
    return next(req);
};