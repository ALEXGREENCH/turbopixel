import { TestBed } from '@angular/core/testing';
import { AppModule } from './app.module';
import { OVERLAY_WINDOW, OverlayNavigation } from './overlay-navigation';
import { AppComponent } from './app.component';

describe('Photo studio', () => {
    beforeEach(async () => { await TestBed.configureTestingModule({ imports: [AppModule], providers: [{ provide: OVERLAY_WINDOW, useValue: { history: { state: null, pushState() {}, back() {} }, addEventListener() {}, removeEventListener() {} } }] }).compileComponents(); });
    it('renders named controls and prevents exporting before a frame exists', () => {
        const fixture = TestBed.createComponent(AppComponent);
        spyOn(fixture.componentInstance, 'ngAfterViewInit');
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelector('h1')?.textContent).toBe('#TurboPixel');
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
    it('expands the existing preview and returns through Back without losing the photo or settings', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        spyOn(app, 'ngAfterViewInit'); fixture.detectChanges();
        const track = spyOn(TestBed.inject(OverlayNavigation), 'track');
        const photo = new Image(); app.sourceImage = photo; app.selectedEffect = 3; app.effectValue = .37;
        const canvas = app.canvas.nativeElement;
        app.togglePreview(); fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.preview-expanded')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[aria-label="Exit large preview"]')).not.toBeNull();
        for (const selector of ['.app-header', '.source-control', '.intensity-slider', '.shuffle-button', '.app-footer']) {
            expect(getComputedStyle(fixture.nativeElement.querySelector(selector)).display).not.toBe('none');
        }
        expect(getComputedStyle(fixture.nativeElement.querySelector('.app-content-image'), '::before').display).toBe('none');
        track.calls.mostRecent().args[0](); fixture.detectChanges();
        expect(app.previewExpanded).toBeFalse();
        expect(app.sourceImage).toBe(photo); expect(app.selectedEffect).toBe(3); expect(app.effectValue).toBe(.37);
        expect(app.canvas.nativeElement).toBe(canvas); fixture.destroy();
    });
    it('lets an open dialog consume Escape before leaving large preview', () => {
        const fixture = TestBed.createComponent(AppComponent); const app = fixture.componentInstance;
        spyOn(TestBed.inject(OverlayNavigation), 'track');
        app.togglePreview();
        const container = document.createElement('div'); container.className = 'cdk-overlay-container';
        const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog');
        container.appendChild(dialog); document.body.appendChild(container);
        try { app.escapePreview(new KeyboardEvent('keydown', { key: 'Escape' })); expect(app.previewExpanded).toBeTrue(); }
        finally { container.remove(); }
        app.escapePreview(new KeyboardEvent('keydown', { key: 'Escape' })); expect(app.previewExpanded).toBeFalse();
        fixture.destroy();
    });
    it('crossfades palette changes without putting the transition into image data', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        spyOn(app, 'ngAfterViewInit'); fixture.detectChanges();
        app.hasFrame = true;
        app.appearance.still = false;
        spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
        const transition = app.transitionCanvas.nativeElement;
        const animate = spyOn(transition, 'animate').and.returnValue({ cancel() {} } as Animation);
        app.changeEffect(1, .3);
        expect(app.effectValue).toBe(.3);
        expect(animate).toHaveBeenCalledTimes(1);
        expect(transition.getAttribute('aria-hidden')).toBe('true');
        app.appearance.still = true; app.hasFrame = true;
        app.changeEffect(2);
        expect(animate).toHaveBeenCalledTimes(1);
        fixture.destroy();
    });
    it('retains dialog semantics and backdrop with custom motion durations', async () => {
        const fixture = TestBed.createComponent(AppComponent);
        spyOn(fixture.componentInstance, 'ngAfterViewInit'); fixture.detectChanges();
        fixture.componentInstance.clickAppearance(); fixture.detectChanges();
        await fixture.whenStable();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog).not.toBeNull();
        expect(dialog.textContent).toContain('Appearance');
        expect(document.querySelector('.cdk-overlay-backdrop')).not.toBeNull();
        (dialog.querySelector('.sheet-done') as HTMLButtonElement).click();
        fixture.destroy();
    });
    it('styles the actual palette container in dark mode, not its overlay parent', async () => {
        const fixture = TestBed.createComponent(AppComponent);
        spyOn(fixture.componentInstance, 'ngAfterViewInit');
        fixture.detectChanges();
        document.documentElement.dataset['style'] = 'modern';
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
        fixture.destroy(); delete document.documentElement.dataset['theme']; delete document.documentElement.dataset['style'];
    });
});
