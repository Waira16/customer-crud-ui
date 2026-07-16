import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CustomerService } from '../../services/customer.service';
import { Tariff } from '../../models/tariff';
import { TariffService } from '../../services/tariff';



export interface Invoice {

  id:number;

  amount:number;

  dueDate:string;

  status:string;

  billingPeriod:string;

}



export interface CustomerTariff {

  id:number;

  tariff:Tariff;

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


  tariffs?:CustomerTariff[];


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
    MatCheckboxModule

  ],


  templateUrl:'./customer-detail.html',

  styleUrl:'./customer-detail.css'

})


export class CustomerDetailComponent implements OnInit {



customerId!:number;


customer!:Customer;


tariffs:Tariff[]=[];


invoices:Invoice[]=[];


selectedTariffId!:number;


isLoading=true;




private apiUrl =
'http://localhost:8080/api/customers';



private invoiceUrl =
'http://localhost:8080/api/invoices';





constructor(

private route:ActivatedRoute,

private http:HttpClient,

private customerService:CustomerService,

private tariffService:TariffService,

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


this.loadInvoices();



}





loadCustomer(): void {

  this.http.get<Customer>(`${this.apiUrl}/${this.customerId}`)
    .subscribe({

      next: (data) => {

        console.log("CUSTOMER:", data);
        console.log("TARIFFS:", data.tariffs);

        this.customer = data;

        this.isLoading = false;

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.isLoading = false;

      }

    });

}






loadTariffs():void{


this.tariffService.getTariffs()

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






loadInvoices():void{


this.http.get<Invoice[]>(

`${this.invoiceUrl}/customer/${this.customerId}`

)

.subscribe({


next:(data)=>{


this.invoices=data;


this.cdr.detectChanges();


},



error:(err)=>{


console.error(
"Faturalar alınamadı",
err
);


}


});


}








updateTariff():void{


if(!this.selectedTariffId){


alert(
"Tarife seçiniz."
);


return;


}





this.http.post(


`${this.apiUrl}/${this.customerId}/tariff/${this.selectedTariffId}`,


{}


)

.subscribe({



next:()=>{


alert(
"Tarife eklendi."
);



this.loadCustomer();


this.selectedTariffId = 0;



},




error:(err)=>{


console.error(
err
);


alert(
"Tarife eklenemedi."
);


}



});



}








payInvoice(invoiceId:number):void{


this.http.put<Invoice>(

`${this.invoiceUrl}/${invoiceId}/pay`,

{}

)

.subscribe({



next:()=>{


alert(
"Fatura ödendi."
);


this.loadInvoices();


},



error:(err)=>{


console.error(
"Ödeme hatası",
err
);


}


});


}







updateCustomer():void{


this.http.put(

`${this.apiUrl}/${this.customer.id}`,

this.customer

)

.subscribe({



next:()=>{


alert(
"Müşteri güncellendi."
);



this.loadCustomer();


},



error:(err)=>{


console.error(
err
);



}


});


}








goBack():void{


this.router.navigate([

'/customers'

]);


}







getRiskColor(status:string):string{


if(status==="HIGH"){

return "#f44336";

}


if(status==="MEDIUM"){

return "#ff9800";

}


return "#4caf50";


}

deactivateTariff(id:number):void{

  this.customerService
      .deactivateTariff(id)
      .subscribe({

        next:(customer)=>{

         this.customer = customer;

          this.cdr.detectChanges();

        },

        error:(err)=>{

          console.error(err);

          alert("Tarife pasif yapılamadı.");

        }

      });

}


activateTariff(id:number):void{

  this.customerService
      .activateTariff(id)
      .subscribe({

        next:(customer)=>{

          this.customer = customer;

          this.cdr.detectChanges();

        },

        error:(err)=>{

          console.error(err);

          alert("Tarife aktif edilemedi.");

        }

      });

}


deleteTariff(id:number):void{

  if(!confirm("Bu tarife kalıcı olarak silinsin mi?")){

    return;

  }


  this.customerService
      .deleteTariff(id)
      .subscribe({

        next:(customer)=>{

          this.customer = customer;

          this.cdr.detectChanges();

        },

        error:(err)=>{

          console.error(err);

          alert("Tarife silinemedi.");

        }

      });

}



getTotalMonthlyPrice():number{

  if(!this.customer?.tariffs){

    return 0;

  }

  return this.customer.tariffs

    .filter(t=>t.active)

    .reduce(

      (total,t)=>total+Number(t.tariff.price),

      0

    );

}
}