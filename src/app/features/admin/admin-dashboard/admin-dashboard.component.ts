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

  // --- Revenue trend (last 7 days) — line chart ---
  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };

  revenueChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: value => `₹${value}` }
      }
    }
  };

  // --- Orders by status — doughnut chart ---
  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnInit() {

    forkJoin({
      products: this.productService.getProducts(),
      users: this.authService.getUsers(),
      orders: this.orderService.getAllOrders()
    }).subscribe({
      next: ({ products, users, orders }) => {

        this.productCount = products.length;
        this.userCount = users.length;
        this.orderCount = orders.length;
        this.lowStockCount = products.filter(p => p.stock <= 5).length;

        this.totalRevenue = orders
          .filter(order => order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.total, 0);

        this.recentOrders = orders.slice(0, 5);

        this.buildRevenueChart(orders);
        this.buildStatusChart(orders);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /** Sums revenue per day for the last 7 days (cancelled orders excluded). */
  private buildRevenueChart(orders: Order[]) {

    const days: { label: string; key: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        key: date.toDateString()
      });
    }

    const revenueByDay = new Map(days.map(d => [d.key, 0]));

    orders
      .filter(order => order.status !== 'cancelled')
      .forEach(order => {
        const key = new Date(order.createdAt).toDateString();
        if (revenueByDay.has(key)) {
          revenueByDay.set(key, revenueByDay.get(key)! + order.total);
        }
      });

    this.revenueChartData = {
      labels: days.map(d => d.label),
      datasets: [{
        data: days.map(d => revenueByDay.get(d.key) ?? 0),
        label: 'Revenue',
        borderColor: '#6B4F3A',
        backgroundColor: 'rgba(107, 79, 58, 0.10)',
        pointBackgroundColor: '#6B4F3A',
        fill: true,
        tension: 0.35
      }]
    };
  }

  /** Counts orders per status for the doughnut chart. */
  private buildStatusChart(orders: Order[]) {

    const statuses: Order['status'][] = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const colors = [ '#cca274',
        '#a87e53',
        '#6a4e36',
        '#3d281a',
        '#b8aa9c'];

    const counts = statuses.map(
      status => orders.filter(o => o.status === status).length
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
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}