import { Component, OnInit, DestroyRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  finalize,
  tap
} from 'rxjs/operators';
import { of } from 'rxjs';

import { HasRoleDirective } from '../../directives/has-role.directive';
import { AgentContextService } from '../../services/agent-context.service';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { MoneyPipe } from '../../pipes/money.pipe';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    ReactiveFormsModule,
    HasRoleDirective,
    MoneyPipe
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {

  selectedCustomer: Customer | null = null;
  profileSearchControl = new FormControl('');
  searchResults: Customer[] = [];
  searchQuery = '';
  isSearching = false;
  showResults = false;
  isSelectingProfile = false;

  private blurTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private agentContext: AgentContextService,
    private customerService: CustomerService,
    private router: Router,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.agentContext.selectedCustomer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        this.selectedCustomer = customer;
        this.cdr.markForCheck();
      });

    this.selectedCustomer = this.agentContext.getSelectedCustomer();

    this.profileSearchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap((value) => {
          const query = value?.trim() ?? '';
          this.searchQuery = query;
          this.showResults = query.length > 0;

          if (!query) {
            this.searchResults = [];
            this.isSearching = false;
            this.cdr.markForCheck();
          }
        }),
        switchMap((value) => {
          const query = value?.trim();

          if (!query) {
            return of([]);
          }

          this.isSearching = true;
          this.cdr.markForCheck();

          return this.customerService.searchCustomers(query).pipe(
            catchError(() => of([])),
            finalize(() => {
              this.isSearching = false;
              this.cdr.markForCheck();
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.searchResults = data ?? [];
        this.showResults = this.searchQuery.length > 0;
        this.cdr.markForCheck();
      });
  }

  onSearchFocus(): void {
    if (this.searchQuery.length > 0) {
      this.showResults = true;
    }
  }

  onSearchBlur(): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }

    this.blurTimeout = setTimeout(() => {
      if (!this.isSelectingProfile) {
        this.showResults = false;
        this.cdr.markForCheck();
      }
    }, 200);
  }

  selectProfile(customer: Customer, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const customerId = Number(customer?.id);
    if (!customerId || Number.isNaN(customerId)) {
      this.notification.warning('Geçersiz profil seçimi.');
      return;
    }

    if (this.isSelectingProfile) {
      return;
    }

    this.isSelectingProfile = true;
    this.showResults = false;

    this.customerService.getCustomerById(customerId).subscribe({
      next: (fullCustomer) => {
        this.searchResults = [];
        this.searchQuery = '';
        this.profileSearchControl.setValue('', { emitEvent: false });
        this.agentContext.setSelectedCustomer(fullCustomer);
        this.isSelectingProfile = false;

        if (!this.router.url.startsWith('/portal')) {
          void this.router.navigate(['/portal']);
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSelectingProfile = false;
        this.notification.error(
          this.notification.extractError(err, 'Profil yüklenemedi.')
        );
        this.cdr.markForCheck();
      }
    });
  }

  clearProfile(): void {
    this.agentContext.clearSelection();
    this.searchResults = [];
    this.showResults = false;
    this.searchQuery = '';
    this.profileSearchControl.setValue('', { emitEvent: false });
    this.cdr.markForCheck();
  }

}
