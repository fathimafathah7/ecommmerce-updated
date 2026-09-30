import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../core/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService);
  private snackbar = inject(SnackbarService);

  products: Product[] = [];
  loading = true;
  searchTerm = '';

  showForm = false;
  editingProduct: Product | null = null;
  saving = false;

  productPendingDelete: Product | null = null;

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    category: new FormControl('', [Validators.required]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    stock: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    maxQuantity: new FormControl<number | null>(5, [Validators.required, Validators.min(1)]),
    rating: new FormControl<number | null>(4.5, [Validators.required, Validators.min(0), Validators.max(5)]),
    imagesText: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Could not load products.');
      }
    });
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.products;
    }
    return this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  openAddForm() {
    this.editingProduct = null;
    this.form.reset({
      name: '',
      category: '',
      price: null,
      stock: null,
      maxQuantity: 5,
      rating: 4.5,
      imagesText: '',
      description: ''
    });
    this.showForm = true;
  }

  openEditForm(product: Product) {
    this.editingProduct = product;
    this.form.setValue({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      maxQuantity: product.maxQuantity,
      rating: product.rating,
      imagesText: product.images.join('\n'),
      description: product.description
    });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  save() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const images = value.imagesText!
  .split('\n')
  .map(url => url.trim())
  .filter(url => url.length > 0);

    const payload = {
      name: value.name!,
      category: value.category!,
      price: value.price!,
      stock: value.stock!,
      maxQuantity: value.maxQuantity!,
      rating: value.rating!,
      images,
      description: value.description!
    };

    this.saving = true;

    const request = this.editingProduct
      ? this.productService.updateProduct(this.editingProduct.id, payload)
      : this.productService.addProduct(payload);

    request.subscribe({
      next: saved => {

        if (this.editingProduct) {
          this.products = this.products.map(p => p.id === saved.id ? saved : p);
          this.snackbar.success('Product updated.');
        } else {
          this.products = [saved, ...this.products];
          this.snackbar.success('Product added.');
        }

        this.saving = false;
        this.closeForm();
      },
      error: () => {
        this.saving = false;
        this.snackbar.error('Could not save the product. Please try again.');
      }
    });
  }

  askDelete(product: Product) {
    this.productPendingDelete = product;
  }

  cancelDelete() {
    this.productPendingDelete = null;
  }

  confirmDelete() {

    if (!this.productPendingDelete) {
      return;
    }

    const id = this.productPendingDelete.id;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.snackbar.info('Product deleted.');
        this.productPendingDelete = null;
      },
      error: () => {
        this.snackbar.error('Could not delete the product.');
        this.productPendingDelete = null;
      }
    });
  }
}