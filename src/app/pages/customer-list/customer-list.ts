import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { MoneyPipe } from '../../pipes/money.pipe';
import { NotificationService } from '../../services/notification.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { CustomerService } from '../../services/customer.service';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice';



export interface Customer {

  id: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  age: number;

  riskStatus: string;

  paymentType?: 'PREPAID' | 'POSTPAID';

  balance?: number;

  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

}





@Component({

  selector: 'app-customer-list',

  standalone: true,


  imports: [

    CommonModule,

    RouterModule,

    FormsModule,


    MatTableModule,

    MatCardModule,

    MatButtonModule,

    MatIconModule,

    MatProgressSpinnerModule,


    MatInputModule,

    MatFormFieldModule,

    MatSelectModule,


    MatSortModule,

    MatPaginatorModule,
    MoneyPipe,
    HasRoleDirective

  ],


  templateUrl: './customer-list.html',

  styleUrls: ['./customer-list.css']

})


export class CustomerListComponent implements OnInit {



  displayedColumns: string[] = [

    'id',

    'firstName',

    'lastName',

    'email',

    'phone',

    'paymentType',

    'balance',

    'status',

    'riskStatus',

    'actions'

  ];





  dataSource =
    new MatTableDataSource<Customer>([]);





  isLoading = true;



  searchText = '';

  selectedRisk = 'ALL';

  selectedPaymentType = 'ALL';

  selectedInvoiceStatus = 'ALL';

  selectedCustomerStatus = 'ALL';

  private invoices: Invoice[] = [];





  @ViewChild(MatSort)

  sort!: MatSort;




  @ViewChild(MatPaginator)

  paginator!: MatPaginator;


  constructor(

    private customerService: CustomerService,

    private invoiceService: InvoiceService,

    private router: Router,

    private cdr: ChangeDetectorRef,

    private notification: NotificationService

  ) {}






  ngOnInit(): void {

    this.setupFilterPredicate();
    this.loadCustomers();

  }


  setupFilterPredicate(): void {

    this.dataSource.filterPredicate = (data: Customer, filter: string) => {

      const parsed = JSON.parse(filter || '{}') as {
        search?: string;
        risk?: string;
        paymentType?: string;
        invoiceStatus?: string;
        customerStatus?: string;
      };

      const search = (parsed.search || '').trim().toLowerCase();
      const risk = parsed.risk || 'ALL';
      const paymentType = parsed.paymentType || 'ALL';
      const invoiceStatus = parsed.invoiceStatus || 'ALL';
      const customerStatus = parsed.customerStatus || 'ALL';

      const matchesSearch = !search || [
        data.id?.toString(),
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.riskStatus,
        data.paymentType,
        data.status
      ].some(value =>
        (value || '').toString().toLowerCase().includes(search)
      );

      const matchesRisk = risk === 'ALL' || data.riskStatus === risk;

      const matchesPaymentType =
        paymentType === 'ALL' || data.paymentType === paymentType;

      const matchesCustomerStatus =
        customerStatus === 'ALL' || data.status === customerStatus;

      const hasUnpaidInvoice = this.invoices.some(
        invoice => invoice.customerId === data.id && invoice.status === 'UNPAID'
      );

      const matchesInvoiceStatus =
        invoiceStatus === 'ALL'
        || (invoiceStatus === 'UNPAID' && hasUnpaidInvoice)
        || (invoiceStatus === 'PAID' && !hasUnpaidInvoice);

      return matchesSearch
        && matchesRisk
        && matchesPaymentType
        && matchesCustomerStatus
        && matchesInvoiceStatus;

    };

  }


  applyFilters(): void {

    this.dataSource.filter = JSON.stringify({
      search: this.searchText,
      risk: this.selectedRisk,
      paymentType: this.selectedPaymentType,
      invoiceStatus: this.selectedInvoiceStatus,
      customerStatus: this.selectedCustomerStatus
    });

  }







  loadCustomers(): void {


    this.isLoading = true;



    forkJoin({
      customers: this.customerService.getCustomers(),
      invoices: this.invoiceService.getInvoices()
    })
    .pipe(
      finalize(()=>{
        this.isLoading=false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: ({ customers, invoices }) => {
        this.invoices = invoices ?? [];
        this.dataSource.data = customers ?? [];
        setTimeout(()=>{
          this.dataSource.sort=this.sort;
          this.dataSource.paginator=this.paginator;
          this.applyFilters();
        });
      },
      error:(err)=>{
        console.error(
          "Müşteriler alınamadı:",
          err
        );
        this.notification.error(
          this.notification.extractError(err, 'Müşteri listesi yüklenemedi.')
        );
      }
    });



  }







  applyFilter():void{

    this.applyFilters();

  }








  filterRisk():void{

    this.applyFilters();

  }

  filterPaymentType(): void {
    this.applyFilters();
  }

  filterInvoiceStatus(): void {
    this.applyFilters();
  }

  filterCustomerStatus(): void {
    this.applyFilters();
  }








  getStatusLabel(status?: string): string {

    if (status === 'SUSPENDED') {
      return 'Askıda';
    }
    if (status === 'PENDING_VERIFICATION') {
      return 'Doğrulama Bekliyor';
    }
    return 'Aktif';

  }

  getRiskLabel(status?: string): string {
    if (status === 'HIGH') {
      return 'Yüksek';
    }
    if (status === 'MEDIUM') {
      return 'Orta';
    }
    if (status === 'LOW') {
      return 'Düşük';
    }
    return status ?? '-';
  }

  detailCustomer(id:number):void{


    this.router.navigate([

      '/customer-detail',

      id

    ]);


  }






  editCustomer(id:number):void{


    this.router.navigate([

      '/customer-edit',

      id

    ]);


  }






  deleteCustomer(id:number):void{


    this.notification.confirm(
      'Silmek istediğine emin misin?',
      'Müşteri Sil',
      'Sil',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {

    if(!confirmed){
      return;
    }


      this.customerService.deleteCustomer(id)

      .subscribe({
        next: () => {
          this.notification.success('Müşteri silindi.');
          this.loadCustomers();
        },
        error: (err: unknown) => {
          this.notification.error(
            this.notification.extractError(err, 'Müşteri silinemedi.')
          );
        }
      });


    });



  }

  isApplicationActionLoading = false;

  approveApplication(id: number): void {
    if (this.isApplicationActionLoading) {
      return;
    }

    this.notification.confirm(
      'Bu başvuruyu doğrulayıp müşteriyi aktif etmek istiyor musunuz?',
      'Başvuruyu Doğrula',
      'Doğrula',
      'Vazgeç'
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isApplicationActionLoading = true;
      this.customerService.approveOnlineApplication(id).subscribe({
        next: (result) => {
          this.isApplicationActionLoading = false;
          this.notification.success(result.message || 'Başvuru doğrulandı.');
          this.loadCustomers();
        },
        error: (err: unknown) => {
          this.isApplicationActionLoading = false;
          this.notification.error(
            this.notification.extractError(err, 'Başvuru doğrulanamadı.')
          );
          this.cdr.detectChanges();
        }
      });
    });
  }

  rejectApplication(id: number): void {
    if (this.isApplicationActionLoading) {
      return;
    }

    this.notification.confirm(
      'Bu başvuruyu reddetmek istiyor musunuz? Kayıt silinecek.',
      'Başvuruyu Reddet',
      'Reddet',
      'Vazgeç',
      true
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isApplicationActionLoading = true;
      this.customerService.rejectOnlineApplication(id).subscribe({
        next: (result) => {
          this.isApplicationActionLoading = false;
          this.notification.success(result.message || 'Başvuru reddedildi.');
          this.loadCustomers();
        },
        error: (err: unknown) => {
          this.isApplicationActionLoading = false;
          this.notification.error(
            this.notification.extractError(err, 'Başvuru reddedilemedi.')
          );
          this.cdr.detectChanges();
        }
      });
    });
  }






  exportExcel():void{


    this.customerService.exportExcel({
      search: this.searchText,
      risk: this.selectedRisk,
      paymentType: this.selectedPaymentType,
      invoiceStatus: this.selectedInvoiceStatus
    })


    .subscribe({


      next:(blob:Blob)=>{


        const url =

        window.URL.createObjectURL(blob);



        const a =

        document.createElement('a');



        a.href=url;


        a.download='telecom-crm-raporu.xlsx';



        document.body.appendChild(a);


        a.click();


        document.body.removeChild(a);



        window.URL.revokeObjectURL(url);



        this.notification.success('Excel raporu indirildi.');
      },
      error:(err)=>{
        console.error(
          "Excel indirilemedi:",
          err
        );
        this.notification.error(
          this.notification.extractError(err, 'Excel raporu indirilemedi.')
        );
      }


    });



  }



}