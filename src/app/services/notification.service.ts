import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../components/confirm-dialog/confirm-dialog';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 6500): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 5000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration);
  }

  confirm(
    message: string,
    title = 'Onay',
    confirmText = 'Evet',
    cancelText = 'İptal',
    destructive = false
  ): Observable<boolean | undefined> {
    return this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title,
        message,
        confirmText,
        cancelText,
        destructive
      }
    }).afterClosed();
  }

  extractError(err: unknown, fallback = 'İşlem başarısız.'): string {
    if (!err || typeof err !== 'object') {
      return fallback;
    }

    const errorObj = err as {
      error?: unknown;
      message?: string;
    };

    if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
      return errorObj.error.trim();
    }

    if (errorObj.error && typeof errorObj.error === 'object') {
      const body = errorObj.error as {
        message?: string;
        error?: string;
      };

      if (body.message?.trim()) {
        return body.message.trim();
      }

      if (body.error?.trim()) {
        return body.error.trim();
      }
    }

    if (errorObj.message?.trim()) {
      return errorObj.message.trim();
    }

    return fallback;
  }

  private show(message: string, type: NotificationType, duration: number): void {
    this.snackBar.open(message, 'Kapat', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['app-snackbar', `app-snackbar-${type}`]
    });
  }

}
