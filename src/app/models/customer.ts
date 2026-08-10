import { Commitment } from './commitment';

export interface CustomerTariff {

  id:number;

  tariff:any;

  startDate:string;

  active:boolean;

}



export interface CustomerAddon {

  id:number;

  addonPackage:any;

  startDate:string;

  active:boolean;

}



export interface Customer {


  id:number;


  firstName:string;


  lastName:string;


  email:string;


  phone:string;


  age:number;


  complaintCount:number;


  hasLatePayments:boolean;


  churnRiskScore:number;


  riskStatus:'HIGH' | 'MEDIUM' | 'LOW';



  paymentType:'PREPAID' | 'POSTPAID';


  balance:number;


  status:'ACTIVE' | 'SUSPENDED';

  loyaltyDiscountPercent?: number;


  contractStartDate?:string;


  contractDuration?:number;


  commitment?: Commitment;


  tariffs?:CustomerTariff[];


  addons?:CustomerAddon[];


}
