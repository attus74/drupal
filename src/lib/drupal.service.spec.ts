import { TestBed } from '@angular/core/testing';

import { DrupalService } from './drupal.service';

describe('DrupalService', () => {
  let service: DrupalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrupalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
