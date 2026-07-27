import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  AuthUser,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  LoginRequest,
  LoginResponse
} from '../models/auth.model';
import { AgentContextService } from './agent-context.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly agentContext = inject(AgentContextService);

  private authState = new BehaviorSubject<AuthUser | null>(this.loadStoredUser());

  currentUser$ = this.authState.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        const user: AuthUser = {
          token: response.token,
          username: response.username,
          roles: response.roles ?? []
        };
        localStorage.setItem(AUTH_TOKEN_KEY, user.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        this.authState.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.authState.next(null);
    this.agentContext.clearSelection();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    return this.authState.value;
  }

  getUsername(): string {
    return this.getCurrentUser()?.username ?? '';
  }

  getRoles(): string[] {
    return this.getCurrentUser()?.roles ?? [];
  }

  hasRole(role: string): boolean {
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    const roles = this.getRoles();

    return roles.includes(role)
      || roles.includes(normalizedRole)
      || roles.includes(role.replace(/^ROLE_/, ''));
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  isAgent(): boolean {
    return this.hasRole('ROLE_AGENT');
  }

  getRoleLabel(): string {
    if (this.isAdmin()) {
      return 'Yönetici';
    }
    if (this.isAgent()) {
      return 'Temsilci';
    }
    return 'Kullanıcı';
  }

  getDefaultRoute(): string {
    return this.isAdmin() ? '/dashboard' : '/portal';
  }

  private loadStoredUser(): AuthUser | null {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const rawUser = localStorage.getItem(AUTH_USER_KEY);

    if (!token || !rawUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawUser) as AuthUser;
      return {
        token,
        username: parsed.username,
        roles: parsed.roles ?? []
      };
    } catch {
      return null;
    }
  }
}
