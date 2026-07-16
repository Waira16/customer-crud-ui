import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
MatSelectModule
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

  customer: Customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: 18,
    complaintCount: 0,
    hasLatePayments: false,
    churnRiskScore: 0,
    riskStatus: 'LOW'
  };

  isEditMode = false;
  isLoading = false;

  private apiUrl = 'http://localhost:8080/api/customers';


  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.loadCustomerById(Number(id));
    }

  }


  loadCustomerById(id: number): void {

    this.isLoading = true;

    this.http.get<Customer>(`${this.apiUrl}/${id}`)
      .subscribe({

        next: (data) => {
          this.customer = data;
          this.isLoading = false;
        },

        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }

      });

  }



  onSubmit(form: any): void {

    if (form.invalid) {
      return;
    }


    this.isLoading = true;


   const payload: Customer = {

  firstName: this.customer.firstName.trim(),

  lastName: this.customer.lastName.trim(),

  email: this.customer.email.trim(),

  phone: this.customer.phone ? this.customer.phone.trim() : '',

  age: Number(this.customer.age) || 18,

  complaintCount: this.customer.complaintCount || 0,

  hasLatePayments: this.customer.hasLatePayments || false

};


    if (this.isEditMode && this.customer.id) {

      payload.id = this.customer.id;


      this.http.put(
        `${this.apiUrl}/${this.customer.id}`,
        payload
      )
      .subscribe({

        next: () => this.handleSuccess(),

        error: (err) => this.handleError(err)

      });


    } else {


      this.http.post(
        this.apiUrl,
        payload
      )
      .subscribe({

        next: () => this.handleSuccess(),

        error: (err) => this.handleError(err)

      });

    }

  }



  private handleSuccess(): void {

    this.isLoading = false;

    console.log('KAYIT BAŞARILI');

    this.router.navigate(['/customers']);

  }



  private handleError(err: any): void {

    console.error('API ERROR:', err);

    this.isLoading = false;


    alert(
      'HATA:\n' +
      JSON.stringify(err.error)
    );

  }

}