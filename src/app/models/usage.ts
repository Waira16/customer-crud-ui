export type UsageType = 'DATA' | 'VOICE' | 'SMS';

export interface UsageSimulateRequest {
  customerId: number;
  customerPhone?: string;
  type?: UsageType;
}

export interface UsageSimulateResponse {
  recordId: number;
  customerId: number;
  type: UsageType;
  dataMb: number;
  voiceMinutes: number;
  quotaExceeded: boolean;
  message: string;
}

export interface HourlyUsagePoint {
  hour: number;
  dataMb: number;
  voiceMinutes: number;
  smsCount: number;
}

export interface DailyUsageSummary {
  customerId: number;
  date: string;
  totalDataMb: number;
  totalVoiceMinutes: number;
  totalSmsCount: number;
  hourlyBreakdown: HourlyUsagePoint[];
}
