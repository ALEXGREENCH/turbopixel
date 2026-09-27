import { ElementRef } from '@angular/core';
import { SheetDrag } from './sheet-drag';

describe('Palette sheet drag handle', () => {
    it('dismisses only after a deliberate downward drag and cancels interrupted gestures', () => {
        const surface = document.createElement('div'); surface.className = 'mat-bottom-sheet-container';
        const handle = document.createElement('div'); surface.appendChild(handle); document.body.appendChild(surface);
        spyOn(handle, 'setPointerCapture'); spyOn(surface, 'animate');
        const drag = new SheetDrag(new ElementRef(handle)); const dismiss = jasmine.createSpy('dismiss'); drag.dismiss.subscribe(dismiss);
        const down = () => drag.down({ isPrimary: true, button: 0, clientY: 0, pointerId: 1 } as PointerEvent);
        down(); drag.move({ clientY: 40 } as PointerEvent); drag.up(); expect(dismiss).not.toHaveBeenCalled();
        down(); drag.move({ clientY: 100 } as PointerEvent); drag.cancel(); expect(dismiss).not.toHaveBeenCalled();
        down(); drag.move({ clientY: 100 } as PointerEvent); drag.up(); expect(dismiss).toHaveBeenCalledTimes(1);
        expect(surface.style.translate).toBe(''); surface.remove();
    });
});
