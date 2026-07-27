import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Tariff } from '../../services/tariff';

export interface TariffFormDialogData {
  tariff?: Tariff;
}

@Component({
  selector: 'app-tariff-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './tariff-form-dialog.html',
  styleUrl: './tariff-form-dialog.css'
})
export class TariffFormDialogComponent {

  isEdit: boolean;
  form: Partial<Tariff>;

  constructor(
    private dialogRef: MatDialogRef<TariffFormDialogComponent, Partial<Tariff>>,
    @Inject(MAT_DIALOG_DATA) data: TariffFormDialogData
  ) {
    this.isEdit = !!data?.tariff;
    this.form = data?.tariff
      ? { ...data.tariff }
      : {
          name: '',
          type: 'FIBER',
          dataGB: 0,
          minutes: 0,
          price: 0,
          imageUrl: ''
        };
  }

  isValid(): boolean {
    return !!(
      this.form.name?.trim()
      && this.form.type
      && Number(this.form.dataGB) >= 0
      && Number(this.form.minutes) >= 0
      && Number(this.form.price) > 0
    );
  }

  save(): void {
    if (!this.isValid()) {
      return;
    }

    this.dialogRef.close({
      ...this.form,
      dataGB: Number(this.form.dataGB),
      minutes: Number(this.form.minutes),
      price: Number(this.form.price)
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
