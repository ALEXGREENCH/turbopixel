const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const scopeUrl = 'http://localhost/turbopixel/';
const absolute = input => new URL(typeof input === 'string' ? input : input.url, scopeUrl).href;

// Execute the installed Angular worker, substituting only the browser/network
// boundaries. Release A files really disappear from the simulated server.
class Cache {
    data = new Map();
    async match(request) { return this.data.get(absolute(request))?.clone(); }
    async put(request, response) { this.data.set(absolute(request), response.clone()); }
    async delete(request) { return this.data.delete(absolute(request)); }
    async keys() { return [...this.data.keys()].map(url => new Request(url)); }
}
class Caches {
    data = new Map();
    async open(name) { if (!this.data.has(name)) this.data.set(name, new Cache()); return this.data.get(name); }
    async keys() { return [...this.data.keys()]; }
    async has(name) { return this.data.has(name); }
    async delete(name) { return this.data.delete(name); }
    async match(request) { for (const cache of this.data.values()) { const response = await cache.match(request); if (response) return response; } }
}
function release(version) {
    const files = new Map([
        ['/turbopixel/index.html', `<html>${version}</html>`],
        [`/turbopixel/main.${version}.js`, `// bundle ${version}`],
        ['/turbopixel/assets/demo.svg', `<svg>${version}</svg>`]
    ]);
    const manifest = { configVersion: 1, timestamp: version.charCodeAt(0), appData: { version }, index: '/turbopixel/index.html',
        navigationRequestStrategy: 'freshness', navigationUrls: [{ positive: true, regex: '^/.*$' }],
        assetGroups: [{ name: 'app', installMode: 'prefetch', updateMode: 'prefetch', urls: [...files.keys()], patterns: [], cacheQueryOptions: { ignoreVary: true } }],
        dataGroups: [], hashTable: Object.fromEntries([...files].map(([url, contents]) => [url, createHash('sha1').update(contents).digest('hex')])) };
    return { files, manifest };
}
async function harness() {
    const server = { release: release('A'), offline: false };
    const caches = new Caches(), clients = new Map(), requests = [], messages = [];
    const scope = { caches, registration: { scope: scopeUrl, active: null, unregister: async () => true },
        addEventListener() {}, skipWaiting: async () => {},
        clients: { claim: async () => {}, matchAll: async () => [...clients.values()], get: async id => clients.get(id) },
        fetch: async request => {
            const url = new URL(absolute(request)); requests.push(url.pathname);
            if (server.offline) throw new Error('offline');
            if (url.pathname.endsWith('/ngsw.json')) return new Response(JSON.stringify(server.release.manifest));
            const body = server.release.files.get(url.pathname === '/turbopixel/' ? '/turbopixel/index.html' : url.pathname);
            return new Response(body ?? 'Not found', { status: body === undefined ? 404 : 200 });
        }
    };
    const code = fs.readFileSync(require.resolve('@angular/service-worker/ngsw-worker.js'), 'utf8')
        .replace('new Driver(scope, adapter, new CacheDatabase(adapter));', 'self.driver = new Driver(scope, adapter, new CacheDatabase(adapter));');
    vm.runInNewContext(code, { self: scope, Request: class extends Request { constructor(input, init) { super(absolute(input), init); } },
        Response, Headers, URL, console, Client: class {}, setTimeout: (fn, ms) => { const timer = setTimeout(fn, ms); timer.unref(); return timer; }, clearTimeout });
    const driver = scope.driver;
    driver.initialized = driver.initialize(); await driver.initialized;
    async function fetchFor(id, pathname, navigation = false) {
        if (!clients.has(id)) clients.set(id, { id, postMessage: message => messages.push(message) });
        const request = new Request(new URL(pathname, scopeUrl), { headers: { Accept: navigation ? 'text/html' : '*/*' } });
        if (navigation) Object.defineProperty(request, 'mode', { value: 'navigate' });
        return driver.handleFetch({ request, clientId: id, resultingClientId: '', waitUntil() {} });
    }
    return { server, caches, clients, driver, requests, messages, fetchFor };
}

test('installed A updates directly to C after A/B files leave the server, and remains usable offline', async () => {
    const h = await harness();
    assert.equal(await (await h.fetchFor('old-tab', 'main.A.js')).text(), '// bundle A');
    const oldHash = h.driver.latestHash;
    h.server.release = release('C');
    assert.equal(h.server.release.files.has('/turbopixel/main.A.js'), false);
    assert.equal(await h.driver.checkForUpdate(), true);
    assert.notEqual(h.driver.latestHash, oldHash);
    assert.ok(h.messages.some(message => message.type === 'VERSION_READY'));
    // A remains intact while its tab is editing, even with the old server files gone.
    assert.equal(await (await h.fetchFor('old-tab', 'main.A.js')).text(), '// bundle A');
    h.server.offline = true;
    assert.equal(await (await h.fetchFor('new-tab', '', true)).text(), '<html>C</html>');
    assert.equal(await (await h.fetchFor('new-tab', 'main.C.js')).text(), '// bundle C');
    assert.equal(await (await h.fetchFor('new-tab', 'assets/demo.svg')).text(), '<svg>C</svg>');
    await h.driver.cleanupCaches(); assert.equal(h.driver.versions.size, 2);
    h.clients.delete('old-tab');
    await h.driver.cleanupCaches(); assert.equal(h.driver.versions.size, 1);
    assert.equal((await h.caches.keys()).some(name => name.includes(oldHash)), false);
});

test('incomplete release never replaces the last complete offline version', async () => {
    const h = await harness();
    await h.fetchFor('tab', 'main.A.js'); const current = h.driver.latestHash;
    h.server.release = release('B'); h.server.release.files.delete('/turbopixel/main.B.js');
    assert.equal(await h.driver.checkForUpdate(), false);
    assert.equal(h.driver.latestHash, current);
    h.server.offline = true;
    assert.equal(await (await h.fetchFor('tab', 'main.A.js')).text(), '// bundle A');
});

test('cleanup stays inside TurboPixel scope and does not delete GreenPixel caches', async () => {
    const h = await harness();
    await h.caches.open('ngsw:/greenpixel/:keep-me');
    await h.caches.open('unrelated-user-cache');
    await h.driver.cleanupCaches();
    assert.equal(await h.caches.has('ngsw:/greenpixel/:keep-me'), true);
    assert.equal(await h.caches.has('unrelated-user-cache'), true);
});
