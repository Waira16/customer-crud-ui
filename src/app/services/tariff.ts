import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';


export interface Tariff {

  id: number;

  name: string;

  dataGB: number;

  minutes: number;

  price: number;

  type: 'FIBER' | 'DSL' | 'MOBILE';

}



@Injectable({
  providedIn: 'root'
})


export class TariffService {


  private apiUrl =
    'http://localhost:8080/api/tariffs';



  private tariffSubject =
    new BehaviorSubject<Tariff[]>([]);



  tariffs$ =
    this.tariffSubject.asObservable();




  constructor(
    private http: HttpClient
  ) {

    this.loadTariffs();

  }




  loadTariffs(): void {


    this.http
      .get<Tariff[]>(this.apiUrl)

      .subscribe({

        next: (data) => {


          console.log(
            'SERVICE TARİFELER:',
            data
          );


          this.tariffSubject.next(data);


        },


        error: (err) => {


          console.error(
            'Tarife yükleme hatası:',
            err
          );


          this.tariffSubject.next([]);


        }


      });


  }





  getTariffs(): Observable<Tariff[]> {


    return this.tariffs$;


  }


  fetchTariffs(): Observable<Tariff[]> {

    return this.http.get<Tariff[]>(this.apiUrl);

  }



}