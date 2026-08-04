import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { DailyUsageSummary, UsageService } from '../../core/usage.service';
import { ProfileService, CustomerPortalProfile } from '../../core/profile.service';
import { MessageBoxService } from '../../core/message-box/message-box.service';
import {
  DeviceInstallment,
  DeviceInstallmentService
} from '../../core/device-installment.service';
import { MoneyPipe } from '../../core/money.pipe';

@Component({
  selector: 'self-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MoneyPipe
  ],
  templateUrl: './account.html',
  styleUrl: './account.css'
})
export class AccountComponent implements OnInit {
  summary: DailyUsageSummary | null = null;
  installments: DeviceInstallment[] = [];
  installmentsLoading = false;
  error = '';
  isLoading = true;
  readonly todayLabel = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  constructor(
    private authService: AuthService,
    private usageService: UsageService,
    private profileService: ProfileService,
    private deviceInstallmentService: DeviceInstallmentService,
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

    this.loadSummary(customerId);
    this.loadInstallments();
  }

  get dataQuota(): number {
    return this.summary?.dataQuotaMb ?? 1000;
  }

  get voiceQuota(): number {
    return this.summary?.voiceQuotaMinutes ?? 1000;
  }

  get smsQuota(): number {
    return this.summary?.smsQuota ?? 250;
  }

  get remainingDataLabel(): string {
    const remaining = Math.max(0, this.dataQuota - (this.summary?.totalDataMb ?? 0));
    if (remaining >= 1024) {
      return `${(remaining / 1024).toFixed(1)} GB`;
    }
    return `${remaining} MB`;
  }

  get remainingVoice(): number {
    return Math.max(0, this.voiceQuota - (this.summary?.totalVoiceMinutes ?? 0));
  }

  get remainingSms(): number {
    return Math.max(0, this.smsQuota - (this.summary?.totalSmsCount ?? 0));
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

  get monthlyInstallmentTotal(): number {
    return this.installments.reduce(
      (sum, item) => sum + Number(item.monthlyInstallment ?? 0),
      0
    );
  }

  get remainingInstallmentTotal(): number {
    return this.installments.reduce(
      (sum, item) => sum + this.remainingAmount(item),
      0
    );
  }

  paidInstallments(item: DeviceInstallment): number {
    return Math.max(0, (item.totalInstallments ?? 0) - (item.remainingInstallments ?? 0));
  }

  remainingAmount(item: DeviceInstallment): number {
    return Number(item.monthlyInstallment ?? 0) * Math.max(0, item.remainingInstallments ?? 0);
  }

  progressPercent(item: DeviceInstallment): number {
    const total = item.totalInstallments ?? 0;
    if (!total) {
      return 0;
    }
    return Math.min(100, Math.round((this.paidInstallments(item) / total) * 100));
  }

  retry(): void {
    const customerId = this.authService.getCustomerId();
    if (customerId) {
      this.loadSummary(customerId);
      this.loadInstallments();
    }
  }

  private loadInstallments(): void {
    this.installmentsLoading = true;
    this.deviceInstallmentService.listMine().pipe(
      timeout(15000),
      finalize(() => {
        this.installmentsLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (items) => {
        this.installments = items ?? [];
      },
      error: () => {
        this.installments = [];
      }
    });
  }

  loadSummary(customerId: number): void {
    this.isLoading = true;
    this.error = '';

    const cachedProfile = this.authService.getDisplayProfile();
    if (this.hasUsageData(cachedProfile)) {
      this.summary = this.summaryFromProfile(cachedProfile, customerId);
      this.isLoading = false;
      this.cdr.detectChanges();
    }

    this.profileService.loadProfile().pipe(
      timeout(15000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.authService.setProfile(profile);
          if (this.hasUsageData(profile)) {
            this.summary = this.summaryFromProfile(profile, customerId);
            this.error = '';
            return;
          }
        }
        this.loadUsageFromApi(customerId);
      },
      error: () => {
        if (!this.summary) {
          this.loadUsageFromApi(customerId);
        }
      }
    });
  }

  private loadUsageFromApi(customerId: number): void {
    this.usageService.getDailySummary(customerId).pipe(
      timeout(15000)
    ).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string }; name?: string; status?: number }) => {
        if (this.summary) {
          return;
        }
        if (err?.name === 'TimeoutError') {
          this.error = 'Kullanım servisi yanıt vermedi. usage-cdr (8086) çalışıyor mu kontrol edin.';
          void this.messageBox.warning('Bağlantı Hatası', this.error);
          return;
        }
        if (err?.status === 503) {
          this.error = err?.error?.message ?? 'Kullanım servisi şu an kapalı. usage-cdr (8086) servisini başlatın.';
          void this.messageBox.warning('Servis Kapalı', this.error);
          return;
        }
        this.summary = this.emptySummary(customerId);
        this.error = '';
        this.cdr.detectChanges();
      }
    });
  }

  private hasUsageData(profile: CustomerPortalProfile): boolean {
    return profile.dataQuotaMb != null
      || profile.totalDataMb != null
      || profile.voiceQuotaMinutes != null;
  }

  private summaryFromProfile(profile: CustomerPortalProfile, customerId: number): DailyUsageSummary {
    return {
      customerId,
      date: new Date().toISOString().slice(0, 10),
      totalDataMb: profile.totalDataMb ?? 0,
      totalVoiceMinutes: profile.totalVoiceMinutes ?? 0,
      totalSmsCount: profile.totalSmsCount ?? 0,
      dataQuotaMb: profile.dataQuotaMb ?? 1000,
      voiceQuotaMinutes: profile.voiceQuotaMinutes ?? 1000,
      smsQuota: profile.smsQuota ?? 250
    };
  }

  private emptySummary(customerId: number): DailyUsageSummary {
    return {
      customerId,
      date: new Date().toISOString().slice(0, 10),
      totalDataMb: 0,
      totalVoiceMinutes: 0,
      totalSmsCount: 0,
      dataQuotaMb: 1000,
      voiceQuotaMinutes: 1000,
      smsQuota: 250
    };
  }

  logout(): void {
    this.messageBox.confirm({
      title: 'Çıkış Onayı',
      message: 'Oturumunuz kapatılacak. Çıkmak istiyor musunuz?',
      type: 'warning',
      confirmText: 'Çıkış Yap',
      cancelText: 'Vazgeç'
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.authService.logoutAndGoHome();
    });
  }

  ringPercent(used: number, quota: number): number {
    if (!quota) {
      return 0;
    }
    return Math.min(100, Math.round((used / quota) * 100));
  }

  ringStyle(used: number, quota: number, color: string): Record<string, string> {
    const percent = this.ringPercent(used, quota);
    return {
      background: `conic-gradient(${color} ${percent * 3.6}deg, #e2e8f0 0deg)`
    };
  }
}
