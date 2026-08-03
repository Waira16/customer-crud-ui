import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelecomShared } from './telecom-shared';

describe('TelecomShared', () => {
  let component: TelecomShared;
  let fixture: ComponentFixture<TelecomShared>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelecomShared],
    }).compileComponents();

    fixture = TestBed.createComponent(TelecomShared);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
