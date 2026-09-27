import { Injectable, InjectionToken, Inject, OnDestroy } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { Observable } from 'rxjs';

export const OVERLAY_WINDOW = new InjectionToken<Window>('Overlay history', { providedIn: 'root', factory: () => window });
interface Entry { id: number; close: () => void; closed: boolean; pushed: boolean; }

/** A transient history entry belongs to each open sheet, not to the editor. */
@Injectable({ providedIn: 'root' })
export class OverlayNavigation implements OnDestroy {
    private readonly key = '__turboOverlay';
    private readonly session = Math.random().toString(36).slice(2);
    private serial = 0;
    private entries: Entry[] = [];
    private returning = false;
    private destroyed = false;

    constructor(private dialogs: MatDialog, private sheets: MatBottomSheet, @Inject(OVERLAY_WINDOW) private win: Window) {
        this.win.addEventListener('popstate', this.onPop);
        // A reload restores the editor, never a stale modal from an earlier run.
        if (this.win.history.state?.[this.key]) this.replaceBase();
    }

    dialog<T, D = unknown>(component: ComponentType<T>, config: MatDialogConfig<D> = {}) {
        const ref = this.dialogs.open(component, { ...config, closeOnNavigation: false });
        this.track(() => ref.close(), ref.afterClosed());
        return ref;
    }

    sheet<T, D = unknown>(component: ComponentType<T>, config: MatBottomSheetConfig<D> = {}) {
        const ref = this.sheets.open(component, { ...config, closeOnNavigation: false, autoFocus: 'dialog' });
        this.track(() => ref.dismiss(), ref.afterDismissed());
        return ref;
    }

    track(close: () => void, closed: Observable<unknown>) {
        const entry: Entry = { id: ++this.serial, close, closed: false, pushed: false };
        this.entries.push(entry);
        closed.subscribe(() => {
            entry.closed = true;
            if (!this.destroyed && this.entries.includes(entry)) this.settle();
        });
        this.settle();
    }

    private settle() {
        if (this.returning) return;
        this.entries = this.entries.filter(entry => entry.pushed || !entry.closed);
        const pushed = this.entries.filter(entry => entry.pushed);
        const top = pushed[pushed.length - 1];
        if (top?.closed) {
            this.returning = true;
            this.win.history.back();
            return;
        }
        for (const entry of this.entries.filter(entry => !entry.pushed)) {
            try {
                this.win.history.pushState({ ...this.win.history.state, [this.key]: { session: this.session, id: entry.id } }, '');
                entry.pushed = true;
            } catch { /* Embedded/restricted browsers still support normal dismissal. */ }
        }
    }

    private onPop = (event: PopStateEvent) => {
        this.returning = false;
        const marker = event.state?.[this.key];
        const destination = marker?.session === this.session ? this.entries.find(entry => entry.id === marker.id && entry.pushed) : undefined;
        if (marker && !destination) {
            // Forward must not resurrect a dismissed dialog with stale photo data.
            this.win.history.back();
            return;
        }
        const index = destination ? this.entries.indexOf(destination) : -1;
        const removed = this.entries.filter((entry, i) => entry.pushed && i > index);
        this.entries = this.entries.filter(entry => !removed.includes(entry));
        for (const entry of removed.reverse()) if (!entry.closed) entry.close();
        this.settle();
    };

    private replaceBase() {
        const state = { ...this.win.history.state };
        delete state[this.key];
        this.win.history.replaceState(state, '');
    }

    ngOnDestroy() { this.destroyed = true; this.win.removeEventListener('popstate', this.onPop); }
}
