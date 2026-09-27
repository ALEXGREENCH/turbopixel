import { interfaceStyles } from './appearance';

describe('Interface style contrast', () => {
    const root = document.documentElement;
    const luminance = (hex: string) => {
        let value = hex.trim().slice(1);
        if (value.length === 3) value = value.split('').map(c => c + c).join('');
        return [0,2,4].map(i => parseInt(value.slice(i,i+2),16)/255)
            .map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4)
            .reduce((sum,c,i) => sum + c*[.2126,.7152,.0722][i],0);
    };
    afterEach(() => { delete root.dataset['style']; delete root.dataset['theme']; });
    it('keeps body, secondary, accent and primary-action labels legible in all ten variants', () => {
        for (const style of interfaceStyles) for (const theme of ['light','dark']) {
            root.dataset['style'] = style.value; root.dataset['theme'] = theme;
            const css = getComputedStyle(root);
            for (const [foreground, background] of [['--text','--solid'],['--secondary','--solid'],['--accent','--solid'],['--action-text','--action'], ...(style.value === 'desktop1995' ? [['--page-secondary','--page-bg'],['--header-text','--page-bg']] : [['--secondary','--page-bg']])]) {
                const a = luminance(css.getPropertyValue(foreground)), b = luminance(css.getPropertyValue(background));
                expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).withContext(`${style.value} ${theme} ${foreground}`).toBeGreaterThanOrEqual(4.5);
            }
        }
    });
});
