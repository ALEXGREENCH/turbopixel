import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppModule } from '../app.module';
import { AboutDialogComponent } from './about-dialog.component';
describe('AboutDialogComponent', () => {
 it('renders its accessible dialog content', async () => {
  await TestBed.configureTestingModule({ imports: [AppModule], providers: [
   { provide: MAT_DIALOG_DATA, useValue: { appLink: '/', repoLink: '/', socLink: '/' } },
   { provide: MatDialogRef, useValue: { close() {} } }
  ] }).compileComponents();
  const fixture = TestBed.createComponent(AboutDialogComponent);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('h1')).not.toBeNull();
  const addresses = fixture.nativeElement.querySelectorAll('.wallet code') as NodeListOf<HTMLElement>;
  expect(addresses.length).toBe(fixture.componentInstance.wallets.length);
  addresses.forEach((address, index) => expect(address.textContent).toBe(fixture.componentInstance.wallets[index].id));
  const copy = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
  (fixture.nativeElement.querySelector('[aria-label="Copy XMR address"]') as HTMLButtonElement).click();
  expect(copy).toHaveBeenCalledWith(fixture.componentInstance.wallets[4].id);
  fixture.destroy();
 });
});
