import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { AddonPackage } from '../models/addon-package';



@Injectable({
  providedIn: 'root'
})
export class AddonService {


  private apiUrl = 'http://localhost:8080/api/addons';

  private addonSubject = new BehaviorSubject<AddonPackage[]>([]);

  addons$ = this.addonSubject.asObservable();




  constructor(
    private http: HttpClient
  ) {

    this.loadAddons();

  }


  loadAddons(): void {

    this.http.get<AddonPackage[]>(this.apiUrl)
      .subscribe({
        next: (data) => this.addonSubject.next(data),
        error: () => this.addonSubject.next([])
      });

  }


  getAddons(): Observable<AddonPackage[]> {

    return this.addons$;

  }


  fetchAddons(): Observable<AddonPackage[]> {

    return this.http.get<AddonPackage[]>(this.apiUrl);

  }

}
