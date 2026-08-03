import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MessageBoxDialogComponent } from './message-box-dialog.component';
import { MessageBoxDialogData, MessageBoxOptions } from './message-box.types';

@Injectable({ providedIn: 'root' })
export class MessageBoxService {
  constructor(private dialog: MatDialog) {}

  confirm(options: MessageBoxOptions): Observable<boolean> {
    return this.open({
      ...options,
      type: options.type ?? 'confirm',
      mode: 'confirm'
    }).pipe(map((result) => !!result));
  }

  alert(options: MessageBoxOptions): Observable<void> {
    return this.open({
      ...options,
      type: options.type ?? 'info',
      mode: 'alert'
    }).pipe(map(() => undefined));
  }

  success(title: string, message: string): Observable<void> {
    return this.alert({ title, message, type: 'success', confirmText: 'Tamam' });
  }

  error(title: string, message: string): Observable<void> {
    return this.alert({ title, message, type: 'error', confirmText: 'Tamam' });
  }

  warning(title: string, message: string): Observable<void> {
    return this.alert({ title, message, type: 'warning', confirmText: 'Tamam' });
  }

  info(title: string, message: string): Observable<void> {
    return this.alert({ title, message, type: 'info', confirmText: 'Tamam' });
  }

  confirmExtraDataPurchase(gb: number): Observable<boolean> {
    const message = gb >= 10
      ? `${gb} GB ek internet paketi anında tanımlanır ve faturanıza yansır.\n\n10 GB ve üzeri paketlerde iptal veya iade yapılamaz. Devam etmek istiyor musunuz?`
      : `${gb} GB ek internet paketi anında tanımlanır ve faturanıza yansır.\n\nOnaylıyor musunuz?`;

    return this.confirm({
      title: `${gb} GB Ek İnternet`,
      message,
      type: gb >= 10 ? 'warning' : 'confirm',
      confirmText: 'Satın Al',
      cancelText: 'Vazgeç'
    });
  }

  private open(data: MessageBoxDialogData): Observable<boolean | undefined> {
    return this.dialog.open(MessageBoxDialogComponent, {
      width: '440px',
      maxWidth: '92vw',
      disableClose: false,
      autoFocus: 'first-tabbable',
      panelClass: 'self-message-box-panel',
      data
    }).afterClosed().pipe(
      map((result) => (data.mode === 'confirm' ? !!result : result))
    );
  }
}
