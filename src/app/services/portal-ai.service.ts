import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PortalChatMessage {
  role: 'user' | 'assistant';
  text: string;
  aiPowered?: boolean;
}

export interface PortalChatResponse {
  reply: string;
  aiPowered: boolean;
  facts?: string[];
}

export interface PortalAiHealthResponse {
  status: string;
  ollamaAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class PortalAiService {
  private readonly base = `${environment.apiBaseUrl}/api/v1/ai`;
  private readonly tokenKey = 'customer_portal_token';
  private readonly customerIdKey = 'customer_portal_id';

  constructor(private http: HttpClient) {}

  hasCustomerSession(): boolean {
    return !!this.getToken() && !!this.getCustomerId();
  }

  getHealth(): Observable<PortalAiHealthResponse> {
    return this.http.get<PortalAiHealthResponse>(`${this.base}/health`);
  }

  sendChat(
    message: string,
    history: { role: string; content: string }[] = []
  ): Observable<PortalChatResponse> {
    return this.http.post<PortalChatResponse>(
      `${this.base}/chat`,
      { customerId: this.getCustomerId(), message, history },
      { headers: this.authHeaders() }
    );
  }

  get selfServiceUrl(): string {
    return environment.selfServiceUrl || 'http://localhost:4202';
  }

  private getCustomerId(): number | null {
    const raw = localStorage.getItem(this.customerIdKey);
    if (!raw) {
      return null;
    }
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
