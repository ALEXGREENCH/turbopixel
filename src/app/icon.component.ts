import { Component, Input } from '@angular/core';

// Original outline glyphs, drawn on a shared 24px grid. No remote font needed.
const paths: Record<string, string[]> = {
    photo: ['M4 4h16v16H4z', 'm4 16 5-5 4 4 3-3 4 4', 'M15 8h.01'],
    camera: ['M8 5 9.5 3h5L16 5h4a1 1 0 0 1 1 1v13H3V6a1 1 0 0 1 1-1z', 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
    share: ['M12 15V3', 'm8 7 4-4 4 4', 'M7 10H4v11h16V10h-3'],
    download: ['M12 3v12', 'm7 10 5 5 5-5', 'M4 16v5h16v-5'],
    copy: ['M9 9h12v12H9z', 'M5 15H3V3h12v2'],
    left: ['m14 5-7 7 7 7'], right: ['m10 5 7 7-7 7'], down: ['m6 9 6 6 6-6'],
    info: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 11v6', 'M12 7h.01'],
    appearance: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 2v20', 'M16 5v14', 'M19 8v8'],
    shuffle: ['M3 6h3c5 0 7 12 12 12h3', 'm18 15 3 3-3 3', 'M3 18h3c1.5 0 2.8-1.1 4-3', 'M14 9c1.2-1.9 2.5-3 4-3h3', 'm18 3 3 3-3 3'],
    flip: ['M4 8a9 9 0 0 1 15-2l2 2', 'M21 3v5h-5', 'M20 16a9 9 0 0 1-15 2l-2-2', 'M3 21v-5h5'],
    check: ['m5 12 4 4L19 6'], close: ['m6 6 12 12', 'M6 18 18 6'],
    search: ['M16 9a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'm14 14 7 7'],
    pixels: ['M3 3h6v6H3z', 'M15 3h6v6h-6z', 'M3 15h6v6H3z', 'M15 15h6v6h-6z'],
    arrow: ['M6 18 18 6', 'M6 6h12v12']
};

@Component({
    selector: 'app-icon',
    host: { '[attr.data-icon]': 'name' },
    template: `<span class="terminal-glyph" aria-hidden="true">{{terminalGlyph}}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path *ngFor="let path of glyph" [attr.d]="path" /></svg>`,
    styles: [':host { display: inline-flex; flex: 0 0 auto; width: 22px; height: 22px; vertical-align: middle; } svg { width: 100%; height: 100%; }']
})
export class IconComponent {
    @Input() name = 'pixels';
    get terminalGlyph() { return ({ appearance: 'SET', info: '?', left: '<', right: '>', down: 'v', shuffle: 'RND', flip: 'FLIP', check: '*', search: '/', arrow: '>' } as Record<string, string>)[this.name] || ''; }
    get glyph() { return paths[this.name] || paths['pixels']; }
}
