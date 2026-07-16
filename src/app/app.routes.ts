import { Routes } from '@angular/router';

import { CustomerListComponent } from './pages/customer-list/customer-list';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit';
import { AddCustomerComponent } from './pages/add-customer/add-customer';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { TariffsComponent } from './pages/tariffs/tariffs';


export const routes: Routes = [


  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },


  {
    path: 'dashboard',
    component: DashboardComponent
  },


  {
    path: 'customers',
    component: CustomerListComponent
  },


  {
    path: 'add-customer',
    component: AddCustomerComponent
  },


  {
    path: 'customer-edit/:id',
    component: CustomerEditComponent
  },


  {
    path: 'customer-detail/:id',
    loadComponent: () =>
      import('./pages/customer-detail/customer-detail')
      .then(
        m => m.CustomerDetailComponent
      )
  },


  {
    path: 'invoices',
    loadComponent: () =>
      import('./pages/invoices/invoices')
      .then(
        m => m.InvoicesComponent
      )
  },


  {
    path: 'tariffs',
    component: TariffsComponent
  },


  {
    path: '**',
    redirectTo: 'dashboard'
  }


];