import { Injectable, OnDestroy } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';
import packageJson from 'package.json';

export interface UpdateDraft { photo: Blob; effect: number; intensity: number; }

// One temporary draft, kept separately from disposable application caches.
export async function draftStore(action: 'read' | 'write' | 'delete', draft?: UpdateDraft): Promise<UpdateDraft | undefined> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('turbopixel-update-draft', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('draft');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    try {
        return await new Promise<UpdateDraft | undefined>((resolve, reject) => {
            const transaction = db.transaction('draft', action === 'read' ? 'readonly' : 'readwrite');
            const store = transaction.objectStore('draft');
            const request = action === 'read' ? store.get('current') : action === 'write' ? store.put(draft, 'current') : store.delete('current');
            transaction.oncomplete = () => resolve(action === 'read' ? request.result : undefined);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('Draft could not be saved.'));
        });
    } finally { db.close(); }
}

@Injectable({ providedIn: 'root' })
export class AppUpdates implements OnDestroy {
    ready = false;
    recovery = false;
    busy = false;
    status = '';
    error = '';
    private releaseKey = '';
    private checking = false;
    private checkedAt = 0;
    private timer?: ReturnType<typeof setInterval>;
    private subscriptions = new Subscription();
    private onReturn = () => { void this.check(); };

    constructor(private sw: SwUpdate) {
        if (!sw.isEnabled) return;
        this.subscriptions.add(sw.versionUpdates.subscribe(event => {
            if (event.type !== 'VERSION_READY') return;
            const release = event.latestVersion.appData as { version?: string; build?: string } | undefined;
            const currentBuild = document.querySelector('meta[name="turbopixel-build"]')?.getAttribute('content');
            if (currentBuild && release?.build ? currentBuild !== release.build : release?.version !== packageJson.version) {
                this.releaseKey = event.latestVersion.hash;
                this.ready = true;
                this.status = 'Update ready. Your photo and settings will be kept.';
            }
        }));
        this.subscriptions.add(sw.unrecoverable.subscribe(() => {
            this.ready = this.recovery = true;
            this.status = 'App files need refreshing. Your photo and settings will be kept.';
        }));
        document.addEventListener('visibilitychange', this.onReturn);
        window.addEventListener('online', this.onReturn);
        this.timer = setInterval(this.onReturn, 5 * 60 * 1000);
        void this.check();
    }

    async check(manual = false) {
        if (!this.sw.isEnabled) { if (manual) this.status = 'Updates are available in the installed or published app.'; return; }
        if (this.checking || document.hidden || (!manual && Date.now() - this.checkedAt < 30000)) return;
        if (!navigator.onLine) { if (manual) this.status = 'Connect to the internet to check for updates.'; return; }
        this.checking = true; this.checkedAt = Date.now();
        try {
            // Keep the same worker URL/scope so old Home Screen installations migrate.
            void navigator.serviceWorker?.getRegistration(document.baseURI).then(registration => registration?.update()).catch(() => {});
            await this.sw.checkForUpdate();
            if (manual && !this.ready) this.status = 'App is up to date.';
        } catch { if (manual) this.status = 'Could not check. Try again when connected.'; }
        finally { this.checking = false; }
    }

    async apply(saveDraft: () => Promise<void>) {
        if (this.busy || !this.ready) return;
        this.busy = true; this.error = '';
        try {
            if (this.recovery) {
                const probe = new URL('ngsw.json', document.baseURI);
                probe.searchParams.set('ngsw-bypass', 'true');
                probe.searchParams.set('check', String(Date.now()));
                const response = await fetch(probe, { cache: 'no-store' });
                if (!response.ok) throw new Error('Connect to the internet and try again.');
                await response.json();
            }
            await saveDraft();
            this.reload();
        } catch { this.error = 'Could not prepare the update. Your current photo is still here. Please try again.'; this.busy = false; }
    }

    reload() {
        const url = new URL(document.baseURI);
        if (this.recovery) url.searchParams.set('ngsw-bypass', 'true');
        url.searchParams.set('release', this.releaseKey || String(Date.now()));
        location.replace(url.href);
    }

    ngOnDestroy() {
        clearInterval(this.timer); this.subscriptions.unsubscribe();
        document.removeEventListener('visibilitychange', this.onReturn);
        window.removeEventListener('online', this.onReturn);
    }
}
