import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { preparePng, downloadFile, canShareFile } from './photo-export';

export enum SaveDialogResult { Cancel, Download, Share, Copy }
export interface SaveDialogData { imageUrl: string; fileName: string; description: string; }

@Component({ selector: 'app-save-dialog', templateUrl: './save-dialog.component.html', styleUrls: ['./save-dialog.component.css'] })
export class SaveDialogComponent implements OnDestroy {
    readonly SaveDialogResult = SaveDialogResult;
    file?: File;
    previewUrl = '';
    busy = false;
    status = '';
    error = '';

    constructor(@Inject(MAT_DIALOG_DATA) public data: SaveDialogData) {
        // Prepare before the next user gesture, without awaiting a fetch in the
        // share/clipboard handler. Safari needs the original user activation.
        try {
            this.file = preparePng(data.imageUrl, data.fileName);
            this.previewUrl = URL.createObjectURL(this.file);
        } catch {
            this.error = 'This photo could not be prepared. Close this sheet and take another photo.';
        }
    }
    get allowCopy(): boolean { return !!navigator.clipboard?.write && typeof ClipboardItem !== 'undefined'; }
    get allowShare(): boolean { return !!this.file && canShareFile(this.file); }
    async copyDescription() {
        this.error = '';
        try {
            await navigator.clipboard.writeText(this.data.description);
            this.status = 'Caption copied.';
        } catch { this.error = 'Could not copy the caption. You can select and copy the text below.'; }
    }
    clickSave() {
        if (!this.file || this.busy) return;
        this.error = '';
        try {
            downloadFile(this.file);
            this.status = 'Download requested. Check your browser’s Downloads or the Files app.';
        } catch { this.error = 'Could not start the download. Try Share or touch and hold the photo.'; }
    }
    async clickCopy() {
        if (!this.file || this.busy || !this.allowCopy) return;
        this.busy = true;
        this.error = '';
        try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': this.file })]);
            this.status = 'Photo copied.';
        } catch { this.error = 'Clipboard access is unavailable. Download or share the PNG instead.'; }
        finally { this.busy = false; }
    }
    async clickShare() {
        if (!this.file || this.busy || !this.allowShare) return;
        this.busy = true;
        this.error = '';
        this.status = '';
        try {
            // Top-level navigator, called directly from the click handler.
            await navigator.share({ files: [this.file] });
            this.status = 'Photo shared.';
        } catch (error) {
            if ((error as { name?: string })?.name !== 'AbortError') this.error = 'Sharing is unavailable right now. Try Download PNG instead.';
        } finally { this.busy = false; }
    }
    ngOnDestroy() { if (this.previewUrl) URL.revokeObjectURL(this.previewUrl); }
}
