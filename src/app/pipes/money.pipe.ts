import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney } from '../utils/money.util';

@Pipe({
  name: 'money',
  standalone: true
})
export class MoneyPipe implements PipeTransform {

  transform(value: number | null | undefined): string {
    return formatMoney(value);
  }

}
