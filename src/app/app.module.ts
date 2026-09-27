import { SheetDrag } from './sheet-drag';
import { IconComponent } from './icon.component';
import { AppearanceComponent } from './appearance';
import { InstallComponent } from './install';
import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, BottomSheetEffects } from './app.component';
import { CameraErrorDialogComponent } from './camera-error-dialog/camera-error-dialog.component';
import { SaveDialogComponent } from './save-dialog/save-dialog.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialogConfig, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ServiceWorkerModule } from '@angular/service-worker';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        IconComponent,
        SheetDrag,
        AppearanceComponent,
        InstallComponent,
        CameraErrorDialogComponent,
        BottomSheetEffects,
        SaveDialogComponent,
        AboutDialogComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        // --
        FormsModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatDialogModule,
        MatCardModule,
        MatSliderModule,
        MatProgressSpinnerModule,
        MatBottomSheetModule,
        MatTooltipModule,
        // --
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Frame timers keep this camera app busy; do not wait for stability.
            registrationStrategy: 'registerImmediately'
        }),
    ],
    providers: [{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { ...new MatDialogConfig(), enterAnimationDuration: 280, exitAnimationDuration: 180 } }],
    bootstrap: [AppComponent]
})
export class AppModule { }
