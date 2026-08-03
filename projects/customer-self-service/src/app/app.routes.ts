import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AccountComponent } from './pages/account/account';
import { PackagesComponent } from './pages/packages/packages';
import { InvoicesComponent } from './pages/invoices/invoices';
import { TariffsComponent } from './pages/tariffs/tariffs';
import { PortalShellComponent } from './layout/portal-shell';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: PortalShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'account', pathMatch: 'full' },
      { path: 'account', component: AccountComponent },
      { path: 'packages', component: PackagesComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'tariffs', component: TariffsComponent }
    ]
  },
  { path: '**', redirectTo: 'account' }
];
