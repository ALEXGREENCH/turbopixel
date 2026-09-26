import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppModule } from '../app.module';
import { SaveDialogComponent } from './save-dialog.component';

describe('Photo export sheet', () => {
    beforeEach(async () => { await TestBed.configureTestingModule({ imports: [AppModule], providers: [
        { provide: MAT_DIALOG_DATA, useValue: { imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRe8AAAAASUVORK5CYII=', fileName: 'photo.png', description: 'Caption' } },
        { provide: MatDialogRef, useValue: { close() {} } }
    ] }).compileComponents(); });
    it('renders a prepared PNG preview and an enabled download button', () => {
        const fixture = TestBed.createComponent(SaveDialogComponent);
        fixture.detectChanges();
        const c = fixture.componentInstance;
        const root = fixture.nativeElement as HTMLElement;
        expect(c.file?.type).toBe('image/png');
        expect(root.querySelector('img')?.getAttribute('src')).toBe(c.previewUrl);
        expect((root.querySelector('.export-actions button') as HTMLButtonElement).disabled).toBeFalse();
        fixture.destroy();
    });
    it('releases the preview URL when the sheet is destroyed', () => {
        const fixture = TestBed.createComponent(SaveDialogComponent);
        const url = fixture.componentInstance.previewUrl;
        const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
        fixture.destroy();
        expect(revoke).toHaveBeenCalledWith(url);
    });
});
