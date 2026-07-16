import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Customer } from '../models/customer';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private apiUrl = 'http://localhost:8080/api/customers';

  constructor(
    private http: HttpClient
  ) {}

  getCustomers(): Observable<Customer[]> {

    return this.http.get<Customer[]>(
      this.apiUrl
    );

  }

  getCustomerById(id: number): Observable<Customer> {

    return this.http.get<Customer>(
      `${this.apiUrl}/${id}`
    );

  }

  createCustomer(customer: Customer): Observable<Customer> {

    return this.http.post<Customer>(
      this.apiUrl,
      customer
    );

  }

  updateCustomer(
    id: number,
    customer: Customer
  ): Observable<Customer> {

    return this.http.put<Customer>(
      `${this.apiUrl}/${id}`,
      customer
    );

  }

  deleteCustomer(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

  searchCustomers(query: string): Observable<Customer[]> {

    const params = new HttpParams()
      .set('query', query);

    return this.http.get<Customer[]>(
      `${this.apiUrl}/search`,
      {
        params
      }
    );

  }

  analyzeChurn(id: number): Observable<Customer> {

    return this.http.post<Customer>(
      `${this.apiUrl}/${id}/analyze-churn`,
      {}
    );

  }

  exportExcel() {

    return this.http.get(
      `${this.apiUrl}/export/excel`,
      {
        responseType: 'blob'
      }
    );

  }

  deactivateTariff(id: number): Observable<Customer> {

    return this.http.patch<Customer>(
      `${this.apiUrl}/tariffs/${id}/deactivate`,
      {}
    );

  }

  activateTariff(id: number): Observable<Customer> {

    return this.http.patch<Customer>(
      `${this.apiUrl}/tariffs/${id}/activate`,
      {}
    );

  }

  deleteTariff(id: number): Observable<Customer> {

    return this.http.delete<Customer>(
      `${this.apiUrl}/tariffs/${id}`
    );

  }

}