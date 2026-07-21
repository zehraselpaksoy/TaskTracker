import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamTaskListPage } from './team-task-list.page';

describe('TeamTaskListPage', () => {
  let component: TeamTaskListPage;
  let fixture: ComponentFixture<TeamTaskListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamTaskListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
