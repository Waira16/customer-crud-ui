export interface DeviceInstallment {
  contractId: number;
  customerId: number;
  deviceId?: number;
  deviceName: string;
  monthlyInstallment: number;
  totalInstallments: number;
  remainingInstallments: number;
  startDate?: string;
  active: boolean;
}
