import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../products/product-card/product-card.component';
import { loadProducts } from '../../store/products/product.action';
import { selectLoading, selectProducts } from '../../store/products/product.selector';
import { RevealOnScrollDirective } from '../../shared/components/scroll-directive/reveal-on-scroll.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, FooterComponent, ProductCardComponent, AsyncPipe,RevealOnScrollDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);

  loading$ = this.store.select(selectLoading);

  
  featuredProducts$ = this.store.select(selectProducts).pipe(
    map(products =>
      [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
    )
  );
   readonly categoryNames = [
    'Remote Control',
    'Plush & Cuddly',
    'Learn & Play',
    'Build & Create'
  ];
 
  categories$ = this.store.select(selectProducts).pipe(
    map(products =>
      this.categoryNames
        .map(name => {
          const items = products.filter(p => p.category === name);
          const cover = [...items].sort((a, b) => b.rating - a.rating)[0];
 
          return {
            name,
            count: items.length,
            image: cover?.images?.[0] ?? ''
          };
        })
        .filter(category => category.count > 0)
    )
  );

  // Arrow button state for the horizontal row.
  canScrollLeft = false;
  canScrollRight = true;

  ngOnInit() {
    this.store.dispatch(loadProducts());
  }

  viewProduct(id: number | string) {
    this.router.navigate(['/products', id]);
  }

  scrollRow(row: HTMLElement, direction: 1 | -1) {
    row.scrollBy({ left: direction * row.clientWidth, behavior: 'smooth' });
  }

  onRowScroll(row: HTMLElement) {
    this.canScrollLeft = row.scrollLeft > 4;
    this.canScrollRight = row.scrollLeft + row.clientWidth < row.scrollWidth - 4;
  }
}