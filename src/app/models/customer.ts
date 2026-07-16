import { Tariff } from './tariff';


export interface Customer {

  id: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  age: number;

  complaintCount: number;

  hasLatePayments: boolean;

  churnRiskScore: number;

  riskStatus: 'HIGH' | 'MEDIUM' | 'LOW';

  tariff: Tariff;

}