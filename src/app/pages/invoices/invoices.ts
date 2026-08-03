import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Invoice } from '../../models/invoice';
import { InvoiceGenerateResult } from '../../models/invoice-generate-result';
import { InvoiceService } from '../../services/invoice.service';
import { formatMoney as formatMoneyUtil } from '../../utils/money.util';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { AuthService } from '../../services/auth.service';
import { AgentContextService } from '../../services/agent-context.service';
import { CustomerService } from '../../services/customer.service';
import { PaymentFlowService } from '../../services/payment-flow.service';



@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HasRoleDirective
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class InvoicesComponent implements OnInit {



  invoices: Invoice[] = [];

  filteredInvoices: Invoice[] = [];

  selectedStatus: string = 'ALL';

  selectedPaymentType: 'ALL' | 'PREPAID' | 'POSTPAID' = 'ALL';

  isGenerating = false;

  feedbackMessage = '';

  feedbackType: 'success' | 'info' | 'error' = 'info';

  lastGenerateResult: InvoiceGenerateResult | null = null;




  constructor(
    private invoiceService: InvoiceService,
    private paymentFlow: PaymentFlowService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public authService: AuthService,
    private agentContext: AgentContextService,
    private customerService: CustomerService
  ) {}





  ngOnInit(): void {

    this.loadInvoices();

  }



  loadInvoices() {

    this.invoiceService.getInvoices()
      .subscribe({
        next: (data) => {
          this.invoices = this.sortInvoicesByIdDesc(data);
          this.filterInvoices();
          this.cd.detectChanges();
        },
        error: (err) => {
          console.log('Invoice API Error:', err);
          this.showFeedback(
            'Faturalar yüklenemedi. Backend çalışıyor mu kontrol edin.',
            'error'
          );
        }
      });
  }



  generateInvoices() {

    this.isGenerating = true;
    this.feedbackMessage = '';

    this.invoiceService.generateInvoices()
      .subscribe({
        next: (result) => {
          this.isGenerating = false;
          this.lastGenerateResult = result;
          this.showFeedback(
            result.message || 'Fatura oluşturma tamamlandı.',
            result.createdCount > 0 ? 'success' : 'info'
          );
          this.loadInvoices();
        },
        error: (err) => {
          console.log('Generate Error:', err);
          this.isGenerating = false;
          const backendMessage =
            err?.error?.message
            || (typeof err?.error === 'string' ? err.error : null);
          this.showFeedback(
            backendMessage || 'Fatura oluşturma isteği başarısız oldu.',
            'error'
          );
        }
      });
  }



  showFeedback(message: string, type: 'success' | 'info' | 'error') {

    this.feedbackMessage = message;
    this.feedbackType = type;
    this.cd.detectChanges();

  }



  filterInvoices() {

    let list = [...this.invoices];

    if (this.selectedStatus !== 'ALL') {
      list = list.filter(invoice =>
        invoice.status === this.selectedStatus
      );
    }

    if (this.selectedPaymentType !== 'ALL') {
      list = list.filter(invoice =>
        invoice.paymentType === this.selectedPaymentType
      );
    }

    this.filteredInvoices = this.sortInvoicesByIdDesc(list);
  }


  private sortInvoicesByIdDesc(invoices: Invoice[]): Invoice[] {

    return [...invoices].sort(
      (a, b) => b.id - a.id
    );

  }



  payInvoice(invoice: Invoice) {

    if (invoice.paymentType === 'PREPAID') {
      this.payPrepaidInvoice(invoice);
      return;
    }

    this.paymentFlow.requestPayment({
      title: 'Kredi Kartı ile Ödeme',
      subtitle: `Fatura #${invoice.id}`,
      amount: this.getAmount(invoice)
    }).subscribe((result) => {
      if (!result) {
        return;
      }

      this.invoiceService.payInvoice(invoice.id, result.payment)
        .subscribe({
          next: () => {
            this.showFeedback('Fatura başarıyla ödendi.', 'success');
            this.loadInvoices();
          },
          error: (err) => {
            console.log('Payment Error:', err);
            const backendMessage =
              err?.error?.message
              || (typeof err?.error === 'string' ? err.error : null);
            this.showFeedback(
              backendMessage || 'Fatura ödenemedi.',
              'error'
            );
          }
        });
    });
  }


  private payPrepaidInvoice(invoice: Invoice): void {

    this.invoiceService.payInvoice(invoice.id)
      .subscribe({
        next: () => {
          this.showFeedback('Fatura bakiyeden kesildi.', 'success');
          this.loadInvoices();
        },
        error: (err) => {
          console.log('Payment Error:', err);
          const backendMessage =
            err?.error?.message
            || (typeof err?.error === 'string' ? err.error : null);
          this.showFeedback(
            backendMessage || 'Bakiyeden ödeme yapılamadı.',
            'error'
          );
        }
      });

  }



  getTotalAmount() {

    return this.invoices.reduce(
      (total, invoice) => total + Number(invoice.amount ?? 0),
      0
    );
  }



  getPaidAmount() {

    return this.invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce(
        (total, invoice) => total + Number(invoice.amount ?? 0),
        0
      );
  }



  getUnpaidAmount() {

    return this.invoices
      .filter(invoice => invoice.status === 'UNPAID')
      .reduce(
        (total, invoice) => total + Number(invoice.amount ?? 0),
        0
      );
  }



  getPenalty(invoice: Invoice): number {

    return Number(invoice.penaltyFee ?? 0);

  }

  getInstallmentTotal(invoice: Invoice): number {
    return Number(invoice.installmentTotal ?? 0);
  }


  getAmount(invoice: Invoice): number {

    return Number(invoice.amount ?? 0);

  }



  getStatusLabel(status: string): string {

    return status === 'PAID' ? 'Ödendi' : 'Ödenmedi';

  }


  getPaidCount(): number {

    return this.invoices.filter(i => i.status === 'PAID').length;

  }


  getUnpaidCount(): number {

    return this.invoices.filter(i => i.status === 'UNPAID').length;

  }


  getPaymentTypeLabel(invoice: Invoice): string {

    return invoice.paymentType === 'PREPAID' ? 'Ön Ödemeli' : 'Faturalı';

  }

  getRiskLevel(invoice: Invoice): 'LOW' | 'MEDIUM' | 'HIGH' {
    const status = (invoice.riskStatus ?? 'LOW').toUpperCase();

    if (status === 'HIGH') {
      return 'HIGH';
    }
    if (status === 'MEDIUM') {
      return 'MEDIUM';
    }
    return 'LOW';
  }


  getActionLabel(invoice: Invoice): string {

    if (invoice.status === 'UNPAID') {
      return 'Ödeme bekliyor';
    }

    if (invoice.paymentType === 'PREPAID') {
      return 'Bakiyeden kesildi';
    }

    return invoice.paymentDate
      ? `Ödendi (${invoice.paymentDate})`
      : 'Manuel ödendi';

  }


  isUnpaid(invoice: Invoice): boolean {

    return invoice.status === 'UNPAID';

  }


  isPaid(invoice: Invoice): boolean {

    return invoice.status === 'PAID';

  }



  formatMoney(value: number): string {

    return formatMoneyUtil(value);

  }


  hasGenerateDetails(): boolean {

    return !!this.lastGenerateResult?.billingPeriod
      && (
        (this.lastGenerateResult?.createdCount ?? 0) > 0
        || (this.lastGenerateResult?.skippedAlreadyBilledCount ?? 0) > 0
        || (this.lastGenerateResult?.skippedNoTariffCount ?? 0) > 0
      );

  }


  goToCustomerDetail(invoice: Invoice): void {

    if (!invoice.customerId) {
      this.showFeedback('Müşteri bilgisi bulunamadı.', 'error');
      return;
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/customer-detail', invoice.customerId]);
      return;
    }

    this.customerService.getCustomerById(invoice.customerId).subscribe({
      next: (customer) => {
        this.agentContext.setSelectedCustomer(customer);
        this.router.navigate(['/portal']);
      },
      error: () => {
        this.showFeedback('Müşteri profili yüklenemedi.', 'error');
      }
    });
  }



}
