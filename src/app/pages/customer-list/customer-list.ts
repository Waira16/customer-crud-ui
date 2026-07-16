import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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



export interface Customer {

  id: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  age: number;

  riskStatus: string;

}





@Component({

  selector: 'app-customer-list',

  standalone: true,


  imports: [

    CommonModule,

    RouterModule,

    HttpClientModule,

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

    MatPaginatorModule

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

    'riskStatus',

    'actions'

  ];





  dataSource =
    new MatTableDataSource<Customer>([]);





  isLoading = true;



  searchText = '';

  selectedRisk = 'ALL';





  @ViewChild(MatSort)

  sort!: MatSort;




  @ViewChild(MatPaginator)

  paginator!: MatPaginator;





  private apiUrl =
    'http://localhost:8080/api/customers';





  constructor(

    private http: HttpClient,

    private router: Router,

    private cdr: ChangeDetectorRef

  ) {}






  ngOnInit(): void {

    this.loadCustomers();

  }







  loadCustomers(): void {


    this.isLoading = true;



    this.http.get<Customer[]>(this.apiUrl)


    .pipe(

      finalize(()=>{


        this.isLoading=false;

        this.cdr.detectChanges();


      })


    )



    .subscribe({


      next:(data)=>{


        this.dataSource.data=data;



        setTimeout(()=>{


          this.dataSource.sort=this.sort;


          this.dataSource.paginator=this.paginator;


        });


      },



      error:(err)=>{


        console.error(

          "Müşteriler alınamadı:",

          err

        );


      }


    });



  }







  applyFilter():void{


    this.dataSource.filter =

      this.searchText

      .trim()

      .toLowerCase();



  }








  filterRisk():void{


    if(this.selectedRisk === 'ALL'){


      this.dataSource.filter='';

      return;


    }



    this.dataSource.filterPredicate =

    (data:Customer,filter:string)=>{


      return data.riskStatus === filter;


    };



    this.dataSource.filter=this.selectedRisk;



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


    if(confirm("Silmek istediğine emin misin?")){


      this.http.delete(

        `${this.apiUrl}/${id}`,

        {

          responseType:'text'

        }

      )

      .subscribe(()=>{


        this.loadCustomers();


      });


    }



  }






  exportExcel():void{


    this.http.get(

      `${this.apiUrl}/export/excel`,

      {

        responseType:'blob'

      }

    )


    .subscribe({


      next:(blob:Blob)=>{


        const url =

        window.URL.createObjectURL(blob);



        const a =

        document.createElement('a');



        a.href=url;


        a.download='customers.xlsx';



        document.body.appendChild(a);


        a.click();


        document.body.removeChild(a);



        window.URL.revokeObjectURL(url);



      },



      error:(err)=>{


        console.error(

          "Excel indirilemedi:",

          err

        );


      }


    });



  }



}