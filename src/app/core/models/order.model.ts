import { CartItem } from './cart.model';
import { Address } from './address.model';

export type PaymentMethod = 'cod' | 'card' | 'upi';

export interface Order {
  id?: number | string;
  userId: number | string;
  items: CartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
  total: number;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}
