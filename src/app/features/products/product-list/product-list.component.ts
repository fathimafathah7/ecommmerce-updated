import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadProducts } from '../../../store/products/product.action';
import { Store } from '@ngrx/store';
import { selectError, selectLoading, selectProducts } from '../../../store/products/product.selector';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [AsyncPipe, ProductCardComponent, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  products$ = this.store.select(selectProducts);
  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);

  searchTerm = '';
  selectedCategory = '';
  sortOrder = '';

  private categorySubject = new BehaviorSubject<string>('');
  private searchSubject = new BehaviorSubject<string>('');
  private sortSubject = new BehaviorSubject<string>('');

  categories$!: Observable<string[]>;
  filteredProducts$!: Observable<Product[]>;

  viewProduct(id: number | string) {
    this.router.navigate(['/products', id]);
  }

  ngOnInit() {

    this.store.dispatch(loadProducts());

    // Keep the search box in sync with the ?search= query param so a
    // navbar search, a direct link, or the in-page box all agree.
    this.route.queryParamMap.subscribe(params => {
      const term = params.get('search') ?? '';
      this.searchTerm = term;
      this.searchSubject.next(term.trim().toLowerCase());
    });

    this.categories$ = this.products$.pipe(
      map(products => Array.from(new Set(products.map(p => p.category))).sort())
    );

    this.filteredProducts$ = combineLatest([
      this.products$,
      this.searchSubject,
      this.categorySubject,
      this.sortSubject
    ]).pipe(
      map(([products, search, category, sort]) => {

        let result = products;

        if (search) {
          result = result.filter(product =>
            product.name.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search) ||
            product.description.toLowerCase().includes(search)
          );
        }

        if (category) {
          result = result.filter(product => product.category === category);
        }

        // Sort by price without mutating the original array.
        if (sort === 'low-high') {
          result = [...result].sort((a, b) => a.price - b.price);
        } else if (sort === 'high-low') {
          result = [...result].sort((a, b) => b.price - a.price);
        }

        return result;
      })
    );
  }

  onSortChange(sort: string) {
    this.sortOrder = sort;
    this.sortSubject.next(sort);
  }

  onSearchInput() {
    this.searchSubject.next(this.searchTerm.trim().toLowerCase());
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.sortOrder = '';
    this.searchSubject.next('');
    this.categorySubject.next('');
    this.sortSubject.next('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
}