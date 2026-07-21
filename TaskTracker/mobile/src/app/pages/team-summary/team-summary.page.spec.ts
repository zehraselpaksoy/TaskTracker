import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamSummaryPage } from './team-summary.page';

describe('TeamSummaryPage', () => {
  let component: TeamSummaryPage;
  let fixture: ComponentFixture<TeamSummaryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamSummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
