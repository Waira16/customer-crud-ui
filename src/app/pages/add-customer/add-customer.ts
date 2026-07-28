import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { getEmailErrorMessage, isValidEmail } from '../../utils/email.util';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { AgentContextService } from '../../services/agent-context.service';
import { CustomerService } from '../../services/customer.service';
import { Customer as CustomerModel } from '../../models/customer';



@Component({

  selector: 'app-add-customer',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    RouterModule,

    MatCardModule,

    MatFormFieldModule,

    MatInputModule,

    MatButtonModule,

    MatIconModule,

    MatProgressSpinnerModule,

    MatSelectModule

  ],

  templateUrl: './add-customer.html',

  styleUrls: ['./add-customer.css']

})


export class AddCustomerComponent implements OnInit {


  customer: CustomerModel = {
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

    status: 'ACTIVE'

  };



  isEditMode = false;

  isLoading = false;

  emailTouched = false;

  constructor(

    private customerService: CustomerService,

    private router: Router,

    private route: ActivatedRoute,

    private notification: NotificationService,

    private authService: AuthService,

    private agentContext: AgentContextService

  ) {}





  ngOnInit(): void {


    const id =
      this.route.snapshot.paramMap.get('id');



    if(id){


      this.isEditMode = true;


      this.loadCustomerModelById(
        Number(id)
      );


    }


  }





  loadCustomerModelById(id:number):void{


    this.isLoading = true;

    this.customerService.getCustomerById(id).subscribe({

      next:(data)=>{

        this.customer = data;

        this.isLoading=false;

      },

      error:(err)=>{

        console.error(err);

        this.isLoading=false;

      }

    });


  }






  onSubmit(form: NgForm): void {

    this.emailTouched = true;

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.notification.warning('Lütfen zorunlu alanları doldurun.');
      return;
    }

    if (!isValidEmail(this.customer.email)) {
      this.notification.warning(getEmailErrorMessage(this.customer.email));
      return;
    }

    if (!this.authService.getToken()) {
      this.notification.warning('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.isLoading = true;

    const payload: CustomerModel = {
      firstName: this.customer.firstName.trim(),
      lastName: this.customer.lastName.trim(),
      email: this.customer.email.trim(),
      phone: this.customer.phone ? this.customer.phone.trim() : '',
      age: Number(this.customer.age) || 18,
      complaintCount: Number(this.customer.complaintCount) || 0,
      hasLatePayments: this.customer.hasLatePayments || false,
      churnRiskScore: Number(this.customer.churnRiskScore) || 0,
      riskStatus: this.customer.riskStatus || 'LOW',
      paymentType: this.customer.paymentType || 'POSTPAID',
      balance: Number(this.customer.balance) || 0,
      status: this.customer.status || 'ACTIVE'
    } as CustomerModel;

    const request$ = this.isEditMode && this.customer.id
      ? this.customerService.updateCustomer(this.customer.id, {
          ...payload,
          id: this.customer.id
        })
      : this.customerService.createCustomer(payload);

    request$.subscribe({
      next: (created) => {
        this.handleSuccess(created);
      },
      error: (err) => {
        this.handleError(err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }








  private handleSuccess(created?: CustomerModel):void{


    this.isLoading=false;


    console.log(
      'KAYIT BAŞARILI'
    );

    this.notification.success('Müşteri başarıyla kaydedildi.');

    if (this.authService.isAgent() && created) {
      this.agentContext.setSelectedCustomer(created);
      this.router.navigate(['/portal']);
      return;
    }

    this.router.navigate([
      '/customers'
    ]);


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




  private handleError(err:any):void{

    console.error(
      'API ERROR:',
      err
    );

    this.isLoading=false;

    if (err?.status === 401) {
      this.notification.error('Oturum gerekli veya geçersiz. Lütfen tekrar giriş yapın.');
      return;
    }

    if (err?.status === 403) {
      this.notification.error('Müşteri oluşturmak için yönetici (admin) hesabı gerekir.');
      return;
    }

    this.notification.error(
      this.notification.extractError(err, 'Müşteri kaydedilemedi.')
    );

  }



}