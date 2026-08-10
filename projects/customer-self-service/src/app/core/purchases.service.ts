import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { DeviceInstallment } from './device-installment.service';

export interface PurchasedAddon {
  id: number;
  addonId?: number;
  name: string;
  type?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
  validDaysLeft?: number;
}

export interface ShopOrderItem {
  id?: number;
  itemType?: string;
  itemId?: number;
  itemName?: string;
  itemBrand?: string;
  price?: number;
  imageUrl?: string;
}

export interface ShopOrder {
  id: number;
  orderDate?: string;
  totalAmount?: number;
  items?: ShopOrderItem[];
}

export interface PortalPurchases {
  addons: PurchasedAddon[];
  shopOrders: ShopOrder[];
  deviceInstallments: DeviceInstallment[];
}

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private readonly url = `${environment.apiBaseUrl}/api/customers/portal/purchases`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listMine(): Observable<PortalPurchases> {
    return this.http.get<PortalPurchases>(this.url, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
