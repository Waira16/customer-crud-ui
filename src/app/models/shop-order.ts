export type ShopOrderItemType = 'TARIFF' | 'ADDON' | 'DEVICE';

export interface ShopOrderItem {
  id: number;
  itemType: ShopOrderItemType;
  itemId: number;
  itemName: string;
  itemBrand?: string;
  itemCategory?: string;
  price: number;
  imageUrl?: string;
}

export interface ShopOrder {
  id: number;
  orderDate: string;
  totalAmount: number;
  items: ShopOrderItem[];
}
