describe('Bundled terminal font', () => {
    it('loads the real IBM 3270 web font instead of silently using a system monospace', async () => {
        const faces = await document.fonts.load('20px "IBM 3270"', 'TurboPixel 0123456789');
        expect(faces.length).toBe(1);
        expect(faces[0].status).toBe('loaded');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.font = '20px "IBM 3270"';
        const width = context.measureText('MMMMMMMM').width;
        expect(width).toBeCloseTo(context.measureText('iiiiiiii').width, 1);
        context.font = '20px "Courier New"';
        expect(Math.abs(width - context.measureText('MMMMMMMM').width)).toBeGreaterThan(1);
    });
});
