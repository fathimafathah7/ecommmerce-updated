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

export interface Order {
  id?: number | string;
  orderNumber?: number;
  userId: number | string;
  items: CartItem[];
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