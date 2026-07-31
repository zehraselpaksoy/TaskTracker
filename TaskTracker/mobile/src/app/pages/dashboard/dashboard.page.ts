import {
  CommonModule,
  registerLocaleData
} from '@angular/common';

import localeTr from '@angular/common/locales/tr';
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
  UpcomingTask,
  OverdueTask
} from '../../services/report';
registerLocaleData(localeTr);
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
  overdueTasks: OverdueTask[] = [];

isOverdueModalOpen = false;

isOverdueTasksLoading = false;

overdueTasksError = '';
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
    ],
    datasets: [
      {
        data: [0, 0, 0],

        backgroundColor: [
  '#ffab00',
  '#4f8cff',
  '#57c785'
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
   
  }
ionViewWillEnter(): void {
  this.isOverdueModalOpen = false;

  this.loadDashboardSummary();
  this.loadWeeklyProgress();
  this.loadUpcomingTasks();
}
loadOverdueTasks(): void {
 
  this.isOverdueTasksLoading =
    this.overdueTasks.length === 0;

  this.overdueTasksError = '';

  this.reportService
    .getOverdueTasks()
    .subscribe({
      next: tasks => {
        this.overdueTasks =
          tasks ?? [];

        this.isOverdueTasksLoading =
          false;
      },

      error: error => {
        console.error(
          'Geciken görevler alınamadı:',
          error
        );

        this.isOverdueTasksLoading =
          false;

        /*
         * Eski liste varsa onu silme.
         */
        if (
          this.overdueTasks.length === 0
        ) {
          this.overdueTasksError =
            'Geciken görevler yüklenemedi.';
        }
      }
    });
}
openOverdueModal(): void {
  this.isOverdueModalOpen = true;
}

closeOverdueModal(): void {
  this.isOverdueModalOpen = false;
}

openOverdueTask(
  task: OverdueTask
): void {
  this.closeOverdueModal();

  void this.router.navigate([
    '/teams',
    task.teamId,
    'tasks',
    task.id
  ]);
}

getPriorityLabel(
  priority: string
): string {
  const value =
    priority
      .trim()
      .toLocaleLowerCase('tr-TR');

  if (
    value === 'high' ||
    value === 'yüksek' ||
    value === 'yuksek' ||
    value === '2'
  ) {
    return 'Yüksek';
  }

  if (
    value === 'low' ||
    value === 'düşük' ||
    value === 'dusuk' ||
    value === '0'
  ) {
    return 'Düşük';
  }

  return 'Orta';
}

trackByOverdueTaskId(
  index: number,
  task: OverdueTask
): number {
  return task.id;
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
      next: response => {
        this.summary = response;

        /*
         * Yeni dizi oluşturarak Angular'ın
         * bütün modal satırlarını yenilemesini sağlar.
         */
        this.overdueTasks = [
          ...(response.overdueTaskItems ?? [])
        ];

        this.isOverdueTasksLoading = false;
        this.overdueTasksError = '';

        this.updateDoughnutChart(
          response
        );

        this.isLoading = false;
      },

      error: (
        error: unknown
      ) => {
        console.error(
          'Dashboard bilgileri yüklenemedi:',
          error
        );

        this.summary = null;
        this.overdueTasks = [];

        this.errorMessage =
          'Dashboard bilgileri yüklenirken bir hata oluştu.';

        this.isOverdueTasksLoading = false;
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
            summary.completedTasks
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