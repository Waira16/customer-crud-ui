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
  filter,
  catchError
} from 'rxjs/operators';

import { of } from 'rxjs';

import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { AuthService } from '../../services/auth.service';
import { AgentContextService } from '../../services/agent-context.service';
import { MatButtonModule } from '@angular/material/button';



@Component({

  selector: 'app-navbar',

  standalone: true,

  imports: [

    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule

  ],

  template: `

<div class="header">


  <div class="title-area">


    <h1>
      Müşteri Yönetim Sistemi
    </h1>


    <p>
      {{ currentPage() }}
    </p>


  </div>




  <div class="search-box" *ngIf="authService.isAdmin()">


    <mat-icon>
      search
    </mat-icon>



    <input

      type="text"

      [formControl]="searchControl"

      [placeholder]="searchPlaceholder">





    <div

      class="search-result"

      *ngIf="customers.length > 0">



      <div

        class="customer-item"

        *ngFor="let customer of customers"

        (mousedown.prevent)="selectCustomer(customer)">



        {{customer.firstName}}

        {{customer.lastName}}



      </div>



    </div>



  </div>



  <div class="user-panel">

    <div class="user-info">
      <strong>{{ authService.getUsername() }}</strong>
      <span>({{ authService.getRoleLabel() }})</span>
    </div>

    <button
      mat-stroked-button
      type="button"
      class="logout-btn"
      (click)="logout()">
      Çıkış Yap
    </button>

  </div>



</div>

  `,


  styleUrls: ['./navbar.css']

})


export class NavbarComponent implements OnInit {



  searchControl = new FormControl('');



  customers: Customer[] = [];



  currentPage = signal('Gösterge Paneli');

  searchPlaceholder = 'Müşteri ara...';





  constructor(

    private customerService: CustomerService,

    private router: Router,

    public authService: AuthService,

    private agentContext: AgentContextService

  ) {}





  ngOnInit(): void {

    this.searchPlaceholder = this.authService.isAgent()
      ? 'Adınızı yazın, profilinizi seçin...'
      : 'Müşteri ara...';

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

      debounceTime(300),

      distinctUntilChanged(),

      switchMap(value => {

        const query = value?.trim();

        if (!query) {
          this.customers = [];
          return of([]);
        }

        return this.customerService.searchCustomers(query).pipe(
          catchError((err) => {
            console.error('Arama hatası:', err);
            return of([]);
          })
        );

      })

    )

    .subscribe({

      next: (data) => {
        this.customers = data ?? [];
      }

    });



  }









  private updatePageTitle(url:string):void {



    console.log(
      "Gelen URL:",
      url
    );




    if(url.includes('dashboard')){


      this.currentPage.set('Gösterge Paneli');


    }


    else if(url.includes('portal')){


      this.currentPage.set('Temsilci Paneli');


    }


    else if(url.includes('customers')){


      this.currentPage.set('Müşteriler');


    }


    else if(url.includes('add-customer')){


      this.currentPage.set('Müşteri Ekle');


    }


    else if(url.includes('customer-edit')){


      this.currentPage.set('Müşteri Düzenle');


    }


    else if(url.includes('customer-detail')){


      this.currentPage.set('Müşteri Detayı');


    }


    else if(url.includes('invoices')){


      this.currentPage.set('Kullanıcılar');


    }


    else if(url.includes('tariffs')){


      this.currentPage.set('Tarifeler');


    }


    else{


      this.currentPage.set('Gösterge Paneli');


    }





    console.log(

      "Başlık:",

      this.currentPage()

    );


  }








  selectCustomer(customer: Customer): void {

    if (customer?.id == null) {
      return;
    }

    this.customers = [];
    this.searchControl.setValue('');

    if (this.authService.isAgent()) {
      this.agentContext.setSelectedCustomer(customer);
      this.router.navigate(['/portal']);
      return;
    }

    this.router.navigate(['/customer-detail', customer.id]);
  }

  logout(): void {
    this.agentContext.clearSelection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}