import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';

import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { WishlistButtonComponent } from '../../../shared/components/wishlist-button/wishlist-button.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { addToCart,buyNow } from '../../../store/cart/cart.action';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    WishlistButtonComponent,
    ProductCardComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private  store=inject(Store)
  
  product!: Product;

  relatedProducts$!: Observable<Product[]>;

  selectedImage = '';
  zoomActive = false;
  notFound = false;

  @ViewChild('zoomImage')
  zoomImage!: ElementRef<HTMLImageElement>;


  ngOnInit() {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.productService.getProductById(id).subscribe({
      next: product => {

        this.product = product;
        this.selectedImage = product.images[0];

        this.loadRelatedProducts();

      },

      error: () => {
        this.notFound = true;
      }
    });

  }


  loadRelatedProducts() {

    this.productService.getProducts().subscribe(products => {

      const related = products
        .filter(product =>
          product.category === this.product.category &&
          product.id !== this.product.id
        )
        .slice(0, 4);

          this.relatedProducts$ = of(related);

    });

  }


  changeImage(image: string) {
    this.selectedImage = image;
  }


  onZoomEnter() {
    this.zoomActive = true;
  }


  onZoomLeave() {

    this.zoomActive = false;

    if (this.zoomImage) {
      this.zoomImage.nativeElement.style.transform = 'scale(1)';
    }

  }


  onZoomMove(event: MouseEvent) {

    if (!this.zoomImage) {
      return;
    }

    const image = this.zoomImage.nativeElement;

    const rect = image.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    image.style.transformOrigin = `${x}% ${y}%`;
    image.style.transform = 'scale(1.6)';

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
  

}