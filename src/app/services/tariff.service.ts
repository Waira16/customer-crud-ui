import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';


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


  private apiUrl =
  'http://localhost:8080/api/tariffs';



  constructor(
    private http:HttpClient
  ){}




  getTariffs():Observable<Tariff[]> {


    return this.http.get<Tariff[]>(
      this.apiUrl
    );


  }



}