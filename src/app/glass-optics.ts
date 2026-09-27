// One WebGL context renders the photographic scene through rounded glass lenses.
// Each surface receives a 2D copy; DOM labels stay crisp above the shader.
const vertex = `attribute vec2 position; varying vec2 uv;
void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
const fragment = `
precision highp float;
varying vec2 uv;
uniform sampler2D photo;
uniform vec2 viewport, size, origin, light;
uniform vec4 preview;
uniform float radius, dark, clearGlass;
float box(vec2 p){
  vec2 q=abs(p-size*.5)-(size*.5-radius);
  return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
}
vec3 scene(vec2 p){
  vec2 t=clamp(p/viewport,0.,1.);
  // Same photo-derived field as the page, sampled independently of the DOM.
  vec3 c=texture2D(photo,t).rgb*.4;
  c+=texture2D(photo,t+vec2(.012,0.)).rgb*.15;
  c+=texture2D(photo,t-vec2(.012,0.)).rgb*.15;
  c+=texture2D(photo,t+vec2(0.,.012)).rgb*.15;
  c+=texture2D(photo,t-vec2(0.,.012)).rgb*.15;
  c=mix(mix(vec3(.94,.945,.955),vec3(.075,.08,.10),dark),c,mix(.22,.16,dark));
  vec2 imageUV=(p-preview.xy)/max(preview.zw,vec2(1.));
  if(clearGlass>.5 && min(imageUV.x,imageUV.y)>=0. && max(imageUV.x,imageUV.y)<=1.) c=texture2D(photo,imageUV).rgb;
  return c;
}
void main(){
  vec2 p=vec2(uv.x,1.-uv.y)*size;
  float d=box(p);
  float coverage=1.-smoothstep(-.7,.7,d);
  if(coverage<=0.) discard;
  vec2 n=normalize(vec2(box(p+vec2(.5,0.))-box(p-vec2(.5,0.)),box(p+vec2(0.,.5))-box(p-vec2(0.,.5)))+vec2(.0001));
  float bevel=min(10.,min(size.x,size.y)*.23);
  float edge=1.-smoothstep(0.,bevel,-d);
  // Curved lens: inward displacement grows toward the edge; separate RGB rays.
  float bend=sin(edge*1.570796)*8.;
  vec2 ray=origin+p-n*bend;
  float dispersion=edge*.45;
  vec3 color=vec3(scene(ray+n*dispersion).r,scene(ray).g,scene(ray-n*dispersion).b);
  vec3 tint=mix(vec3(.97,.975,.985),vec3(.12,.14,.18),dark);
  // Regular material: protect every label with a stable luminance field.
  // Refraction is confined to the outer bevel, clear of the padded controls.
  float body=smoothstep(1.,10.,-d);
  color=mix(color,tint,mix(.72,.992,body));
  if(clearGlass>.5) color=mix(color,vec3(.015,.025,.045),.55);
  vec2 direction=normalize(light-(origin+p)+vec2(.001));
  float facing=dot(n,direction);
  float rim=exp(-abs(d+1.1)*1.1);
  color+=vec3(.85,.92,1.)*pow(max(facing,0.),5.)*rim*.15;
  color+=vec3(1.,.90,.78)*pow(max(-facing,0.),7.)*rim*.04;
  color-=pow(max(-facing,0.),2.)*edge*.015;
  gl_FragColor=vec4(clamp(color,0.,1.),coverage);
}`;

export class GlassOptics {
    private readonly stage = document.createElement('canvas');
    private gl: WebGLRenderingContext | null = null;
    private program?: WebGLProgram;
    private texture?: WebGLTexture;
    private buffer?: WebGLBuffer;
    private surfaces = new Map<HTMLElement, HTMLCanvasElement>();
    private source?: HTMLCanvasElement;
    private dirtyTexture = false;
    private revision?: string;
    private frame = 0;
    private destroyed = false;
    private pointer = [-100, -100];
    private lightPosition?: number[];
    private readonly media = ['(prefers-reduced-transparency: reduce)', '(prefers-reduced-motion: reduce)', '(prefers-contrast: more)', '(forced-colors: active)', '(prefers-color-scheme: dark)'].map(q => matchMedia(q));
    private readonly resize = new ResizeObserver(() => this.invalidate());
    private readonly mutations = new MutationObserver(records => {
        if (records.some(r => r.type === 'attributes' || [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].some(n => !(n instanceof HTMLCanvasElement)))) this.invalidate();
    });
    private readonly request = () => this.invalidate();
    private readonly move = (e: PointerEvent) => {
        if (this.still() || e.pointerType !== 'mouse') return;
        this.pointer = [e.clientX, e.clientY]; this.invalidate();
    };
    private readonly lost = (event: Event) => { event.preventDefault(); this.fallback(); };
    private readonly restored = () => { this.init(); this.dirtyTexture = true; this.invalidate(); };

    constructor(private readonly preview: HTMLCanvasElement) {
        this.stage.addEventListener('webglcontextlost', this.lost);
        this.stage.addEventListener('webglcontextrestored', this.restored);
        this.init();
        this.mutations.observe(document.body, { childList: true, subtree: true });
        this.mutations.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-style', 'data-still', 'data-opaque'] });
        this.resize.observe(document.body);
        window.addEventListener('resize', this.request);
        document.addEventListener('scroll', this.request, true);
        document.addEventListener('visibilitychange', this.request);
        document.addEventListener('pointermove', this.move, { passive: true });
        this.media.forEach(m => m.addEventListener('change', this.request));
    }

    private init() {
        try {
            const gl = this.stage.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: false });
            if (!gl) return;
            this.gl = gl;
            const compile = (type: number, text: string) => {
                const shader = gl.createShader(type)!;
                gl.shaderSource(shader, text); gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Glass shader compilation failed'); }
                return shader;
            };
            const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
            const program = gl.createProgram()!;
            gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
            gl.deleteShader(vs); gl.deleteShader(fs);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); throw new Error('Glass shader link failed'); }
            this.program = program; gl.useProgram(program);
            this.buffer = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
            const position = gl.getAttribLocation(program, 'position');
            gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
            this.texture = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        } catch { this.fallback(); }
    }

    setSource(source: HTMLCanvasElement, revision?: string) {
        if (revision !== undefined && this.revision === revision) return;
        this.revision = revision; this.source = source; this.dirtyTexture = true; this.invalidate();
    }
    private still() { return document.documentElement.dataset['still'] === 'true' || this.media[1].matches; }
    private blocked() { return (!!document.documentElement.dataset['style'] && document.documentElement.dataset['style'] !== 'modern') || document.documentElement.dataset['opaque'] === 'true' || this.media[0].matches || this.media[2].matches || this.media[3].matches; }
    private invalidate() {
        if (!this.frame && !this.destroyed && !document.hidden) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
    }
    private fallback() { this.surfaces.forEach((canvas, host) => { host.classList.remove('has-optics'); canvas.hidden = true; }); }

    private render() {
        const gl = this.gl;
        if (this.blocked() || !gl || !this.program || gl.isContextLost() || !this.source) { this.fallback(); return; }
        try {
            for (const [host, canvas] of this.surfaces) if (!host.isConnected) { this.resize.unobserve(host); canvas.remove(); this.surfaces.delete(host); }
            document.querySelectorAll<HTMLElement>('.liquid-glass').forEach(host => {
                if (this.surfaces.has(host)) return;
                const canvas = document.createElement('canvas'); canvas.className = 'glass-optics'; canvas.setAttribute('aria-hidden', 'true');
                host.prepend(canvas); this.surfaces.set(host, canvas); this.resize.observe(host);
            });
            if (this.dirtyTexture) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source); this.dirtyTexture = false; }
            const uniform = (name: string) => gl.getUniformLocation(this.program!, name);
            const root = document.documentElement;
            const dark = root.dataset['theme'] === 'dark' || (root.dataset['theme'] !== 'light' && this.media[4].matches);
            gl.uniform1f(uniform('dark'), dark ? 1 : 0);
            gl.uniform2f(uniform('viewport'), innerWidth, innerHeight);
            const image = this.preview.getBoundingClientRect();
            gl.uniform4f(uniform('preview'), image.left, image.top, image.width, image.height);
            const pointer = this.still() || this.pointer[0] < 0 ? [innerWidth * .2, -innerHeight * .2] : this.pointer;
            if (!this.lightPosition || this.still()) this.lightPosition = [...pointer];
            const distance = Math.hypot(pointer[0] - this.lightPosition[0], pointer[1] - this.lightPosition[1]);
            this.lightPosition = this.lightPosition.map((value, i) => value + (pointer[i] - value) * .24);
            gl.uniform2f(uniform('light'), this.lightPosition[0], this.lightPosition[1]);
            if (distance > .5 && !this.still()) this.invalidate();
            const scale = Math.min(devicePixelRatio || 1, 1.5);
            for (const [host, canvas] of this.surfaces) {
                const rect = host.getBoundingClientRect();
                if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) continue;
                const width = Math.round(rect.width * scale), height = Math.round(rect.height * scale);
                if (this.stage.width !== width || this.stage.height !== height) { this.stage.width = width; this.stage.height = height; }
                gl.viewport(0, 0, width, height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
                gl.uniform2f(uniform('size'), rect.width, rect.height);
                gl.uniform2f(uniform('origin'), rect.left, rect.top);
                gl.uniform1f(uniform('radius'), Math.min(parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0, rect.width / 2, rect.height / 2));
                gl.uniform1f(uniform('clearGlass'), host.classList.contains('glass-clear') ? 1 : 0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
                const context = canvas.getContext('2d')!; context.clearRect(0,0,width,height); context.drawImage(this.stage,0,0);
                canvas.hidden = false; host.classList.add('has-optics');
            }
        } catch { this.fallback(); }
    }

    destroy() {
        this.destroyed = true; cancelAnimationFrame(this.frame);
        this.resize.disconnect(); this.mutations.disconnect();
        window.removeEventListener('resize', this.request); document.removeEventListener('scroll', this.request, true);
        document.removeEventListener('visibilitychange', this.request); document.removeEventListener('pointermove', this.move);
        this.media.forEach(m => m.removeEventListener('change', this.request));
        this.fallback(); this.surfaces.forEach(canvas => canvas.remove()); this.surfaces.clear();
        if (this.gl) { this.gl.deleteBuffer(this.buffer || null); this.gl.deleteTexture(this.texture || null); this.gl.deleteProgram(this.program || null); }
        this.stage.removeEventListener('webglcontextlost', this.lost); this.stage.removeEventListener('webglcontextrestored', this.restored);
        this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
