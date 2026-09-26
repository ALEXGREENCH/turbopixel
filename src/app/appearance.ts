import { Component, Injectable } from '@angular/core';

export type AppearanceTheme = 'auto' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class Appearance {
    theme: AppearanceTheme = 'auto';
    opaque = false;
    still = false;

    constructor() {
        try {
            const saved = JSON.parse(localStorage.getItem('turbopixel-appearance') || '{}');
            if (['auto', 'light', 'dark'].includes(saved.theme)) this.theme = saved.theme;
            this.opaque = saved.opaque === true;
            this.still = saved.still === true;
        } catch { /* Private browsing or an old preference must not block the app. */ }
        this.apply();
    }

    setTheme(theme: AppearanceTheme) { this.theme = theme; this.apply(); }
    apply() {
        const root = document.documentElement;
        root.dataset['theme'] = this.theme;
        root.dataset['opaque'] = String(this.opaque);
        root.dataset['still'] = String(this.still);
        document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
            const dark = this.theme === 'dark' || (this.theme === 'auto' && meta.media.includes('dark'));
            meta.content = dark ? '#131419' : '#f0f1f4';
        });
        try { localStorage.setItem('turbopixel-appearance', JSON.stringify({ theme: this.theme, opaque: this.opaque, still: this.still })); }
        catch { /* Appearance remains available for this session. */ }
    }
}

@Component({
    selector: 'app-appearance',
    template: `
        <div class="sheet-grabber" aria-hidden="true"></div>
        <header class="sheet-header"><h1 mat-dialog-title>Appearance</h1><button class="plain-button sheet-done" mat-dialog-close>Done</button></header>
        <div mat-dialog-content class="appearance-content">
            <fieldset class="theme-picker"><legend>Color theme</legend>
                <div class="segmented-picker" [style.--selection]="appearance.theme === 'auto' ? 0 : appearance.theme === 'light' ? 1 : 2">
                    <button *ngFor="let theme of themes" class="plain-button" [attr.aria-pressed]="appearance.theme === theme.value" (click)="appearance.setTheme(theme.value)">{{theme.label}}</button>
                </div>
            </fieldset>
            <label class="setting-row"><span><strong>Reduce transparency</strong><small>Solid surfaces for easier reading.</small></span><input type="checkbox" role="switch" [(ngModel)]="appearance.opaque" (change)="appearance.apply()"><span class="switch-track" aria-hidden="true"></span></label>
            <label class="setting-row"><span><strong>Reduce motion</strong><small>Keep controls and reflections still.</small></span><input type="checkbox" role="switch" [(ngModel)]="appearance.still" (change)="appearance.apply()"><span class="switch-track" aria-hidden="true"></span></label>
            <p class="sheet-description footnote">Your device’s accessibility preferences are also respected.</p>
        </div>
    `
})
export class AppearanceComponent {
    readonly themes: { value: AppearanceTheme; label: string }[] = [
        { value: 'auto', label: 'Automatic' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }
    ];
    constructor(public appearance: Appearance) { }
}
