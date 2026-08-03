import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { UsageService } from '../../core/usage.service';
import { ProfileService, CustomerPortalProfile } from '../../core/profile.service';
import { CatalogAddon, CatalogService } from '../../core/catalog.service';
import { MoneyPipe } from '../../core/money.pipe';
import { MessageBoxService } from '../../core/message-box/message-box.service';

interface ExtraDataOffer {
  gb: number;
  label: string;
  hint: string;
  featured?: boolean;
}

@Component({
  selector: 'self-packages',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MoneyPipe
  ],
  templateUrl: './packages.html',
  styleUrl: './packages.css'
})
export class PackagesComponent implements OnInit {
  isLoading = true;
  isBuying = false;
  buyingGb: number | null = null;

  remainingDataLabel = '—';
  dataUsedMb = 0;
  dataQuotaMb = 1000;

  readonly extraOffers: ExtraDataOffer[] = [
    { gb: 5, label: 'Ek 5 GB', hint: 'Anında tanımlanır', featured: true },
    { gb: 10, label: 'Ek 10 GB', hint: 'Yoğun kullanım için' },
    { gb: 20, label: 'Ek 20 GB', hint: 'Ay sonuna kadar rahat edin' }
  ];

  addons: CatalogAddon[] = [];
  readonly Math = Math;

  constructor(
    private authService: AuthService,
    private usageService: UsageService,
    private profileService: ProfileService,
    private catalogService: CatalogService,
    private messageBox: MessageBoxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      void this.router.navigate(['/login']);
      return;
    }

    this.applyProfile(this.authService.getDisplayProfile());
    this.loadUsage(customerId);
    this.loadAddons();
  }

  get packageName(): string {
    return this.authService.getPackageName();
  }

  get packageSummary(): string {
    return this.authService.getPackageSummary();
  }

  get customerName(): string {
    return this.authService.getFullName();
  }

  buyExtraGb(gb: number): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId || this.isBuying) {
      return;
    }

    this.messageBox.confirmExtraDataPurchase(gb).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isBuying = true;
      this.buyingGb = gb;

      this.usageService.buyExtraData(customerId, gb).subscribe({
        next: (response) => {
          this.isBuying = false;
          this.buyingGb = null;
          this.loadUsage(customerId);
          void this.messageBox.success('Paket Tanımlandı', response.message);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isBuying = false;
          this.buyingGb = null;
          void this.messageBox.error(
            'Satın Alma Başarısız',
            err?.error?.message ?? 'Ek paket tanımlanamadı.'
          );
          this.cdr.detectChanges();
        }
      });
    });
  }

  addonTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      STREAMING: 'Dijital Platform',
      TV: 'TV Paketi',
      INTERNET: 'İnternet',
      SECURITY: 'Güvenlik',
      OTHER: 'Ek Hizmet'
    };
    return labels[type] ?? 'Ek Paket';
  }

  private loadUsage(customerId: number): void {
    this.isLoading = true;
    this.profileService.loadProfile().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.authService.setProfile(profile);
          this.applyProfile(profile);
        }
      }
    });
  }

  private loadAddons(): void {
    this.catalogService.fetchAddons().subscribe({
      next: (addons) => {
        this.addons = addons.filter((item) => item.active !== false);
        this.cdr.detectChanges();
      }
    });
  }

  private applyProfile(profile: CustomerPortalProfile): void {
    const quota = profile.dataQuotaMb ?? 1000;
    const used = profile.totalDataMb ?? 0;
    const remaining = Math.max(0, quota - used);

    this.dataQuotaMb = quota;
    this.dataUsedMb = used;
    this.remainingDataLabel = remaining >= 1024
      ? `${(remaining / 1024).toFixed(1)} GB`
      : `${remaining} MB`;
  }
}
