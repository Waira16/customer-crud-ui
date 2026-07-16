import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';


export interface Customer {

  id?: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  age?: number;

  complaintCount?: number;

  hasLatePayments?: boolean;

  churnRiskScore?: number;

  riskStatus?: string;

}



@Component({

  selector: 'app-customer-edit',

  standalone: true,

  imports: [

    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule

  ],

  templateUrl: './customer-edit.html',

  styleUrls: ['./customer-edit.css']

})


export class CustomerEditComponent implements OnInit {


  customer: Customer = {

    firstName: '',

    lastName: '',

    email: '',

    phone: '',

    age: 0,

    complaintCount: 0,

    hasLatePayments: false,

    churnRiskScore: 0,

    riskStatus: 'LOW'

  };


  isLoading = true;

  isSaving = false;


  private apiUrl =
    'http://localhost:8080/api/customers';



  constructor(

    private http: HttpClient,

    private router: Router,

    private route: ActivatedRoute,

    private cdr: ChangeDetectorRef

  ) {}



  ngOnInit(): void {


    const id =
      this.route.snapshot.paramMap.get('id');


    if(id){

      this.loadCustomer(Number(id));

    }
    else {

      alert('Müşteri ID bulunamadı');

      this.router.navigate(['/customers']);

    }

  }




  loadCustomer(id:number):void {


    this.http.get<Customer>(

      `${this.apiUrl}/${id}`

    )
    .subscribe({

      next:(data)=>{


        this.customer = data;


        this.isLoading = false;


        this.cdr.detectChanges();


      },


      error:(err)=>{


        console.error(
          err
        );


        alert(
          'Müşteri bilgisi alınamadı'
        );


        this.isLoading=false;


      }

    });


  }





  onSubmit():void {


    this.isSaving=true;


    this.http.put(

      `${this.apiUrl}/${this.customer.id}`,

      this.customer

    )
    .subscribe({

      next:()=>{


        alert(
          'Müşteri başarıyla güncellendi'
        );


        this.router.navigate([
          '/customers'
        ]);


      },


      error:(err)=>{


        console.error(
          err
        );


        alert(
          'Güncelleme başarısız'
        );


        this.isSaving=false;


      }

    });


  }


}