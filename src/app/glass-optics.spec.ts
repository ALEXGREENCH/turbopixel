import { GlassOptics } from './glass-optics';

describe('Glass optics', () => {
    let host: HTMLDivElement;
    let source: HTMLCanvasElement;
    let optics: GlassOptics | undefined;
    const paint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    beforeEach(() => {
        host = document.createElement('div'); host.className = 'liquid-glass';
        host.style.cssText = 'position:fixed;left:20px;top:20px;width:200px;height:100px;border-radius:30px';
        document.body.appendChild(host);
        source = document.createElement('canvas'); source.width = source.height = 64;
        const context = source.getContext('2d')!;
        context.fillStyle = '#e04455'; context.fillRect(0,0,64,64);
        context.fillStyle = '#44aaff'; context.fillRect(32,0,32,64);
        document.documentElement.dataset['theme'] = 'light';
        document.documentElement.dataset['opaque'] = 'false';
    });
    afterEach(() => {
        optics?.destroy(); optics = undefined; host.remove();
        delete document.documentElement.dataset['theme']; delete document.documentElement.dataset['opaque'];
    });
    it('compiles the shader, renders a rounded lens, and removes it for opaque mode', async () => {
        const probe = document.createElement('canvas').getContext('webgl');
        if (!probe) { pending('WebGL unavailable on this test runner'); return; }
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        optics = new GlassOptics(source); optics.setSource(source);
        await paint();
        expect(host.classList.contains('has-optics')).toBeTrue();
        const lens = host.querySelector('canvas')!;
        const context = lens.getContext('2d')!;
        expect(context.getImageData(0,0,1,1).data[3]).toBe(0);
        const center = context.getImageData(Math.floor(lens.width/2),Math.floor(lens.height/2),1,1).data;
        expect(center[3]).toBe(255);
        expect(center[0]+center[1]+center[2]).toBeGreaterThan(100);
        const stage = (optics as unknown as { stage: HTMLCanvasElement }).stage;
        const contextLoss = stage.getContext('webgl')!.getExtension('WEBGL_lose_context');
        if (contextLoss) {
            const lost = new Promise<void>(resolve => stage.addEventListener('webglcontextlost', () => resolve(), { once: true }));
            contextLoss.loseContext(); await lost; await paint();
            expect(host.classList.contains('has-optics')).toBeFalse();
            const restored = new Promise<void>(resolve => stage.addEventListener('webglcontextrestored', () => resolve(), { once: true }));
            contextLoss.restoreContext(); await restored; await paint();
            expect(host.classList.contains('has-optics')).toBeTrue();
        }
        document.documentElement.dataset['opaque'] = 'true'; await paint();
        expect(host.classList.contains('has-optics')).toBeFalse();
        expect(lens.hidden).toBeTrue();
        document.documentElement.dataset['opaque'] = 'false'; await paint();
        expect(host.classList.contains('has-optics')).toBeTrue();
        optics.destroy(); optics = undefined;
        expect(host.querySelector('canvas')).toBeNull();
    });
    it('leaves CSS glass and controls intact when WebGL is unavailable', async () => {
        spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(null);
        const button = document.createElement('button'); button.textContent = 'Save'; host.appendChild(button);
        optics = new GlassOptics(source); optics.setSource(source); await paint();
        expect(host.classList.contains('has-optics')).toBeFalse();
        expect(host.querySelector('button')).toBe(button);
        expect(host.querySelector('canvas')).toBeNull();
    });
    it('keeps secondary text above 4.5:1 on the rendered control body in both themes', async () => {
        const probe = document.createElement('canvas').getContext('webgl');
        if (!probe) { pending('WebGL unavailable on this test runner'); return; }
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        const luminance = (rgb: number[]) => rgb.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126,.7152,.0722][i], 0);
        optics = new GlassOptics(source);
        for (const theme of ['light', 'dark']) {
            document.documentElement.dataset['theme'] = theme;
            const color = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim();
            const text = luminance([1,3,5].map(i => parseInt(color.slice(i,i+2),16)));
            let minimum = Infinity;
            for (const background of ['#000000','#ffffff','#ff0000','#00ff00','#0000ff']) {
                const context = source.getContext('2d')!;
                context.fillStyle = background; context.fillRect(0,0,64,64);
                optics.setSource(source); await paint();
                const lens = host.querySelector('canvas')!;
                const scale = lens.width / 200;
                const inset = Math.ceil(16 * scale);
                const pixels = lens.getContext('2d')!.getImageData(inset,inset,lens.width-2*inset,lens.height-2*inset).data;
                for (let i=0; i<pixels.length; i+=4) {
                    const surface = luminance([pixels[i],pixels[i+1],pixels[i+2]]);
                    minimum = Math.min(minimum,(Math.max(text,surface)+.05)/(Math.min(text,surface)+.05));
                }
            }
            console.info('Glass secondary text minimum contrast (' + theme + '): ' + minimum.toFixed(2) + ':1');
            expect(minimum).withContext(theme + ' secondary text contrast').toBeGreaterThanOrEqual(4.5);
        }
    });
});
