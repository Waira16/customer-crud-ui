import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TariffService, Tariff } from '../../services/tariff';



@Component({

selector:'app-tariffs',

standalone:true,

imports:[
 CommonModule
],

templateUrl:'./tariffs.html',

styleUrl:'./tariffs.css'

})


export class TariffsComponent implements OnInit {


tariffs:Tariff[]=[];



constructor(
 private tariffService:TariffService
){}




ngOnInit(){


 this.tariffService.tariffs$

 .subscribe(data=>{


   console.log(
    "COMPONENT TARİFE:",
    data
   );


   this.tariffs=data;


 });



}



}