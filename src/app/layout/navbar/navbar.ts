import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import {
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter
} from 'rxjs/operators';

import { of } from 'rxjs';

import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';



@Component({

  selector: 'app-navbar',

  standalone: true,

  imports: [

    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule

  ],

  template: `

<div class="header">


  <div class="title-area">


    <h1>
      Customer Management System
    </h1>


    <p>
      {{ currentPage() }}
    </p>


  </div>




  <div class="search-box">


    <mat-icon>
      search
    </mat-icon>



    <input

      type="text"

      [formControl]="searchControl"

      placeholder="Müşteri ara...">





    <div

      class="search-result"

      *ngIf="customers.length > 0">



      <div

        class="customer-item"

        *ngFor="let customer of customers"

        (click)="goToCustomer(customer.id)">



        {{customer.firstName}}

        {{customer.lastName}}



      </div>



    </div>



  </div>



</div>

  `,


  styleUrls: ['./navbar.css']

})


export class NavbarComponent implements OnInit {



  searchControl = new FormControl('');



  customers: Customer[] = [];



  currentPage = signal('Dashboard');





  constructor(

    private customerService: CustomerService,

    private router: Router

  ) {}





  ngOnInit(): void {



    this.updatePageTitle(
      this.router.url
    );




    this.router.events

    .pipe(

      filter(
        event => event instanceof NavigationEnd
      )

    )

    .subscribe(

      (event:any)=>{


        this.updatePageTitle(
          event.urlAfterRedirects
        );


      }

    );






    this.searchControl.valueChanges

    .pipe(

      debounceTime(150),

      distinctUntilChanged(),


      switchMap(value=>{


        const query = value?.trim();



        if(!query){


          this.customers = [];


          return of([]);


        }



        return this.customerService.searchCustomers(query);


      })


    )

    .subscribe({


      next:(data)=>{


        this.customers = data;


      },


      error:(err)=>{


        console.error(
          "Arama hatası:",
          err
        );


        this.customers = [];


      }


    });



  }









  private updatePageTitle(url:string):void {



    console.log(
      "Gelen URL:",
      url
    );




    if(url.includes('dashboard')){


      this.currentPage.set('Dashboard');


    }


    else if(url.includes('customers')){


      this.currentPage.set('Customers');


    }


    else if(url.includes('add-customer')){


      this.currentPage.set('Add Customer');


    }


    else if(url.includes('customer-edit')){


      this.currentPage.set('Customer Edit');


    }


    else if(url.includes('customer-detail')){


      this.currentPage.set('Customer Detail');


    }


    else if(url.includes('invoices')){


      this.currentPage.set('Invoices');


    }


    else if(url.includes('tariffs')){


      this.currentPage.set('Tariffs');


    }


    else{


      this.currentPage.set('Dashboard');


    }





    console.log(

      "Başlık:",

      this.currentPage()

    );


  }








  goToCustomer(id:number | undefined):void {



    if(id == null){

      return;

    }



    this.customers = [];



    this.searchControl.setValue('');




    this.router.navigate([

      '/customer-detail',

      id

    ]);



  }




}