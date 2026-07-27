import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface Tariff {

  id: number;

  name: string;

  dataGB: number;

  minutes: number;

  price: number;

  type: 'FIBER' | 'DSL' | 'MOBILE' | 'TV' | 'DIGITAL_SERVICE';

  imageUrl?: string;

}



@Injectable({
  providedIn: 'root'
})


export class TariffService {


  private apiUrl = `${environment.apiBaseUrl}/api/tariffs`;



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

  createTariff(tariff: Partial<Tariff>): Observable<Tariff> {
    return this.http.post<Tariff>(this.apiUrl, tariff);
  }

  updateTariff(id: number, tariff: Partial<Tariff>): Observable<Tariff> {
    return this.http.put<Tariff>(`${this.apiUrl}/${id}`, tariff);
  }

  deleteTariff(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

}