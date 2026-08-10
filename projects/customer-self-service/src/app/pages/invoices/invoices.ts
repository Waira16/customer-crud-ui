import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { Invoice, InvoiceService, PaymentRequest } from '../../core/invoice.service';
import { MoneyPipe } from '../../core/money.pipe';
import { isValidLuhn } from '../../core/luhn.util';
import { MessageBoxService } from '../../core/message-box/message-box.service';

type InvoiceFilter = 'ALL' | 'UNPAID' | 'PAID';

@Component({
  selector: 'self-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MoneyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filter: InvoiceFilter = 'ALL';
  expandedInvoiceId: number | null = null;
  payment: PaymentRequest = {
    cardNumber: '4532015112830366',
    expiryDate: '12/28',
    cvv: '123'
  };
  payingInvoiceId: number | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private invoiceService: InvoiceService,
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

    this.loadInvoices(customerId);
  }

  get filteredInvoices(): Invoice[] {
    if (this.filter === 'UNPAID') {
      return this.invoices.filter((invoice) => invoice.status !== 'PAID');
    }
    if (this.filter === 'PAID') {
      return this.invoices.filter((invoice) => invoice.status === 'PAID');
    }
    return this.invoices;
  }

  get unpaidCount(): number {
    return this.invoices.filter((invoice) => invoice.status !== 'PAID').length;
  }

  get unpaidTotal(): number {
    return this.invoices
      .filter((invoice) => invoice.status !== 'PAID')
      .reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0);
  }

  setFilter(filter: InvoiceFilter): void {
    this.filter = filter;
  }

  togglePayment(invoiceId: number): void {
    this.expandedInvoiceId = this.expandedInvoiceId === invoiceId ? null : invoiceId;
  }

  statusLabel(status: string): string {
    return status === 'PAID' ? 'Ödendi' : 'Ödenmedi';
  }

  isShopInvoice(invoice: Invoice): boolean {
    return !!invoice.billingPeriod?.includes('-SHOP-');
  }

  invoicePeriodLabel(invoice: Invoice): string {
    if (this.isShopInvoice(invoice)) {
      return 'Mağaza siparişi (peşin)';
    }
    return invoice.billingPeriod || 'Fatura Dönemi';
  }

  invoiceLines(invoice: Invoice): string[] {
    if (this.isShopInvoice(invoice)) {
      return invoice.shopPurchases ?? [];
    }
    return [
      ...(invoice.tariffs ?? []),
      ...(invoice.addons ?? []),
      ...(invoice.deviceInstallments ?? []),
      ...(invoice.shopPurchases ?? [])
    ];
  }

  loadInvoices(customerId: number): void {
    this.isLoading = true;
    this.invoiceService.getCustomerInvoices(customerId).pipe(
      timeout(15000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (invoices) => {
        this.invoices = invoices ?? [];
      },
      error: (err: { error?: { message?: string }; name?: string; status?: number }) => {
        if (err?.name === 'TimeoutError') {
          void this.messageBox.error('Bağlantı Hatası', 'Fatura servisi yanıt vermedi.');
          return;
        }
        if (err?.status === 401) {
          void this.messageBox.warning('Oturum Sona Erdi', 'Lütfen tekrar giriş yapın.').subscribe(() => {
            this.authService.logout();
            void this.router.navigate(['/login']);
          });
          return;
        }
        void this.messageBox.error('Faturalar Yüklenemedi', err?.error?.message ?? 'Faturalar yüklenemedi.');
      }
    });
  }

  pay(invoice: Invoice): void {
    if (!isValidLuhn(this.payment.cardNumber)) {
      void this.messageBox.warning('Geçersiz Kart', 'Kart numarası Luhn doğrulamasından geçmedi.');
      return;
    }

    const amountLabel = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(invoice.amount ?? 0);

    this.messageBox.confirm({
      title: 'Ödeme Onayı',
      message: `Fatura #${invoice.id} için ${amountLabel} tutarında ödeme yapılacak.\n\nOnaylıyor musunuz?`,
      type: 'warning',
      confirmText: 'Öde',
      cancelText: 'Vazgeç'
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.payingInvoiceId = invoice.id;
      this.invoiceService.payInvoice(invoice.id, this.payment).subscribe({
        next: () => {
          this.payingInvoiceId = null;
          invoice.status = 'PAID';
          this.expandedInvoiceId = null;
          void this.messageBox.success('Ödeme Başarılı', `Fatura #${invoice.id} başarıyla ödendi.`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.payingInvoiceId = null;
          void this.messageBox.error('Ödeme Başarısız', err?.error?.message ?? 'Ödeme işlemi tamamlanamadı.');
          this.cdr.detectChanges();
        }
      });
    });
  }
}
