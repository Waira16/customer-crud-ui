import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { Customer } from '../../models/customer';
import { CustomerService } from '../../services/customer.service';
import { getEmailErrorMessage, isValidEmail } from '../../utils/email.util';



@Component({

  selector: 'app-customer-edit',

  standalone: true,

  imports: [

    CommonModule,
    FormsModule,
    RouterModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule

  ],

  templateUrl: './customer-edit.html',

  styleUrls: ['./customer-edit.css']

})


export class CustomerEditComponent implements OnInit {


  customer: Customer = {

    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: 18,
    complaintCount: 0,
    hasLatePayments: false,
    churnRiskScore: 0,
    riskStatus: 'LOW',
    paymentType: 'POSTPAID',
    balance: 0,
    status: 'ACTIVE',
    contractStartDate: '',
    contractDuration: 12

  };


  isLoading = true;

  isSaving = false;

  emailTouched = false;



  constructor(

    private customerService: CustomerService,

    private router: Router,

    private route: ActivatedRoute,

    private cdr: ChangeDetectorRef

  ) {}



  ngOnInit(): void {


    const id =
      this.route.snapshot.paramMap.get('id');


    if (id) {

      this.loadCustomer(Number(id));

    }
    else {

      alert('Müşteri ID bulunamadı');

      this.router.navigate(['/customers']);

    }

  }




  loadCustomer(id: number): void {


    this.customerService.getCustomerById(id)
      .subscribe({

        next: (data) => {

          this.customer = {
            ...this.customer,
            ...data,
            paymentType: data.paymentType || 'POSTPAID',
            balance: data.balance ?? 0,
            status: data.status || 'ACTIVE',
            contractDuration: data.contractDuration ?? 12
          };

          this.isLoading = false;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(err);

          alert('Müşteri bilgisi alınamadı');

          this.isLoading = false;

        }

      });

  }




  onSubmit(): void {


    this.emailTouched = true;

    if (!this.customer.id || !isValidEmail(this.customer.email)) {
      return;
    }

    this.isSaving = true;

    const payload: Customer = {
      ...this.customer,
      age: Number(this.customer.age) || 18,
      complaintCount: Number(this.customer.complaintCount) || 0,
      churnRiskScore: Number(this.customer.churnRiskScore) || 0,
      balance: Number(this.customer.balance) || 0,
      contractDuration: Number(this.customer.contractDuration) || 12
    };

    this.customerService.updateCustomer(this.customer.id, payload)
      .subscribe({

        next: () => {

          alert('Müşteri başarıyla güncellendi');

          this.router.navigate(['/customers']);

        },

        error: (err) => {

          console.error(err);

          alert('Güncelleme başarısız');

          this.isSaving = false;

        }

      });

  }


  showEmailError(): boolean {

    return this.emailTouched && !isValidEmail(this.customer.email);

  }


  getEmailError(): string {

    return getEmailErrorMessage(this.customer.email);

  }


  onEmailBlur(): void {

    this.emailTouched = true;

  }


  onEmailInput(): void {

    this.emailTouched = true;

  }


  goBack(): void {

    this.router.navigate(['/customers']);

  }


}
