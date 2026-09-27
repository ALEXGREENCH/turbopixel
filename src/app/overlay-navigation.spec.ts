import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { OverlayNavigation } from './overlay-navigation';

describe('Overlay history', () => {
    let navigation: OverlayNavigation;
    let listener: (event: PopStateEvent) => void;
    let states: unknown[], position: number, pending: number | undefined;
    let history: { state: unknown; pushState: jasmine.Spy; replaceState: jasmine.Spy; back: jasmine.Spy };
    const arrive = (index: number) => { position = index; history.state = states[index]; pending = undefined; listener({ state: history.state } as PopStateEvent); };
    const completeBack = () => { expect(pending).toBeDefined(); arrive(pending!); };
    const open = () => {
        const closed = new Subject<void>();
        const close = jasmine.createSpy('close').and.callFake(() => closed.next());
        navigation.track(close, closed);
        return { closed, close };
    };
    beforeEach(() => {
        states = [{ editor: true }]; position = 0; pending = undefined;
        history = {
            state: states[0],
            pushState: jasmine.createSpy('pushState').and.callFake(state => { states.splice(++position); states.push(state); history.state = state; }),
            replaceState: jasmine.createSpy('replaceState').and.callFake(state => { states[position] = state; history.state = state; }),
            back: jasmine.createSpy('back').and.callFake(() => { pending = position - 1; })
        };
        const win = { history, addEventListener: (_: string, fn: typeof listener) => listener = fn, removeEventListener() {} } as unknown as Window;
        navigation = new OverlayNavigation({} as MatDialog, {} as MatBottomSheet, win);
    });
    afterEach(() => navigation.ngOnDestroy());
    it('closes a sheet on browser Back without issuing a second Back', () => {
        const sheet = open(); arrive(0);
        expect(sheet.close).toHaveBeenCalledTimes(1);
        expect(history.back).not.toHaveBeenCalled();
        expect(history.state).toEqual({ editor: true });
    });
    it('consumes the modal history entry after Done, Escape or selection', () => {
        const sheet = open(); sheet.closed.next();
        expect(history.back).toHaveBeenCalledTimes(1); completeBack();
        expect(position).toBe(0); expect(sheet.close).not.toHaveBeenCalled();
    });
    it('closes only the top dialog, then the underlying sheet', () => {
        const sheet = open(), dialog = open(); arrive(1);
        expect(dialog.close).toHaveBeenCalledTimes(1); expect(sheet.close).not.toHaveBeenCalled();
        arrive(0); expect(sheet.close).toHaveBeenCalledTimes(1);
        expect(history.back).not.toHaveBeenCalled();
    });
    it('queues a new dialog opened while the previous dismissal is returning', () => {
        const sheet = open(); sheet.closed.next();
        const dialog = open(); expect(history.pushState).toHaveBeenCalledTimes(1);
        completeBack(); expect(history.pushState).toHaveBeenCalledTimes(2);
        expect(dialog.close).not.toHaveBeenCalled();
        arrive(0); expect(dialog.close).toHaveBeenCalledTimes(1);
    });
    it('discards Forward entries for dismissed dialogs', () => {
        const dialog = open(); arrive(0); arrive(1); completeBack();
        expect(position).toBe(0); expect(dialog.close).toHaveBeenCalledTimes(1);
    });
    it('skips an already dismissed underlying sheet when its child closes', () => {
        const sheet = open(), dialog = open(); sheet.closed.next();
        expect(history.back).not.toHaveBeenCalled();
        dialog.closed.next(); completeBack(); completeBack();
        expect(position).toBe(0);
    });
});

describe('Browser history integration', () => {
    it('returns to the editor with real asynchronous popstate events', async () => {
        const frame = document.createElement('iframe');
        const loaded = new Promise<void>(resolve => frame.onload = () => resolve());
        frame.srcdoc = '<!doctype html><title>Overlay history test</title>';
        document.body.appendChild(frame); await loaded;
        const win = frame.contentWindow!;
        const service = new OverlayNavigation({} as MatDialog, {} as MatBottomSheet, win);
        try {
            const closed = new Subject<void>();
            const close = jasmine.createSpy('dismiss').and.callFake(() => closed.next());
            service.track(close, closed);
            expect(win.history.state.__turboOverlay).toBeDefined();
            const popped = new Promise<void>(resolve => win.addEventListener('popstate', () => resolve(), { once: true }));
            win.history.back(); await popped;
            expect(close).toHaveBeenCalledTimes(1);
            expect(win.history.state?.__turboOverlay).toBeUndefined();
            const nextClosed = new Subject<void>();
            service.track(() => {}, nextClosed);
            const returned = new Promise<void>(resolve => win.addEventListener('popstate', () => resolve(), { once: true }));
            nextClosed.next(); await returned;
            expect(win.history.state?.__turboOverlay).toBeUndefined();
        } finally { service.ngOnDestroy(); frame.remove(); }
    });
});
