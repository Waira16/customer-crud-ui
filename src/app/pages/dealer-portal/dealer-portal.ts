import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DealerService } from '../../services/dealer.service';
import { AgentContextService } from '../../services/agent-context.service';
import { NotificationService } from '../../services/notification.service';
import {
  DealerCommissionSummary,
  DealerSaleResponse
} from '../../models/dealer';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-dealer-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MoneyPipe
  ],
  templateUrl: './dealer-portal.html',
  styleUrl: './dealer-portal.css'
})
export class DealerPortalComponent implements OnInit {

  dealerId = 1;
  customerId: number | null = null;
  saleAmount: number | null = null;
  description = '';

  commissionSummary: DealerCommissionSummary | null = null;
  lastSale: DealerSaleResponse | null = null;
  isSubmitting = false;
  isLoadingSummary = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private dealerService: DealerService,
    private agentContext: AgentContextService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.agentContext.selectedCustomer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        this.customerId = customer?.id ?? null;
        this.cdr.markForCheck();
      });

    this.customerId = this.agentContext.getSelectedCustomerId();
    this.loadCommissionSummary();
  }

  loadCommissionSummary(): void {
    this.isLoadingSummary = true;
    this.dealerService.getMonthlyCommissions(this.dealerId).subscribe({
      next: (summary) => {
        this.commissionSummary = summary;
        this.isLoadingSummary = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingSummary = false;
        this.notification.error(
          this.notification.extractError(err, 'Komisyon bilgisi alınamadı.')
        );
        this.cdr.markForCheck();
      }
    });
  }

  submitSale(): void {
    const amount = Number(this.saleAmount);

    if (!amount || amount <= 0) {
      this.notification.warning('Geçerli bir satış tutarı girin.');
      return;
    }

    this.isSubmitting = true;
    this.dealerService.registerSale({
      dealerId: this.dealerId,
      customerId: this.customerId ?? undefined,
      saleAmount: amount,
      description: this.description || 'Bayi satışı'
    }).subscribe({
      next: (response) => {
        this.lastSale = response;
        this.saleAmount = null;
        this.description = '';
        this.isSubmitting = false;
        this.loadCommissionSummary();
        this.notification.success('Bayi satışı kaydedildi.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.error(
          this.notification.extractError(err, 'Satış kaydedilemedi.')
        );
        this.cdr.markForCheck();
      }
    });
  }
}
