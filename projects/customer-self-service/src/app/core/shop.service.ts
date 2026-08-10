import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface PortalPayment {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface PortalShopCheckoutRequest {
  addonIds?: number[];
  deviceIds?: number[];
  tariffIds?: number[];
  billToInvoice?: boolean;
  payment?: PortalPayment;
}

export interface PortalDevicePurchaseRequest {
  deviceId: number;
  installments: number;
  billToInvoice?: boolean;
  payment?: PortalPayment;
}

export interface PortalDevicePurchaseResponse {
  message?: string;
  monthlyInstallment?: number;
  totalInstallments?: number;
  contractId?: number;
  customerId?: number;
  deviceId?: number;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly checkoutUrl = `${environment.apiBaseUrl}/api/customers/portal/shop/checkout`;
  private readonly devicePurchaseUrl = `${environment.apiBaseUrl}/api/customers/portal/devices/purchase`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  checkout(request: PortalShopCheckoutRequest): Observable<unknown> {
    const payload: PortalShopCheckoutRequest = {
      addonIds: request.addonIds ?? [],
      deviceIds: request.deviceIds ?? [],
      tariffIds: request.tariffIds ?? [],
      billToInvoice: !!request.billToInvoice,
      payment: request.billToInvoice ? undefined : request.payment
    };

    return this.http.post(this.checkoutUrl, payload, {
      headers: this.authHeaders()
    });
  }

  purchaseDevice(request: PortalDevicePurchaseRequest): Observable<PortalDevicePurchaseResponse> {
    return this.http.post<PortalDevicePurchaseResponse>(this.devicePurchaseUrl, {
      deviceId: request.deviceId,
      installments: request.installments,
      billToInvoice: !!request.billToInvoice,
      payment: request.billToInvoice ? undefined : request.payment
    }, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
