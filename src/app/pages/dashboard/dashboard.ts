import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  totalCustomers: number = 0;
  isLoading: boolean = true;

  private apiUrl = 'http://localhost:8080/api/customers';


  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.getStats();
  }


  getStats(): void {

    this.isLoading = true;


    this.http.get<any[]>(this.apiUrl)
      .subscribe({

        next: (res) => {

          console.log("Customers API Response:", res);


          this.totalCustomers = res.length;


          console.log("TOTAL CUSTOMER:", this.totalCustomers);


          this.isLoading = false;


          // Ekranı yenile
          this.cdr.detectChanges();

        },


        error: (err) => {

          console.error(
            "Müşteri istatistikleri alınamadı:",
            err
          );


          this.totalCustomers = 0;
          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }

}