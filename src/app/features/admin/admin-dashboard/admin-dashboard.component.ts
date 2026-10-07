import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';

type RevenuePeriod = 'week' | 'month' | 'year';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  loading = true;

  productCount = 0;
  userCount = 0;
  orderCount = 0;
  totalRevenue = 0;
  lowStockCount = 0;

  recentOrders: Order[] = [];

  // Cached so switching the revenue period doesn't need a refetch.
  private allOrders: Order[] = [];

  // --- Revenue trend — line chart, with a period selector ---
  revenuePeriod: RevenuePeriod = 'week';

  revenuePeriodOptions: { value: RevenuePeriod; label: string }[] = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };

  revenueChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { autoSkip: true, maxRotation: 0 }
      },
      y: {
        beginAtZero: true,
        ticks: { callback: value => `₹${value}` }
      }
    }
  };

  // --- Sales by category — doughnut chart ---
  categoryChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: context => `₹${context.parsed} in sales`
        }
      }
    }
  };

  hasCategoryData = false;

  // --- Orders by status — separate bar chart ---
  statusChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  statusChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  ngOnInit() {

    forkJoin({
      products: this.productService.getProducts(),
      users: this.authService.getUsers(),
      orders: this.orderService.getAllOrders()
    }).subscribe({
      next: ({ products, users, orders }) => {

        this.allOrders = orders;

        this.productCount = products.length;
        this.userCount = users.length;
        this.orderCount = orders.length;
        this.lowStockCount = products.filter(p => p.stock <= 5).length;

        this.totalRevenue = orders
          .filter(order => order.status !== 'cancelled' && order.status !== 'refunded')
          .reduce((sum, order) => sum + order.total, 0);

        this.recentOrders = orders.slice(0, 5);

        this.buildRevenueChart();
        this.buildCategoryChart();
        this.buildStatusChart();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPeriodChange(period: RevenuePeriod) {
    this.revenuePeriod = period;
    this.buildRevenueChart();
  }

  /** Builds the revenue trend for whichever period is currently selected. */
  private buildRevenueChart() {

    const sellableOrders = this.allOrders.filter(order => order.status !== 'cancelled' && order.status !== 'refunded');

    if (this.revenuePeriod === 'year') {
      this.buildRevenueByMonth(sellableOrders);
    } else {
      const days = this.revenuePeriod === 'week' ? 7 : 30;
      this.buildRevenueByDay(sellableOrders, days);
    }
  }

  private buildRevenueByDay(orders: Order[], dayCount: number) {

    const days: { label: string; key: string }[] = [];

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        key: date.toDateString()
      });
    }

    const revenueByDay = new Map(days.map(d => [d.key, 0]));

    orders.forEach(order => {
      const key = new Date(order.createdAt).toDateString();
      if (revenueByDay.has(key)) {
        revenueByDay.set(key, revenueByDay.get(key)! + order.total);
      }
    });

    this.setRevenueChartData(
      days.map(d => d.label),
      days.map(d => revenueByDay.get(d.key) ?? 0)
    );
  }

  private buildRevenueByMonth(orders: Order[]) {

    const months: { label: string; key: string }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        key: `${date.getFullYear()}-${date.getMonth()}`
      });
    }

    const revenueByMonth = new Map(months.map(m => [m.key, 0]));

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (revenueByMonth.has(key)) {
        revenueByMonth.set(key, revenueByMonth.get(key)! + order.total);
      }
    });

    this.setRevenueChartData(
      months.map(m => m.label),
      months.map(m => revenueByMonth.get(m.key) ?? 0)
    );
  }

  private setRevenueChartData(labels: string[], data: number[]) {
    this.revenueChartData = {
      labels,
      datasets: [{
        data,
        label: 'Revenue',
        borderColor: '#533E2E',
        backgroundColor: 'rgba(170, 148, 127, 0.17)',
        pointBackgroundColor: '#291E0D',
        pointRadius: this.revenuePeriod === 'year' ? 3 : 2,
        fill: true,
        tension: 0.35
      }]
    };
  }

  /** Sums order-item revenue per product category, across all non-cancelled orders. */
  private buildCategoryChart() {

    const revenueByCategory = new Map<string, number>();

    this.allOrders
      .filter(order => order.status !== 'cancelled' && order.status !== 'refunded')
      .forEach(order => {
        order.items.forEach(item => {
          const category = item.product.category;
          const revenue = item.product.price * item.quantity;
          revenueByCategory.set(category, (revenueByCategory.get(category) ?? 0) + revenue);
        });
      });

    const entries = Array.from(revenueByCategory.entries())
      .sort((a, b) => b[1] - a[1]); // largest category first

    this.hasCategoryData = entries.length > 0;

    const palette = ['#49301b', '#7c4712c6', '#cda973e3', '#d0c3a9e9', '#9333EA', '#F3C4D3', '#765662', '#D24F82'];

    this.categoryChartData = {
      labels: entries.map(([category]) => category),
      datasets: [{
        data: entries.map(([, revenue]) => revenue),
        backgroundColor: entries.map((_, i) => palette[i % palette.length])
      }]
    };
  }

  
  private buildStatusChart() {

    const statuses: Order['status'][] = [
      'placed', 'processing', 'shipped', 'delivered', 'cancelled',
      'return requested', 'returned', 'refunded'
    ];
    const colors = [
      '#F3C4D3', '#F59E0B', '#3B82F6', '#16A34A', '#DC2626',
      '#F97316', '#8B5CF6', '#64748B'
    ];
    const counts = statuses.map(
      status => this.allOrders.filter(o => o.status === status).length
    );

    this.statusChartData = {
      labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [{
        data: counts,
        backgroundColor: colors
      }]
    };
  }

  statusBadgeClass(status: Order['status']): string {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-700';
      case 'shipped': return 'bg-blue-50 text-blue-700';
      case 'processing': return 'bg-amber-50 text-amber-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      
      case 'return requested': return 'bg-orange-50 text-orange-700';
      case 'returned': return 'bg-purple-50 text-purple-700';
      case 'refunded': return 'bg-slate-100 text-slate-700';
 
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}