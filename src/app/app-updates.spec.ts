import { AppUpdates, draftStore } from './app-updates';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import packageJson from 'package.json';
import { fakeAsync, tick } from '@angular/core/testing';

describe('App updates', () => {
    let events: Subject<any>, broken: Subject<any>, service: AppUpdates, sw: any;
    beforeEach(() => {
        events = new Subject(); broken = new Subject();
        sw = { isEnabled: true, versionUpdates: events, unrecoverable: broken, checkForUpdate: jasmine.createSpy().and.resolveTo(false) };
        service = new AppUpdates(sw as SwUpdate);
    });
    afterEach(() => service.ngOnDestroy());
    it('does not leave manual checks stuck when a worker is replaced during a request', fakeAsync(() => {
        service.ngOnDestroy();
        sw.checkForUpdate.and.returnValue(new Promise(() => {}));
        service = new AppUpdates(sw);
        void service.check(true);
        expect(service.status).toContain('Checking');
        tick(20001);
        expect(service.status).toContain('Could not check');
        sw.checkForUpdate.and.resolveTo(false);
        void service.check(true); tick();
        expect(service.status).toBe('App is up to date.');
        service.ngOnDestroy();
    }));
    it('offers only a fully installed newer release and never reloads an active editor automatically', () => {
        const reload = spyOn(service, 'reload');
        events.next({ type: 'VERSION_DETECTED' }); expect(service.ready).toBeFalse();
        events.next({ type: 'VERSION_INSTALLATION_FAILED' }); expect(service.ready).toBeFalse();
        events.next({ type: 'VERSION_READY', latestVersion: { appData: { version: packageJson.version } } }); expect(service.ready).toBeFalse();
        events.next({ type: 'VERSION_READY', latestVersion: { appData: { version: 'future-release' } } }); expect(service.ready).toBeTrue();
        expect(reload).not.toHaveBeenCalled();
    });
    it('waits for the draft transaction before reloading', async () => {
        service.ready = true;
        const reload = spyOn(service, 'reload'); let saved!: () => void;
        const applying = service.apply(() => new Promise<void>(resolve => saved = resolve));
        expect(service.busy).toBeTrue(); expect(reload).not.toHaveBeenCalled();
        saved(); await applying; expect(reload).toHaveBeenCalledTimes(1);
    });
    it('detects a new build even when the version number was reused', () => {
        const meta = document.createElement('meta'); meta.name = 'turbopixel-build'; meta.content = 'old-build'; document.head.appendChild(meta);
        try {
            events.next({ type: 'VERSION_READY', latestVersion: { appData: { version: packageJson.version, build: 'new-build' } } });
            expect(service.ready).toBeTrue();
        } finally { meta.remove(); }
    });
    it('keeps the current editor when draft storage fails and allows retry', async () => {
        service.ready = true; const reload = spyOn(service, 'reload');
        await service.apply(() => Promise.reject(new Error('quota')));
        expect(reload).not.toHaveBeenCalled(); expect(service.busy).toBeFalse(); expect(service.error).toContain('current photo');
        await service.apply(() => Promise.resolve()); expect(reload).toHaveBeenCalledTimes(1);
    });
    it('offers recovery for evicted assets and does not reload on a failed network probe', async () => {
        broken.next({ reason: 'Old bundle evicted; server returned 404' });
        expect(service.recovery).toBeTrue(); expect(service.ready).toBeTrue();
        spyOn(window, 'fetch').and.rejectWith(new Error('offline'));
        const reload = spyOn(service, 'reload'), save = jasmine.createSpy().and.resolveTo();
        await service.apply(save);
        expect(reload).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    });
    it('stores one photo draft across connections and removes it after recovery', async () => {
        await draftStore('write', { photo: new Blob(['first']), effect: 4, intensity: .25 });
        await draftStore('write', { photo: new Blob(['latest']), effect: 8, intensity: .75 });
        const draft = await draftStore('read');
        expect(await draft!.photo.text()).toBe('latest'); expect(draft!.effect).toBe(8); expect(draft!.intensity).toBe(.75);
        await draftStore('delete'); expect(await draftStore('read')).toBeUndefined();
    });
});
