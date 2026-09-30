import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../products/product-card/product-card.component';
import { loadProducts } from '../../store/products/product.action';
import { selectLoading, selectProducts } from '../../store/products/product.selector';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, FooterComponent, ProductCardComponent, AsyncPipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);

  loading$ = this.store.select(selectLoading);

  // Top 8 products by rating (copy first so the store array isn't mutated).
  featuredProducts$ = this.store.select(selectProducts).pipe(
    map(products =>
      [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
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

  /** Scrolls the row by one "page" (the width of the visible area). */
  scrollRow(row: HTMLElement, direction: 1 | -1) {
    row.scrollBy({ left: direction * row.clientWidth, behavior: 'smooth' });
  }

  /** Keeps the arrow buttons enabled/disabled in sync with the scroll position. */
  onRowScroll(row: HTMLElement) {
    this.canScrollLeft = row.scrollLeft > 4;
    this.canScrollRight = row.scrollLeft + row.clientWidth < row.scrollWidth - 4;
  }
}