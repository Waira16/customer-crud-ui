import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Tariff } from '../../services/tariff.service';
import { CustomerService } from '../../services/customer.service';
import { TariffService } from '../../services/tariff.service';
import { TariffChangePreview } from '../../models/tariff-change-preview';
import { Commitment } from '../../models/commitment';
import { Invoice } from '../../models/invoice';
import { InvoiceService } from '../../services/invoice.service';
import { MoneyPipe } from '../../pipes/money.pipe';
import { roundMoney } from '../../utils/money.util';
import { NotificationService } from '../../services/notification.service';
import { PaymentFlowService } from '../../services/payment-flow.service';
import { CommitmentService } from '../../services/commitment.service';
import { AddonService } from '../../services/addon.service';
import { UsageService } from '../../services/usage.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import {
  isTariffDowngrade,
  requiresTariffChangeConfirmation
} from '../../utils/tariff-change.util';
import { ShopOrder, ShopOrderItem } from '../../models/shop-order';
import { DeviceInstallment } from '../../models/device-installment';
import { DailyUsageSummary, UsageType } from '../../models/usage';
import { DEVICE_CATEGORY_LABELS, DeviceCategory } from '../../models/device';
import {
  catalogImageUrl,
  onCatalogImageError
} from '../../utils/catalog-image.util';



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

  address?:string;

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
    FormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatCheckboxModule,
    MoneyPipe,
    HasRoleDirective

  ],


  templateUrl:'./customer-detail.html',

  styleUrl:'./customer-detail.css'

})


export class CustomerDetailComponent implements OnInit, OnDestroy {

  readonly isTariffDowngrade = isTariffDowngrade;

  customerId!: number;

  customer!: Customer;

  tariffs: Tariff[] = [];

  commitment: Commitment | null = null;

  addons: any[] = [];

  invoices: Invoice[] = [];

  shopOrders: ShopOrder[] = [];

  deviceInstallments: DeviceInstallment[] = [];

  selectedTariffId!: number;

  selectedAddonId!: number;

  tariffPreview: TariffChangePreview | null = null;

  showPenaltyWarning = false;

  topUpAmount: number | null = null;

  tariffsOpen = false;
  addonsOpen = false;
  ordersOpen = false;
  installmentsOpen = false;
  invoicesOpen = false;
  usageOpen = false;
  private usagePollSub?: Subscription;

  dailyUsageSummary: DailyUsageSummary | null = null;
  isUsageLoading = false;
  isSimulatingUsage = false;
  selectedUsageType: UsageType = 'DATA';

  isLoading = true;
  loadError = '';





constructor(

private route:ActivatedRoute,

private customerService:CustomerService,

private tariffService:TariffService,

private invoiceService:InvoiceService,
private addonService: AddonService,
private commitmentService: CommitmentService,

private notification: NotificationService,

private paymentFlow: PaymentFlowService,

private usageService: UsageService,

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

this.isLoading = true;
this.loadError = '';

this.customerService.getCustomerById(this.customerId)
.subscribe({

next:(data:Customer)=>{

this.customer=data;

this.applyCommitmentData(data);

this.loadDeviceInstallments(this.customerId);

this.isLoading=false;

this.cdr.detectChanges();

},

error:(err:any)=>{

console.error("Müşteri alınamadı:",err);

this.isLoading=false;
this.loadError = this.notification.extractError(
  err,
  'Müşteri bilgileri yüklenemedi.'
);

this.cdr.detectChanges();

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

this.addonService.fetchAddons().subscribe({

next:(data)=>{

this.addons=data ?? [];

},

error:(err)=>{

console.error(
"Addon alınamadı",
err
);

this.addons = [];

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







loadShopOrders(customerId: number): void {
  this.customerService.getShopOrders(customerId).subscribe({
    next: (orders) => {
      this.shopOrders = this.filterProductOrders(orders ?? []);
      this.cdr.detectChanges();
    },
    error: () => {
      this.shopOrders = [];
    }
  });
}

loadDeviceInstallments(customerId: number): void {
  this.customerService.getDeviceInstallments(customerId).subscribe({
    next: (installments) => {
      this.deviceInstallments = installments ?? [];
      this.loadShopOrders(customerId);
      this.cdr.detectChanges();
    },
    error: () => {
      this.deviceInstallments = [];
    }
  });
}

private filterProductOrders(orders: ShopOrder[]): ShopOrder[] {
  return orders
    .map((order) => {
      const deviceItems = order.items.filter((item) => item.itemType === 'DEVICE');
      return {
        ...order,
        items: deviceItems,
        totalAmount: deviceItems.reduce(
          (sum, item) => sum + Number(item.price ?? 0),
          0
        )
      };
    })
    .filter((order) => order.items.length > 0);
}

toggleTariffsSection(): void {
  this.tariffsOpen = !this.tariffsOpen;
  this.cdr.detectChanges();
}

toggleAddonsSection(): void {
  this.addonsOpen = !this.addonsOpen;
  this.cdr.detectChanges();
}

toggleOrdersSection(): void {
  this.ordersOpen = !this.ordersOpen;
  this.cdr.detectChanges();
}

toggleInstallmentsSection(): void {
  this.installmentsOpen = !this.installmentsOpen;
  if (this.installmentsOpen && this.customer?.id) {
    this.loadDeviceInstallments(this.customer.id);
  }
  this.cdr.detectChanges();
}

toggleInvoicesSection(): void {
  this.invoicesOpen = !this.invoicesOpen;
  this.cdr.detectChanges();
}

toggleUsageSection(): void {
  this.usageOpen = !this.usageOpen;
  if (this.usageOpen && this.customer?.id) {
    this.loadUsageSummary(this.customer.id);
    this.startUsagePolling(this.customer.id);
  } else {
    this.stopUsagePolling();
  }
  this.cdr.detectChanges();
}

private startUsagePolling(customerId: number): void {
  this.stopUsagePolling();
  this.usagePollSub = interval(8000)
    .pipe(
      filter(() => this.usageOpen),
      switchMap(() => this.usageService.getDailySummary(customerId))
    )
    .subscribe({
      next: (summary) => {
        this.dailyUsageSummary = summary;
        this.isUsageLoading = false;
        this.cdr.detectChanges();
      }
    });
}

private stopUsagePolling(): void {
  this.usagePollSub?.unsubscribe();
  this.usagePollSub = undefined;
}

ngOnDestroy(): void {
  this.stopUsagePolling();
}

loadUsageSummary(customerId: number): void {
  this.isUsageLoading = true;
  this.usageService.getDailySummary(customerId).subscribe({
    next: (summary) => {
      this.dailyUsageSummary = summary;
      this.isUsageLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.dailyUsageSummary = null;
      this.isUsageLoading = false;
      this.cdr.detectChanges();
    }
  });
}

simulateUsage(): void {
  if (!this.customer?.id) {
    return;
  }

  this.isSimulatingUsage = true;
  this.usageService.simulateUsage({
    customerId: this.customer.id,
    customerPhone: this.customer.phone,
    type: this.selectedUsageType
  }).subscribe({
    next: (response) => {
      this.isSimulatingUsage = false;
      this.loadUsageSummary(this.customer!.id!);
      if (response.quotaExceeded) {
        this.notification.warning(response.message || 'Günlük internet kotası aşıldı.');
      } else {
        this.notification.success(response.message || 'Kullanım kaydı oluşturuldu.');
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.isSimulatingUsage = false;
      this.notification.error(
        this.notification.extractError(err, 'Kullanım simülasyonu başarısız.')
      );
      this.cdr.detectChanges();
    }
  });
}

getUsageBarHeight(value: number, max: number): number {
  if (!max || max <= 0) {
    return 0;
  }
  return Math.max(8, Math.round((value / max) * 100));
}

getMaxHourlyData(): number {
  const points = this.dailyUsageSummary?.hourlyBreakdown ?? [];
  return Math.max(...points.map(point => point.dataMb), 1);
}

onOrderImageError(event: Event, item: ShopOrderItem): void {
  const fallbackKey = item.itemType === 'DEVICE'
    ? (item.itemCategory ?? 'DEFAULT')
    : item.itemType === 'TARIFF'
      ? item.itemCategory ?? 'MOBILE'
      : item.itemCategory ?? 'STREAMING';
  onCatalogImageError(event, fallbackKey, item.itemName);
}

getOrderItemImage(item: ShopOrderItem): string {
  const fallbackKey = item.itemType === 'DEVICE'
    ? (item.itemCategory ?? 'DEFAULT')
    : item.itemType === 'TARIFF'
      ? item.itemCategory ?? 'MOBILE'
      : item.itemCategory ?? 'STREAMING';
  return catalogImageUrl(item.imageUrl, fallbackKey, item.itemName);
}

getOrderItemTypeLabel(item: ShopOrderItem): string {
  if (item.itemType === 'TARIFF') {
    return 'Tarife';
  }
  if (item.itemType === 'ADDON') {
    return 'Ek Paket';
  }
  if (item.itemCategory && item.itemCategory in DEVICE_CATEGORY_LABELS) {
    return DEVICE_CATEGORY_LABELS[item.itemCategory as DeviceCategory];
  }
  return 'Cihaz';
}

formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return this.formatDate(value);
  }
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

getCustomerStatusLabel(): string {
  if (this.customer?.status === 'SUSPENDED') {
    return 'Askıda';
  }
  if (this.customer?.status === 'PENDING_VERIFICATION') {
    return 'Doğrulama Bekliyor';
  }
  return 'Aktif';
}

isCustomerSuspended(): boolean {
  return this.customer?.status === 'SUSPENDED';
}

isCustomerPending(): boolean {
  return this.customer?.status === 'PENDING_VERIFICATION';
}

isApplicationActionLoading = false;

approveApplication(): void {
  if (!this.customer?.id || this.isApplicationActionLoading) {
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
    this.customerService.approveOnlineApplication(this.customer!.id!).subscribe({
      next: (result) => {
        this.notification.success(result.message || 'Başvuru doğrulandı.');
        this.isApplicationActionLoading = false;
        this.loadCustomer();
      },
      error: (err) => {
        this.isApplicationActionLoading = false;
        this.notification.error(
          this.notification.extractError(err, 'Başvuru doğrulanamadı.')
        );
        this.cdr.detectChanges();
      }
    });
  });
}

rejectApplication(): void {
  if (!this.customer?.id || this.isApplicationActionLoading) {
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
    this.customerService.rejectOnlineApplication(this.customer!.id!).subscribe({
      next: (result) => {
        this.notification.success(result.message || 'Başvuru reddedildi.');
        this.isApplicationActionLoading = false;
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.isApplicationActionLoading = false;
        this.notification.error(
          this.notification.extractError(err, 'Başvuru reddedilemedi.')
        );
        this.cdr.detectChanges();
      }
    });
  });
}

getActiveCustomerTariffs() {
  return this.customer?.tariffs?.filter(t => t.active) ?? [];
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
        this.showPenaltyWarning = requiresTariffChangeConfirmation(preview);
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

this.notification.warning("Tarife seçiniz.");

return;

}

if(this.showPenaltyWarning && this.tariffPreview){
  return;
}

this.customerService
  .previewTariffChange(this.customerId, this.selectedTariffId)
  .subscribe({
    next: (preview) => {
      this.tariffPreview = preview;
      this.showPenaltyWarning = requiresTariffChangeConfirmation(preview);

      if (this.showPenaltyWarning) {
        this.cdr.detectChanges();
        return;
      }

      this.executeTariffChange();
    },
    error: (err) => {
      console.error('Tarife önizleme hatası', err);
      this.notification.error(
        this.notification.extractError(err, 'Tarife önizlemesi alınamadı.')
      );
    }
  });

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


this.notification.success("Tarife değiştirildi.");


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

this.notification.error(
  this.notification.extractError(err, "Tarife değiştirilemedi.")
);

}


});

}






addAddon():void{


if(!this.selectedAddonId){

this.notification.warning("Ek paket seçiniz.");

return;

}



this.customerService
.addAddon(
this.customerId,
this.selectedAddonId
)

.subscribe({

next:(customer)=>{


this.notification.success("Ek paket eklendi.");


this.customer=customer;


this.selectedAddonId=0;


this.loadCustomer();


this.cdr.detectChanges();


},


error:(err)=>{


console.error(err);


this.notification.error(
  this.notification.extractError(err, "Ek paket eklenemedi.")
);


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


this.notification.confirm(
  'Ek paket silinsin mi?',
  'Ek Paket Sil',
  'Sil',
  'Vazgeç',
  true
).subscribe((confirmed) => {

if(!confirmed)

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


});

}payInvoice(invoice: Invoice):void{

if (invoice.paymentType === 'PREPAID' || this.customer?.paymentType === 'PREPAID') {
  this.invoiceService.payInvoice(invoice.id)
    .subscribe({
      next: () => {
        this.notification.success('Fatura bakiyeden kesildi.');
        this.loadInvoices();
        this.loadCustomer();
      },
      error: (err) => {
        console.error('Ödeme hatası:', err);
        this.notification.error(
          this.notification.extractError(err, 'Bakiyeden ödeme yapılamadı.')
        );
      }
    });
  return;
}

this.paymentFlow.requestPayment({
  title: 'Kredi Kartı ile Ödeme',
  subtitle: `Fatura #${invoice.id}`,
  amount: this.getInvoiceAmount(invoice)
}).subscribe((result) => {
  if (!result) {
    return;
  }

  this.invoiceService.payInvoice(invoice.id, result.payment)
    .subscribe({
      next: () => {
        this.notification.success('Fatura ödendi.');
        this.loadInvoices();
        this.loadCustomer();
      },
      error: (err) => {
        console.error('Ödeme hatası:', err);
        this.notification.error(
          this.notification.extractError(err, 'Fatura ödenemedi.')
        );
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


this.notification.confirm(
  'Tarife silinsin mi?',
  'Tarife Sil',
  'Sil',
  'Vazgeç',
  true
).subscribe((confirmed) => {

if(!confirmed)

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


});

}







addBalance():void{


const amount = Number(this.topUpAmount);



if(!amount || amount <= 0){

this.notification.warning("Geçerli bir tutar giriniz.");

return;

}

this.paymentFlow.requestPayment({
  title: 'Bakiye Yükleme',
  subtitle: `${this.customer.firstName} ${this.customer.lastName}`,
  amount
}).subscribe((result) => {
  if (!result) {
    return;
  }

  this.customerService.addBalance(
    this.customerId,
    {
      ...result.payment,
      amount
    }
  )
    .subscribe({
      next: (customer) => {
        this.customer = customer;
        this.topUpAmount = null;
        this.loadCustomer();
        this.cdr.detectChanges();
        this.notification.success('Bakiye yüklendi.');
      },
      error: (err) => {
        console.error(err);
        this.notification.error(
          this.notification.extractError(err, 'Bakiye yüklenemedi.')
        );
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

getRiskStatusLabel(status: string): string {
  if (status === 'HIGH') {
    return 'Yüksek';
  }
  if (status === 'MEDIUM') {
    return 'Orta';
  }
  if (status === 'LOW') {
    return 'Düşük';
  }
  return status;
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

  this.commitmentService.getCommitment(this.customerId).subscribe({
    next: (commitment) => {
      this.commitment = commitment;
      this.cdr.detectChanges();
    },
    error: () => {
      this.commitment = null;
      this.cdr.detectChanges();
    }
  });

}

hasCommitment(): boolean {
  return !!(
    this.commitment?.startDate
    || this.customer?.contractStartDate
  );
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