import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MessageBoxDialogData, MessageBoxType } from './message-box.types';

@Component({
  selector: 'self-message-box-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './message-box-dialog.component.html',
  styleUrl: './message-box-dialog.component.css'
})
export class MessageBoxDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: MessageBoxDialogData,
    private dialogRef: MatDialogRef<MessageBoxDialogComponent, boolean | undefined>
  ) {}

  get iconName(): string {
    const icons: Record<MessageBoxType, string> = {
      confirm: 'help_outline',
      info: 'info',
      warning: 'warning_amber',
      success: 'check_circle',
      error: 'error_outline'
    };
    return icons[this.data.type ?? 'info'];
  }

  get primaryButtonColor(): 'primary' | 'warn' | undefined {
    if (this.data.type === 'error' || this.data.type === 'warning') {
      return 'warn';
    }
    return 'primary';
  }

  close(result?: boolean): void {
    this.dialogRef.close(result);
  }
}
