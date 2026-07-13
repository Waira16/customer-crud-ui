import { Routes } from '@angular/router';

import { CustomerListComponent } from './pages/customer-list/customer-list';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit';
import { AddCustomerComponent } from './pages/add-customer/add-customer';
import { DashboardComponent } from './pages/dashboard/dashboard';

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
    path: '**',
    redirectTo: 'dashboard'
  }

];