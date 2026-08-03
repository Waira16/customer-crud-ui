import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  aiPowered?: boolean;
}

export interface ChatResponse {
  reply: string;
  aiPowered: boolean;
  facts?: string[];
}

export interface AiHealthResponse {
  status: string;
  ollamaAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly base = `${environment.apiBaseUrl}/api/v1/ai`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  sendChat(message: string): Observable<ChatResponse> {
    const customerId = this.authService.getCustomerId();
    return this.http.post<ChatResponse>(
      `${this.base}/chat`,
      { customerId, message },
      { headers: this.authHeaders() }
    );
  }

  getHealth(): Observable<AiHealthResponse> {
    return this.http.get<AiHealthResponse>(`${this.base}/health`);
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
