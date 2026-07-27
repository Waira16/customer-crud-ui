import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Customer } from '../models/customer';
import { ShopOrder } from '../models/shop-order';
import { TariffChangePreview } from '../models/tariff-change-preview';
import { BalanceTopUpRequest, PaymentRequest } from '../models/payment-request';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {


  private apiUrl = `${environment.apiBaseUrl}/api/customers`;



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
    id:number,
    customer:Customer
  ):Observable<Customer>{

    return this.http.put<Customer>(
      `${this.apiUrl}/${id}`,
      customer
    );

  }





  deleteCustomer(id:number):Observable<void>{

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }





  searchCustomers(query:string):Observable<Customer[]>{


    const params = new HttpParams()
      .set('query',query);


    return this.http.get<Customer[]>(
      `${this.apiUrl}/search`,
      {
        params
      }
    );

  }





  analyzeChurn(id:number):Observable<Customer>{


    return this.http.post<Customer>(
      `${this.apiUrl}/${id}/analyze-churn`,
      {}
    );

  }





  exportExcel(filters?: {
    search?: string;
    risk?: string;
    paymentType?: string;
    invoiceStatus?: string;
  }){


    let params = new HttpParams();

    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters?.risk && filters.risk !== 'ALL') {
      params = params.set('risk', filters.risk);
    }

    if (filters?.paymentType && filters.paymentType !== 'ALL') {
      params = params.set('paymentType', filters.paymentType);
    }

    if (filters?.invoiceStatus && filters.invoiceStatus !== 'ALL') {
      params = params.set('invoiceStatus', filters.invoiceStatus);
    }

    return this.http.get(
      `${this.apiUrl}/export/excel`,
      {
        params,
        responseType:'blob'
      }
    );

  }




// ==========================
// TARİFE İŞLEMLERİ
// ==========================


// TARİFE DEĞİŞTİRME
updateCustomerTariff(
  customerId:number,
  tariffId:number
):Observable<Customer>{

  return this.http.put<Customer>(
    `${this.apiUrl}/${customerId}/change-tariff/${tariffId}`,
    {}
  );

}

previewTariffChange(
  customerId:number,
  tariffId:number
):Observable<TariffChangePreview>{

  return this.http.get<TariffChangePreview>(
    `${this.apiUrl}/${customerId}/tariff-preview/${tariffId}`
  );

}


deactivateTariff(id:number):Observable<Customer>{

  return this.http.patch<Customer>(
    `${this.apiUrl}/tariffs/${id}/deactivate`,
    {}
  );

}





activateTariff(id:number):Observable<Customer>{

  return this.http.patch<Customer>(
    `${this.apiUrl}/tariffs/${id}/activate`,
    {}
  );

}





deleteTariff(id:number):Observable<Customer>{

  return this.http.delete<Customer>(
    `${this.apiUrl}/tariffs/${id}`
  );

}







// ==========================
// EK PAKET İŞLEMLERİ
// ==========================


addAddon(
  customerId:number,
  addonId:number
):Observable<Customer>{

  return this.http.post<Customer>(
    `${this.apiUrl}/${customerId}/addon/${addonId}`,
    {}
  );

}





deactivateAddon(id:number):Observable<Customer>{

  return this.http.patch<Customer>(
    `${this.apiUrl}/addons/${id}/deactivate`,
    {}
  );

}





activateAddon(id:number):Observable<Customer>{

  return this.http.patch<Customer>(
    `${this.apiUrl}/addons/${id}/activate`,
    {}
  );

}





deleteAddon(id:number):Observable<Customer>{

  return this.http.delete<Customer>(
    `${this.apiUrl}/addons/${id}`
  );

}





// ==========================
// BAKİYE İŞLEMLERİ
// ==========================


addBalance(
  customerId:number,
  request: BalanceTopUpRequest
):Observable<Customer>{

  return this.http.post<Customer>(
    `${this.apiUrl}/${customerId}/balance/top-up`,
    request
  );

}

shopCheckout(
  customerId: number,
  request: {
    payment: PaymentRequest;
    tariffIds: number[];
    addonIds: number[];
    deviceIds: number[];
  }
): Observable<Customer> {

  return this.http.post<Customer>(
    `${this.apiUrl}/${customerId}/shop/checkout`,
    request
  );

}

getShopOrders(customerId: number): Observable<ShopOrder[]> {
  return this.http.get<ShopOrder[]>(
    `${this.apiUrl}/${customerId}/shop/orders`
  );
}
}