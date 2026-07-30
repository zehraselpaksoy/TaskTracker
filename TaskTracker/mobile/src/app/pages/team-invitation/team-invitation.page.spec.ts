import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamInvitationPage } from './team-invitation.page';

describe('TeamInvitationPage', () => {
  let component: TeamInvitationPage;
  let fixture: ComponentFixture<TeamInvitationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamInvitationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
