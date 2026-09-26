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

import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject } from '@angular/core';
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
    <mat-nav-list>
      <a mat-list-item role="button" tabindex="0" (keydown.enter)="openLink(i)" (keydown.space)="$event.preventDefault(); openLink(i)" (click)="openLink(i)" *ngFor="let effect of data.effects; index as i;">
        <span class="appicon">{{effectIcon(effect)}} </span><span matLine>{{effect.title}}</span>
      </a>
    </mat-nav-list>
  `,
})

export class BottomSheetEffects {
    constructor(
        private bottomSheetRef: MatBottomSheetRef<BottomSheetEffects>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: { effects: Array<PixelEffect> }
    ) { }

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

    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
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

    constructor(private dialog: MatDialog, private bottomSheet: MatBottomSheet) {

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
            data: {
                effects: this.effects,
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

        this.changeEffect(Math.floor(Math.random() * this.effects.length));
        this.effectValue = 0.1 + Math.random() * 0.8; 
    }

    // <about>
    clickAbout() {
        // NOT WORK???
        // https://stackoverflow.com/questions/45928423/get-rid-of-white-space-around-angular-material-modal-dialog
        // about dialog
        const dialogRef = this.dialog.open(AboutDialogComponent, {
            disableClose: false,
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
                disableClose: false
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
        this.canvas.nativeElement.getContext('2d')?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        clearInterval(this.timer);
        this.hasFrame = false;
        this.state = State.Paused;
        this.camera.stop();
    }

    clickNextCamera() {
        this.cameraStop();
        this.cameraStart(CameraType.Next);
    }

    changeEffect(effectIndex: number) {
        this.hasFrame = false;
        this.selectedEffect = effectIndex;
        this.effectValue = 0.5;
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

        this.hasFrame = true;
    }

    cameraWork() {
        this.state = State.Work;

        this.updateFrame();
    }

    ngAfterViewInit() {
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
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.contentwrapperResizeObserver?.disconnect();
        clearInterval(this.timer);
        this.camera?.stop();
    }

    effectIcon(effect: PixelEffect) {
        return iconCharForEffect(effect);
    }
}

