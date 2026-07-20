export type DeviceCategory =
  | 'PHONE'
  | 'TABLET'
  | 'HEADPHONE'
  | 'LAPTOP'
  | 'DESKTOP'
  | 'WEARABLE';

export interface Device {
  id: number;
  name: string;
  brand: string;
  category: DeviceCategory;
  price: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  stock?: number;
}

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  PHONE: 'Telefon',
  TABLET: 'Tablet',
  HEADPHONE: 'Kulaklık',
  LAPTOP: 'Laptop',
  DESKTOP: 'Masaüstü PC',
  WEARABLE: 'Giyilebilir'
};
