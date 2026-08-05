import { mat4 } from './math.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { antialias: true });
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.initShaders();
        this.initCube();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.aspect = this.canvas.width / this.canvas.height;
    }

    initShaders() {
        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            uniform mat4 uProjection;
            uniform mat4 uView;
            uniform mat4 uModel;
            varying vec3 vNormal;
            varying vec3 vFragPos;
            void main() {
                gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
                vNormal = mat3(uModel) * aNormal;
                vFragPos = vec3(uModel * vec4(aPosition, 1.0));
            }
        `;
        const fsSource = `
            precision mediump float;
            uniform vec3 uColor;
            uniform vec3 uLightDir;
            uniform vec3 uViewPos;
            varying vec3 vNormal;
            varying vec3 vFragPos;
            void main() {
                vec3 lightDir = normalize(uLightDir);
                vec3 norm = normalize(vNormal);
                float diff = max(dot(norm, lightDir), 0.0);
                vec3 ambient = uColor * 0.2;
                vec3 diffuse = uColor * diff;
                vec3 viewDir = normalize(uViewPos - vFragPos);
                vec3 reflectDir = reflect(-lightDir, norm);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.5;
                vec3 color = ambient + diffuse + vec3(spec);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        this.program = this.createProgram(this.gl, vsSource, fsSource);
        this.gl.useProgram(this.program);
        this.uProjection = this.gl.getUniformLocation(this.program, 'uProjection');
        this.uView = this.gl.getUniformLocation(this.program, 'uView');
        this.uModel = this.gl.getUniformLocation(this.program, 'uModel');
        this.uColor = this.gl.getUniformLocation(this.program, 'uColor');
        this.uLightDir = this.gl.getUniformLocation(this.program, 'uLightDir');
        this.uViewPos = this.gl.getUniformLocation(this.program, 'uViewPos');
        this.aPosition = this.gl.getAttribLocation(this.program, 'aPosition');
        this.aNormal = this.gl.getAttribLocation(this.program, 'aNormal');
    }

    createProgram(gl, vsSource, fsSource) {
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vs));
        }
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fs));
        }
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
        }
        return program;
    }

    initCube() {
        // Generate vertices and normals for a cube
        const positions = [];
        const normals = [];
        // 6 faces (+x, -x, +y, -y, +z, -z) each with 2 triangles = 6 vertices
        const faces = [
            { normal: [1,0,0], dir: 1, axes: [1,2] },
            { normal: [-1,0,0], dir: 0, axes: [1,2] },
            { normal: [0,1,0], dir: 1, axes: [0,2] },
            { normal: [0,-1,0], dir: 0, axes: [0,2] },
            { normal: [0,0,1], dir: 1, axes: [0,1] },
            { normal: [0,0,-1], dir: 0, axes: [0,1] }
        ];
        const verts = [
            [-0.5,-0.5,-0.5], [-0.5,-0.5,0.5], [-0.5,0.5,-0.5], [-0.5,0.5,0.5],
            [0.5,-0.5,-0.5], [0.5,-0.5,0.5], [0.5,0.5,-0.5], [0.5,0.5,0.5]
        ];
        const idx = [0,1,2, 2,1,3, 4,6,5, 5,6,7, 0,4,6, 0,6,2, 1,3,7, 1,7,5, 0,2,4, 2,6,4, 1,5,3, 3,5,7];
        const tri = [
            // front (z positive)
            [1,3,5, 5,3,7],
            // back (z negative)
            [0,4,2, 2,4,6],
            // top (y positive)
            [2,3,6, 6,3,7],
            // bottom (y negative)
            [0,1,4, 4,1,5],
            // right (x positive)
            [4,5,6, 6,5,7],
            // left (x negative)
            [0,2,1, 1,2,3]
        ];
        // We'll construct per-face to get correct normals
        for (let i = 0; i < faces.length; i++) {
            const f = faces[i];
            const normal = f.normal;
            // pick vertices from tri array
            const t = tri[i];
            const v0 = verts[t[0]];
            const v1 = verts[t[1]];
            const v2 = verts[t[2]];
            const v3 = verts[t[3]];
            const v4 = verts[t[4]];
            const v5 = verts[t[5]];
            // push positions and normals for each triangle
            values: [v0,v1,v2, v3,v4,v5].forEach(v => {
                positions.push(...v);
                normals.push(...normal);
            });
        }
        this.cubeVertCount = positions.length / 3;
        this.cubePosBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubePosBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.cubeNormBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeNormBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
    }

    begin(camera) {
        this.gl.clearColor(0.5, 0.8, 1.0, 1.0); // sky blue
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.program);
        // set projection and view
        const proj = mat4.perspective(75 * Math.PI/180, this.aspect, 0.1, 100.0);
        const view = camera.getViewMatrix();
        this.gl.uniformMatrix4fv(this.uProjection, false, new Float32Array(proj));
        this.gl.uniformMatrix4fv(this.uView, false, new Float32Array(view));
        this.gl.uniform3f(this.uLightDir, 0.5, 1.0, 0.5);
        this.gl.uniform3f(this.uViewPos, camera.eye[0], camera.eye[1], camera.eye[2]);
    }

    drawCube(position, scale, color) {
        const model = mat4.identity();
        mat4.translate(position, model);
        mat4.scale(scale, model);
        this.gl.uniformMatrix4fv(this.uModel, false, new Float32Array(model));
        this.gl.uniform3f(this.uColor, color[0], color[1], color[2]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubePosBuffer);
        this.gl.enableVertexAttribArray(this.aPosition);
        this.gl.vertexAttribPointer(this.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeNormBuffer);
        this.gl.enableVertexAttribArray(this.aNormal);
        this.gl.vertexAttribPointer(this.aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.cubeVertCount);
    }
}