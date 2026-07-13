import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, HttpClientModule, MatTableModule, 
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'firstName', 'lastName', 'email', 'phone', 'actions'];
  dataSource = new MatTableDataSource<Customer>([]);
  isLoading = true;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.http.get<Customer[]>('http://localhost:8080/api/customers')
      .pipe(finalize(() => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }))
      .subscribe({
        next: (data) => this.dataSource.data = data,
        error: (err) => console.error("Hata:", err)
      });
  }

  editCustomer(id: number): void {
    this.router.navigate(['/customer-edit', id]);
  }

  deleteCustomer(id: number): void {
    if (confirm("Silmek istediğine emin misin?")) {
      this.http.delete(`http://localhost:8080/api/customers/${id}`, { responseType: 'text' })
        .subscribe(() => this.loadCustomers());
    }
  }
}