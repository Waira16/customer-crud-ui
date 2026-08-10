import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subscription, interval, of, Observable } from 'rxjs';
import { catchError, finalize, switchMap, timeout, concatMap, toArray } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { UsageService } from '../../core/usage.service';
import { ProfileService, CustomerPortalProfile } from '../../core/profile.service';
import { CatalogAddon, CatalogDevice, CatalogService } from '../../core/catalog.service';
import { ShopService } from '../../core/shop.service';
import { PricingService } from '../../core/pricing.service';
import { PricedItem } from '../../core/pricing.util';
import { catalogImageUrl, onCatalogImageError } from '../../core/catalog-image.util';
import { MoneyPipe } from '../../core/money.pipe';
import { MessageBoxService } from '../../core/message-box/message-box.service';
import {
  PaymentDialogComponent,
  PaymentDialogResult
} from '../../core/payment-dialog/payment-dialog';
import { calculateMonthlyInstallment, DEFAULT_INSTALLMENT_MONTHS } from 'telecom-shared';

interface ExtraDataOffer {
  gb: number;
  label: string;
  hint: string;
  featured?: boolean;
}

type CatalogTab = 'addons' | 'devices';

interface CartItem {
  key: string;
  type: 'ADDON' | 'DEVICE';
  id: number;
  name: string;
  price: number;
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
export class PackagesComponent implements OnInit, OnDestroy {
  isLoading = true;
  isBuying = false;
  buyingGb: number | null = null;
  isCheckingOut = false;
  catalogLoading = true;

  remainingDataLabel = '—';
  dataUsedMb = 0;
  dataQuotaMb = 1000;
  private usagePollSub?: Subscription;

  readonly extraOffers: ExtraDataOffer[] = [
    { gb: 5, label: 'Ek 5 GB', hint: '1 ay geçerli · anında tanımlanır', featured: true },
    { gb: 10, label: 'Ek 10 GB', hint: '1 ay geçerli · yoğun kullanım için' },
    { gb: 20, label: 'Ek 20 GB', hint: '1 ay geçerli · ay sonuna kadar rahat edin' }
  ];

  catalogTab: CatalogTab = 'addons';
  addons: CatalogAddon[] = [];
  devices: CatalogDevice[] = [];
  cart: CartItem[] = [];
  private lastBonusMb = 0;
  readonly Math = Math;

  constructor(
    private authService: AuthService,
    private usageService: UsageService,
    private profileService: ProfileService,
    private catalogService: CatalogService,
    private shopService: ShopService,
    private pricingService: PricingService,
    private messageBox: MessageBoxService,
    private dialog: MatDialog,
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
    this.pricingService.loadOffers().subscribe({
      next: () => this.cdr.detectChanges()
    });
    this.loadUsage(customerId);
    this.loadCatalog();
    this.startUsagePolling(customerId);
  }

  ngOnDestroy(): void {
    this.stopUsagePolling();
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

  get cartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  get cartCount(): number {
    return this.cart.length;
  }

  setCatalogTab(tab: CatalogTab): void {
    this.catalogTab = tab;
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
          if (response?.totalBonusMb != null) {
            const baseQuota = Math.max(0, this.dataQuotaMb - (this.lastBonusMb || 0));
            this.lastBonusMb = response.totalBonusMb;
            this.dataQuotaMb = baseQuota + response.totalBonusMb;
            this.applyUsageTotals(this.dataUsedMb, this.dataQuotaMb);
          }
          this.loadUsage(customerId);
          void this.messageBox.success(
            'Paket Tanımlandı',
            response.message || `${gb} GB ek internet tanımlandı.`
          );
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

  pricedAddon(addon: CatalogAddon): PricedItem {
    return this.pricingService.price(Number(addon.price), 'ADDON', addon.id);
  }

  pricedDevice(device: CatalogDevice): PricedItem {
    return this.pricingService.price(Number(device.price), 'DEVICE', device.id);
  }

  deviceMonthlyEstimate(device: CatalogDevice): number {
    return calculateMonthlyInstallment(
      this.pricedDevice(device).price,
      DEFAULT_INSTALLMENT_MONTHS
    );
  }

  addonImage(addon: CatalogAddon): string {
    return catalogImageUrl(addon.imageUrl, addon.type || 'STREAMING', addon.name);
  }

  deviceImage(device: CatalogDevice): string {
    return catalogImageUrl(device.imageUrl, device.category || 'PHONE', device.name);
  }

  onImageError(event: Event, fallbackKey: string, name?: string): void {
    onCatalogImageError(event, fallbackKey, name);
  }

  isInCart(type: 'ADDON' | 'DEVICE', id: number): boolean {
    return this.cart.some((item) => item.type === type && item.id === id);
  }

  addAddonToCart(addon: CatalogAddon): void {
    if (this.isInCart('ADDON', addon.id)) {
      return;
    }
    const priced = this.pricedAddon(addon);
    this.cart = [
      ...this.cart,
      {
        key: `ADDON-${addon.id}`,
        type: 'ADDON',
        id: addon.id,
        name: addon.name,
        price: priced.price
      }
    ];
    this.cdr.detectChanges();
  }

  addDeviceToCart(device: CatalogDevice): void {
    if (this.isInCart('DEVICE', device.id)) {
      return;
    }
    const priced = this.pricedDevice(device);
    const label = [device.brand, device.name].filter(Boolean).join(' ');
    this.cart = [
      ...this.cart,
      {
        key: `DEVICE-${device.id}`,
        type: 'DEVICE',
        id: device.id,
        name: label || device.name,
        price: priced.price
      }
    ];
    this.cdr.detectChanges();
  }

  removeFromCart(key: string): void {
    this.cart = this.cart.filter((item) => item.key !== key);
    this.cdr.detectChanges();
  }

  clearCart(): void {
    this.cart = [];
    this.cdr.detectChanges();
  }

  checkoutCart(): void {
    if (!this.cart.length || this.isCheckingOut) {
      return;
    }

    const cartSnapshot = [...this.cart];
    const deviceItems = cartSnapshot.filter((i) => i.type === 'DEVICE');
    const addonItems = cartSnapshot.filter((i) => i.type === 'ADDON');
    const deviceTotal = deviceItems.reduce((sum, item) => sum + item.price, 0);
    const amount = this.cartTotal;
    const hasDevices = deviceItems.length > 0;

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: hasDevices ? '860px' : '720px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
      disableClose: true,
      panelClass: 'self-payment-dialog-panel',
      data: {
        title: 'Ödeme',
        subtitle: hasDevices
          ? `${cartSnapshot.length} kalem · kart veya faturaya yansıt, peşin/taksit`
          : `${cartSnapshot.length} kalem · kart veya faturaya yansıt`,
        amount,
        showInstallmentOptions: hasDevices,
        devicePrice: deviceTotal,
        allowBillToInvoice: true
      }
    });

    dialogRef.afterClosed().subscribe((payment?: PaymentDialogResult) => {
      if (!payment?.method) {
        return;
      }

      this.isCheckingOut = true;
      const installments = payment.installments ?? 0;
      const billToInvoice = payment.method === 'INVOICE';
      const card = !billToInvoice && payment.cardNumber && payment.expiryDate && payment.cvv
        ? {
            cardNumber: payment.cardNumber,
            expiryDate: payment.expiryDate,
            cvv: payment.cvv
          }
        : undefined;

      const finishOk = (message: string) => {
        this.isCheckingOut = false;
        this.cart = [];
        void this.messageBox.success('Satın Alma Tamam', message);
        this.cdr.detectChanges();
      };

      const finishErr = (err: { error?: { message?: string; error?: string } }) => {
        this.isCheckingOut = false;
        void this.messageBox.error(
          'Satın Alma Başarısız',
          err?.error?.message ?? err?.error?.error ?? 'İşlem tamamlanamadı.'
        );
        this.cdr.detectChanges();
      };

      // Peşin: tüm sepet
      if (!hasDevices || installments <= 0) {
        this.shopService.checkout({
          addonIds: addonItems.map((i) => i.id),
          deviceIds: deviceItems.map((i) => i.id),
          billToInvoice,
          payment: card
        }).subscribe({
          next: () => finishOk(
            billToInvoice
              ? 'Sipariş faturanıza yansıtıldı. Faturalar sayfasından takip edebilirsiniz.'
              : 'Kart ödemesi alındı. Seçtiğiniz kalemler hesabınıza tanımlandı.'
          ),
          error: finishErr
        });
        return;
      }

      // Taksit: ürünler taksitli, ek paketler peşin (kart veya fatura)
      const addonCheckout$: Observable<unknown> = addonItems.length
        ? this.shopService.checkout({
            addonIds: addonItems.map((i) => i.id),
            deviceIds: [],
            billToInvoice,
            payment: card
          })
        : of(null);

      addonCheckout$.pipe(
        switchMap(() => {
          if (!deviceItems.length) {
            return of([]);
          }
          return of(...deviceItems).pipe(
            concatMap((item) =>
              this.shopService.purchaseDevice({
                deviceId: item.id,
                installments,
                billToInvoice,
                payment: card
              })
            ),
            toArray()
          );
        })
      ).subscribe({
        next: (results) => {
          const monthly = results
            .map((r) => Number(r?.monthlyInstallment ?? 0))
            .reduce((sum, n) => sum + n, 0);
          const via = billToInvoice ? 'faturaya' : 'kart taksitine';
          const msg = addonItems.length
            ? `Ek paketler ${billToInvoice ? 'faturaya' : 'karta'} işlendi. Ürünler ${installments} ay ${via} bağlandı` +
              (monthly > 0
                ? billToInvoice
                  ? ` (aylık ~${monthly.toFixed(2)} TL faturaya yansır).`
                  : ` (aylık ~${monthly.toFixed(2)} TL kartınızdan çekilir, faturaya yazılmaz).`
                : '.')
            : `Ürünler ${installments} ay ${via} bağlandı` +
              (monthly > 0
                ? billToInvoice
                  ? ` (aylık ~${monthly.toFixed(2)} TL faturaya yansır).`
                  : ` (aylık ~${monthly.toFixed(2)} TL kartınızdan çekilir, faturaya yazılmaz).`
                : '.');
          finishOk(msg);
        },
        error: finishErr
      });
    });
  }

  private startUsagePolling(customerId: number): void {
    this.stopUsagePolling();
    this.usagePollSub = interval(8000)
      .pipe(switchMap(() => this.usageService.getDailySummary(customerId).pipe(timeout(12000))))
      .subscribe({
        next: (summary) => {
          this.applyUsageTotals(
            summary.totalDataMb ?? 0,
            summary.dataQuotaMb ?? this.dataQuotaMb
          );
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          // Sessiz: sonraki tick tekrar dener
        }
      });
  }

  private stopUsagePolling(): void {
    this.usagePollSub?.unsubscribe();
    this.usagePollSub = undefined;
  }

  private loadUsage(customerId: number): void {
    this.isLoading = true;
    this.profileService.loadProfile().pipe(
      finalize(() => {
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.authService.setProfile(profile);
          this.applyProfile(profile);
        }
        this.usageService.getDailySummary(customerId).pipe(
          timeout(12000),
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        ).subscribe({
          next: (summary) => {
            this.applyUsageTotals(
              summary.totalDataMb ?? 0,
              summary.dataQuotaMb ?? this.dataQuotaMb
            );
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.usageService.getDailySummary(customerId).pipe(
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        ).subscribe({
          next: (summary) => {
            this.applyUsageTotals(
              summary.totalDataMb ?? 0,
              summary.dataQuotaMb ?? this.dataQuotaMb
            );
          }
        });
      }
    });
  }

  private loadCatalog(): void {
    this.catalogLoading = true;
    forkJoin({
      addons: this.catalogService.fetchAddons().pipe(catchError(() => of([] as CatalogAddon[]))),
      devices: this.catalogService.fetchDevices().pipe(catchError(() => of([] as CatalogDevice[])))
    }).subscribe({
      next: ({ addons, devices }) => {
        this.addons = (addons ?? []).filter((item) => item.active !== false);
        this.devices = (devices ?? []).filter((item) => item.active !== false);
        this.catalogLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.catalogLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyProfile(profile: CustomerPortalProfile): void {
    this.applyUsageTotals(profile.totalDataMb ?? 0, profile.dataQuotaMb ?? 1000);
  }

  private applyUsageTotals(used: number, quota: number): void {
    const remaining = Math.max(0, quota - used);
    this.dataQuotaMb = quota;
    this.dataUsedMb = used;
    this.remainingDataLabel = remaining >= 1024
      ? `${(remaining / 1024).toFixed(1)} GB`
      : `${remaining} MB`;
  }
}
