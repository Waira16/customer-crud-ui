import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
export class LoginComponent implements OnInit {

  username = '';
  password = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      void this.redirectAfterLogin();
    }
  }

  submit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.notification.warning('Kullanıcı adı ve şifre zorunludur.');
      return;
    }

    this.isLoading = true;

    this.authService.login({
      username: this.username.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.success('Giriş başarılı.');
        void this.redirectAfterLogin();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          this.notification.extractError(err, 'Giriş başarısız.')
        );
      }
    });
  }

  private async redirectAfterLogin(): Promise<void> {
    const target = this.resolveTargetRoute();

    const navigated = await this.router.navigateByUrl(target);
    if (navigated) {
      return;
    }

    const fallback = this.authService.getDefaultRoute();
    if (fallback !== target) {
      const fallbackNavigated = await this.router.navigateByUrl(fallback);
      if (fallbackNavigated) {
        return;
      }
    }

    this.notification.warning('Yönlendirme yapılamadı. Lütfen menüden devam edin.');
  }

  private resolveTargetRoute(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    const sanitized = this.sanitizeReturnUrl(requested);

    if (sanitized) {
      return sanitized;
    }

    return this.authService.getDefaultRoute();
  }

  private sanitizeReturnUrl(url: string | null): string | null {
    if (!url?.trim()) {
      return null;
    }

    const path = url.split('?')[0].split('#')[0].trim();

    if (!path || path === '/' || path.startsWith('/login')) {
      return null;
    }

    return path.startsWith('/') ? path : `/${path}`;
  }

}
