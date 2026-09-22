import { Product } from './product.model';

export interface CartItem {
  id?: number | string;
  userId?: number | string;
  product: Product;
  quantity: number;
}
