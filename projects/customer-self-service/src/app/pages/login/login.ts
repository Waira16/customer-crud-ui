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
  customerId: number | null = null;
  phone = '';
  error = '';
  isLoading = false;
  readonly publicUrl = environment.publicPortalUrl;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private messageBox: MessageBoxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (this.authService.isLoggedIn()) {
      void this.router.navigate(['/account']);
    }
  }

  submit(): void {
    this.error = '';

    const customerId = Number(this.customerId);
    const phone = this.normalizePhone(this.phone);

    if (!customerId || !phone) {
      this.error = 'Müşteri numarası ve telefon zorunludur.';
      void this.messageBox.warning('Eksik Bilgi', this.error);
      return;
    }

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
        void this.router.navigate(['/account']);
        this.profileService.loadProfile().subscribe({
          next: (profile) => {
            if (profile) {
              this.authService.setProfile(profile);
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
}
