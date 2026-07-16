import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BaseChartDirective } from 'ng2-charts';

import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  DoughnutController,
  BarController
} from 'chart.js';


Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  DoughnutController,
  BarController
);



@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [

    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective

  ],

  templateUrl:'./dashboard.html',

  styleUrls:['./dashboard.css']

})


export class DashboardComponent implements OnInit {



  customersOpen = false;

  invoicesOpen = false;



  totalCustomers = 0;

  highRiskCustomers = 0;

  mediumRiskCustomers = 0;

  lowRiskCustomers = 0;



  totalInvoices = 0;

  paidInvoices = 0;

  unpaidInvoices = 0;



  expectedRevenue = 0;

  collectedRevenue = 0;

  pendingRevenue = 0;



  isLoading = true;



  private apiUrl =
  'http://localhost:8080/api/dashboard/stats';





  // Risk grafiği

  riskChartData:any = {

    labels:[
      'HIGH',
      'MEDIUM',
      'LOW'
    ],

    datasets:[

      {

        data:[0,0,0],

        backgroundColor:[

          '#ef5350',
          '#ffb74d',
          '#66bb6a'

        ]

      }

    ]

  };



  riskChartType:any='doughnut';






  // Yaş grafiği

  ageChartData:any = {


    labels:[

      '18-25',
      '26-40',
      '41+'

    ],


    datasets:[

      {

        label:'Customers',

        data:[0,0,0],

        backgroundColor:[

          '#42a5f5',
          '#66bb6a',
          '#ffa726'

        ]

      }

    ]


  };



  ageChartType:any='bar';







  // Fatura grafiği

  invoiceChartData:any = {


    labels:[

      'PAID',
      'UNPAID'

    ],


    datasets:[

      {

        label:'Invoices',

        data:[0,0],

        backgroundColor:[

          '#66bb6a',
          '#ef5350'

        ]

      }

    ]


  };



  invoiceChartType:any='bar';








  constructor(

    private http:HttpClient,

    private cdr:ChangeDetectorRef

  ){}





  ngOnInit():void{


    this.loadDashboard();


  }







  toggleCustomers(){


    this.customersOpen =
    !this.customersOpen;


    if(this.customersOpen){

      this.invoicesOpen=false;

    }


    this.cdr.detectChanges();

  }







  toggleInvoices(){


    this.invoicesOpen =
    !this.invoicesOpen;



    if(this.invoicesOpen){

      this.customersOpen=false;

    }


    this.cdr.detectChanges();


  }







  loadDashboard(){


    this.http.get<any>(this.apiUrl)

    .subscribe({


      next:(data)=>{



        console.log(
          "Dashboard:",
          data
        );



        this.totalCustomers =
        data.totalCustomers || 0;



        this.highRiskCustomers =
        data.highRiskChurnCount || 0;



        this.mediumRiskCustomers =
        data.mediumRiskChurnCount || 0;



        this.lowRiskCustomers =
        data.lowRiskChurnCount || 0;





        this.totalInvoices =
        data.totalInvoices || 0;



        this.paidInvoices =
        data.paidInvoices || 0;



        this.unpaidInvoices =
        data.unpaidInvoices || 0;





        this.expectedRevenue =
        data.expectedRevenue || 0;



        this.collectedRevenue =
        data.collectedRevenue || 0;



        this.pendingRevenue =
        data.pendingRevenue || 0;








        this.riskChartData.datasets[0].data=[


          this.highRiskCustomers,

          this.mediumRiskCustomers,

          this.lowRiskCustomers


        ];







        if(data.ageGroups){


          this.ageChartData.datasets[0].data=[


            data.ageGroups["18_25"] || 0,


            data.ageGroups["26_40"] || 0,


            data.ageGroups["41_plus"] || 0


          ];

        }







        this.invoiceChartData.datasets[0].data=[


          this.paidInvoices,

          this.unpaidInvoices


        ];






        this.isLoading=false;


        this.cdr.detectChanges();



      },



      error:(err)=>{


        console.error(
          "Dashboard Error:",
          err
        );


        this.isLoading=false;


      }



    });


  }



}