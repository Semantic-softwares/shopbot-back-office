import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent  {
  users = [
    { id: 1, name: 'User 1', status: 'active' },
    { id: 2, name: 'User 2', status: 'inactive' }
  ];
  
  currentDate = new Date();
  selectedStat = 'users';
  selectedPeriod = 'month';

  stats = {
    users: { count: 1234, trend: '+12%', icon: 'person' },
    companies: { count: 543, trend: '+5%', icon: 'business' },
    feedback: { count: 321, trend: '+8%', icon: 'handyman' },
    surveys: { count: 89, trend: '+15%', icon: 'event' }
  };

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#e2e8f0'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Growth',
      data: [65, 59, 80, 81, 56, 75],
      fill: true,
    }]
  };

  recentActivities = [
    { text: 'New user registered', time: '5 min ago', icon: 'person_add', color: '#4f46e5' },
    { text: 'New company added', time: '1 hour ago', icon: 'business', color: '#10b981' },
    { text: 'Service updated', time: '2 hours ago', icon: 'update', color: '#f59e0b' },
    { text: 'Event scheduled', time: '3 hours ago', icon: 'event', color: '#ef4444' },
  ];

  selectStat(stat: string) {
    this.selectedStat = stat;
    this.updateChartData();
  }

  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.updateChartData();
  }

  private updateChartData() {
    // Mock data update based on selected stat and period
    this.chartData = {
      labels: this.selectedPeriod === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
             this.selectedPeriod === 'month' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] :
             ['2018', '2019', '2020', '2021', '2022', '2023'],
      datasets: [{
        label: `${this.selectedStat} Growth`,
        data: Array.from({length: this.selectedPeriod === 'week' ? 7 : 6}, () => Math.floor(Math.random() * 100)),
        fill: true,
      }]
    };
  }
}
