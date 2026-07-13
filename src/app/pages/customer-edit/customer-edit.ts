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

export interface Customer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
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
    MatIconModule
  ],
  templateUrl: './customer-edit.html',
  styleUrls: ['./customer-edit.css']
})
export class CustomerEditComponent implements OnInit {
  customer: Customer = { firstName: '', lastName: '', email: '', phone: '' };
  isLoading = true;
  isSaving = false;
  private apiUrl = 'http://localhost:8080/api/customers';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // URL'den gelen id parametresini alıyoruz (Örn: /customer-edit/12)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(Number(id));
    } else {
      alert('Müşteri ID bulunamadı!');
      this.router.navigate(['/customer-list']);
    }
  }

  // Düzenlenecek olan mevcut müşteri bilgilerini Spring Boot'tan çekiyoruz
  loadCustomer(id: number): void {
    this.isLoading = true;
    this.http.get<Customer>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.customer = data;
        this.isLoading = false; // Veri başarıyla geldi, çarkı durdur!
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Müşteri detayları yüklenirken hata:', err);
        alert('Müşteri bilgileri getirilemedi!');
        this.isLoading = false;
        this.router.navigate(['/customer-list']);
        this.cdr.detectChanges();
      }
    });
  }

  // Güncellenmiş form verilerini PUT isteğiyle kaydediyoruz
  onSubmit(): void {
    if (!this.customer.firstName || !this.customer.lastName || !this.customer.email) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

    this.isSaving = true;
    this.http.put(`${this.apiUrl}/${this.customer.id}`, this.customer).subscribe({
      next: () => {
        alert('Müşteri başarıyla güncellendi!');
        this.router.navigate(['/customer-list']);
      },
      error: (err) => {
        console.error('Güncelleme sırasında hata:', err);
        alert('Güncelleme işlemi başarısız oldu!');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}