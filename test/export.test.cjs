const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRe8AAAAASUVORK5CYII=';

// Run the actual TypeScript methods with browser boundaries replaced. This lets
// us assert activation timing and unsupported APIs without pretending to run iOS.
function harness(options = {}) {
    const events = [];
    const timers = [];
    let count = 0;
    const navigator = options.navigator || {};
    const document = {
        body: { appendChild(link) { link.connected = true; events.push('append'); } },
        createElement(tag) {
            assert.equal(tag, 'a');
            return {
                style: {}, connected: false,
                click() {
                    assert.equal(this.connected, true);
                    events.push({ download: this.download, href: this.href });
                    if (options.clickError) throw new Error('download blocked');
                },
                remove() { this.connected = false; events.push('remove'); }
            };
        }
    };
    const globals = {
        navigator, document, File, Blob, Uint8Array, atob,
        URL: {
            createObjectURL(file) { assert.ok(file instanceof File); return 'blob:test-' + (++count); },
            revokeObjectURL(url) { events.push({ revoked: url }); }
        },
        ClipboardItem: class { constructor(data) { this.data = data; } },
        setTimeout(callback, delay) { timers.push({ callback, delay }); }
    };
    function load(relative, imports = {}) {
        const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
        const js = ts.transpileModule(source, { compilerOptions: {
            module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
            experimentalDecorators: true
        }}).outputText;
        const exports = {};
        vm.runInNewContext(js, { ...globals, exports, require(name) {
            if (name in imports) return imports[name];
            throw new Error('Unexpected import ' + name);
        }});
        return exports;
    }
    const helpers = load('src/app/save-dialog/photo-export.ts');
    const { SaveDialogComponent } = load('src/app/save-dialog/save-dialog.component.ts', {
        '@angular/core': { Component: () => target => target, Inject: () => () => {} },
        '@angular/material/dialog': { MAT_DIALOG_DATA: 'data' },
        './photo-export': helpers
    });
    return { helpers, events, timers, navigator, make: () => new SaveDialogComponent({
        imageUrl: png, fileName: 'TurboPixel 12:34/56.png', description: 'A caption'
    }) };
}

test('PNG bytes, MIME and a filesystem-safe filename are preserved', async () => {
    const { helpers } = harness();
    const file = helpers.preparePng(png, 'TurboPixel 12:34/56.PNG');
    assert.equal(file.type, 'image/png');
    assert.equal(file.name, 'TurboPixel 12-34-56.png');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(png.split(',')[1], 'base64'));
    assert.throws(() => helpers.preparePng('data:image/jpeg;base64,AAAA', 'x'));
    assert.throws(() => helpers.preparePng('data:image/png;base64,AAAA', 'x'));
});

test('missing or throwing share APIs hide Share without relying on userAgent', () => {
    for (const navigator of [{}, { share() {} }, { share() {}, canShare: () => false }, { share() {}, canShare() { throw Error(); } }]) {
        assert.equal(harness({ navigator }).make().allowShare, false);
    }
});

test('share is invoked synchronously in the click, with a prepared PNG File', async () => {
    let payload;
    const h = harness({ navigator: { canShare: () => true, share(data) { payload = data; return Promise.resolve(); } } });
    const component = h.make();
    const promise = component.clickShare();
    assert.equal(payload.files[0], component.file);
    assert.equal(payload.files[0].type, 'image/png');
    assert.equal(component.busy, true);
    await promise;
    assert.equal(component.busy, false);
    assert.equal(component.status, 'Photo shared.');
});

test('cancel is silent and sharing can be repeated', async () => {
    let count = 0;
    const h = harness({ navigator: { canShare: () => true, share() {
        count++;
        return count === 1 ? Promise.reject({ name: 'AbortError' }) : Promise.resolve();
    } } });
    const c = h.make();
    await c.clickShare();
    assert.equal(c.error, '');
    assert.equal(c.busy, false);
    await c.clickShare();
    assert.equal(count, 2);
    assert.equal(c.status, 'Photo shared.');
});

test('a second share click is ignored while the share sheet is open', async () => {
    let finish;
    let count = 0;
    const h = harness({ navigator: { canShare: () => true, share() { count++; return new Promise(resolve => finish = resolve); } } });
    const c = h.make();
    const pending = c.clickShare();
    await c.clickShare();
    assert.equal(count, 1);
    finish();
    await pending;
    assert.equal(c.busy, false);
});

test('share rejection gives a recoverable download message', async () => {
    const c = harness({ navigator: { canShare: () => true, share() { throw new Error('denied'); } } }).make();
    await c.clickShare();
    assert.match(c.error, /Download PNG/);
    assert.equal(c.busy, false);
});

test('download attaches the anchor and its URL outlives the closed preview', () => {
    const h = harness();
    const c = h.make();
    c.clickSave();
    assert.equal(h.events[0], 'append');
    assert.deepEqual(h.events[1], { download: 'TurboPixel 12-34-56.png', href: 'blob:test-2' });
    assert.equal(h.events[2], 'remove');
    c.ngOnDestroy();
    assert.deepEqual(h.events[3], { revoked: 'blob:test-1' });
    assert.equal(h.timers[0].delay, 60000);
    h.timers[0].callback();
    assert.deepEqual(h.events[4], { revoked: 'blob:test-2' });
});

test('failed download still cleans up and explains alternatives', () => {
    const h = harness({ clickError: true });
    const c = h.make();
    c.clickSave();
    assert.match(c.error, /Try Share/);
    assert.equal(h.events[2], 'remove');
    assert.equal(h.timers.length, 1);
});

test('clipboard call is synchronous and handles permission rejection', async () => {
    let item;
    const c = harness({ navigator: { clipboard: { write(items) { item = items[0]; return Promise.reject(new Error('denied')); } } } }).make();
    const pending = c.clickCopy();
    assert.equal(item.data['image/png'], c.file);
    await pending;
    assert.match(c.error, /Clipboard access/);
    assert.equal(c.busy, false);
});

test('missing clipboard is unsupported and caption failure is handled', async () => {
    const c = harness().make();
    assert.equal(c.allowCopy, false);
    await c.clickCopy();
    await c.copyDescription();
    assert.match(c.error, /select and copy/);
});
