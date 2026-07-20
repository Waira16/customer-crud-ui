import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Tariff } from '../../services/tariff.service';
import { CustomerService } from '../../services/customer.service';
import { TariffService } from '../../services/tariff.service';
import { TariffChangePreview } from '../../models/tariff-change-preview';
import { Commitment } from '../../models/commitment';
import { Invoice } from '../../models/invoice';
import { InvoiceService } from '../../services/invoice.service';
import { PaymentRequest } from '../../models/payment-request';
import {
  PaymentDialogComponent,
  PaymentDialogData
} from '../../components/payment-dialog/payment-dialog';
import { MoneyPipe } from '../../pipes/money.pipe';
import { roundMoney } from '../../utils/money.util';



export interface CustomerTariff {

  id:number;

  tariff:Tariff;

  startDate:string;

  endDate?:string;

  active:boolean;

}



export interface CustomerAddon {

  id:number;

  addonPackage:{
    id:number;
    name:string;
    description:string;
    price:number;
  };

  startDate:string;

  active:boolean;

}



export interface Customer {

  id?:number;

  firstName:string;

  lastName:string;

  email:string;

  phone:string;

  age:number;

  complaintCount:number;

  hasLatePayments:boolean;

  churnRiskScore:number;

  riskStatus:string;

  paymentType?:string;

  balance?:number;

  status?:string;

  contractStartDate?:string;

  contractDuration?:number;

  commitment?: Commitment;

  tariffs?:CustomerTariff[];

  addons?:CustomerAddon[];

}



@Component({

  selector:'app-customer-detail',

  standalone:true,

  imports:[

    CommonModule,
    HttpClientModule,
    FormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatCheckboxModule,
    MoneyPipe

  ],


  templateUrl:'./customer-detail.html',

  styleUrl:'./customer-detail.css'

})


export class CustomerDetailComponent implements OnInit {


  customerId!: number;

  customer!: Customer;

  tariffs: Tariff[] = [];

  commitment: Commitment | null = null;

  addons: any[] = [];

  invoices: Invoice[] = [];

  selectedTariffId!: number;

  selectedAddonId!: number;

  tariffPreview: TariffChangePreview | null = null;

  showPenaltyWarning = false;

  topUpAmount: number | null = null;

  isLoading = true;

private apiUrl =
'http://localhost:8080/api/customers';



private invoiceUrl =
'http://localhost:8080/api/invoices';

private commitmentUrl =
'http://localhost:8080/api/commitments';





constructor(

private route:ActivatedRoute,

private http:HttpClient,

private customerService:CustomerService,

private tariffService:TariffService,

private invoiceService:InvoiceService,

private dialog: MatDialog,

private router:Router,

private cdr:ChangeDetectorRef

){}




ngOnInit():void{


this.customerId =
Number(
this.route.snapshot.paramMap.get('id')
);


this.loadCustomer();

this.loadTariffs();

this.loadAddons();

this.loadInvoices();


}


loadCustomer():void{


this.http.get<Customer>(
`${this.apiUrl}/${this.customerId}`
)

.subscribe({

next:(data:Customer)=>{


console.log("CUSTOMER:",data);


this.customer=data;

this.applyCommitmentData(data);


this.isLoading=false;


this.cdr.detectChanges();


},


error:(err:any)=>{


console.error("Müşteri alınamadı:",err);


this.isLoading=false;


}


});


}







loadTariffs():void{


this.tariffService
.getTariffs()

.subscribe({

next:(data)=>{


this.tariffs=data;


},


error:(err)=>{


console.error(
"Tarifeler alınamadı",
err
);


}


});


}







loadAddons():void{


this.http.get<any[]>(

'http://localhost:8080/api/addons'

)

.subscribe({

next:(data)=>{


console.log("ADDONS:",data);


this.addons=data;


},


error:(err)=>{


console.error(
"Addon alınamadı",
err
);


}


});


}






loadInvoices():void{


this.invoiceService
.getInvoicesByCustomer(this.customerId)

.subscribe({

next:(data)=>{


this.invoices = [...data].sort((a, b) => b.id - a.id);


this.cdr.detectChanges();


},


error:(err)=>{


console.error(
"Fatura hatası",
err
);


}


});


}







onTariffSelectionChange(): void {

  if (!this.selectedTariffId) {
    this.tariffPreview = null;
    this.showPenaltyWarning = false;
    return;
  }

  this.customerService
    .previewTariffChange(this.customerId, this.selectedTariffId)
    .subscribe({
      next: (preview) => {
        this.tariffPreview = preview;
        this.showPenaltyWarning = preview.commitmentWarning;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Tarife önizleme hatası', err);
        this.tariffPreview = null;
        this.showPenaltyWarning = false;
      }
    });
}


updateTariff():void{


if(!this.selectedTariffId){

alert("Tarife seçiniz.");

return;

}

if(this.showPenaltyWarning && this.tariffPreview){

  return;

}


this.executeTariffChange();

}


confirmTariffChangeWithPenalty(): void {

  this.executeTariffChange();

}


cancelTariffChange(): void {

  this.selectedTariffId = 0;
  this.tariffPreview = null;
  this.showPenaltyWarning = false;

}


private executeTariffChange(): void {

this.customerService
.updateCustomerTariff(
this.customerId,
this.selectedTariffId
)

.subscribe({

next:(customer)=>{


alert("Tarife değiştirildi.");


this.customer = customer;


this.selectedTariffId = 0;
this.tariffPreview = null;
this.showPenaltyWarning = false;


this.loadCustomer();
this.loadInvoices();


this.cdr.detectChanges();


},


error:(err)=>{

console.error(err);

alert("Tarife değiştirilemedi.");

}


});

}






addAddon():void{


if(!this.selectedAddonId){

alert("Ek paket seçiniz.");

return;

}



this.customerService
.addAddon(
this.customerId,
this.selectedAddonId
)

.subscribe({

next:(customer)=>{


alert("Ek paket eklendi.");


this.customer=customer;


this.selectedAddonId=0;


this.loadCustomer();


this.cdr.detectChanges();


},


error:(err)=>{


console.error(err);


alert("Ek paket eklenemedi.");


}


});


}







deactivateAddon(id:number):void{


this.customerService
.deactivateAddon(id)

.subscribe({

next:(customer)=>{


this.customer=customer;


this.loadCustomer();


this.cdr.detectChanges();


}


});


}







activateAddon(id:number):void{


this.customerService
.activateAddon(id)

.subscribe({

next:(customer)=>{


this.customer=customer;


this.loadCustomer();


this.cdr.detectChanges();


}


});


}







deleteAddon(id:number):void{


if(!confirm("Ek paket silinsin mi?"))

return;



this.customerService
.deleteAddon(id)

.subscribe({

next:(customer)=>{


this.customer=customer;


this.loadCustomer();


this.cdr.detectChanges();


}


});


}payInvoice(invoice: Invoice):void{

if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
  this.invoiceService.payInvoice(invoice.id)
    .subscribe({
      next: () => {
        alert('Fatura bakiyeden kesildi.');
        this.loadInvoices();
        this.loadCustomer();
      },
      error: (err) => {
        console.error('Ödeme hatası:', err);
        const backendMessage =
          err?.error?.message
          || (typeof err?.error === 'string' ? err.error : null);
        alert(backendMessage || 'Bakiyeden ödeme yapılamadı.');
      }
    });
  return;
}

const dialogRef = this.dialog.open<
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentRequest
>(PaymentDialogComponent, {
  width: '520px',
  disableClose: true,
  data: {
    title: 'Kredi Kartı ile Ödeme',
    subtitle: `Fatura #${invoice.id}`,
    amount: this.getInvoiceAmount(invoice)
  }
});

dialogRef.afterClosed().subscribe((payment) => {
  if (!payment) {
    return;
  }

  this.invoiceService.payInvoice(invoice.id, payment)
    .subscribe({
      next: () => {
        alert('Fatura ödendi.');
        this.loadInvoices();
      },
      error: (err) => {
        console.error('Ödeme hatası:', err);
        const backendMessage =
          err?.error?.message
          || (typeof err?.error === 'string' ? err.error : null);
        alert(backendMessage || 'Fatura ödenemedi.');
      }
    });
});

}






deactivateTariff(id:number):void {

  this.customerService
    .deactivateTariff(id)
    .subscribe({

      next: () => {

        this.loadCustomer();

      },

      error:(err)=>{

        console.log("Tarife pasif yapma hatası", err);

      }

    });

}







activateTariff(id:number):void{


this.customerService
.activateTariff(id)

.subscribe({

next:(customer)=>{


this.customer=customer;


this.loadCustomer();


this.cdr.detectChanges();


}


});


}







deleteTariff(id:number):void{


if(!confirm("Tarife silinsin mi?"))

return;



this.customerService
.deleteTariff(id)

.subscribe({

next:(customer)=>{


this.customer=customer;


this.loadCustomer();


this.cdr.detectChanges();


}


});


}







addBalance():void{


const amount = Number(this.topUpAmount);



if(!amount || amount <= 0){

alert("Geçerli bir tutar giriniz.");

return;

}

const dialogRef = this.dialog.open<
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentRequest
>(PaymentDialogComponent, {
  width: '520px',
  disableClose: true,
  data: {
    title: 'Bakiye Yükleme',
    subtitle: `${this.customer.firstName} ${this.customer.lastName}`,
    amount
  }
});

dialogRef.afterClosed().subscribe((payment) => {
  if (!payment) {
    return;
  }

  this.customerService.addBalance(
    this.customerId,
    {
      ...payment,
      amount
    }
  )
    .subscribe({
      next: (customer) => {
        this.customer = customer;
        this.topUpAmount = null;
        this.loadCustomer();
        this.cdr.detectChanges();
        alert('Bakiye yüklendi.');
      },
      error: (err) => {
        console.error(err);
        const backendMessage =
          err?.error?.message
          || (typeof err?.error === 'string' ? err.error : null);
        alert(backendMessage || 'Bakiye yüklenemedi.');
      }
    });
});


}







getRiskColor(status:string):string{


if(status==="HIGH")
return "#f44336";


if(status==="MEDIUM")
return "#ff9800";


return "#4caf50";


}







getTotalMonthlyPrice():number{


let total=0;



if(this.customer?.tariffs){


total += this.customer.tariffs

.filter(t=>t.active)

.reduce(

(sum,t)=>sum+Number(t.tariff.price),

0

);


}




if(this.customer?.addons){


total += this.customer.addons

.filter(a=>a.active)

.reduce(

(sum,a)=>sum+Number(a.addonPackage.price),

0

);


}



return roundMoney(total);


}







goBack():void{


this.router.navigate([

'/customers'

]);


}
getRemainingMonths(): number {

  const endDateValue = this.getCommitmentEndDate();

  if (!endDateValue) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(endDateValue);
  endDate.setHours(0, 0, 0, 0);

  const months =
    (endDate.getFullYear() - today.getFullYear()) * 12 +
    (endDate.getMonth() - today.getMonth());

  return months < 0 ? 0 : months;

}

applyCommitmentData(data: Customer): void {

  if (data.commitment) {
    this.commitment = data.commitment;
    return;
  }

  this.http.get<Commitment>(
    `${this.commitmentUrl}/${this.customerId}`
  ).subscribe({
    next: (commitment) => {
      this.commitment = commitment;
      this.cdr.detectChanges();
    },
    error: () => {
      this.commitment = {
        startDate: data.contractStartDate,
        durationMonths: data.contractDuration,
        endDate: this.calculateContractEndDate(
          data.contractStartDate,
          data.contractDuration
        )
      };
      this.cdr.detectChanges();
    }
  });

}

formatDate(value?: string): string {

  if (!value) {
    return '-';
  }

  if (value.includes('T')) {
    return value.split('T')[0];
  }

  return value;

}

getCommitmentStartDate(): string {

  return this.formatDate(
    this.commitment?.startDate
      ?? this.customer?.contractStartDate
  );

}

getCommitmentDuration(): number {

  return this.commitment?.durationMonths
    ?? this.customer?.contractDuration
    ?? 0;

}

getCommitmentEndDate(): string {

  if (this.commitment?.endDate) {
    return this.formatDate(this.commitment.endDate);
  }

  return this.formatDate(
    this.calculateContractEndDate(
      this.customer?.contractStartDate,
      this.customer?.contractDuration
    )
  );

}

getInvoiceAmount(invoice: Invoice): number {

  return Number(invoice.amount ?? 0);

}

getInvoicePenalty(invoice: Invoice): number {

  return Number(invoice.penaltyFee ?? 0);

}

isInvoicePaid(invoice: Invoice): boolean {

  return invoice.status === 'PAID';

}

getInvoicePaidMessage(invoice: Invoice): string {

  if (!this.isInvoicePaid(invoice)) {
    return '';
  }

  if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
    return 'Bakiyeden otomatik kesildi';
  }

  return 'Manuel ödendi';

}

getInvoiceStatusLabel(invoice: Invoice): string {

  if (this.isInvoiceUnpaid(invoice)) {
    return 'Ödenmedi';
  }

  if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
    return 'Otomatik ödendi';
  }

  return 'Ödendi';

}

isAutoPaid(invoice: Invoice): boolean {

  return this.isInvoicePaid(invoice)
    && (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID');

}

isInvoiceUnpaid(invoice: Invoice): boolean {

  return invoice.status === 'UNPAID';

}

calculateContractEndDate(
  startDate:string | undefined,
  duration:number | undefined
):string {

  if(!startDate || !duration){
    return '';
  }

  const date = new Date(startDate);

  date.setMonth(
    date.getMonth() + duration
  );

  return date.toISOString().split('T')[0];

}
}