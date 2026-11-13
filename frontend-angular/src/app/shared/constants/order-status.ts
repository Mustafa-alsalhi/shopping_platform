export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن / في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي'
};

export const DRIVER_STATUS_LABELS: Record<string, string> = {
  assigned: 'تم إسناد مندوب',
  picked_up_from_seller: 'استلم المندوب الطلب من المتجر',
  out_for_delivery: 'المندوب في الطريق إليك',
  delivered: 'تم التسليم'
};

