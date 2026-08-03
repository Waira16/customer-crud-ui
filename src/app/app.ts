import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './layout/navbar/navbar';
import { SidebarComponent } from './layout/sidebar/sidebar';
import { CustomerChatWidgetComponent } from './components/customer-chat-widget/customer-chat-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    NavbarComponent,
    SidebarComponent,
    CustomerChatWidgetComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  showLayout = false;

  constructor(private router: Router) {
    this.updateLayout(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateLayout(event.urlAfterRedirects);
      });
  }

  private updateLayout(url: string): void {
    const path = this.normalizePath(url);
    this.showLayout = !this.isPublicRoute(path);
    document.body.classList.toggle('public-page', !this.showLayout);
  }

  private normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0].trim();
    if (!path || path === '/') {
      return '/';
    }
    return path.startsWith('/') ? path : `/${path}`;
  }

  private isPublicRoute(path: string): boolean {
    return path === '/' || path === '/login' || path.startsWith('/welcome');
  }

}
