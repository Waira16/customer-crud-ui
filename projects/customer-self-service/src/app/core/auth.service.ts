import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerPortalProfile } from './profile.service';

export interface PortalLoginResponse {
  token: string;
  username: string;
  roles: string[];
  customerId?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  packageName?: string;
  packageSummary?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'customer_portal_token';
  private readonly customerIdKey = 'customer_portal_id';
  private readonly phoneKey = 'customer_portal_phone';
  private readonly firstNameKey = 'customer_portal_first_name';
  private readonly lastNameKey = 'customer_portal_last_name';
  private readonly packageNameKey = 'customer_portal_package_name';
  private readonly packageSummaryKey = 'customer_portal_package_summary';
  private readonly fullNameKey = 'customer_portal_full_name';
  private readonly loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private readonly profileSubject = new BehaviorSubject<CustomerPortalProfile | null>(this.loadStoredProfile());

  loggedIn$ = this.loggedInSubject.asObservable();
  profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(customerId: number, phone: string): Observable<PortalLoginResponse> {
    return this.http.post<PortalLoginResponse>(
      `${environment.apiBaseUrl}/api/auth/customer-portal-login`,
      { customerId, phone }
    ).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.customerIdKey, String(response.customerId ?? customerId));
        if (response.username) {
          localStorage.setItem(this.phoneKey, response.username);
        }
        this.storeProfileFields(response);
        this.profileSubject.next(this.loadStoredProfile());
        this.loggedInSubject.next(true);
      })
    );
  }

  setProfile(profile: CustomerPortalProfile): void {
    localStorage.setItem(this.firstNameKey, profile.firstName ?? '');
    localStorage.setItem(this.lastNameKey, profile.lastName ?? '');
    localStorage.setItem(this.fullNameKey, profile.fullName ?? '');
    localStorage.setItem(this.packageNameKey, profile.packageName ?? '');
    localStorage.setItem(this.packageSummaryKey, profile.packageSummary ?? '');
    if (profile.phone) {
      localStorage.setItem(this.phoneKey, profile.phone);
    }
    this.profileSubject.next(profile);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.customerIdKey);
    localStorage.removeItem(this.phoneKey);
    localStorage.removeItem(this.firstNameKey);
    localStorage.removeItem(this.lastNameKey);
    localStorage.removeItem(this.packageNameKey);
    localStorage.removeItem(this.packageSummaryKey);
    localStorage.removeItem(this.fullNameKey);
    this.profileSubject.next(null);
    this.loggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCustomerId(): number | null {
    const value = localStorage.getItem(this.customerIdKey);
    return value ? Number(value) : null;
  }

  getPhone(): string | null {
    return localStorage.getItem(this.phoneKey);
  }

  getFullName(): string {
    const storedFullName = localStorage.getItem(this.fullNameKey)?.trim();
    if (storedFullName) {
      return storedFullName;
    }

    const profile = this.profileSubject.value ?? this.loadStoredProfile();
    if (profile?.fullName?.trim() && profile.fullName !== 'Değerli Müşterimiz') {
      return profile.fullName.trim();
    }

    const first = localStorage.getItem(this.firstNameKey)?.trim() ?? '';
    const last = localStorage.getItem(this.lastNameKey)?.trim() ?? '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Değerli Müşterimiz';
  }

  getInitials(): string {
    const profile = this.profileSubject.value ?? this.loadStoredProfile();
    const first = profile?.firstName?.trim() || localStorage.getItem(this.firstNameKey)?.trim() || '';
    const last = profile?.lastName?.trim() || localStorage.getItem(this.lastNameKey)?.trim() || '';
    const initials = `${first.charAt(0)}${last.charAt(0)}`.trim().toUpperCase();
    if (initials) {
      return initials;
    }
    const customerId = this.getCustomerId();
    return customerId ? String(customerId).slice(-2) : '?';
  }

  getPackageName(): string {
    const profile = this.profileSubject.value ?? this.loadStoredProfile();
    return profile?.packageName
      || localStorage.getItem(this.packageNameKey)
      || 'Aktif paket tanımlı değil';
  }

  getPackageSummary(): string {
    const profile = this.profileSubject.value ?? this.loadStoredProfile();
    return profile?.packageSummary
      || localStorage.getItem(this.packageSummaryKey)
      || 'Tarife bilgisi yükleniyor';
  }

  getDisplayProfile(): CustomerPortalProfile {
    return this.profileSubject.value ?? this.loadStoredProfile() ?? {
      customerId: this.getCustomerId() ?? 0,
      firstName: '',
      lastName: '',
      fullName: this.getFullName(),
      phone: this.getPhone() ?? '',
      packageName: this.getPackageName(),
      packageSummary: this.getPackageSummary()
    };
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  private storeProfileFields(response: PortalLoginResponse): void {
    if (response.fullName?.trim()) {
      localStorage.setItem(this.fullNameKey, response.fullName.trim());
    }
    if (response.firstName) {
      localStorage.setItem(this.firstNameKey, response.firstName);
    }
    if (response.lastName) {
      localStorage.setItem(this.lastNameKey, response.lastName);
    }
    if (!response.fullName?.trim() && response.firstName) {
      const combined = `${response.firstName} ${response.lastName ?? ''}`.trim();
      localStorage.setItem(this.fullNameKey, combined);
    }
    if (response.packageName) {
      localStorage.setItem(this.packageNameKey, response.packageName);
    }
    if (response.packageSummary) {
      localStorage.setItem(this.packageSummaryKey, response.packageSummary);
    }
  }

  private loadStoredProfile(): CustomerPortalProfile | null {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return null;
    }

    const firstName = localStorage.getItem(this.firstNameKey) ?? '';
    const lastName = localStorage.getItem(this.lastNameKey) ?? '';
    const fullName = localStorage.getItem(this.fullNameKey)?.trim()
      || `${firstName} ${lastName}`.trim()
      || 'Değerli Müşterimiz';

    return {
      customerId,
      firstName,
      lastName,
      fullName: fullName || 'Değerli Müşterimiz',
      phone: this.getPhone() ?? '',
      packageName: localStorage.getItem(this.packageNameKey) ?? 'Aktif paket tanımlı değil',
      packageSummary: localStorage.getItem(this.packageSummaryKey) ?? ''
    };
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
