import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CatalogTariff {
  id: number;
  name: string;
  dataGB: number;
  minutes: number;
  price: number;
  type: string;
  imageUrl?: string;
}

export interface CatalogDevice {
  id: number;
  name: string;
  brand?: string;
  price: number;
  category?: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  fetchTariffs(): Observable<CatalogTariff[]> {
    return this.http.get<CatalogTariff[]>(`${this.base}/api/tariffs`);
  }

  fetchDevices(): Observable<CatalogDevice[]> {
    return this.http.get<CatalogDevice[]>(`${this.base}/api/devices`);
  }
}
