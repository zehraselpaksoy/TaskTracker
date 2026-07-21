import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronDownOutline
} from 'ionicons/icons';
import {
  ReportService,
  TeamSummary
} from '../../services/report';

@Component({
  selector: 'app-team-summary',
  templateUrl: './team-summary.page.html',
  styleUrls: ['./team-summary.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamSummaryPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);

  teamId = 0;
  teamName = 'Takım';

  summary: TeamSummary | null = null;

  isLoading = false;
  errorMessage = '';

 constructor() {
  addIcons({
    arrowBackOutline,
    chevronDownOutline
  });
}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Geçersiz takım bilgisi.';
      return;
    }

    this.teamId = id;

    this.teamName =
      localStorage.getItem(`teamName_${id}`) ?? 'Takım';

    this.loadSummary();
  }

 loadSummary(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.reportService
    .getTeamSummary(this.teamId)
    .subscribe({
      next: (response: TeamSummary) => {
        this.summary = response;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error(
          'Takım özeti yüklenirken hata oluştu:',
          error
        );

        this.errorMessage =
          'Takım özeti yüklenemedi. Lütfen tekrar deneyin.';

        this.isLoading = false;
      }
    });
}

 goBack(): void {
  void this.router.navigate([
    '/teams'
  ]);
}
navigateTo(tab: 'summary' | 'board' | 'list' | 'calendar'): void {
  if (tab === 'board') {
    void this.router.navigate([
      '/teams',
      this.teamId
    ]);
    return;
  }

  if (tab === 'list') {
    void this.router.navigate([
      '/teams',
      this.teamId,
      'list'
    ]);
    return;
  }

  if (tab === 'calendar') {
    return;
  }
}
}