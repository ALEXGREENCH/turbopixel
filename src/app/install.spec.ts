import { AppInstall } from './install';

describe('App installation', () => {
    let install: AppInstall;
    beforeEach(() => { install = new AppInstall(); install.installed = false; });
    afterEach(() => install.ngOnDestroy());
    function offer(outcome: 'accepted' | 'dismissed') {
        const event = new Event('beforeinstallprompt', { cancelable: true });
        const prompt = jasmine.createSpy('prompt').and.resolveTo();
        Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
        window.dispatchEvent(event);
        return { event, prompt };
    }
    it('invokes the browser prompt in the click and consumes it once', async () => {
        const { event, prompt } = offer('accepted');
        expect(event.defaultPrevented).toBeTrue(); expect(install.canPrompt).toBeTrue();
        const result = install.install();
        expect(prompt).toHaveBeenCalledTimes(1);
        await result; await install.install();
        expect(prompt).toHaveBeenCalledTimes(1);
        // Acceptance requests installation; only the installed event confirms it.
        expect(install.installed).toBeFalse();
        window.dispatchEvent(new Event('appinstalled'));
        expect(install.installed).toBeTrue(); expect(install.canPrompt).toBeFalse();
    });
    it('does not claim installation after cancellation and accepts a later offer', async () => {
        offer('dismissed'); await install.install();
        expect(install.installed).toBeFalse(); expect(install.canPrompt).toBeFalse();
        expect(install.status).toContain('cancelled');
        offer('accepted'); expect(install.canPrompt).toBeTrue();
    });
    it('keeps manual instructions available if no prompt or a rejected prompt exists', async () => {
        await install.install(); expect(install.canPrompt).toBeFalse();
        const { prompt } = offer('accepted'); prompt.and.rejectWith(new Error('unavailable'));
        await install.install();
        expect(install.busy).toBeFalse(); expect(install.status).toContain('browser menu');
    });
});
