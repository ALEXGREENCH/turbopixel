import { Component, Injectable } from '@angular/core';

export type InterfaceStyle = 'classic' | 'modern' | 'system1984' | 'desktop1995' | 'terminal';
export const interfaceStyles: { value: InterfaceStyle; label: string; era: string }[] = [
    { value: 'classic', label: 'Classic orange', era: 'TurboPixel' },
    { value: 'modern', label: 'Modern', era: 'Today' },
    { value: 'system1984', label: 'Monochrome', era: '1984' },
    { value: 'desktop1995', label: 'Desktop', era: '1995' },
    { value: 'terminal', label: 'Terminal', era: 'IBM 3270' }
];

export type AppearanceTheme = 'auto' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class Appearance {
    theme: AppearanceTheme = 'auto';
    style: InterfaceStyle = 'classic';
    opaque = true;
    still = false;

    constructor() {
        try {
            const saved = JSON.parse(localStorage.getItem('turbopixel-appearance') || '{}');
            if (['auto', 'light', 'dark'].includes(saved.theme)) this.theme = saved.theme;
            if (interfaceStyles.some(style => style.value === saved.style)) this.style = saved.style;
            this.opaque = saved.opaque !== false;
            this.still = saved.still === true;
        } catch { /* Private browsing or an old preference must not block the app. */ }
        this.apply();
    }

    setStyle(style: InterfaceStyle) { this.style = style; this.apply(); }
    setTheme(theme: AppearanceTheme) { this.theme = theme; this.apply(); }
    apply() {
        const root = document.documentElement;
        root.dataset['theme'] = this.theme;
        root.dataset['style'] = this.style;
        root.dataset['opaque'] = String(this.opaque);
        root.dataset['still'] = String(this.still);
        document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
            const dark = this.theme === 'dark' || (this.theme === 'auto' && meta.media.includes('dark'));
            meta.content = this.style === 'classic' ? '#ff6500' : this.style === 'terminal' ? (dark ? '#080e09' : '#e1e8da') : dark ? '#131419' : '#f0f1f4';
        });
        try { localStorage.setItem('turbopixel-appearance', JSON.stringify({ style: this.style, theme: this.theme, opaque: this.opaque, still: this.still })); }
        catch { /* Appearance remains available for this session. */ }
    }
}

@Component({
    selector: 'app-appearance',
    template: `
        <div class="sheet-grabber" aria-hidden="true"></div>
        <header class="sheet-header"><h1 mat-dialog-title>Appearance</h1><button class="plain-button sheet-done" mat-dialog-close>Done</button></header>
        <div mat-dialog-content class="appearance-content">
            <fieldset class="style-picker"><legend>Interface style</legend>
                <div class="style-options">
                    <button *ngFor="let style of styles" class="plain-button style-option" [attr.aria-pressed]="appearance.style === style.value" (click)="appearance.setStyle(style.value)">
                        <span class="style-sample" [attr.data-sample]="style.value" aria-hidden="true"><i></i></span>
                        <span>{{style.label}}<small>{{style.era}}</small></span><app-icon *ngIf="appearance.style === style.value" name="check"></app-icon>
                    </button>
                </div>
            </fieldset>
            <fieldset class="theme-picker"><legend>Color theme</legend>
                <div class="segmented-picker" [style.--selection]="appearance.theme === 'auto' ? 0 : appearance.theme === 'light' ? 1 : 2">
                    <button *ngFor="let theme of themes" class="plain-button" [attr.aria-pressed]="appearance.theme === theme.value" (click)="appearance.setTheme(theme.value)">{{theme.label}}</button>
                </div>
            </fieldset>
            <label *ngIf="appearance.style === 'modern'" class="setting-row"><span><strong>Reduce transparency</strong><small>Solid surfaces for easier reading.</small></span><input type="checkbox" role="switch" [(ngModel)]="appearance.opaque" (change)="appearance.apply()"><span class="switch-track" aria-hidden="true"></span></label>
            <label class="setting-row"><span><strong>Reduce motion</strong><small>Keep controls and reflections still.</small></span><input type="checkbox" role="switch" [(ngModel)]="appearance.still" (change)="appearance.apply()"><span class="switch-track" aria-hidden="true"></span></label>
            <p class="sheet-description footnote">Your device’s accessibility preferences are also respected.</p>
        </div>
    `
})
export class AppearanceComponent {
    readonly styles = interfaceStyles;
    readonly themes: { value: AppearanceTheme; label: string }[] = [
        { value: 'auto', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }
    ];
    constructor(public appearance: Appearance) { }
}
