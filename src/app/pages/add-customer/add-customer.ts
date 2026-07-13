import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface Customer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // Java'daki 'phone' ile eşitlendi
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
    MatProgressSpinnerModule
  ],
  templateUrl: './add-customer.html',
  styleUrls: ['./add-customer.css']
})
export class AddCustomerComponent implements OnInit {
  // Java Entity tarafında null düşüp patlamaması için güvenli varsayılan değerler
  customer: Customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: 20, // Varsayılan bir yaş değeri
    complaintCount: 0,
    hasLatePayments: false,
    churnRiskScore: 0,
    riskStatus: 'LOW' // RiskStatus enum yapına uygun varsayılan bir değer (Gerekirse 'LOW' veya 'SAFE' yapabilirsin)
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
      this.loadCustomerById(+id);
    }
  }

  loadCustomerById(id: number): void {
    this.isLoading = true;
    this.http.get<Customer>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.customer = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Müşteri detayları yüklenemedi:', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      return;
    }

    this.isLoading = true;

    // Java Entity yapısıyla birebir eşleşen payload paketi
    const payload: Customer = {
      firstName: this.customer.firstName.trim(),
      lastName: this.customer.lastName.trim(),
      email: this.customer.email.trim(),
      phone: this.customer.phone ? this.customer.phone.trim() : '',
      age: Number(this.customer.age) || 20,
      complaintCount: this.customer.complaintCount || 0,
      hasLatePayments: this.customer.hasLatePayments || false,
      churnRiskScore: this.customer.churnRiskScore || 0,
      riskStatus: this.customer.riskStatus || 'LOW'
    };

    if (this.isEditMode && this.customer.id) {
      payload.id = this.customer.id;
      console.log('PUT PAYLOAD:', payload);
      this.http.put(`${this.apiUrl}/${this.customer.id}`, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    } else {
      console.log('POST PAYLOAD:', payload);
      this.http.post(this.apiUrl, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleSuccess(): void {
    this.isLoading = false;
    this.router.navigate(['/customer-list']);
  }

  private handleError(err: any): void {
    console.error('API Error:', err);
    this.isLoading = false;
    alert('Müşteri kaydedilirken sunucu hatası (500) oluştu. Java konsolunu kontrol edin.');
  }
}