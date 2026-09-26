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
});
