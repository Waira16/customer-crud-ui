import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  DevicePurchaseRequest,
  DevicePurchaseResponse,
  SalesDevice
} from '../models/device-sales';

@Injectable({
  providedIn: 'root'
})
export class DeviceSalesService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/devices`;

  constructor(private http: HttpClient) {}

  fetchSalesDevices(): Observable<SalesDevice[]> {
    return this.http.get<SalesDevice[]>(this.apiUrl);
  }

  purchaseDevice(request: DevicePurchaseRequest): Observable<DevicePurchaseResponse> {
    return this.http.post<DevicePurchaseResponse>(`${this.apiUrl}/purchase`, request);
  }
}
