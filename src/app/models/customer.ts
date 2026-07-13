export interface Customer {

  id?: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  age: number;

  complaintCount: number;

  hasLatePayments: boolean;

  churnRiskScore?: number;

  riskStatus?: string;

}