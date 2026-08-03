import { Component, OnInit, AfterViewInit, ChangeDetectorRef, DestroyRef, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TariffService, Tariff } from '../../services/tariff';
import { AddonService } from '../../services/addon.service';
import { DeviceService } from '../../services/device.service';
import { DeviceSalesService } from '../../services/device-sales.service';
import { AddonPackage } from '../../models/addon-package';
import { Device, DEVICE_CATEGORY_LABELS, DeviceCategory } from '../../models/device';
import { SalesDevice } from '../../models/device-sales';
import { MoneyPipe } from '../../pipes/money.pipe';
import { catalogImageUrl, onCatalogImageError } from '../../utils/catalog-image.util';
import { AuthService } from '../../services/auth.service';
import { AgentContextService } from '../../services/agent-context.service';
import {
  CartItem,
  CatalogCartService
} from '../../services/catalog-cart.service';
import { CustomerService } from '../../services/customer.service';
import { NotificationService } from '../../services/notification.service';
import { PaymentFlowService } from '../../services/payment-flow.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import {
  TariffFormDialogComponent,
  TariffFormDialogData
} from '../../components/tariff-form-dialog/tariff-form-dialog';
import { Customer } from '../../models/customer';
import {
  buildTariffChangeConfirmMessage,
  requiresTariffChangeConfirmation
} from '../../utils/tariff-change.util';
import {
  calculateMonthlyInstallment,
  DEFAULT_INSTALLMENT_ESTIMATE_MONTHS,
  DEFAULT_INSTALLMENT_MONTHS
} from '../../utils/installment.util';

@Component({
  selector: 'app-tariffs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MoneyPipe,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    HasRoleDirective
  ],
  templateUrl: './tariffs.html',
  styleUrl: './tariffs.css'
})
export class TariffsComponent implements OnInit, AfterViewInit {

  tariffs: Tariff[] = [];
  addons: AddonPackage[] = [];
  devices: Device[] = [];
  salesDevices: SalesDevice[] = [];
  cartItems: CartItem[] = [];
  selectedDeviceCategory: DeviceCategory | 'ALL' = 'ALL';
  hasSelectedProfile = false;
  isAgent = false;
  isAdmin = false;
  isCheckingOut = false;
  applyingTariffId: number | null = null;
  purchasingSalesDeviceId: number | null = null;
  selectedCustomer: Customer | null = null;

  isLoading = true;
  loadError = '';
  showScrollTop = true;

  @ViewChild('scrollTopBtn')
  private scrollTopBtn?: ElementRef<HTMLButtonElement>;

  private scrollContainer: HTMLElement | null = null;
  private readonly onScrollContainerScroll = (): void => {
    const scrollTop = this.getScrollTop();
    const shouldShow = scrollTop > 120 || this.isPageScrollable();

    if (shouldShow !== this.showScrollTop) {
      this.showScrollTop = shouldShow;
      this.cdr.detectChanges();

      if (shouldShow) {
        setTimeout(() => this.mountScrollTopButton());
      }
    }
  };

  readonly categoryLabels = DEVICE_CATEGORY_LABELS;
  readonly deviceCategories: DeviceCategory[] = [
    'PHONE', 'TABLET', 'HEADPHONE', 'LAPTOP', 'DESKTOP', 'WEARABLE'
  ];

  readonly salesCategoryLabels: Record<string, string> = {
    PHONE: 'Telefon',
    TABLET: 'Tablet',
    MODEM: 'Modem'
  };

  catalogImageUrl = catalogImageUrl;
  onImageError = onCatalogImageError;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private tariffService: TariffService,
    private addonService: AddonService,
    private deviceService: DeviceService,
    private deviceSalesService: DeviceSalesService,
    private authService: AuthService,
    private agentContext: AgentContextService,
    private cartService: CatalogCartService,
    private customerService: CustomerService,
    private notification: NotificationService,
    private paymentFlow: PaymentFlowService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAgent = this.authService.isAgent();
    this.isAdmin = this.authService.isAdmin();

    this.cartService.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.cartItems = items.filter(item => item.type !== 'TARIFF');
        this.cdr.detectChanges();
      });

    this.agentContext.selectedCustomer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        this.selectedCustomer = customer;
        this.hasSelectedProfile = !!customer?.id;
        this.cdr.detectChanges();
      });

    this.selectedCustomer = this.agentContext.getSelectedCustomer();
    this.hasSelectedProfile = !!this.agentContext.getSelectedCustomerId();
    this.cartService.removeItemsByType('TARIFF');
    this.loadPageData();
  }

  ngAfterViewInit(): void {
    this.mountScrollTopButton();
    this.bindScrollContainer();

    this.destroyRef.onDestroy(() => {
      this.scrollContainer?.removeEventListener('scroll', this.onScrollContainerScroll);
      window.removeEventListener('scroll', this.onScrollContainerScroll);
      this.unmountScrollTopButton();
    });
  }

  private mountScrollTopButton(): void {
    const button = this.scrollTopBtn?.nativeElement;
    if (!button || button.parentElement === document.body) {
      return;
    }

    document.body.appendChild(button);
  }

  private unmountScrollTopButton(): void {
    const button = this.scrollTopBtn?.nativeElement;
    if (button?.parentElement === document.body) {
      document.body.removeChild(button);
    }
  }

  private bindScrollContainer(): void {
    this.scrollContainer = document.querySelector('mat-sidenav-content');

    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.onScrollContainerScroll, { passive: true });
    } else {
      window.addEventListener('scroll', this.onScrollContainerScroll, { passive: true });
    }

    setTimeout(() => this.onScrollContainerScroll());
  }

  private getScrollTop(): number {
    if (this.scrollContainer) {
      return this.scrollContainer.scrollTop;
    }

    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  private isPageScrollable(): boolean {
    if (this.scrollContainer) {
      return this.scrollContainer.scrollHeight > this.scrollContainer.clientHeight + 40;
    }

    return document.documentElement.scrollHeight > window.innerHeight + 40;
  }

  loadPageData(): void {
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      tariffs: this.tariffService.fetchTariffs(),
      addons: this.addonService.fetchAddons(),
      devices: this.deviceService.fetchDevices(),
      salesDevices: this.deviceSalesService.fetchSalesDevices().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ tariffs, addons, devices, salesDevices }) => {
        this.tariffs = tariffs ?? [];
        this.addons = addons ?? [];
        this.devices = devices ?? [];
        this.salesDevices = salesDevices ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.mountScrollTopButton();
          this.onScrollContainerScroll();
        });
      },
      error: (err) => {
        console.error('Tarife/ek paket/cihaz yukleme hatasi', err);
        this.tariffs = [];
        this.addons = [];
        this.devices = [];
        this.salesDevices = [];
        this.isLoading = false;
        this.loadError = 'Veriler yüklenemedi. Lütfen sayfayı yenileyin.';
        this.cdr.detectChanges();
      }
    });
  }

  showCartActions(): boolean {
    return this.isAgent || this.isAdmin;
  }

  getProfileSelectionHint(): string {
    return this.isAdmin
      ? 'Sepet kullanmak için sol menüden müşteri seçin.'
      : 'Sepet kullanmak için sol menüden profilinizi seçin.';
  }

  openCreateTariffDialog(): void {
    const dialogRef = this.dialog.open<
      TariffFormDialogComponent,
      TariffFormDialogData,
      Partial<Tariff>
    >(TariffFormDialogComponent, {
      width: '560px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }

      this.tariffService.createTariff(payload).subscribe({
        next: () => {
          this.notification.success('Tarife eklendi.');
          this.loadPageData();
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Tarife eklenemedi.')
          );
        }
      });
    });
  }

  openEditTariffDialog(tariff: Tariff): void {
    const dialogRef = this.dialog.open<
      TariffFormDialogComponent,
      TariffFormDialogData,
      Partial<Tariff>
    >(TariffFormDialogComponent, {
      width: '560px',
      data: { tariff }
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }

      this.tariffService.updateTariff(tariff.id, payload).subscribe({
        next: () => {
          this.notification.success('Tarife güncellendi.');
          this.loadPageData();
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Tarife güncellenemedi.')
          );
        }
      });
    });
  }

  deleteCatalogTariff(tariff: Tariff): void {
    this.notification.confirm(
      `"${tariff.name}" tarifesi silinsin mi?`,
      'Tarife Sil',
      'Sil',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.tariffService.deleteTariff(tariff.id).subscribe({
        next: () => {
          this.notification.success('Tarife silindi.');
          this.loadPageData();
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Tarife silinemedi.')
          );
        }
      });
    });
  }

  handleTariffAction(tariff: Tariff): void {
    if (!this.ensureProfileSelected()) {
      return;
    }

    const customerId = this.agentContext.getSelectedCustomerId();
    if (!customerId) {
      return;
    }

    this.applyingTariffId = tariff.id;
    this.cdr.detectChanges();

    this.customerService.previewTariffChange(customerId, tariff.id).subscribe({
      next: (preview) => {
        this.applyingTariffId = null;

        if (requiresTariffChangeConfirmation(preview)) {
          this.notification.confirm(
            buildTariffChangeConfirmMessage(preview, tariff.name),
            'Tarife Değişikliği',
            'Evet, Onaylıyorum',
            'İptal',
            true
          ).subscribe((confirmed) => {
            if (confirmed) {
              this.applyTariffChange(customerId, tariff.id);
            }
            this.cdr.detectChanges();
          });
          return;
        }

        const isChange = this.hasActiveTariffOfType(tariff.type);
        const title = isChange ? 'Tarife Değiştir' : 'Tarife Al';
        const message = isChange
          ? `"${tariff.name}" tarifesine geçilsin mi?`
          : `"${tariff.name}" tarifesi müşteriye eklensin mi?`;

        this.notification.confirm(
          message,
          title,
          'Evet',
          'İptal'
        ).subscribe((confirmed) => {
          if (confirmed) {
            this.applyTariffChange(customerId, tariff.id);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.applyingTariffId = null;
        this.notification.error(
          this.notification.extractError(err, 'Tarife önizlemesi alınamadı.')
        );
        this.cdr.detectChanges();
      }
    });
  }

  private applyTariffChange(customerId: number, tariffId: number): void {
    this.applyingTariffId = tariffId;
    this.cdr.detectChanges();

    this.customerService.updateCustomerTariff(customerId, tariffId).subscribe({
      next: (customer) => {
        this.agentContext.refreshSelectedCustomer(customer);
        this.selectedCustomer = customer;
        this.applyingTariffId = null;
        this.notification.success('Tarife işlemi tamamlandı.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.applyingTariffId = null;
        this.notification.error(
          this.notification.extractError(err, 'Tarife işlemi başarısız.')
        );
        this.cdr.detectChanges();
      }
    });
  }

  hasActiveTariffOfType(type: string): boolean {
    return this.selectedCustomer?.tariffs?.some(
      (entry) => entry.active && entry.tariff?.type === type
    ) ?? false;
  }

  getTariffActionLabel(tariff: Tariff): string {
    if (!this.hasSelectedProfile) {
      return 'Tarife Al';
    }
    return this.hasActiveTariffOfType(tariff.type)
      ? 'Tarife Değiştir'
      : 'Tarife Al';
  }

  isTariffActionDisabled(tariff: Tariff): boolean {
    return this.applyingTariffId === tariff.id;
  }

  showTariffProfileActions(): boolean {
    return this.showCartActions() && this.hasSelectedProfile;
  }

  addAddonToCart(addon: AddonPackage): void {
    if (!this.ensureProfileSelected()) {
      return;
    }

    this.cartService.addItem({
      type: 'ADDON',
      id: addon.id,
      name: addon.name,
      price: addon.price
    });
    this.notification.success(`${addon.name} sepete eklendi.`);
  }

  addDeviceToCart(device: Device): void {
    if (!this.ensureProfileSelected()) {
      return;
    }

    if ((device.stock ?? 0) <= 0) {
      this.notification.warning('Bu cihaz stokta yok.');
      return;
    }

    this.cartService.addItem({
      type: 'DEVICE',
      id: device.id,
      name: device.name,
      price: device.price
    });
    this.notification.success(`${device.name} sepete eklendi.`);
  }

  getSalesDeviceName(device: SalesDevice): string {
    return `${device.brand} ${device.model}`.trim();
  }

  getDeviceInstallmentEstimate(price: number, months = DEFAULT_INSTALLMENT_ESTIMATE_MONTHS): number {
    return calculateMonthlyInstallment(Number(price ?? 0), months);
  }

  purchaseSalesDevice(device: SalesDevice): void {
    if (!this.ensureProfileSelected()) {
      return;
    }

    const customerId = this.agentContext.getSelectedCustomerId();
    if (!customerId) {
      return;
    }

    if (device.stockQuantity <= 0) {
      this.notification.warning('Bu cihaz stokta yok.');
      return;
    }

    const profile = this.agentContext.getSelectedCustomer();

    this.paymentFlow.requestPayment({
      title: 'Cihaz Taksit Ödemesi',
      subtitle: profile
        ? `${profile.firstName} ${profile.lastName} — ${this.getSalesDeviceName(device)}`
        : this.getSalesDeviceName(device),
      amount: Number(device.price),
      showInstallmentOptions: true,
      devicePrice: Number(device.price)
    }).subscribe((result) => {
      if (!result) {
        return;
      }

      this.purchasingSalesDeviceId = device.id;
      this.cdr.detectChanges();

      this.deviceSalesService.purchaseDevice({
        customerId,
        deviceId: device.id,
        installments: result.installments ?? DEFAULT_INSTALLMENT_MONTHS
      }).subscribe({
        next: (response) => {
          this.purchasingSalesDeviceId = null;
          this.loadPageData();
          this.notification.success(
            response.message
              || `Cihaz taksiti oluşturuldu. Aylık ${response.monthlyInstallment} TL faturaya yansıyacak. Profilde Cihaz Taksitleri bölümünden görebilirsiniz.`
          );
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.purchasingSalesDeviceId = null;
          this.notification.error(
            this.notification.extractError(err, 'Cihaz taksit satışı tamamlanamadı.')
          );
          this.cdr.detectChanges();
        }
      });
    });
  }

  isPurchasingSalesDevice(deviceId: number): boolean {
    return this.purchasingSalesDeviceId === deviceId;
  }

  removeFromCart(item: CartItem): void {
    this.cartService.removeItem(item.type, item.id);
  }

  isInCart(type: CartItem['type'], id: number): boolean {
    return this.cartItems.some(item => item.type === type && item.id === id);
  }

  getCartTotal(): number {
    return this.cartService.getTotal();
  }

  checkout(): void {
    const customerId = this.agentContext.getSelectedCustomerId();

    if (!customerId) {
      this.notification.warning(this.getProfileSelectionHint());
      return;
    }

    if (this.cartItems.length === 0) {
      this.notification.warning('Sepetiniz boş.');
      return;
    }

    const profile = this.agentContext.getSelectedCustomer();
    const total = this.getCartTotal();
    const deviceTotal = this.cartItems
      .filter(item => item.type === 'DEVICE')
      .reduce((sum, item) => sum + Number(item.price ?? 0), 0);
    const hasDevices = deviceTotal > 0;

    this.paymentFlow.requestPayment({
      title: 'Sepet Ödemesi',
      subtitle: profile
        ? `${profile.firstName} ${profile.lastName}`
        : undefined,
      amount: total,
      showInstallmentOptions: hasDevices,
      devicePrice: hasDevices ? deviceTotal : undefined
    }).subscribe((result) => {
      if (!result) {
        return;
      }

      this.isCheckingOut = true;
      this.cdr.detectChanges();

      this.customerService.shopCheckout(customerId, {
        payment: result.payment,
        tariffIds: [],
        addonIds: this.cartItems
          .filter(item => item.type === 'ADDON')
          .map(item => item.id),
        deviceIds: this.cartItems
          .filter(item => item.type === 'DEVICE')
          .map(item => item.id)
      }).subscribe({
        next: (customer) => {
          this.agentContext.refreshSelectedCustomer(customer);
          this.cartService.clear();
          this.isCheckingOut = false;
          this.loadPageData();
          this.notification.success('Ödeme alındı. Siparişiniz profilinizde Son Siparişler bölümünde görünür.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isCheckingOut = false;
          this.notification.error(
            this.notification.extractError(err, 'Ödeme tamamlanamadı.')
          );
          this.cdr.detectChanges();
        }
      });
    });
  }

  private ensureProfileSelected(): boolean {
    if (this.agentContext.getSelectedCustomerId()) {
      return true;
    }

    this.notification.warning(this.getProfileSelectionHint());
    return false;
  }

  getStreamingAddons(): AddonPackage[] {
    return this.addons.filter(addon => addon.type === 'STREAMING');
  }

  getOtherAddons(): AddonPackage[] {
    return this.addons.filter(addon => addon.type !== 'STREAMING');
  }

  selectDeviceCategory(category: DeviceCategory | 'ALL'): void {
    this.selectedDeviceCategory = category;
  }

  getFilteredDevices(): Device[] {
    if (this.selectedDeviceCategory === 'ALL') {
      return this.devices;
    }
    return this.devices.filter(
      device => device.category === this.selectedDeviceCategory
    );
  }

  tariffTypeLabel(type: string): string {
    if (type === 'MOBILE') {
      return 'Mobil';
    }
    if (type === 'FIBER') {
      return 'Fiber';
    }
    if (type === 'DSL') {
      return 'DSL';
    }
    if (type === 'TV') {
      return 'TV';
    }
    if (type === 'DIGITAL_SERVICE') {
      return 'Dijital';
    }
    return type;
  }

  cartItemLabel(type: CartItem['type']): string {
    if (type === 'TARIFF') {
      return 'Tarife';
    }
    if (type === 'ADDON') {
      return 'Ek Paket';
    }
    return 'Cihaz';
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
