import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

import { Store } from '@ngrx/store';
import { addToCart, buyNow } from '../../../store/cart/cart.action';
import { WishlistButtonComponent } from '../../../shared/components/wishlist-button/wishlist-button.component';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, WishlistButtonComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private store = inject(Store);

  @ViewChild('zoomImage') zoomImageRef?: ElementRef<HTMLImageElement>;

  product!: Product;
  notFound = false;

  // --- Image zoom (magnifier) state ---
  zoomActive = false;
  zoomBackgroundPosition = '0% 0%';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.productService.getProductById(id).subscribe({
      next: product => {
        this.product = product;
      },
      error: () => {
        this.notFound = true;
      }
    });
  }

  addProductToCart() {
    this.store.dispatch(
      addToCart({ product: this.product })
    );
  }

  buyNow() {
    this.store.dispatch(
      buyNow({ product: this.product })
    );
  }

  // --- Image zoom handlers ---
  onZoomEnter() {
    this.zoomActive = true;
  }

  onZoomLeave() {
    this.zoomActive = false;
  }

  onZoomMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.zoomBackgroundPosition = `${x}% ${y}%`;
  }
}
