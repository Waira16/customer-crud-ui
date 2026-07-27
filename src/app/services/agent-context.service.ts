import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer } from '../models/customer';

const SELECTED_CUSTOMER_KEY = 'agent_selected_customer';

@Injectable({
  providedIn: 'root'
})
export class AgentContextService {

  private selectedCustomerSubject =
    new BehaviorSubject<Customer | null>(this.loadStoredCustomer());

  selectedCustomer$ = this.selectedCustomerSubject.asObservable();

  setSelectedCustomer(customer: Customer | null): void {
    const currentId = this.getSelectedCustomerId();

    if (customer?.id != null && customer.id === currentId) {
      this.persistCustomer(customer);
      this.selectedCustomerSubject.next(customer);
      return;
    }

    this.selectedCustomerSubject.next(customer);

    if (customer?.id) {
      this.persistCustomer(customer);
    } else {
      sessionStorage.removeItem(SELECTED_CUSTOMER_KEY);
    }
  }

  refreshSelectedCustomer(customer: Customer): void {
    if (customer.id !== this.getSelectedCustomerId()) {
      return;
    }

    this.persistCustomer(customer);
    this.selectedCustomerSubject.next(customer);
  }

  getSelectedCustomer(): Customer | null {
    return this.selectedCustomerSubject.value;
  }

  getSelectedCustomerId(): number | null {
    return this.getSelectedCustomer()?.id ?? null;
  }

  clearSelection(): void {
    sessionStorage.removeItem(SELECTED_CUSTOMER_KEY);
    this.selectedCustomerSubject.next(null);
  }

  private persistCustomer(customer: Customer): void {
    sessionStorage.setItem(SELECTED_CUSTOMER_KEY, JSON.stringify(customer));
  }

  private loadStoredCustomer(): Customer | null {
    const raw = sessionStorage.getItem(SELECTED_CUSTOMER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Customer;
    } catch {
      return null;
    }
  }
}
