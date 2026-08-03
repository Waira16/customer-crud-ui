import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OnlineApplicationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  address?: string;
  selectedTariffId?: number;
  notes?: string;
}

export interface OnlineApplicationResponse {
  id: number;
  status: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  submit(payload: OnlineApplicationPayload): Observable<OnlineApplicationResponse> {
    return this.http.post<OnlineApplicationResponse>(
      `${this.base}/api/customers/applications`,
      payload
    );
  }
}
