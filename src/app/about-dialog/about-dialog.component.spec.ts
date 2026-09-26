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
  fixture.destroy();
 });
});
