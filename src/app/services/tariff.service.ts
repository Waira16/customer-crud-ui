import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface Tariff {

  id:number;

  name:string;

  dataGB:number;

  minutes:number;

  price:number;

  type:string;

  imageUrl?: string;

}



@Injectable({
  providedIn:'root'
})


export class TariffService {


  private apiUrl = `${environment.apiBaseUrl}/api/tariffs`;



  constructor(
    private http:HttpClient
  ){}




  getTariffs():Observable<Tariff[]> {


    return this.http.get<Tariff[]>(
      this.apiUrl
    );


  }



}