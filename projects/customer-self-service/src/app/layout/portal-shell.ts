import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../core/auth.service';
import { ProfileService } from '../core/profile.service';
import { MessageBoxService } from '../core/message-box/message-box.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'self-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MatIconModule, MatButtonModule],
  templateUrl: './portal-shell.html',
  styleUrl: './portal-shell.css'
})
export class PortalShellComponent implements OnInit {
  readonly navItems: NavItem[] = [
    { label: 'Ana Sayfa', icon: 'home', route: '/account' },
    { label: 'Faturalar', icon: 'receipt_long', route: '/invoices' },
    { label: 'Paketler', icon: 'shopping_bag', route: '/packages' },
    { label: 'Tarifeler', icon: 'local_offer', route: '/tariffs' }
  ];

  profile = this.emptyProfile();

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private messageBox: MessageBoxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profile = this.authService.getDisplayProfile();
  }

  ngOnInit(): void {
    this.authService.profile$.subscribe((profile) => {
      this.profile = profile ?? this.authService.getDisplayProfile();
      this.cdr.markForCheck();
    });

    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.profileService.loadProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.authService.setProfile(profile);
        }
        this.profile = this.authService.getDisplayProfile();
        this.cdr.markForCheck();
      }
    });
  }

  isActive(item: NavItem): boolean {
    return this.router.url.startsWith(item.route);
  }

  onNavClick(item: NavItem): void {
    void this.router.navigate([item.route]);
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
      this.authService.logout();
      void this.router.navigate(['/login']);
    });
  }

  private emptyProfile() {
    return {
      customerId: 0,
      firstName: '',
      lastName: '',
      fullName: '',
      phone: '',
      packageName: '',
      packageSummary: ''
    };
  }
}
