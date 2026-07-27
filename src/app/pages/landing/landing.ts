import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TariffService, Tariff } from '../../services/tariff';
import { AddonService } from '../../services/addon.service';
import { DeviceService } from '../../services/device.service';
import { AddonPackage } from '../../models/addon-package';
import { Device, DEVICE_CATEGORY_LABELS, DeviceCategory } from '../../models/device';
import { MoneyPipe } from '../../pipes/money.pipe';
import { AuthService } from '../../services/auth.service';
import { catalogImageUrl, onCatalogImageError } from '../../utils/catalog-image.util';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MoneyPipe
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit {

  tariffs: Tariff[] = [];
  addons: AddonPackage[] = [];
  devices: Device[] = [];
  isLoading = true;
  loadError = '';

  readonly categoryLabels = DEVICE_CATEGORY_LABELS;

  catalogImageUrl = catalogImageUrl;
  onImageError = onCatalogImageError;

  readonly carouselStep = 5;

  constructor(
    private tariffService: TariffService,
    private addonService: AddonService,
    private deviceService: DeviceService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    let failedRequests = 0;

    forkJoin({
      tariffs: this.tariffService.fetchTariffs().pipe(
        catchError(() => {
          failedRequests++;
          return of([] as Tariff[]);
        })
      ),
      addons: this.addonService.fetchAddons().pipe(
        catchError(() => {
          failedRequests++;
          return of([] as AddonPackage[]);
        })
      ),
      devices: this.deviceService.fetchDevices().pipe(
        catchError(() => {
          failedRequests++;
          return of([] as Device[]);
        })
      )
    }).subscribe({
      next: ({ tariffs, addons, devices }) => {
        this.tariffs = tariffs ?? [];
        this.addons = addons ?? [];
        this.devices = devices ?? [];
        this.isLoading = false;

        if (failedRequests === 3) {
          this.loadError = 'Katalog yüklenemedi. Backend çalışıyor mu kontrol edin.';
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = 'Katalog yüklenemedi. Lütfen daha sonra tekrar deneyin.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollCarousel(track: HTMLElement | null | undefined, direction: 1 | -1): void {
    if (!track) {
      return;
    }

    const firstCard = track.querySelector('.carousel-item') as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 240;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16') || 16;
    const distance = this.carouselStep * (cardWidth + gap);

    track.scrollBy({
      left: direction * distance,
      behavior: 'smooth'
    });
  }

  deviceCategoryLabel(category: DeviceCategory): string {
    return this.categoryLabels[category] ?? category;
  }

  goToPanel(): void {
    this.router.navigate([this.authService.getDefaultRoute()]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  tariffSummary(tariff: Tariff): string {
    const parts: string[] = [];
    if (tariff.dataGB > 0) {
      parts.push(`${tariff.dataGB} GB`);
    }
    if (tariff.minutes > 0) {
      parts.push(`${tariff.minutes} dk`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Esnek kullanım paketi';
  }

  addonTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      INTERNET: 'İnternet',
      STREAMING: 'Yayın',
      TV: 'TV',
      SECURITY: 'Güvenlik'
    };
    return labels[type] ?? type;
  }

  addonSummary(addon: AddonPackage): string {
    if (addon.description?.trim()) {
      return addon.description;
    }

    const fallbacks: Record<string, string> = {
      INTERNET: 'Ek internet kotası paketi',
      STREAMING: 'Yayın platformu içerik paketi',
      TV: 'TV kanalları ve canlı yayın paketi',
      SECURITY: 'Güvenlik ve koruma hizmeti'
    };

    return fallbacks[addon.type] ?? 'Ek hizmet paketi';
  }

  isAddonLogo(addon: AddonPackage): boolean {
    return addon.type === 'STREAMING'
      || addon.type === 'TV'
      || !!addon.imageUrl?.includes('.svg');
  }

}
