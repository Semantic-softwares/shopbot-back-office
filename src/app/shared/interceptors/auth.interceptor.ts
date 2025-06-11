import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStorageService } from '../services/session-storage.service';
import { StoreStore } from '../stores/store.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
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