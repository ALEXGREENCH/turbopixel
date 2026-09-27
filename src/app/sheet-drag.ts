import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

/** Only the handle captures dragging; palette scrolling and OS edge gestures stay native. */
@Directive({ selector: '[appSheetDrag]' })
export class SheetDrag {
    @Output() dismiss = new EventEmitter<void>();
    private start?: number;
    private distance = 0;
    private surface?: HTMLElement;
    constructor(private element: ElementRef<HTMLElement>) {}
    @HostListener('pointerdown', ['$event']) down(event: PointerEvent) {
        if (!event.isPrimary || event.button !== 0) return;
        this.surface = this.element.nativeElement.closest<HTMLElement>('.mat-bottom-sheet-container') || undefined;
        if (!this.surface) return;
        this.start = event.clientY; this.distance = 0;
        this.element.nativeElement.setPointerCapture(event.pointerId);
    }
    @HostListener('pointermove', ['$event']) move(event: PointerEvent) {
        if (this.start === undefined || !this.surface) return;
        this.distance = Math.max(0, event.clientY - this.start);
        this.surface.style.translate = `0 ${this.distance}px`;
    }
    @HostListener('pointerup') up() { this.finish(this.distance > 72); }
    @HostListener('pointercancel') cancel() { this.finish(false); }
    private finish(dismiss: boolean) {
        if (this.start === undefined) return;
        this.start = undefined;
        const surface = this.surface;
        if (surface) {
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset['still'] !== 'true') {
                surface.animate([{ translate: `0 ${this.distance}px` }, { translate: '0 0' }], { duration: dismiss ? 120 : 200, easing: 'cubic-bezier(.2,.8,.25,1)' });
            }
            surface.style.removeProperty('translate');
        }
        this.distance = 0;
        if (dismiss) this.dismiss.emit();
    }
}
