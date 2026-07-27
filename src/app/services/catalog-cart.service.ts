import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CartItemType = 'TARIFF' | 'ADDON' | 'DEVICE';

export interface CartItem {
  type: CartItemType;
  id: number;
  name: string;
  price: number;
}

const CART_STORAGE_KEY = 'agent_catalog_cart';

@Injectable({
  providedIn: 'root'
})
export class CatalogCartService {

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadItems());

  items$ = this.itemsSubject.asObservable();

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  getTotal(): number {
    return this.getItems().reduce((sum, item) => sum + item.price, 0);
  }

  addItem(item: CartItem): void {
    const exists = this.getItems().some(
      existing => existing.type === item.type && existing.id === item.id
    );

    if (exists) {
      return;
    }

    this.saveItems([...this.getItems(), item]);
  }

  removeItem(type: CartItemType, id: number): void {
    this.saveItems(
      this.getItems().filter(item => !(item.type === type && item.id === id))
    );
  }

  removeItemsByType(type: CartItemType): void {
    this.saveItems(this.getItems().filter(item => item.type !== type));
  }

  clear(): void {
    sessionStorage.removeItem(CART_STORAGE_KEY);
    this.itemsSubject.next([]);
  }

  private saveItems(items: CartItem[]): void {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private loadItems(): CartItem[] {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }
}
