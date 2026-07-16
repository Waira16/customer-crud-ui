import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface Invoice {


  id: number;


  customerName: string;


  amount: number;


  dueDate: string;


  status: string;


  billingPeriod: string;


}





@Injectable({
  providedIn: 'root'
})
export class InvoiceService {



  private apiUrl = 'http://localhost:8080/api/invoices';




  constructor(
    private http: HttpClient
  ) {}





  getInvoices(): Observable<Invoice[]> {


    return this.http.get<Invoice[]>(

      this.apiUrl

    );


  }






  payInvoice(id:number): Observable<Invoice> {


    return this.http.put<Invoice>(

      `${this.apiUrl}/${id}/pay`,

      {}

    );


  }



}