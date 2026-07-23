import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { BaseChartDirective } from 'ng2-charts';

import {
  ChartConfiguration,
  ChartData
} from 'chart.js';

import { addIcons } from 'ionicons';

import {
  checkboxOutline,
  gridOutline,
  peopleOutline
} from 'ionicons/icons';

import {
  DashboardSummary,
  ReportService,
  WeeklyProgress,
  UpcomingTask
} from '../../services/report';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    BaseChartDirective
  ]
})
export class DashboardPage implements OnInit {

  private readonly reportService =
    inject(ReportService);

  private readonly router =
    inject(Router);
  
  upcomingTasks: UpcomingTask[] = [];

  summary: DashboardSummary | null = null;

  weeklyProgress: WeeklyProgress[] = [];

  isLoading = false;

  errorMessage = '';

  readonly doughnutChartType = 'doughnut' as const;

  readonly lineChartType = 'line' as const;

  doughnutChartData: ChartData<'doughnut'> = {
    labels: [
      'Yapılacaklar',
      'Devam Ediyor',
      'Tamamlandı',
      'Geciken'
    ],
    datasets: [
      {
        data: [0, 0, 0, 0],

        backgroundColor: [
          '#8c8c94',
          '#4f8cff',
          '#57c785',
          '#ff7452'
        ],

        borderColor: '#1d1d20',

        borderWidth: 5,

        hoverOffset: 6
      }
    ]
  };

  readonly doughnutChartOptions:
    ChartConfiguration<'doughnut'>['options'] = {
      responsive: true,

      maintainAspectRatio: false,

      cutout: '70%',

      plugins: {
        legend: {
          position: 'bottom',

          labels: {
            color: '#d5d5da',

            padding: 18,

            usePointStyle: true,

            pointStyle: 'circle',

            font: {
              size: 12,
              weight: 600
            }
          }
        },

        tooltip: {
          callbacks: {
            label: (context) => {
              const label =
                context.label ?? 'Görev';

              return `${label}: ${context.raw}`;
            }
          }
        }
      }
    };

  lineChartData: ChartData<'line'> = {
    labels: [],

    datasets: [
      {
        label: 'Oluşturulan',

        data: [],

        tension: 0.4,

        fill: false,

        borderWidth: 3,

        pointRadius: 4,

        pointHoverRadius: 6
      },

      {
        label: 'Tamamlanan',

        data: [],

        tension: 0.4,

        fill: false,

        borderWidth: 3,

        pointRadius: 4,

        pointHoverRadius: 6
      }
    ]
  };

  readonly lineChartOptions:
    ChartConfiguration<'line'>['options'] = {
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {
        x: {
          ticks: {
            color: '#a1a1a8'
          },

          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },

        y: {
          beginAtZero: true,

          ticks: {
            color: '#a1a1a8',

            precision: 0,

            stepSize: 1
          },

          grid: {
            color: 'rgba(255, 255, 255, 0.08)'
          }
        }
      },

      plugins: {
        legend: {
          position: 'bottom',

          labels: {
            color: '#d5d5da',

            padding: 18,

            usePointStyle: true,

            pointStyle: 'circle',

            font: {
              size: 12,
              weight: 600
            }
          }
        },

        tooltip: {
          callbacks: {
            label: (context) => {
              const label =
                context.dataset.label ?? 'Görev';

              return `${label}: ${context.parsed.y}`;
            }
          }
        }
      }
    };

  constructor() {
    addIcons({
      checkboxOutline,
      gridOutline,
      peopleOutline
    });
  }

  ngOnInit(): void {
    this.loadDashboardSummary();
    this.loadWeeklyProgress();
    this.loadUpcomingTasks();
  }

  loadUpcomingTasks(): void {

  this.reportService
    .getUpcomingDeadlines()
    .subscribe({

      next: (tasks) => {

        this.upcomingTasks = tasks;

      },

      error: (error) => {

        console.error(
          'Yaklaşan görevler alınamadı',
          error
        );

      }

    });

}

  loadDashboardSummary(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reportService
      .getDashboardSummary()
      .subscribe({
        next: (response) => {
          this.summary = response;

          this.updateDoughnutChart(response);

          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Dashboard bilgileri yüklenemedi:',
            error
          );

          this.errorMessage =
            'Dashboard bilgileri yüklenirken bir hata oluştu.';

          this.isLoading = false;
        }
      });
  }

  loadWeeklyProgress(): void {
    this.reportService
      .getWeeklyProgress()
      .subscribe({
        next: (response) => {
          this.weeklyProgress = response;

          this.updateLineChart(response);
        },

        error: (error: unknown) => {
          console.error(
            'Haftalık ilerleme bilgileri yüklenemedi:',
            error
          );
        }
      });
  }

  openTeams(): void {
    this.router.navigate([
      '/teams'
    ]);
  }

  openTasks(): void {
    this.router.navigate([
      '/tasks'
    ]);
  }

  openReports(): void {
    this.router.navigate([
      '/dashboard'
    ]);
  }

  private updateDoughnutChart(
    summary: DashboardSummary
  ): void {
    this.doughnutChartData = {
      ...this.doughnutChartData,

      datasets: [
        {
          ...this.doughnutChartData.datasets[0],

          data: [
            summary.todoTasks,
            summary.inProgressTasks,
            summary.completedTasks,
            summary.overdueTasks
          ]
        }
      ]
    };
  }

  private updateLineChart(
    progress: WeeklyProgress[]
  ): void {
    this.lineChartData = {
      labels: progress.map(item => item.day),

      datasets: [
        {
          ...this.lineChartData.datasets[0],

          data: progress.map(
            item => item.createdTasks
          )
        },

        {
          ...this.lineChartData.datasets[1],

          data: progress.map(
            item => item.completedTasks
          )
        }
      ]
    };
  }
openTaskFilter(
  filter:
    | 'all'
    | 'pending'
    | 'inProgress'
    | 'completed'
    | 'overdue'
    | 'upcoming'
): void {
  this.router.navigate(
    ['/tasks'],
    {
      queryParams: {
        filter
      }
    }
  );
}

openUpcomingTask(
  task: UpcomingTask
): void {
  if (!task.id) {
    return;
  }

  this.router.navigate([
    '/tasks'
  ], {
    queryParams: {
      taskId: task.id
    }
  });
}
getRemainingDaysLabel(
  remainingDays: number
): string {
  if (remainingDays === 0) {
    return 'Bugün';
  }

  if (remainingDays === 1) {
    return 'Yarın';
  }

  return `${remainingDays} gün kaldı`;
}

trackByUpcomingTaskId(
  index: number,
  task: UpcomingTask
): number {
  return task.id;
}
}