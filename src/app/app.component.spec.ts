import { TestBed } from '@angular/core/testing';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

describe('Photo studio', () => {
    beforeEach(async () => { await TestBed.configureTestingModule({ imports: [AppModule] }).compileComponents(); });
    it('renders named controls and prevents exporting before a frame exists', () => {
        const fixture = TestBed.createComponent(AppComponent);
        spyOn(fixture.componentInstance, 'ngAfterViewInit');
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelector('h1')?.textContent).toBe('TurboPixel');
        expect(root.querySelector('input[type=file]')).not.toBeNull();
        expect(root.querySelector('[aria-label="Next effect"]')).not.toBeNull();
        expect((root.querySelector('.capture-button') as HTMLButtonElement).disabled).toBeTrue();
        fixture.destroy();
    });
    it('wraps palette navigation in both directions', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        app.clickBeforeEffect();
        expect(app.selectedEffect).toBe(app.effects.length - 1);
        app.clickNextEffect();
        expect(app.selectedEffect).toBe(0);
        fixture.destroy();
    });
    it('styles the actual palette container in dark mode, not its overlay parent', async () => {
        const fixture = TestBed.createComponent(AppComponent);
        spyOn(fixture.componentInstance, 'ngAfterViewInit');
        fixture.detectChanges();
        document.documentElement.dataset['theme'] = 'dark';
        fixture.componentInstance.clickOpenBottomSheetEffect();
        fixture.detectChanges(); await fixture.whenStable();
        const sheet = document.querySelector('.palette-sheet .mat-bottom-sheet-container') as HTMLElement;
        expect(sheet).not.toBeNull();
        const style = getComputedStyle(sheet);
        expect(style.backgroundColor).not.toBe('rgb(255, 255, 255)');
        expect(style.color).toBe('rgb(245, 247, 255)');
        expect(parseFloat(style.borderTopLeftRadius)).toBe(32);
        (sheet.querySelector('.sheet-done') as HTMLButtonElement).click();
        fixture.destroy(); delete document.documentElement.dataset['theme'];
    });
});
