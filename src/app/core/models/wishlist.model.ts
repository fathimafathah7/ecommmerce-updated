import { Product } from './product.model';

export interface WishlistItem {
  id?: number | string;
  userId?: number | string;
  product: Product;
}
