/**
 * Liquid Background Transition Engine
 * A lightweight WebGL implementation of a premium "liquid splash" cross-fade.
 */

class LiquidBackground {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.gl = this.canvas.getContext('webgl');

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        const isMobile = window.innerWidth <= 768;
        const landscapeImages = [
            'index/blue_butterfly.webp',
            'index/1 (1).webp',
            'index/1 (2).webp',
            'index/1 (3).webp',
            'index/1 (4).webp'
        ];
        const portraitImages = [
            'index/916/blue_butterfly.jpg',
            'index/916/1 (1).png',
            'index/916/1 (2).png',
            'index/916/1 (3).png',
            'index/916/1 (4).png'
        ];

        this.images = this.shuffleArray(isMobile ? portraitImages : landscapeImages);

        this.currentIndex = 0;
        this.nextIndex = 1;
        this.textures = [];
        this.progress = 0;
        this.animating = false;

        this.init();
    }

    async init() {
        // Shaders ... (omitted for brevity in replacement, but I'll keep them)
        const vs = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                vUv.y = 1.0 - vUv.y;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fs = `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float effectFactor;

            void main() {
                vec2 uv = vUv;
                vec2 distortedPosition1 = vec2(uv.x + dispFactor * (sin(uv.y * 10.0 + effectFactor) * 0.1), uv.y);
                vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (sin(uv.y * 10.0 + effectFactor) * 0.1), uv.y);

                vec4 _texture1 = texture2D(texture1, distortedPosition1);
                vec4 _texture2 = texture2D(texture2, distortedPosition2);

                vec4 finalTexture = mix(_texture1, _texture2, dispFactor);
                gl_FragColor = finalTexture;
            }
        `;

        this.program = this.createProgram(vs, fs);
        this.gl.useProgram(this.program);

        // Buffers
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLoc = this.gl.getAttribLocation(this.program, 'position');
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);

        // PROGRESSIVE LOADING: Load first image immediately
        this.textures[0] = await this.loadTexture(this.images[0]);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.render();

        // Load remaining images in background
        this.loadRemainingTextures();

        // Start automatic rotation
        setInterval(() => this.next(), 10000); // 10s intervals
    }

    async loadRemainingTextures() {
        for (let i = 1; i < this.images.length; i++) {
            this.textures[i] = await this.loadTexture(this.images[i]);
        }
    }

    async loadTexture(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                resolve(texture);
            };
            img.src = src;
        });
    }

    createProgram(vsSource, fsSource) {
        const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        return shader;
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    next() {
        if (this.animating) return;
        this.animating = true;
        this.nextIndex = (this.currentIndex + 1) % this.textures.length;

        const duration = 2500; // 2.5s transition
        const start = performance.now();

        const animate = (time) => {
            const p = (time - start) / duration;
            if (p < 1) {
                this.progress = p;
                requestAnimationFrame(animate);
            } else {
                this.progress = 0;
                this.currentIndex = this.nextIndex;
                this.animating = false;
            }
        };
        requestAnimationFrame(animate);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    render() {
        // Only render if we are on the home view to save CPU/GPU resources
        if (window.state && window.state.view !== 'home') {
            requestAnimationFrame(() => this.render());
            return;
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const tex1Loc = this.gl.getUniformLocation(this.program, 'texture1');
        const tex2Loc = this.gl.getUniformLocation(this.program, 'texture2');
        const dispFactorLoc = this.gl.getUniformLocation(this.program, 'dispFactor');
        const effectFactorLoc = this.gl.getUniformLocation(this.program, 'effectFactor');

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.currentIndex]);
        this.gl.uniform1i(tex1Loc, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.nextIndex]);
        this.gl.uniform1i(tex2Loc, 1);

        this.gl.uniform1f(dispFactorLoc, this.progress);
        this.gl.uniform1f(effectFactorLoc, performance.now() / 1000);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(() => this.render());
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new LiquidBackground();
});
