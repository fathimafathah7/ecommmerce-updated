import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {

  total = input.required<number>();
  pageSize = input.required<number>();
  page = input.required<number>();
  label = input<string>('items');

  pageChange = output<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize()));
  }

  get from(): number {
    return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1;
  }

  get to(): number {
    return Math.min(this.page() * this.pageSize(), this.total());
  }

  
  get pages(): (number | '…')[] {

    const last = this.totalPages;
    const current = this.page();

    const numbers = new Set<number>([1, last, current - 1, current, current + 1]);

    const sorted = [...numbers]
      .filter(n => n >= 1 && n <= last)
      .sort((a, b) => a - b);

    const result: (number | '…')[] = [];

    sorted.forEach((n, index) => {
      if (index > 0 && n - sorted[index - 1] > 1) {
        result.push('…');
      }
      result.push(n);
    });

    return result;
  }

  go(page: number) {
    if (page < 1 || page > this.totalPages || page === this.page()) {
      return;
    }
    this.pageChange.emit(page);
  }
}