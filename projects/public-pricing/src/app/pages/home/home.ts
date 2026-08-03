import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../environments/environment';
import { CatalogDevice, CatalogService, CatalogTariff } from '../../core/catalog.service';
import { ApplicationService } from '../../core/application.service';
import { AiService } from '../../core/ai.service';
import { MoneyPipe } from '../../core/money.pipe';
import {
  calculateInstallmentTotal,
  calculateInterestAmount,
  calculateMonthlyInstallment,
  DEFAULT_INSTALLMENT_MONTHS,
  getInstallmentRateLabel,
  INSTALLMENT_MONTH_OPTIONS,
  isInterestFreeInstallment
} from 'telecom-shared';

@Component({
  selector: 'pub-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MoneyPipe,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  tariffs: CatalogTariff[] = [];
  devices: CatalogDevice[] = [];
  filteredTariffs: CatalogTariff[] = [];

  minDataGb = 5;
  minMinutes = 100;
  selectedDataGb = 5;
  selectedMinutes = 100;

  selectedTariffId: number | null = null;
  selectedDeviceId: number | null = null;
  selectedInstallmentMonths = DEFAULT_INSTALLMENT_MONTHS;
  readonly installmentOptions = INSTALLMENT_MONTH_OPTIONS;

  application = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: 18,
    address: '',
    notes: ''
  };

  isLoading = true;
  loadError = '';
  isSubmitting = false;
  applicationMessage = '';
  applicationError = '';
  showReturnToPortal = false;

  aiRecommendation = '';
  aiRecommendLoading = false;
  aiRecommendError = '';
  aiRecommendPowered = false;
  aiRecommendedTariffName = '';
  aiRecommendedMonthlyTotal: number | null = null;

  readonly crmUrl = environment.crmPortalUrl;
  readonly selfServiceUrl = environment.selfServiceUrl;

  constructor(
    private catalogService: CatalogService,
    private applicationService: ApplicationService,
    private aiService: AiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.showReturnToPortal = this.route.snapshot.queryParamMap.get('from') === 'self-service';

    forkJoin({
      tariffs: this.catalogService.fetchTariffs().pipe(catchError(() => of([]))),
      devices: this.catalogService.fetchDevices().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ tariffs, devices }) => {
        this.tariffs = tariffs ?? [];
        this.devices = devices ?? [];
        this.applyTariffFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = 'Katalog yüklenemedi.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyTariffFilter(): void {
    this.filteredTariffs = this.tariffs.filter(
      (tariff) =>
        tariff.dataGB >= this.selectedDataGb
        && tariff.minutes >= this.selectedMinutes
    );
  }

  onRobotChange(): void {
    this.applyTariffFilter();
  }

  get selectedTariff(): CatalogTariff | undefined {
    return this.tariffs.find((t) => t.id === this.selectedTariffId);
  }

  get selectedDevice(): CatalogDevice | undefined {
    return this.devices.find((d) => d.id === this.selectedDeviceId);
  }

  installmentLabel(months: number): string {
    return getInstallmentRateLabel(months);
  }

  isInterestFree(months: number): boolean {
    return isInterestFreeInstallment(months);
  }

  get deviceMonthlyInstallment(): number {
    if (!this.selectedDevice) {
      return 0;
    }
    return calculateMonthlyInstallment(
      Number(this.selectedDevice.price),
      this.selectedInstallmentMonths
    );
  }

  get deviceInstallmentTotal(): number {
    if (!this.selectedDevice) {
      return 0;
    }
    return calculateInstallmentTotal(
      Number(this.selectedDevice.price),
      this.selectedInstallmentMonths
    );
  }

  get deviceInterestAmount(): number {
    if (!this.selectedDevice) {
      return 0;
    }
    return calculateInterestAmount(
      Number(this.selectedDevice.price),
      this.selectedInstallmentMonths
    );
  }

  get packageMonthlyTotal(): number {
    const tariffPrice = Number(this.selectedTariff?.price ?? 0);
    return tariffPrice + this.deviceMonthlyInstallment;
  }

  askAiAdvisor(): void {
    this.aiRecommendLoading = true;
    this.aiRecommendError = '';
    this.aiRecommendation = '';
    this.aiRecommendedTariffName = '';
    this.aiRecommendedMonthlyTotal = null;
    this.cdr.detectChanges();

    this.aiService.recommendPackage({
      dataGb: this.selectedDataGb,
      minutes: this.selectedMinutes,
      deviceId: this.selectedDeviceId,
      installmentMonths: this.selectedInstallmentMonths
    }).subscribe({
      next: (response) => {
        this.aiRecommendLoading = false;
        this.aiRecommendation = response.recommendation;
        this.aiRecommendPowered = response.aiPowered;
        this.aiRecommendedTariffName = response.tariffName ?? '';
        this.aiRecommendedMonthlyTotal = response.estimatedMonthlyTotal ?? null;
        if (response.tariffId) {
          this.selectedTariffId = response.tariffId;
        }
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.aiRecommendLoading = false;
        this.aiRecommendError = err?.error?.message
          ?? 'AI öneri servisi yanıt vermedi. ai-support-service (8088) çalışıyor mu kontrol edin.';
        this.cdr.detectChanges();
      }
    });
  }

  submitApplication(): void {
    this.applicationMessage = '';
    this.applicationError = '';

    if (!this.application.firstName.trim() || !this.application.lastName.trim()) {
      this.applicationError = 'Ad ve soyad zorunludur.';
      return;
    }

    this.isSubmitting = true;
    this.applicationService.submit({
      firstName: this.application.firstName.trim(),
      lastName: this.application.lastName.trim(),
      email: this.application.email.trim(),
      phone: this.application.phone.trim(),
      age: Number(this.application.age),
      address: this.application.address.trim(),
      selectedTariffId: this.selectedTariffId ?? undefined,
      notes: this.application.notes.trim()
    }).subscribe({
      next: (response: { message: string }) => {
        this.isSubmitting = false;
        this.applicationMessage = response.message;
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting = false;
        this.applicationError = err?.error?.message ?? 'Başvuru gönderilemedi.';
        this.cdr.detectChanges();
      }
    });
  }
}
