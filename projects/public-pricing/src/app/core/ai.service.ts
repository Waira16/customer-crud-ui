import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PackageRecommendResponse {
  recommendation: string;
  aiPowered: boolean;
  tariffId?: number;
  tariffName?: string;
  tariffPrice?: number;
  deviceId?: number;
  deviceName?: string;
  estimatedMonthlyTotal?: number;
  facts?: string[];
}

export interface AiHealthResponse {
  status: string;
  ollamaAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly base = `${environment.apiBaseUrl}/api/v1/ai`;

  constructor(private http: HttpClient) {}

  getHealth(): Observable<AiHealthResponse> {
    return this.http.get<AiHealthResponse>(`${this.base}/health`);
  }

  recommendPackage(payload: {
    dataGb: number;
    minutes: number;
    deviceId?: number | null;
    installmentMonths?: number;
  }): Observable<PackageRecommendResponse> {
    return this.http.post<PackageRecommendResponse>(`${this.base}/recommend-package`, {
      dataGb: payload.dataGb,
      minutes: payload.minutes,
      deviceId: payload.deviceId ?? undefined,
      installmentMonths: payload.installmentMonths
    });
  }
}
