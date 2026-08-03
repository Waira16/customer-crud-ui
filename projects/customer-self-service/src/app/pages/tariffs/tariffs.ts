import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { ApplicationService } from '../../core/application.service';
import { AuthService } from '../../core/auth.service';
import { CatalogDevice, CatalogService, CatalogTariff } from '../../core/catalog.service';
import { MoneyPipe } from '../../core/money.pipe';
import {
  calculateInstallmentTotal,
  calculateInterestAmount,
  calculateMonthlyInstallment,
  DEFAULT_INSTALLMENT_MONTHS,
  getInstallmentRateLabel,
  INSTALLMENT_MONTH_OPTIONS
} from 'telecom-shared';
import { MessageBoxService } from '../../core/message-box/message-box.service';

@Component({
  selector: 'self-tariffs',
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
  templateUrl: './tariffs.html',
  styleUrl: './tariffs.css'
})
export class TariffsComponent implements OnInit {
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

  constructor(
    private catalogService: CatalogService,
    private applicationService: ApplicationService,
    private authService: AuthService,
    private messageBox: MessageBoxService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const phone = this.authService.getPhone();
    if (phone) {
      this.application.phone = phone;
    }

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
        void this.messageBox.error('Katalog Hatası', 'Tarife ve cihaz listesi yüklenemedi.');
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

  submitApplication(): void {
    if (!this.application.firstName.trim() || !this.application.lastName.trim()) {
      void this.messageBox.warning('Eksik Bilgi', 'Ad ve soyad zorunludur.');
      return;
    }

    const tariffName = this.selectedTariff?.name ?? 'Seçilmedi';
    this.messageBox.confirm({
      title: 'Başvuru Onayı',
      message: `Online başvurunuz operatöre iletilecek.\n\nSeçilen tarife: ${tariffName}\n\nGöndermek istiyor musunuz?`,
      type: 'confirm',
      confirmText: 'Gönder',
      cancelText: 'Vazgeç'
    }).subscribe((confirmed) => {
      if (!confirmed) {
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
        next: (response) => {
          this.isSubmitting = false;
          void this.messageBox.success('Başvuru Alındı', response.message);
          this.cdr.detectChanges();
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSubmitting = false;
          void this.messageBox.error('Başvuru Gönderilemedi', err?.error?.message ?? 'Başvuru gönderilemedi.');
          this.cdr.detectChanges();
        }
      });
    });
  }
}
