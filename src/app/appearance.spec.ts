import { Appearance } from './appearance';

describe('Appearance preferences', () => {
    afterEach(() => {
        delete document.documentElement.dataset['theme'];
        delete document.documentElement.dataset['style'];
        delete document.documentElement.dataset['opaque'];
        delete document.documentElement.dataset['still'];
    });
    it('recovers from malformed saved preferences', () => {
        spyOn(Storage.prototype, 'getItem').and.returnValue('{broken');
        spyOn(Storage.prototype, 'setItem');
        const appearance = new Appearance();
        expect(appearance.theme).toBe('auto');
        expect(appearance.opaque).toBeTrue();
        expect(appearance.style).toBe('classic');
    });
    it('restores choices to the root so overlays and the page agree', () => {
        spyOn(Storage.prototype, 'getItem').and.returnValue('{"theme":"dark","opaque":true,"still":true}');
        spyOn(Storage.prototype, 'setItem');
        new Appearance();
        expect(document.documentElement.dataset['theme']).toBe('dark');
        expect(document.documentElement.dataset['opaque']).toBe('true');
        expect(document.documentElement.dataset['still']).toBe('true');
    });
    it('restores a valid style and ignores unknown styles', () => {
        const read = spyOn(Storage.prototype, 'getItem').and.returnValue('{"style":"terminal","opaque":false}');
        spyOn(Storage.prototype, 'setItem');
        expect(new Appearance().style).toBe('terminal');
        expect(document.documentElement.dataset['opaque']).toBe('false');
        read.and.returnValue('{"style":"unknown"}');
        expect(new Appearance().style).toBe('classic');
    });
    it('works when storage is unavailable', () => {
        spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
        spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
        const appearance = new Appearance();
        appearance.setTheme('light');
        expect(document.documentElement.dataset['theme']).toBe('light');
    });
});
