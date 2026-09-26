import { Component, Injectable, OnDestroy } from '@angular/core';

interface InstallPrompt extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class AppInstall implements OnDestroy {
    private deferred?: InstallPrompt;
    private readonly displayMode = matchMedia('(display-mode: standalone)');
    installed = this.displayMode.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    busy = false;
    status = '';
    get canPrompt() { return !!this.deferred && !this.installed; }
    private readonly beforeInstall = (event: Event) => {
        event.preventDefault(); this.deferred = event as InstallPrompt; this.status = '';
    };
    private readonly didInstall = () => { this.installed = true; this.deferred = undefined; this.status = 'App installed.'; };
    private readonly modeChanged = () => { if (this.displayMode.matches) this.didInstall(); };
    constructor() {
        window.addEventListener('beforeinstallprompt', this.beforeInstall);
        window.addEventListener('appinstalled', this.didInstall);
        this.displayMode.addEventListener('change', this.modeChanged);
    }
    async install() {
        if (!this.deferred || this.busy) return;
        const prompt = this.deferred; this.deferred = undefined; this.busy = true; this.status = '';
        try {
            // Invoke directly in the click handler, before awaiting anything.
            await prompt.prompt();
            const choice = await prompt.userChoice;
            this.status = choice.outcome === 'accepted' ? 'Installation requested. Follow the browser instructions.' : 'Installation cancelled. You can also use the browser menu.';
        } catch { this.status = 'Use the browser menu to install the app.'; }
        finally { this.busy = false; }
    }
    ngOnDestroy() {
        window.removeEventListener('beforeinstallprompt', this.beforeInstall);
        window.removeEventListener('appinstalled', this.didInstall);
        this.displayMode.removeEventListener('change', this.modeChanged);
    }
}

@Component({
    selector: 'app-install',
    template: `
        <div class="sheet-grabber" aria-hidden="true"></div>
        <header class="sheet-header"><h1 mat-dialog-title>Install TurboPixel</h1><button class="plain-button sheet-done" mat-dialog-close>Done</button></header>
        <div mat-dialog-content class="install-content">
            <p *ngIf="install.installed">TurboPixel is installed.</p>
            <ng-container *ngIf="!install.installed">
                <button *ngIf="install.canPrompt" class="prominent-button" [disabled]="install.busy" (click)="install.install()"><app-icon name="download"></app-icon>Install app</button>
                <h2>iPhone or iPad</h2>
                <p>In Safari, open Share, then Add to Home Screen. Keep Open as Web App enabled if shown, then tap Add.</p>
                <h2>Android</h2>
                <p>Open the browser menu (⋮), then Install app or Add to Home screen.</p>
                <h2>Computer</h2>
                <p>Use the install icon in the address bar or the browser’s app menu, when available.</p>
            </ng-container>
            <p role="status" aria-live="polite">{{install.status}}</p>
        </div>
    `,
    styles: ['h2 { font-size: 15px; margin: 20px 0 6px; } p { color: var(--secondary); font-size: 13px; line-height: 1.5; margin: 0 0 16px; } p:empty { display: none; } .prominent-button { width: 100%; }']
})
export class InstallComponent { constructor(public install: AppInstall) {} }
