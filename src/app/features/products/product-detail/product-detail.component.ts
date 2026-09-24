import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

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

  @ViewChild('zoomImage')
  zoomImageRef?: ElementRef<HTMLImageElement>;

  product!: Product;

  selectedImage = '';

  notFound = false;

  // Image zoom
  zoomActive = false;


  ngOnInit() {

    const id = this.route.snapshot.paramMap.get('id')!;

    this.productService.getProductById(id).subscribe({

      next: product => {

        this.product = product;

        // Show first image initially
        this.selectedImage = product.images[0];

      },

      error: () => {

        this.notFound = true;

      }

    });

  }


  // Change the main product image
  changeImage(image: string) {

    this.selectedImage = image;

    // Reset zoom when changing image
    this.zoomActive = false;

  }


  // Add product to cart
  addProductToCart() {

    this.store.dispatch(
      addToCart({
        product: this.product
      })
    );

  }


  // Buy product now
  buyNow() {

    this.store.dispatch(
      buyNow({
        product: this.product
      })
    );

  }


  // Start zoom
  onZoomEnter() {

    this.zoomActive = true;

  }


  // Stop zoom and reset image
  onZoomLeave() {

    this.zoomActive = false;

    const image = this.zoomImageRef?.nativeElement;

    if (image) {

      image.style.transform = 'scale(1)';

      image.style.transformOrigin = 'center center';

    }

  }


  // Zoom according to mouse position
  onZoomMove(event: MouseEvent) {

    const image = this.zoomImageRef?.nativeElement;

    if (!image) {
      return;
    }

    const rect = image.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;


    image.style.transformOrigin = `${x}% ${y}%`;

    image.style.transform = 'scale(2)';

  }

}