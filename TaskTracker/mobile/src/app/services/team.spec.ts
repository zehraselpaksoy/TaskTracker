import { TestBed } from '@angular/core/testing';

import { Team } from './team';

describe('Team', () => {
  let service: Team;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Team);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
