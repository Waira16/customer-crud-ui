import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PricedItem, SpecialOffer, resolveCustomerPrice } from './pricing.util';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly offersUrl = `${environment.apiBaseUrl}/api/customers/portal/special-offers`;
  private cache$: Observable<SpecialOffer[]> | null = null;
  private cachedOffers: SpecialOffer[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  loadOffers(): Observable<SpecialOffer[]> {
    if (!this.authService.isLoggedIn()) {
      this.cachedOffers = [];
      return of([]);
    }
    if (!this.cache$) {
      this.cache$ = this.http.get<SpecialOffer[]>(this.offersUrl, {
        headers: this.authHeaders()
      }).pipe(
        tap((offers) => {
          this.cachedOffers = offers ?? [];
        }),
        catchError(() => {
          this.cachedOffers = [];
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  clearCache(): void {
    this.cache$ = null;
    this.cachedOffers = [];
  }

  price(
    listPrice: number,
    targetType: string,
    targetId?: number | null
  ): PricedItem {
    return resolveCustomerPrice(
      listPrice,
      targetType,
      targetId,
      this.authService.getLoyaltyDiscountPercent(),
      this.cachedOffers
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
