import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {


  private apiUrl = 'http://localhost:8080/api/customers';


  constructor(
    private http: HttpClient
  ) { }


  getCustomers(): Observable<Customer[]> {

    return this.http.get<Customer[]>(this.apiUrl);

  }


  getCustomerById(id:number): Observable<Customer>{

    return this.http.get<Customer>(
      `${this.apiUrl}/${id}`
    );

  }


  createCustomer(customer:Customer): Observable<Customer>{

    return this.http.post<Customer>(
      this.apiUrl,
      customer
    );

  }


  deleteCustomer(id:number): Observable<void>{

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}