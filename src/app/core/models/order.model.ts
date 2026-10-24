import { CartItem } from './cart.model';
import { Address } from './address.model';

export type PaymentMethod = 'cod' | 'card' | 'upi';

/**
 * placed -> processing -> shipped -> delivered
 * cancelled        : cancelled by the customer (or admin) before shipping
 * return requested : customer asked to return a delivered order
 * returned         : admin received the returned item
 * refunded         : money given back - the order is closed
 */
export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return requested'
  | 'returned'
  | 'refunded';

/** Status of ONE product inside an order. "active" = nothing special happened to it. */
export type ItemStatus =
  | 'active'
  | 'cancelled'
  | 'return requested'
  | 'returned'
  | 'refunded';

/** A product line of an order. The extra fields are only filled after a cancel / return. */
export interface OrderItem extends CartItem {
  itemStatus?: ItemStatus;
  itemReason?: string;
  itemUpdatedAt?: string;
}

export interface Order {
  id?: number | string;
  orderNumber?: number;
  userId: number | string;
  items: OrderItem[];
  address: Address;
  paymentMethod: PaymentMethod;
  total: number;
  status: OrderStatus;
  createdAt: string;
  cancelReason?: string;
  cancelledAt?: string;
  returnReason?: string;
  returnRequestedAt?: string;
}

const RETURN_STATES: ItemStatus[] = ['return requested', 'returned', 'refunded'];

/**
 * Status of one product line.
 * Orders saved before item tracking had a single status for everything,
 * so for those the order's status is used.
 */
export function itemStatusOf(order: Order, item: OrderItem): ItemStatus {

  if (item.itemStatus) {
    return item.itemStatus;
  }

  switch (order.status) {
    case 'cancelled':
    case 'return requested':
    case 'returned':
    case 'refunded':
      return order.status;
    default:
      return 'active';
  }
}

/**
 * Overall order status after an item changed:
 *  - every item cancelled                  -> cancelled
 *  - every remaining item is being returned -> return requested / returned / refunded
 *  - otherwise the order keeps its normal status (partial returns stay "delivered")
 */
export function deriveOrderStatus(order: Order): OrderStatus {

  const live = order.items
    .map(item => itemStatusOf(order, item))
    .filter(status => status !== 'cancelled');

  if (live.length === 0) {
    return 'cancelled';
  }

  if (live.every(status => RETURN_STATES.includes(status))) {

    if (live.every(status => status === 'refunded')) {
      return 'refunded';
    }

    if (live.every(status => status === 'returned' || status === 'refunded')) {
      return 'returned';
    }

    return 'return requested';
  }

  return RETURN_STATES.includes(order.status as ItemStatus) ? 'delivered' : order.status;
}

/** Money that no longer counts: cancelled and refunded items. */
export function removedAmount(order: Order): number {
  return order.items
    .filter(item => {
      const status = itemStatusOf(order, item);
      return status === 'cancelled' || status === 'refunded';
    })
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

/** Order total after cancelled / refunded items are taken out. */
export function orderNetTotal(order: Order): number {
  return Math.max(0, order.total - removedAmount(order));
}