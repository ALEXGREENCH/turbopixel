/** Export helpers use capabilities, never browser names. */
export function preparePng(dataUrl: string, name: string): File {
    const prefix = 'data:image/png;base64,';
    if (!dataUrl.startsWith(prefix)) throw new Error('Expected a PNG data URL');
    const binary = atob(dataUrl.slice(prefix.length));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (bytes.length < 8 || ![137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) throw new Error('Invalid PNG');
    const fileName = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\.png$/i, '') || 'TurboPixel';
    return new File([bytes], fileName + '.png', { type: 'image/png' });
}
export function canShareFile(file: File): boolean {
    try {
        return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    } catch { return false; }
}
export function downloadFile(file: File): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    try { link.click(); }
    finally {
        link.remove();
        // Keep an independent URL alive after closing the sheet. Immediate
        // revocation can race Safari's download; release it after one minute.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
}
