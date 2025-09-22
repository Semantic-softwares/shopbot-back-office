import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { 
  AnalyticsService, 
  DashboardStats, 
  RecentActivity,
  OccupancyTrend,
  RevenueTrend
} from '../../../shared/services/analytics.service';
import { StoreStore } from '../../../shared/stores/store.store';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    BaseChartDirective,
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private destroy$ = new Subject<void>();
  private storeStore = inject(StoreStore);

  // Computed values
  get currency() {
    return this.storeStore.selectedStore()?.currencyCode || this.storeStore.selectedStore()?.currency || '$';
  }

  get defaultValue() {
    return '0';
  }

  // Signals for reactive data
  dashboardStats = signal<DashboardStats | null>(null);
  recentActivities = signal<RecentActivity[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date>(new Date());

  // Chart configurations
  occupancyChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [{
      data: [],
      label: 'Occupancy Rate (%)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  });

  occupancyChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  revenueChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{
      data: [],
      label: 'Daily Revenue',
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1
    }]
  });

  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return this.currency + value;
          }
        }
      }
    }
  };

  ngOnInit() {
    // Subscribe to analytics service observables
    this.analyticsService.dashboardStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.dashboardStats.set(stats);
        if (stats) {
          this.lastUpdated.set(stats.lastUpdated);
        }
      });

    this.analyticsService.recentActivities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.recentActivities.set(activities);
      });

    this.analyticsService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading.set(loading);
      });

    this.analyticsService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error.set(error);
      });

    // Load initial data
    this.refreshData();
    this.loadChartData();
  }

  private loadChartData() {
    // Load occupancy trend
    this.analyticsService.getOccupancyTrend(7)
      .pipe(takeUntil(this.destroy$))
      .subscribe(trends => {
        this.occupancyChartData.set({
          labels: trends.map(t => new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })),
          datasets: [{
            data: trends.map(t => t.occupancyRate),
            label: 'Occupancy Rate (%)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        });
      });

    // Load revenue trend
    this.analyticsService.getRevenueTrend(7)
      .pipe(takeUntil(this.destroy$))
      .subscribe(trends => {
        this.revenueChartData.set({
          labels: trends.map(t => new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })),
          datasets: [{
            data: trends.map(t => t.revenue),
            label: `Daily Revenue (${this.currency})`,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          }]
        });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshData() {
    this.analyticsService.refreshData();
    this.loadChartData();
  }

  clearError() {
    this.analyticsService.clearError();
  }

  navigateTo(path: string) {
    this.router.navigate([path], { relativeTo: this.router.routerState.root });
  }
}