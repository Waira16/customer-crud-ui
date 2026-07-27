import { Routes } from '@angular/router';

import { CustomerListComponent } from './pages/customer-list/customer-list';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit';
import { AddCustomerComponent } from './pages/add-customer/add-customer';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { TariffsComponent } from './pages/tariffs/tariffs';
import { LoginComponent } from './pages/login/login';
import { LandingComponent } from './pages/landing/landing';
import { AgentPortalComponent } from './pages/agent-portal/agent-portal';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [

  {
    path: '',
    component: LandingComponent
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])]
  },

  {
    path: 'portal',
    component: AgentPortalComponent,
    canActivate: [authGuard, roleGuard(['ROLE_AGENT', 'ROLE_ADMIN'])]
  },

  {
    path: 'customers',
    component: CustomerListComponent,
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])]
  },

  {
    path: 'add-customer',
    component: AddCustomerComponent,
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])]
  },

  {
    path: 'customer-edit/:id',
    component: CustomerEditComponent,
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])]
  },

  {
    path: 'customer-detail/:id',
    loadComponent: () =>
      import('./pages/customer-detail/customer-detail')
      .then(m => m.CustomerDetailComponent),
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])]
  },

  {
    path: 'invoices',
    loadComponent: () =>
      import('./pages/invoices/invoices')
      .then(m => m.InvoicesComponent),
    canActivate: [authGuard, roleGuard(['ROLE_AGENT', 'ROLE_ADMIN'])]
  },

  {
    path: 'tariffs',
    component: TariffsComponent,
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }

];
