import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommitmentService, CommitmentTerminationResult } from '../../services/commitment.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

import { AgentContextService } from '../../services/agent-context.service';
import { CustomerService } from '../../services/customer.service';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../services/notification.service';
import { PaymentFlowService } from '../../services/payment-flow.service';
import { Customer } from '../../models/customer';
import { Invoice } from '../../models/invoice';
import { ShopOrder, ShopOrderItem } from '../../models/shop-order';
import { DeviceInstallment } from '../../models/device-installment';
import { Commitment } from '../../models/commitment';
import { MoneyPipe } from '../../pipes/money.pipe';
import { roundMoney } from '../../utils/money.util';
import {
  catalogImageUrl,
  onCatalogImageError
} from '../../utils/catalog-image.util';
import { UsageService } from '../../services/usage.service';
import { DailyUsageSummary, UsageType } from '../../models/usage';
import { DEVICE_CATEGORY_LABELS, DeviceCategory } from '../../models/device';

@Component({
  selector: 'app-agent-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MoneyPipe
  ],
  templateUrl: './agent-portal.html',
  styleUrl: './agent-portal.css'
})
export class AgentPortalComponent implements OnInit {

  customer: Customer | null = null;
  commitment: Commitment | null = null;
  terminationPreview: CommitmentTerminationResult | null = null;
  invoices: Invoice[] = [];
  shopOrders: ShopOrder[] = [];
  deviceInstallments: DeviceInstallment[] = [];
  isLoading = false;
  isTerminating = false;

  tariffsOpen = false;
  addonsOpen = false;
  ordersOpen = false;
  installmentsOpen = false;
  invoicesOpen = false;
  usageOpen = false;
  private usagePollSub?: Subscription;
  topUpAmount: number | null = null;

  dailyUsageSummary: DailyUsageSummary | null = null;
  isUsageLoading = false;
  isSimulatingUsage = false;
  selectedUsageType: UsageType = 'DATA';

  private loadingCustomerId: number | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private agentContext: AgentContextService,
    private customerService: CustomerService,
    private invoiceService: InvoiceService,
    private commitmentService: CommitmentService,
    private notification: NotificationService,
    private paymentFlow: PaymentFlowService,
    private usageService: UsageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.agentContext.selectedCustomer$
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((selected) => {
        if (selected?.id) {
          this.loadProfile(selected.id);
        } else {
          this.customer = null;
          this.commitment = null;
          this.invoices = [];
          this.shopOrders = [];
          this.stopUsagePolling();
          this.usageOpen = false;
          this.dailyUsageSummary = null;
          this.cdr.detectChanges();
        }
      });
  }

  loadProfile(customerId: number): void {
    if (this.loadingCustomerId === customerId && this.isLoading) {
      return;
    }

    const cached = this.agentContext.getSelectedCustomer();
    if (cached?.id === customerId) {
      this.customer = cached;
    }

    this.isLoading = true;
    this.loadingCustomerId = customerId;

    this.customerService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.agentContext.refreshSelectedCustomer(customer);
        this.applyCommitmentData(customer);
        this.loadInvoices(customerId);
        this.loadDeviceInstallments(customerId);
        if (this.usageOpen) {
          this.loadUsageSummary(customerId);
          this.startUsagePolling(customerId);
        }
        this.isLoading = false;
        this.loadingCustomerId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadingCustomerId = null;

        if (err.status === 404) {
          this.agentContext.clearSelection();
          this.customer = null;
          this.commitment = null;
          this.invoices = [];
        } else if (cached?.id === customerId) {
          this.customer = cached;
        }

        this.notification.error(
          this.notification.extractError(err, 'Profil yüklenemedi.')
        );
        this.cdr.detectChanges();
      }
    });
  }

  loadInvoices(customerId: number): void {
    this.invoiceService.getInvoicesByCustomer(customerId).subscribe({
      next: (invoices) => {
        this.invoices = invoices ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.invoices = [];
      }
    });
  }

  loadShopOrders(customerId: number): void {
    this.customerService.getShopOrders(customerId).subscribe({
      next: (orders) => {
        this.shopOrders = this.filterProductOrders(orders ?? []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.shopOrders = [];
      }
    });
  }

  loadDeviceInstallments(customerId: number): void {
    this.customerService.getDeviceInstallments(customerId).subscribe({
      next: (installments) => {
        this.deviceInstallments = installments ?? [];
        this.loadShopOrders(customerId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.deviceInstallments = [];
      }
    });
  }

  private filterProductOrders(orders: ShopOrder[]): ShopOrder[] {
    return orders
      .map((order) => {
        const deviceItems = order.items.filter((item) => item.itemType === 'DEVICE');

        return {
          ...order,
          items: deviceItems,
          totalAmount: deviceItems.reduce(
            (sum, item) => sum + Number(item.price ?? 0),
            0
          )
        };
      })
      .filter((order) => order.items.length > 0);
  }

  onOrderImageError(event: Event, item: ShopOrderItem): void {
    const fallbackKey = item.itemType === 'DEVICE'
      ? (item.itemCategory ?? 'DEFAULT')
      : item.itemType === 'TARIFF'
        ? item.itemCategory ?? 'MOBILE'
        : item.itemCategory ?? 'STREAMING';
    onCatalogImageError(event, fallbackKey, item.itemName);
  }

  getOrderItemImage(item: ShopOrderItem): string {
    const fallbackKey = item.itemType === 'DEVICE'
      ? (item.itemCategory ?? 'DEFAULT')
      : item.itemType === 'TARIFF'
        ? item.itemCategory ?? 'MOBILE'
        : item.itemCategory ?? 'STREAMING';
    return catalogImageUrl(item.imageUrl, fallbackKey, item.itemName);
  }

  getOrderItemTypeLabel(item: ShopOrderItem): string {
    if (item.itemType === 'TARIFF') {
      return 'Tarife';
    }
    if (item.itemType === 'ADDON') {
      return 'Ek Paket';
    }
    if (item.itemCategory && item.itemCategory in DEVICE_CATEGORY_LABELS) {
      return DEVICE_CATEGORY_LABELS[item.itemCategory as DeviceCategory];
    }
    return 'Cihaz';
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.formatDate(value);
    }

    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  applyCommitmentData(data: Customer): void {
    if (data.commitment) {
      this.commitment = data.commitment;
      this.loadTerminationPreview(data.id);
      return;
    }

    this.commitmentService.getCommitment(data.id).subscribe({
      next: (commitment) => {
        this.commitment = commitment;
        this.loadTerminationPreview(data.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.commitment = {
          startDate: data.contractStartDate,
          durationMonths: data.contractDuration,
          endDate: this.calculateContractEndDate(
            data.contractStartDate,
            data.contractDuration
          ),
          active: true
        };
        this.loadTerminationPreview(data.id);
        this.cdr.detectChanges();
      }
    });
  }

  loadTerminationPreview(customerId: number): void {
    this.commitmentService.previewTermination(customerId).subscribe({
      next: (preview) => {
        this.terminationPreview = preview;
        this.cdr.detectChanges();
      },
      error: () => {
        this.terminationPreview = null;
      }
    });
  }

  isCommitmentActive(): boolean {
    return this.commitment?.active !== false;
  }

  terminateContract(): void {
    if (!this.customer?.id || !this.isCommitmentActive()) {
      return;
    }

    const penalty = Number(this.terminationPreview?.penaltyAmount ?? 0);
    const remaining = this.terminationPreview?.remainingMonths ?? this.getRemainingMonths();
    const message = penalty > 0
      ? `${remaining} ay kaldı. Cayma bedeli: ${penalty.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL. Tarife ve ek paketler kapatılacak. Devam edilsin mi?`
      : 'Kontratınız sonlandırılacak ve aktif hizmetler kapatılacak. Devam edilsin mi?';

    this.notification.confirm(
      message,
      'Kontratı Durdur',
      'Sonlandır',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isTerminating = true;
      this.cdr.detectChanges();

      this.commitmentService.terminateCommitment(this.customer!.id!).subscribe({
        next: (result) => {
          this.isTerminating = false;
          this.notification.success(
            result.message || 'Kontrat başarıyla sonlandırıldı.'
          );
          this.loadProfile(this.customer!.id!);
        },
        error: (err) => {
          this.isTerminating = false;
          this.notification.error(
            this.notification.extractError(err, 'Kontrat sonlandırılamadı.')
          );
          this.cdr.detectChanges();
        }
      });
    });
  }

  payInvoice(invoice: Invoice): void {
    const isPrepaid =
      invoice.paymentType === 'PREPAID'
      || this.customer?.paymentType === 'PREPAID';

    if (isPrepaid) {
      this.invoiceService.payInvoice(invoice.id).subscribe({
        next: () => {
          this.notification.success('Fatura bakiyeden kesildi.');
          if (this.customer?.id) {
            this.loadProfile(this.customer.id);
          }
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Ödeme yapılamadı.')
          );
        }
      });
      return;
    }

    this.paymentFlow.requestPayment({
      title: 'Kredi Kartı ile Ödeme',
      subtitle: `Fatura #${invoice.id}`,
      amount: Number(invoice.amount ?? 0)
    }).subscribe((result) => {
      if (!result) {
        return;
      }

      this.invoiceService.payInvoice(invoice.id, result.payment).subscribe({
        next: () => {
          this.notification.success('Fatura ödendi.');
          if (this.customer?.id) {
            this.loadProfile(this.customer.id);
          }
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Ödeme yapılamadı.')
          );
        }
      });
    });
  }

  addBalance(): void {
    if (!this.customer?.id) {
      return;
    }

    const amount = Number(this.topUpAmount);

    if (!amount || amount <= 0) {
      this.notification.warning('Geçerli bir tutar giriniz.');
      return;
    }

    this.paymentFlow.requestPayment({
      title: 'Bakiye Yükleme',
      subtitle: `${this.customer.firstName} ${this.customer.lastName}`,
      amount
    }).subscribe((result) => {
      if (!result) {
        return;
      }

      this.customerService.addBalance(this.customer!.id!, {
        ...result.payment,
        amount
      }).subscribe({
        next: (customer) => {
          this.customer = customer;
          this.agentContext.refreshSelectedCustomer(customer);
          this.topUpAmount = null;
          this.notification.success('Bakiye yüklendi.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Bakiye yüklenemedi.')
          );
        }
      });
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (!this.isInvoiceUnpaid(invoice)) {
      return;
    }

    this.notification.confirm(
      `Fatura #${invoice.id} silinsin mi? Bu işlem geri alınamaz.`,
      'Faturayı Sil',
      'Sil',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.invoiceService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.notification.success('Fatura silindi.');
          if (this.customer?.id) {
            this.loadInvoices(this.customer.id);
            this.loadProfile(this.customer.id);
          }
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Fatura silinemedi.')
          );
        }
      });
    });
  }

  toggleTariffsSection(): void {
    this.tariffsOpen = !this.tariffsOpen;
    this.cdr.detectChanges();
  }

  toggleAddonsSection(): void {
    this.addonsOpen = !this.addonsOpen;
    this.cdr.detectChanges();
  }

  toggleOrdersSection(): void {
    this.ordersOpen = !this.ordersOpen;
    this.cdr.detectChanges();
  }

  toggleInstallmentsSection(): void {
    this.installmentsOpen = !this.installmentsOpen;
    if (this.installmentsOpen && this.customer?.id) {
      this.loadDeviceInstallments(this.customer.id);
    }
    this.cdr.detectChanges();
  }

  toggleInvoicesSection(): void {
    this.invoicesOpen = !this.invoicesOpen;
    this.cdr.detectChanges();
  }

  toggleUsageSection(): void {
    this.usageOpen = !this.usageOpen;
    if (this.usageOpen && this.customer?.id) {
      this.loadUsageSummary(this.customer.id);
      this.startUsagePolling(this.customer.id);
    } else {
      this.stopUsagePolling();
    }
    this.cdr.detectChanges();
  }

  private startUsagePolling(customerId: number): void {
    this.stopUsagePolling();
    this.usagePollSub = interval(8000)
      .pipe(
        filter(() => this.usageOpen),
        switchMap(() => this.usageService.getDailySummary(customerId))
      )
      .subscribe({
        next: (summary) => {
          this.dailyUsageSummary = summary;
          this.isUsageLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private stopUsagePolling(): void {
    this.usagePollSub?.unsubscribe();
    this.usagePollSub = undefined;
  }

  loadUsageSummary(customerId: number): void {
    this.isUsageLoading = true;
    this.usageService.getDailySummary(customerId).subscribe({
      next: (summary) => {
        this.dailyUsageSummary = summary;
        this.isUsageLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.dailyUsageSummary = null;
        this.isUsageLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  simulateUsage(): void {
    if (!this.customer?.id) {
      return;
    }

    this.isSimulatingUsage = true;
    this.usageService.simulateUsage({
      customerId: this.customer.id,
      customerPhone: this.customer.phone,
      type: this.selectedUsageType
    }).subscribe({
      next: (response) => {
        this.isSimulatingUsage = false;
        this.loadUsageSummary(this.customer!.id!);

        if (response.quotaExceeded) {
          this.notification.warning(response.message || 'Günlük internet kotası aşıldı.');
        } else {
          this.notification.success(response.message || 'Kullanım kaydı oluşturuldu.');
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSimulatingUsage = false;
        this.notification.error(
          this.notification.extractError(err, 'Kullanım simülasyonu başarısız.')
        );
        this.cdr.detectChanges();
      }
    });
  }

  getUsageBarHeight(value: number, max: number): number {
    if (!max || max <= 0) {
      return 0;
    }
    return Math.max(8, Math.round((value / max) * 100));
  }

  getMaxHourlyData(): number {
    const points = this.dailyUsageSummary?.hourlyBreakdown ?? [];
    return Math.max(...points.map(point => point.dataMb), 1);
  }

  getActiveCustomerTariffs() {
    return this.customer?.tariffs?.filter(t => t.active) ?? [];
  }

  deleteAddon(id: number): void {
    this.notification.confirm(
      'Ek paket silinsin mi?',
      'Ek Paket Sil',
      'Sil',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.customerService.deleteAddon(id).subscribe({
        next: () => {
          this.notification.success('Ek paket silindi.');
          if (this.customer?.id) {
            this.loadProfile(this.customer.id);
          }
        },
        error: (err) => {
          this.notification.error(
            this.notification.extractError(err, 'Ek paket silinemedi.')
          );
        }
      });
    });
  }

  getRiskColor(status: string): string {
    if (status === 'HIGH') {
      return '#f44336';
    }
    if (status === 'MEDIUM') {
      return '#ff9800';
    }
    return '#4caf50';
  }

  getTotalMonthlyPrice(): number {
    let total = 0;

    if (this.customer?.tariffs) {
      total += this.customer.tariffs
        .filter(t => t.active)
        .reduce((sum, t) => sum + Number(t.tariff?.price ?? 0), 0);
    }

    if (this.customer?.addons) {
      total += this.customer.addons
        .filter(a => a.active)
        .reduce((sum, a) => sum + Number(a.addonPackage?.price ?? 0), 0);
    }

    return roundMoney(total);
  }

  getActiveTariffs(): string {
    const tariffs = this.customer?.tariffs?.filter(t => t.active) ?? [];
    if (tariffs.length === 0) {
      return 'Aktif tarife yok';
    }
    return tariffs.map(t => t.tariff?.name).filter(Boolean).join(', ');
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }
    if (value.includes('T')) {
      return value.split('T')[0];
    }
    return value;
  }

  getCommitmentStartDate(): string {
    return this.formatDate(
      this.commitment?.startDate ?? this.customer?.contractStartDate
    );
  }

  getCommitmentDuration(): number {
    return this.commitment?.durationMonths
      ?? this.customer?.contractDuration
      ?? 0;
  }

  getCommitmentEndDate(): string {
    if (this.commitment?.endDate) {
      return this.formatDate(this.commitment.endDate);
    }

    return this.formatDate(
      this.calculateContractEndDate(
        this.customer?.contractStartDate,
        this.customer?.contractDuration
      )
    );
  }

  getRemainingMonths(): number {
    const endDateValue = this.getCommitmentEndDate();

    if (!endDateValue || endDateValue === '-') {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateValue);
    endDate.setHours(0, 0, 0, 0);

    const months =
      (endDate.getFullYear() - today.getFullYear()) * 12
      + (endDate.getMonth() - today.getMonth());

    return months < 0 ? 0 : months;
  }

  getInvoiceAmount(invoice: Invoice): number {
    return Number(invoice.amount ?? 0);
  }

  getInvoicePenalty(invoice: Invoice): number {
    return Number(invoice.penaltyFee ?? 0);
  }

  isInvoicePaid(invoice: Invoice): boolean {
    return invoice.status === 'PAID';
  }

  isInvoiceUnpaid(invoice: Invoice): boolean {
    return invoice.status === 'UNPAID';
  }

  isAutoPaid(invoice: Invoice): boolean {
    return this.isInvoicePaid(invoice)
      && (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID');
  }

  getCustomerStatusLabel(): string {
    return this.isCustomerSuspended() ? 'Askıda' : 'Aktif';
  }

  isCustomerActive(): boolean {
    return !this.isCustomerSuspended();
  }

  isCustomerSuspended(): boolean {
    return this.customer?.status === 'SUSPENDED';
  }

  getRiskStatusLabel(status: string): string {
    if (status === 'HIGH') {
      return 'Yüksek';
    }
    if (status === 'MEDIUM') {
      return 'Orta';
    }
    return 'Düşük';
  }

  getTerminationPreviewMessage(): string {
    const preview = this.terminationPreview;
    if (!preview) {
      return '';
    }

    if (preview.remainingMonths <= 0 || Number(preview.penaltyAmount) <= 0) {
      return 'Cayma bedeli olmadan kontratı sonlandırabilirsiniz.';
    }

    return `${preview.remainingMonths} ay kaldı. Erken çıkışta cayma bedeli uygulanır.`;
  }

  getInvoiceStatusLabel(invoice: Invoice): string {
    if (this.isInvoiceUnpaid(invoice)) {
      return 'Ödenmedi';
    }
    if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
      return 'Otomatik ödendi';
    }
    return 'Ödendi';
  }

  getInvoicePaidMessage(invoice: Invoice): string {
    if (!this.isInvoicePaid(invoice)) {
      return '';
    }
    if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
      return 'Bakiyeden otomatik kesildi';
    }
    return 'Manuel ödendi';
  }

  calculateContractEndDate(
    startDate: string | undefined,
    duration: number | undefined
  ): string {
    if (!startDate || !duration) {
      return '';
    }

    const date = new Date(startDate);
    date.setMonth(date.getMonth() + duration);
    return date.toISOString().split('T')[0];
  }

  clearProfile(): void {
    this.agentContext.clearSelection();
    this.customer = null;
    this.commitment = null;
    this.invoices = [];
    this.shopOrders = [];
    this.deviceInstallments = [];
    this.stopUsagePolling();
    this.usageOpen = false;
    this.dailyUsageSummary = null;
  }

}
