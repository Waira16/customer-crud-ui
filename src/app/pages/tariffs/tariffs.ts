import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { TariffService, Tariff } from '../../services/tariff';
import { AddonService } from '../../services/addon.service';
import { AddonPackage } from '../../models/addon-package';
import { MoneyPipe } from '../../pipes/money.pipe';



@Component({

selector:'app-tariffs',

standalone:true,

imports:[
 CommonModule,
 MoneyPipe
],

templateUrl:'./tariffs.html',

styleUrl:'./tariffs.css'

})


export class TariffsComponent implements OnInit {


tariffs:Tariff[]=[];

addons:AddonPackage[]=[];

isLoading = true;

loadError = '';



constructor(
 private tariffService:TariffService,
 private addonService:AddonService,
 private cdr: ChangeDetectorRef
){}




ngOnInit(){

 this.loadPageData();

}



loadPageData(): void {

 this.isLoading = true;
 this.loadError = '';

 forkJoin({
   tariffs: this.tariffService.fetchTariffs(),
   addons: this.addonService.fetchAddons()
 }).subscribe({
   next: ({ tariffs, addons }) => {
     this.tariffs = tariffs ?? [];
     this.addons = addons ?? [];
     this.isLoading = false;
     this.cdr.detectChanges();
   },
   error: (err) => {
     console.error('Tarife/ek paket yukleme hatasi', err);
     this.tariffs = [];
     this.addons = [];
     this.isLoading = false;
     this.loadError = 'Veriler yuklenemedi. Lutfen sayfayi yenileyin.';
     this.cdr.detectChanges();
   }
 });

}



getStreamingAddons(): AddonPackage[] {

  return this.addons.filter(
    addon => addon.type === 'STREAMING'
  );

}


getOtherAddons(): AddonPackage[] {

  return this.addons.filter(
    addon => addon.type !== 'STREAMING'
  );

}



}
