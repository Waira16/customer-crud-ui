import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { PricingService } from '../../core/pricing.service';
import { MessageBoxService } from '../../core/message-box/message-box.service';

@Component({
  selector: 'self-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  step: 'credentials' | 'otp' = 'credentials';
  customerId: number | null = null;
  phone = '';
  otpCode = '';
  maskedPhone = '';
  error = '';
  isLoading = false;
  readonly homePageUrl = environment.crmPortalUrl;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private pricingService: PricingService,
    private messageBox: MessageBoxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (this.authService.isLoggedIn()) {
      void this.router.navigate(['/account']);
    }
  }

  submitCredentials(): void {
    this.error = '';

    const customerId = Number(this.customerId);
    const phone = this.normalizePhone(this.phone);

    if (!customerId || !phone) {
      this.error = 'Müşteri numarası ve telefon zorunludur.';
      void this.messageBox.warning('Eksik Bilgi', this.error);
      return;
    }

    this.maskedPhone = this.maskPhone(phone);
    this.otpCode = '';
    this.step = 'otp';
    this.cdr.detectChanges();
  }

  backToCredentials(): void {
    this.step = 'credentials';
    this.otpCode = '';
    this.error = '';
    this.cdr.detectChanges();
  }

  /** Demo: kod dogrulamasini atla, dogrudan giris. */
  skipOtpAndLogin(): void {
    this.completeLogin();
  }

  verifyOtpAndLogin(): void {
    if (!this.otpCode?.trim()) {
      this.error = 'Doğrulama kodunu girin veya Hemen Gir ile devam edin.';
      return;
    }
    this.completeLogin();
  }

  private completeLogin(): void {
    this.error = '';
    const customerId = Number(this.customerId);
    const phone = this.normalizePhone(this.phone);

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.login(customerId, phone).pipe(
      timeout(15000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.pricingService.clearCache();
        void this.router.navigate(['/account']);
        this.profileService.loadProfile().subscribe({
          next: (profile) => {
            if (profile) {
              this.authService.setProfile(profile);
              this.pricingService.loadOffers().subscribe();
              this.cdr.detectChanges();
            }
          }
        });
      },
      error: (err: { error?: { message?: string }; name?: string }) => {
        if (err?.name === 'TimeoutError') {
          this.error = 'Sunucu yanıt vermedi. Backend (8080) çalışıyor mu kontrol edin.';
        } else {
          this.error = err?.error?.message ?? 'Giriş başarısız. Müşteri no ve telefonu kontrol edin.';
        }
        void this.messageBox.error('Giriş Başarısız', this.error);
        this.cdr.detectChanges();
      }
    });
  }

  private normalizePhone(value: string): string {
    return value.replace(/\s+/g, '').trim();
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) {
      return '****';
    }
    return `${digits.slice(0, 3)} *** ** ${digits.slice(-2)}`;
  }
}
