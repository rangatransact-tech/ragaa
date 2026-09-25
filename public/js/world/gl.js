// Minimal WebGL2 helpers: programs, meshes, matrices. No dependencies.

export function createProgram(gl, vsSrc, fsSrc, name = '') {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      console.warn(name, log, src.split('\n').map((l, i) => i + 1 + ': ' + l).join('\n'));
      throw new Error('shader ' + name + ': ' + log);
    }
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link ' + name + ': ' + gl.getProgramInfoLog(p));
  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    uniforms[info.name.replace(/\[0\]$/, '')] = { loc: gl.getUniformLocation(p, info.name), type: info.type };
  }
  return { p, uniforms, name };
}

// Set uniforms by name from a plain object; unknown names are ignored.
export function setUniforms(gl, prog, values) {
  for (const k in values) {
    const u = prog.uniforms[k];
    if (!u) continue;
    const v = values[k];
    switch (u.type) {
      case gl.FLOAT: gl.uniform1f(u.loc, v); break;
      case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
      case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
      case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
      case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
      case gl.INT: case gl.SAMPLER_2D: case gl.BOOL: gl.uniform1i(u.loc, v); break;
      default: break;
    }
  }
}

// attribs: { name: { data: Float32Array, size, divisor? , dynamic? } }
export function createMesh(gl, prog, attribs, index) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffers = {};
  for (const name in attribs) {
    const a = attribs[name];
    const loc = gl.getAttribLocation(prog.p, name);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, a.data, a.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    buffers[name] = buf;
    if (loc < 0) continue;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, a.size, gl.FLOAT, false, 0, 0);
    if (a.divisor) gl.vertexAttribDivisor(loc, a.divisor);
  }
  let count = 0, indexType = 0;
  if (index) {
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    count = index.length;
    indexType = index instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  } else {
    const first = attribs[Object.keys(attribs)[0]];
    count = first.data.length / first.size;
  }
  gl.bindVertexArray(null);
  return { vao, buffers, count, indexType };
}

export function updateBuffer(gl, mesh, name, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers[name]);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
}

export function draw(gl, mesh, mode, instances = 0, count = mesh.count) {
  gl.bindVertexArray(mesh.vao);
  if (mesh.indexType) {
    if (instances) gl.drawElementsInstanced(mode, count, mesh.indexType, 0, instances);
    else gl.drawElements(mode, count, mesh.indexType, 0);
  } else if (instances) gl.drawArraysInstanced(mode, 0, count, instances);
  else gl.drawArrays(mode, 0, count);
}

// ---- tiny mat4 (column-major) ----
export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

// View matrix from camera basis (right, up, forward) at the origin: we render
// camera-relative (world minus camera position) to keep float precision.
export function viewFromBasis(r, u, f) {
  return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, 0, 0, 0, 1]);
}

export function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}

export const v3 = {
  norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
  add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
  scale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; },
  dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
};

export function texture2D(gl, w, h, data, { internal, format, type, filter = gl.LINEAR, wrap = gl.REPEAT, mips = false } = {}) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}

export function canvasTexture(gl, canvas, mips = true) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}
