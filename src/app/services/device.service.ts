import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, DeviceCategory } from '../models/device';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private apiUrl = `${environment.apiBaseUrl}/api/devices`;

  constructor(private http: HttpClient) {}

  fetchDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  fetchByCategory(category: DeviceCategory): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/category/${category}`);
  }

}
