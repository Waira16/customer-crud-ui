import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Invoice, InvoiceService } from '../../services/invoice';



@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class InvoicesComponent implements OnInit {



  invoices: Invoice[] = [];

  filteredInvoices: Invoice[] = [];

  selectedStatus: string = 'ALL';





  constructor(
    private invoiceService: InvoiceService,
    private cd: ChangeDetectorRef
  ) {}







  ngOnInit(): void {

    this.loadInvoices();

  }








  loadInvoices() {


    this.invoiceService.getInvoices()

      .subscribe({

        next: (data) => {


          console.log(
            "Invoices Loaded:",
            data
          );



          this.invoices = data;



          this.filteredInvoices = [
            ...data
          ];



          this.cd.detectChanges();



        },



        error: (err) => {


          console.log(
            "Invoice API Error:",
            err
          );


        }


      });


  }









  filterInvoices() {



    if (this.selectedStatus === 'ALL') {


      this.filteredInvoices = [
        ...this.invoices
      ];

      return;


    }






    this.filteredInvoices =

      this.invoices.filter(invoice =>

        invoice.status === this.selectedStatus

      );



  }









  payInvoice(id:number) {



    this.invoiceService.payInvoice(id)

      .subscribe({


        next: () => {


          this.loadInvoices();


        },



        error:(err)=>{


          console.log(
            "Payment Error:",
            err
          );


        }


      });


  }









  getTotalAmount() {


    return this.invoices.reduce(


      (total, invoice) =>

        total + invoice.amount,


      0


    );


  }









  getPaidAmount() {


    return this.invoices


      .filter(invoice =>

        invoice.status === 'PAID'

      )


      .reduce(


        (total, invoice) =>

          total + invoice.amount,


        0


      );


  }









  getUnpaidAmount() {


    return this.invoices


      .filter(invoice =>

        invoice.status === 'UNPAID'

      )


      .reduce(


        (total, invoice) =>

          total + invoice.amount,


        0


      );


  }









  formatMoney(value:number):string {


    return value.toLocaleString(

      'tr-TR',

      {

        minimumFractionDigits:2,

        maximumFractionDigits:2

      }

    ) + ' ₺';


  }



}