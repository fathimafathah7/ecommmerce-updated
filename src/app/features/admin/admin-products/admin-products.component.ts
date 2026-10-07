import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../core/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ImageCropperComponent } from '../../../shared/components/image-crop/image-cropper.component';

/**
 * Product name rules: letters and spaces only (no numbers, no symbols),
 * and at least 2 letters once trimmed.
 */
function productNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '') as string;

  if (!value) {
    return null; // "required" handles the empty case
  }

  if (!/^[\p{L}\s]+$/u.test(value)) {
    return { invalidChars: true };
  }

  if (value.trim().length < 2) {
    return { tooShort: true };
  }

  return null;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, ReactiveFormsModule, ConfirmDialogComponent, ImageCropperComponent, PaginationComponent],
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

  // Images uploaded from the computer (stored as compressed data URLs)
  images: string[] = [];                 // every image of the product (saved addresses and new uploads)
  selectedImageIndex: number | null = null;
  showImageError = false;
  uploadingImages = false;

  // Picked files wait here and are cropped one at a time
  cropQueue: File[] = [];
  currentCropFile: File | null = null;   // new file being cropped
  cropSrc: string | null = null;         // existing image being cropped
  cropIndex: number | null = null;       // which image the result replaces (null = add a new one)

  // Category suggestions dropdown
  categoryOpen = false;

  form = new FormGroup({
    name: new FormControl('', [Validators.required, productNameValidator]),
    category: new FormControl('', [Validators.required]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    stock: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    maxQuantity: new FormControl<number | null>(5, [Validators.required, Validators.min(1)]),
    rating: new FormControl<number | null>(4.5, [Validators.required, Validators.min(0), Validators.max(5)]),
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

  // ---------- Pagination ----------

  readonly pageSize = 8;
  page = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  /** Current page, never beyond the last page (e.g. after a delete or a filter). */
  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.page = page;
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
    this.images = [];
    this.selectedImageIndex = null;
    this.showImageError = false;
    this.categoryOpen = false;
    this.form.reset({
      name: '',
      category: '',
      price: null,
      stock: null,
      maxQuantity: 5,
      rating: 4.5,
      description: ''
    });
    this.showForm = true;
  }

  openEditForm(product: Product) {
    this.editingProduct = product;
    this.categoryOpen = false;

    this.images = [...product.images];
    this.selectedImageIndex = null;
    this.showImageError = false;

    this.form.setValue({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      maxQuantity: product.maxQuantity,
      rating: product.rating,
      description: product.description
    });
    this.showForm = true;
  }

  // ---------- Categories ----------

  /** Unique list of categories that already exist in the catalog. */
  get categories(): string[] {
    const unique = new Set(
      this.products
        .map(p => p.category?.trim())
        .filter((c): c is string => !!c)
    );
    return [...unique].sort((a, b) => a.localeCompare(b));
  }

  /** Categories matching what the admin has typed (all of them if empty / exact match). */
  get categorySuggestions(): string[] {
    const typed = (this.form.controls.category.value ?? '').trim().toLowerCase();
    const all = this.categories;

    if (!typed || all.some(c => c.toLowerCase() === typed)) {
      return all;
    }

    return all.filter(c => c.toLowerCase().includes(typed));
  }

  selectCategory(category: string) {
    this.form.controls.category.setValue(category);
    this.form.controls.category.markAsDirty();
    this.categoryOpen = false;
  }

  onCategoryBlur() {
    this.categoryOpen = false;
    this.form.controls.category.markAsTouched();
  }

  // ---------- Images ----------

  /** True when the product has no image at all. */
  get noImages(): boolean {
    return this.images.length === 0;
  }

  /** Keeps only real image files under 5 MB (and tells the admin what was skipped). */
  private validImages(files: File[]): File[] {

    const images = files.filter(f => f.type.startsWith('image/'));

    if (images.length !== files.length) {
      this.snackbar.warning('Only image files can be uploaded.');
    }

    const valid = images.filter(f => f.size <= 5 * 1024 * 1024);

    if (valid.length !== images.length) {
      this.snackbar.warning('Images larger than 5 MB were skipped.');
    }

    return valid;
  }

  /** "Upload" button: add one or more new images (each one is cropped first). */
  onFilesSelected(event: Event) {

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // lets the same file be picked again later

    const valid = this.validImages(files);

    if (valid.length === 0) {
      return;
    }

    this.cropIndex = null;
    this.cropQueue = valid;
    this.uploadingImages = true;
    this.showNextCrop();
  }

  /** "Replace" button: pick a new file for the selected image, then crop it. */
  onReplaceFileSelected(event: Event) {

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    const valid = this.validImages(files);

    if (valid.length === 0 || this.selectedImageIndex === null) {
      return;
    }

    this.cropIndex = this.selectedImageIndex;
    this.cropQueue = [];
    this.currentCropFile = valid[0];
  }

  private showNextCrop() {
    this.currentCropFile = this.cropQueue.shift() ?? null;

    if (!this.currentCropFile) {
      this.uploadingImages = false;
    }
  }

  get cropSubtitle(): string {
    const remaining = this.cropQueue.length;
    return remaining > 0 ? `(${remaining} more after this)` : '';
  }

  onImageCropped(dataUrl: string) {

    if (this.cropIndex !== null) {
      // Crop / replace: swap the image in the same position
      this.images = this.images.map((img, i) => i === this.cropIndex ? dataUrl : img);
    } else {
      this.images = [...this.images, dataUrl];
    }

    this.cropIndex = null;
    this.cropSrc = null;
    this.showNextCrop();
  }

  /** Cancel stops the whole upload - remaining picked images are dropped. */
  onCropCancelled() {
    this.cropQueue = [];
    this.currentCropFile = null;
    this.cropSrc = null;
    this.cropIndex = null;
    this.uploadingImages = false;
  }

  // ----- Actions on the selected thumbnail -----

  selectImage(index: number) {
    this.selectedImageIndex = this.selectedImageIndex === index ? null : index;
  }

  /** Crop the image that is already saved on the product. */
  cropSelected() {
    if (this.selectedImageIndex === null) {
      return;
    }

    this.cropIndex = this.selectedImageIndex;
    this.cropSrc = this.images[this.selectedImageIndex];
  }

  makeMain() {
    if (this.selectedImageIndex === null || this.selectedImageIndex === 0) {
      return;
    }

    const image = this.images[this.selectedImageIndex];
    this.images = [image, ...this.images.filter((_, i) => i !== this.selectedImageIndex)];
    this.selectedImageIndex = 0;
  }

  removeSelected() {
    if (this.selectedImageIndex === null) {
      return;
    }

    this.images = this.images.filter((_, i) => i !== this.selectedImageIndex);
    this.selectedImageIndex = null;
  }

  closeForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  save() {

    if (this.form.invalid || this.noImages) {
      this.form.markAllAsTouched();
      this.showImageError = this.noImages;
      return;
    }

    const value = this.form.getRawValue();
    const images = [...this.images];

    const payload = {
      name: value.name!.trim(),
      category: value.category!.trim(),
      price: value.price!,
      stock: value.stock!,
      maxQuantity: value.maxQuantity!,
      rating: value.rating!,
      images,
      description: value.description!,
      // Only new products get a date - editing keeps the original one
      ...(this.editingProduct ? {} : { createdAt: new Date().toISOString() })
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
          // Make sure the new product is visible on the first row
          this.searchTerm = '';
          this.page = 1;
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