// ------------------------------------------------------------------------------------------------------------------
//  _ ______           _ ______     _ _____________          _ ______
//  ___  __/___  ___________  /__________  __ \__(_)___  _________  /
//  __  /  _  / / /_  ___/_  __ \  __ \_  /_/ /_  /__  |/_/  _ \_  / 
//  _  /   / /_/ /_  /   _  /_/ / /_/ /  ____/_  / __>  < /  __/  /  
//  /_/    \__,_/ /_/    /_.___/\____//_/     /_/  /_/|_| \___//_/   
//                                                                 
//  Project: TurboPixel PWA application for make pixel-art like photos
//
//  Author: @Turborium
//
//  Licensed under an MPL2.0
//
//  Copyright (c) Turborium (https://github.com/turborium/TurboPixel)
// -------------------------------------------------------------------------------------------------------------------

// Lasciate ogne speranza, voi ch’entrate

import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, HostListener, NgZone } from '@angular/core';
import { GlassOptics } from './glass-optics';
import { AppInstall, InstallComponent } from './install';
import { Appearance, AppearanceComponent } from './appearance';
import { Camera, CameraType } from './camera';
import { MatDialog } from '@angular/material/dialog';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatTooltip } from '@angular/material/tooltip';

import { SaveDialogComponent, SaveDialogResult, SaveDialogData } from './save-dialog/save-dialog.component';
import { CameraErrorDialogComponent, CameraErrorDialogResult } from './camera-error-dialog/camera-error-dialog.component';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';

import { PixelEffect } from './pixelator';
import { effects } from './effects';

import { iconCharForEffect } from './utils';

@Component({
    selector: 'bottom-sheet-effects',
    template: `
    <div class="palette-top">
    <div class="sheet-grabber" aria-hidden="true"></div>
    <header class="sheet-header"><h2 id="palette-title">Palettes <span class="sheet-count">{{data.effects.length}}</span></h2><button class="plain-button sheet-done" (click)="close()">Done</button></header>
    <label class="palette-search"><app-icon name="search"></app-icon><input type="search" placeholder="Find a palette" aria-label="Find a palette" [(ngModel)]="query"></label>
    </div>
    <div class="palette-grid">
      <button class="palette-option plain-button" [attr.aria-pressed]="i === data.selected" (click)="openLink(i)" *ngFor="let i of filteredIndices">
        <span class="palette-swatch" aria-hidden="true"><i *ngFor="let color of colors(data.effects[i])" [style.background]="color"></i></span>
        <span>{{data.effects[i].title}}</span><app-icon *ngIf="i === data.selected" name="check"></app-icon>
      </button>
    </div>
    <p *ngIf="!filteredIndices.length" class="sheet-description">No palettes found. Try a different name.</p>
  `,

})

export class BottomSheetEffects {
    constructor(
        private bottomSheetRef: MatBottomSheetRef<BottomSheetEffects>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: { effects: Array<PixelEffect>; selected: number }
    ) { }

    query = '';
    get filteredIndices() { return this.data.effects.map((_, i) => i).filter(i => this.data.effects[i].title.toLowerCase().includes(this.query.toLowerCase().trim())); }
    close() { this.bottomSheetRef.dismiss(); }
    colors(effect: PixelEffect): string[] {
        const palette = (effect as PixelEffect & { palette?: { R: number; G: number; B: number }[] }).palette;
        return palette?.length ? palette.slice(0, 6).map(c => 'rgb(' + c.R + ',' + c.G + ',' + c.B + ')') : ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2'];
    }
    openLink(index: number): void {
        this.bottomSheetRef.dismiss(index);
    }

    effectIcon(effect: PixelEffect) {
        return iconCharForEffect(effect);
    }
}

enum State {
    Init,
    Paused,
    Error,
    Work,
};

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit, OnDestroy {

    @ViewChild('ambient') ambient!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('transitionCanvas') transitionCanvas!: ElementRef<HTMLCanvasElement>;
    private previewAnimation?: Animation;
    @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
    @ViewChild('image') image!: ElementRef<HTMLElement>;
    @ViewChild('contentwrapper') contentwrapper!: ElementRef<HTMLElement>;

    readonly State = State;

    // title of application
    title: string = 'TurboPixel';
    // repo
    repoLink: string = 'https://github.com/ALEXGREENCH/turbopixel';
    appLink: string = 'https://alexgreench.github.io/turbopixel/';
    socLink: string = 'https://t.me/turborium';
    // current state
    state: State = State.Init;
    // has processed frame
    hasFrame: boolean = false;
    // value of current effect
    effectValue: number = 0.5;
    // current effect
    selectedEffect: number = 0;

    effects: Array<PixelEffect> = effects;

    sourceImage?: HTMLImageElement;
    sourceLabel = 'DEMO PHOTO';
    importError = '';
    private camera!: Camera;

    resumePreview() {
        if (this.sourceImage) {
            this.state = State.Work;
            clearInterval(this.timer);
            this.timer = setInterval(() => this.updateFrame(), 1000 / this.cameraFPS);
            this.updateFrame();
        } else {
            this.cameraStart(CameraType.Current);
        }
    }
    startCamera() {
        this.cameraStop();
        this.sourceImage = undefined;
        this.sourceLabel = 'LIVE CAMERA';
        this.cameraStart(this.camera.hasEnvironmentCamera ? CameraType.Environment : CameraType.User);
    }
    async loadPhoto(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        try {
            const photo = new Image();
            photo.src = url;
            await photo.decode();
            this.cameraStop();
            this.sourceImage = photo;
            this.sourceLabel = 'YOUR PHOTO';
            this.importError = '';
            this.resumePreview();
        } catch {
            this.importError = 'This image could not be opened. Try a PNG, JPEG or WebP photo.';
        } finally {
            URL.revokeObjectURL(url);
            input.value = '';
        }
    }
    async useDemo() {
        const photo = new Image();
        photo.src = 'assets/demo-landscape.svg';
        try {
            await photo.decode();
            this.sourceImage = photo;
            this.sourceLabel = 'DEMO PHOTO';
            this.resumePreview();
        } catch { this.importError = 'Open a photo or start the camera to begin.'; }
    }

    private contentwrapperResizeObserver?: ResizeObserver;
    private timer: any = 0;
    private hangsFrameCount: number = 0;
    private effectMaxWidth: number = 320;
    private effectMaxHeight: number = 320;
    private resumeAfterVisibility = false;
    private sourceCanvas = document.createElement('canvas');
    private onVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && this.state === State.Work) {
            this.resumeAfterVisibility = true;
            this.cameraStop();
        } else if (document.visibilityState === 'visible' && this.resumeAfterVisibility) {
            this.resumeAfterVisibility = false;
            this.resumePreview();
        }
    };
    private cachedCanvas = document.createElement('canvas');
    private watermark = new Image();

    private readonly cameraFPS = 25;
    private readonly hangsTime = 1800;
    private optics?: GlassOptics;

    constructor(private dialog: MatDialog, private bottomSheet: MatBottomSheet, public appearance: Appearance, private zone: NgZone, public install: AppInstall) {

    }

    clickAppearance() {
        this.dialog.open(AppearanceComponent, { panelClass: 'glass-dialog', width: '420px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 32px)' });
    }
    clickInstall() {
        this.dialog.open(InstallComponent, { panelClass: 'glass-dialog', width: '420px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 32px)' });
    }

    @HostListener('pointermove', ['$event'])
    reflectPointer(event: PointerEvent) {
        if (event.pointerType !== 'mouse' || this.appearance.still || this.appearance.opaque || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const surface = (event.target as HTMLElement).closest<HTMLElement>('.liquid-glass');
        if (!surface) return;
        const bounds = surface.getBoundingClientRect();
        surface.style.setProperty('--shine-x', ((event.clientX - bounds.left) / bounds.width * 100).toFixed(1) + '%');
        surface.style.setProperty('--shine-y', ((event.clientY - bounds.top) / bounds.height * 100).toFixed(1) + '%');
    }

    // <next>
    clickNextEffect() {
        let index = this.selectedEffect != this.effects.length - 1 ? this.selectedEffect + 1 : 0;
        this.changeEffect(index);
    }

    // <before>
    clickBeforeEffect() {
        let index = this.selectedEffect != 0 ? this.selectedEffect - 1 : this.effects.length - 1;
        this.changeEffect(index);
    }

    // <effects>
    clickOpenBottomSheetEffect() {
        this.bottomSheet.open(BottomSheetEffects, {
            panelClass: 'palette-sheet',
            ariaLabel: 'Choose a palette',
            data: {
                effects: this.effects,
                selected: this.selectedEffect,
            }
        })
        .afterDismissed().subscribe((result) => {
            if (result != null)
                this.changeEffect(result);
        });
    }

    // <photo>
    clickTakePhoto() {
        // upscale
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.cachedCanvas.width * 4;
        tempCanvas.height = this.cachedCanvas.height * 4;
        tempCanvas.getContext("2d")!.imageSmoothingEnabled = false;
        tempCanvas.getContext("2d")!.drawImage(
            this.cachedCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // get image and name
        const dataUrl = tempCanvas.toDataURL('image/png');
        let fileName = 'TurboPixel-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
        const shareText = '#TurboPixel with \"' + this.effects[this.selectedEffect].title + '" palette' + '\n' + this.appLink;

        // save dialog
        // https://stackoverflow.com/questions/68094609/ios-15-safari-floating-address-bar
        const dialogRef = this.dialog.open(SaveDialogComponent, {
            disableClose: false,
            panelClass: 'glass-dialog',
            width: "460px",
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)",
            // minWidth: "calc(50 * var(--safe-width))",
            // minHeight: "calc(60 * var(--safe-height))",
            data: {
                imageUrl: dataUrl,
                fileName: fileName,
                description: shareText,
            } as SaveDialogData
        });

        // camera off
        dialogRef.afterOpened().subscribe(() => {
            this.cameraStop();
        });

        // camer on
        dialogRef.afterClosed().subscribe(() => {
            this.resumePreview();
        });
    }

    // <random>
    clickRandom() {

        this.changeEffect(Math.floor(Math.random() * this.effects.length), 0.1 + Math.random() * 0.8);
    }

    // <about>
    clickAbout() {
        // NOT WORK???
        // https://stackoverflow.com/questions/45928423/get-rid-of-white-space-around-angular-material-modal-dialog
        // about dialog
        const dialogRef = this.dialog.open(AboutDialogComponent, {
            disableClose: false,
            panelClass: 'glass-dialog',
            //panelClass: 'app-dialog-container',
            width: "460px",
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)",
            data: {
                appLink: this.appLink,
                repoLink: this.repoLink,
                socLink: this.socLink,
            }
        });

        // camera off
        dialogRef.afterOpened().subscribe(() => {
            this.cameraStop();
        });

        // camera on
        dialogRef.afterClosed().subscribe(async (result) => {
            this.resumePreview();
        });
        /*navigator.clipboard.writeText(this.appLink)
        .then(() => {
            this.copyLinkToAppTooltip.disabled = false;
            this.copyLinkToAppTooltip.show()
            setTimeout(() => {
                this.copyLinkToAppTooltip.disabled = true;
            }, 1000);
        });*/
    }

    cameraStart(cameraType: CameraType) {
        this.state = State.Init;
        Promise.resolve().then(() => this.camera.start(
            this.effectMaxWidth,//this.effects[this.selectedEffect].width,
            this.effectMaxHeight,//this.effects[this.selectedEffect].height,
            cameraType
        ))
        .then(() => {
            this.state = State.Work;

            // addEventListener("inactive".. not fired on iOS
            this.hangsFrameCount = 0;

            clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.updateFrame();
            },
            1000 / this.cameraFPS);
            this.updateFrame();
        })
        .catch((error) => {
            this.state = State.Error;
            const dialogRef = this.dialog.open(CameraErrorDialogComponent, {
                disableClose: false, panelClass: 'glass-dialog'
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result == CameraErrorDialogResult.ReloadPage) {
                    window.location.reload();
                } else if (result == CameraErrorDialogResult.TryAgain) {
                    this.cameraStart(cameraType);
                } else {
                    this.useDemo();
                }
            });
        });
    }

    cameraStop() {
        // Retain the last frame beneath translucent sheets.
        clearInterval(this.timer);
        this.hasFrame = false;
        this.state = State.Paused;
        this.camera.stop();
    }

    clickNextCamera() {
        this.cameraStop();
        this.cameraStart(CameraType.Next);
    }

    changeEffect(effectIndex: number, value = 0.5) {
        const overlay = this.transitionCanvas?.nativeElement;
        const animate = overlay && this.hasFrame && !this.appearance.still && !matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.previewAnimation?.cancel();
        if (animate) {
            overlay.width = this.canvas.nativeElement.width;
            overlay.height = this.canvas.nativeElement.height;
            overlay.getContext('2d')!.drawImage(this.canvas.nativeElement, 0, 0);
        }
        this.hasFrame = false;
        this.selectedEffect = effectIndex;
        this.effectValue = value;
        if (this.state === State.Work) this.updateFrame();
        if (animate) this.previewAnimation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.2,.65,.3,1)' });
    }

    // mmm... some smell
    updateFrame() {
        this.hasFrame = false;
        
        // check hangs frames (iOS)
        if (!this.sourceImage && this.hangsTime < this.hangsFrameCount * (1000 / this.cameraFPS)) {
            this.cameraStop();
            this.resumePreview();
            return;
        }

        // try get frame
        const effect = this.effects[this.selectedEffect];
        let frame: ImageData | null;
        if (this.sourceImage) {
            const source = this.sourceCanvas;
            source.width = effect.width;
            source.height = effect.height;
            const context = source.getContext('2d')!;
            const scale = Math.max(source.width / this.sourceImage.naturalWidth, source.height / this.sourceImage.naturalHeight);
            const width = this.sourceImage.naturalWidth * scale;
            const height = this.sourceImage.naturalHeight * scale;
            context.drawImage(this.sourceImage, (source.width - width) / 2, (source.height - height) / 2, width, height);
            frame = context.getImageData(0, 0, source.width, source.height);
        } else {
            frame = this.camera.getFrameWithSize(effect.width, effect.height);
        }
        if (frame == null) {
            this.canvas.nativeElement.getContext("2d")!.clearRect(
                0, 0,
                this.canvas.nativeElement.width, this.canvas.nativeElement.height
            );
            this.hangsFrameCount++;
            return;
        }

        // no hangs
        this.hangsFrameCount = 0;

        // process
        this.effects[this.selectedEffect].process(frame, this.effectValue);

        // draw frame
        if (this.cachedCanvas.width != frame.width || this.cachedCanvas.height != frame.height) {
            this.cachedCanvas.width = frame.width;
            this.cachedCanvas.height = frame.height;
        }
        this.cachedCanvas.getContext("2d")!.putImageData(frame, 0, 0);

        // watermark
        if (this.watermark.complete && this.watermark.naturalWidth != 0) {
            this.cachedCanvas.getContext("2d")!.drawImage(
                this.watermark,
                this.cachedCanvas.width - this.watermark.width,
                this.cachedCanvas.height - this.watermark.height,
            );
        }

        // draw frame on screen 
        let scaledWidth = frame.width * 2;
        let scaledHeight = frame.height * 2;
        if (this.canvas.nativeElement.width != scaledWidth || this.canvas.nativeElement.height != scaledHeight) {
            this.canvas.nativeElement.width = scaledWidth;
            this.canvas.nativeElement.height = scaledHeight;
        }
        this.canvas.nativeElement.getContext("2d")!.imageSmoothingEnabled = false;
        this.canvas.nativeElement.getContext("2d")!.drawImage(
            this.cachedCanvas, 0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

        // Low-resolution color field from the actual image, beneath the glass.
        const ambient = this.ambient?.nativeElement;
        if (ambient) {
            if (ambient.width !== 256) { ambient.width = 256; ambient.height = 256; }
            ambient.getContext('2d')!.drawImage(this.cachedCanvas, 0, 0, 256, 256);
        }
        this.hasFrame = true;
        this.zone.runOutsideAngular(() => this.optics?.setSource(this.cachedCanvas, this.sourceImage ? `${this.sourceImage.src}|${this.selectedEffect}|${this.effectValue}|${this.watermark.complete}` : undefined));
    }

    cameraWork() {
        this.state = State.Work;

        this.updateFrame();
    }

    ngAfterViewInit() {
        this.zone.runOutsideAngular(() => this.optics = new GlassOptics(this.canvas.nativeElement));
        document.addEventListener('visibilitychange', this.onVisibilityChange);

        this.contentwrapperResizeObserver = new ResizeObserver((entries) => {
            const aspect = this.effects[this.selectedEffect].width / this.effects[this.selectedEffect].height;
            const width = Math.min(entries[0].contentRect.width, entries[0].contentRect.height * aspect);
            this.image.nativeElement.style.width = width + 'px';
            this.image.nativeElement.style.height = width / aspect + 'px';
        });
        this.contentwrapperResizeObserver.observe(this.contentwrapper.nativeElement);

        // calc max effect size
        for (let effect of this.effects) {
            if (effect.width > this.effectMaxWidth)
                this.effectMaxWidth = effect.width;
            if (effect.height > this.effectMaxHeight)
                this.effectMaxHeight = effect.height;
        }

        this.watermark.src = 'assets/watermark.png';

        // camera 
        this.camera = new Camera(this.video.nativeElement);
        //this.changeEffect(0);
        this.useDemo();
    }

    ngOnDestroy() {
        this.previewAnimation?.cancel();
        this.optics?.destroy();
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.contentwrapperResizeObserver?.disconnect();
        clearInterval(this.timer);
        this.camera?.stop();
    }

    effectIcon(effect: PixelEffect) {
        return iconCharForEffect(effect);
    }
}
