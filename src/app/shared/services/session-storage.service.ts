import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Store } from '../models';

@Injectable({
    providedIn: 'root'
})
export class SessionStorageService {
    private readonly CURRENT_USER_KEY = 'currentUser';
    private readonly AUTH_TOKEN_KEY = 'auth_token';
    private readonly STORES_KEY = 'store';

    constructor() { }

    setCurrentUser(user: any): void {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    }

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    removeCurrentUser(): void {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    clearAll(): void {
        localStorage.clear();
    }

    setAuthToken(token: string): void {
        localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    }
    
    getAuthToken(): string | null {
        return localStorage.getItem(this.AUTH_TOKEN_KEY);
    }
    
    removeAuthToken(): void {
        localStorage.removeItem(this.AUTH_TOKEN_KEY);
    }

    setItem(key: string, value: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
        }
    }

    getItem<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return null;
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }

    setStore(store: Store): void {
        localStorage.setItem(this.STORES_KEY, JSON.stringify(store));
    }

    setStores(stores: Store[]): void {
        localStorage.setItem('stores', JSON.stringify(stores));
    }

    getStores(): Store[] | null {
        const storesStr = localStorage.getItem('stores');
        return storesStr ? JSON.parse(storesStr) : null;
    }

    removeStores(): void {
        localStorage.removeItem('stores');
    }

    getStore<T = Store>(): T | null {
        const storesStr = localStorage.getItem(this.STORES_KEY);
        return storesStr ? JSON.parse(storesStr) : null;
    }

    removeStore(): void {
        localStorage.removeItem(this.STORES_KEY);
    }
}


