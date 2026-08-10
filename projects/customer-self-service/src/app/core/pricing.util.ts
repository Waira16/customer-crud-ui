export interface SpecialOffer {
  id?: number;
  targetType: 'TARIFF' | 'ADDON' | 'DEVICE' | string;
  targetId: number;
  specialPrice: number;
}

export interface PricedItem {
  originalPrice: number;
  price: number;
  discounted: boolean;
  discountLabel: string;
}

/**
 * Pahali urunlerde ayni sadakat oranini birebir uygulamamak icin
 * liste fiyatina gore efektif yuzdeyi dusurur.
 */
export function effectiveLoyaltyPercent(
  loyaltyDiscountPercent: number,
  listPrice: number,
  targetType: string
): number {
  const base = Math.max(0, Math.min(50, Number(loyaltyDiscountPercent) || 0));
  if (base <= 0) {
    return 0;
  }

  const type = (targetType || '').toUpperCase();
  // Tarife / ek paket: aylik ucuz kalemler, tam oran
  if (type === 'TARIFF' || type === 'ADDON') {
    return base;
  }

  const price = Number(listPrice) || 0;
  let factor = 1;
  let cap = base;

  if (price >= 60000) {
    factor = 0.25;
    cap = 5;
  } else if (price >= 35000) {
    factor = 0.35;
    cap = 7;
  } else if (price >= 15000) {
    factor = 0.5;
    cap = 10;
  } else if (price >= 5000) {
    factor = 0.7;
    cap = 14;
  } else {
    factor = 1;
    cap = Math.min(20, base);
  }

  return Math.max(0, Math.min(cap, Math.round(base * factor)));
}

/** Katalog fiyatina sadakat + urun ozel teklif uygular. */
export function resolveCustomerPrice(
  listPrice: number,
  targetType: string,
  targetId: number | null | undefined,
  loyaltyDiscountPercent = 0,
  specialOffers: SpecialOffer[] = []
): PricedItem {
  const original = Number(listPrice) || 0;
  const offer = specialOffers.find(
    (item) => item.targetType === targetType && Number(item.targetId) === Number(targetId)
  );

  if (offer && offer.specialPrice != null) {
    const special = Number(offer.specialPrice);
    return {
      originalPrice: original,
      price: special,
      discounted: special < original,
      discountLabel: special < original ? 'Sana özel' : ''
    };
  }

  const percent = effectiveLoyaltyPercent(loyaltyDiscountPercent, original, targetType);
  if (percent <= 0) {
    return {
      originalPrice: original,
      price: original,
      discounted: false,
      discountLabel: ''
    };
  }

  const discounted = Math.round((original * (100 - percent)) * 100) / 10000;
  return {
    originalPrice: original,
    price: discounted,
    discounted: true,
    discountLabel: `%${percent} sadakat`
  };
}
