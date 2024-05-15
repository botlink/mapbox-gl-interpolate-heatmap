import w from "earcut";
import T from "mapbox-gl";
/*!
 * mapbox-gl-interpolate-heatmap v0.8.0
 * Mapbox layer for average/interpolation heatmaps
 * (c) 2024 Vinayak Kulkarni<inbox.vinayak@gmail.com>
 * Released under the MIT License
 */
class P {
  id;
  data;
  framebufferFactor;
  maxValue;
  minValue;
  opacity;
  p;
  aoi;
  valueToColor;
  valueToColor4;
  textureCoverSameAreaAsROI;
  points = [];
  // Custom Props
  aPositionComputation;
  aPositionDraw;
  canvas;
  computationFramebuffer = null;
  computationProgram = null;
  computationTexture = null;
  computationVerticesBuffer = null;
  drawingVerticesBuffer = null;
  drawProgram = null;
  framebufferHeight;
  framebufferWidth;
  indicesBuffer = null;
  indicesNumber = null;
  renderingMode = "2d";
  resizeFramebuffer;
  type = "custom";
  uComputationTexture = null;
  uFramebufferSize = null;
  uMatrixComputation = null;
  uMatrixDraw = null;
  uOpacity = null;
  uP = null;
  uScreenSizeDraw = null;
  uUi = null;
  uXi = null;
  constructor(t) {
    this.id = t.id || "", this.data = t.data || [], this.aoi = t.aoi || [], this.valueToColor = t.valueToColor || `
      vec3 valueToColor(float value) {
          return vec3(max((value-0.5)*2.0, 0.0), 1.0 - 2.0*abs(value - 0.5), max((0.5-value)*2.0, 0.0));
      }
  `, this.valueToColor4 = t.valueToColor4 || `
      vec4 valueToColor4(float value, float defaultOpacity) {
          return vec4(valueToColor(value), defaultOpacity);
      }
  `, this.opacity = t.opacity ?? 0.5, this.minValue = t.minValue ?? 1 / 0, this.maxValue = t.maxValue ?? -1 / 0, this.p = t.p ?? 3, this.framebufferFactor = t.framebufferFactor ?? 0.3, this.textureCoverSameAreaAsROI = this.framebufferFactor === 1;
  }
  onAdd(t, e) {
    if (!e.getExtension("OES_texture_float") || !e.getExtension("WEBGL_color_buffer_float") || !e.getExtension("EXT_float_blend"))
      throw "WebGL extension not supported";
    this.canvas = t.getCanvas();
    const i = `
              precision highp float;
              attribute vec2 a_Position;
              uniform mat4 u_Matrix;
              void main() {
                  gl_Position = u_Matrix * vec4(a_Position, 0.0, 1.0);
              }
          `, n = `
              precision highp float;
              ${this.valueToColor}
              ${this.valueToColor4}
              uniform sampler2D u_ComputationTexture;
              uniform vec2 u_ScreenSize;
              uniform float u_Opacity;
              void main(void) {
                  vec4 data = texture2D(u_ComputationTexture, vec2(gl_FragCoord.x/u_ScreenSize.x, gl_FragCoord.y/u_ScreenSize.y));
                  float u = data.x/data.y;
                  u += u_Opacity*0.00000001; // force WebGL to use u_Opacity. This might not be the case depending on valueToColor4
                  gl_FragColor = valueToColor4(u, u_Opacity);
              }
          `, v = `
              precision highp float;
              uniform mat4 u_Matrix;
              uniform vec2 xi;
              varying vec2 xiNormalized;
              attribute vec2 a_Position;
              void main() {
                  vec4 xiProjected = u_Matrix * vec4(xi, 0.0, 1.0);
                  xiNormalized = vec2(xiProjected.x / xiProjected.w, xiProjected.y / xiProjected.w);
                  gl_Position = u_Matrix * vec4(a_Position, 0.0, 1.0);
              }
          `, F = `
              precision highp float;
              uniform float ui;
              varying vec2 xiNormalized;
              uniform float p;
              uniform vec2 u_FramebufferSize;
              void main() {
                  vec2 x = vec2(gl_FragCoord.x/u_FramebufferSize.x, gl_FragCoord.y/u_FramebufferSize.y);
                  vec2 xi = vec2((xiNormalized.x + 1.)/2., (xiNormalized.y + 1.)/2.);
                  float dist = distance(x, xi);
                  float wi = 1.0/pow(dist, p);
                  gl_FragColor = vec4(ui*wi, wi, 0.0, 1.0);
              }
          `, h = p(
      e,
      v
    );
    if (!h)
      throw new Error("error: computation vertex shader not created");
    const c = x(
      e,
      F
    );
    if (!c)
      throw new Error("error: computation fragment shader not created");
    if (this.computationProgram = b(
      e,
      h,
      c
    ), !this.computationProgram)
      throw new Error("error: computation fragment shader not created");
    if (this.aPositionComputation = e.getAttribLocation(
      this.computationProgram,
      "a_Position"
    ), this.uMatrixComputation = e.getUniformLocation(
      this.computationProgram,
      "u_Matrix"
    ), this.uUi = e.getUniformLocation(this.computationProgram, "ui"), this.uXi = e.getUniformLocation(this.computationProgram, "xi"), this.uP = e.getUniformLocation(this.computationProgram, "p"), this.uFramebufferSize = e.getUniformLocation(
      this.computationProgram,
      "u_FramebufferSize"
    ), this.aPositionComputation < 0 || !this.uMatrixComputation || !this.uUi || !this.uXi || !this.uP || !this.uFramebufferSize)
      throw "WebGL error: Failed to get the storage location of computation variable";
    const m = p(e, i);
    if (!m)
      throw new Error("error: drawing vertex shader not created");
    const d = x(e, n);
    if (!d)
      throw new Error("error: drawing fragment shader not created");
    if (this.drawProgram = b(
      e,
      m,
      d
    ), !this.drawProgram)
      throw new Error("error: drawing program not created");
    if (this.aPositionDraw = e.getAttribLocation(this.drawProgram, "a_Position"), this.uMatrixDraw = e.getUniformLocation(this.drawProgram, "u_Matrix"), this.uComputationTexture = e.getUniformLocation(
      this.drawProgram,
      "u_ComputationTexture"
    ), this.uScreenSizeDraw = e.getUniformLocation(
      this.drawProgram,
      "u_ScreenSize"
    ), this.uOpacity = e.getUniformLocation(this.drawProgram, "u_Opacity"), this.aPositionDraw < 0 || !this.uMatrixDraw || !this.uComputationTexture || !this.uScreenSizeDraw || !this.uOpacity)
      throw "WebGL error: Failed to get the storage location of drawing variable";
    const f = [];
    this.aoi?.length === 0 ? f.push(-1, -1, -1, 1, 1, 1, 1, -1) : this.aoi?.forEach((a) => {
      const s = T.MercatorCoordinate.fromLngLat(a);
      f.push(s.x, s.y);
    }), this.drawingVerticesBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.drawingVerticesBuffer), e.bufferData(
      e.ARRAY_BUFFER,
      new Float32Array(f),
      e.STATIC_DRAW
    );
    const R = this.textureCoverSameAreaAsROI ? f : [1, 1, -1, 1, 1, -1, -1, -1];
    this.computationVerticesBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.computationVerticesBuffer), e.bufferData(
      e.ARRAY_BUFFER,
      new Float32Array(R),
      e.STATIC_DRAW
    );
    const E = w(f);
    if (this.indicesBuffer = e.createBuffer(), !this.indicesBuffer)
      throw new Error("error: indices buffer not created");
    this.indicesNumber = E.length, e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.indicesBuffer), e.bufferData(
      e.ELEMENT_ARRAY_BUFFER,
      new Uint8Array(E),
      e.STATIC_DRAW
    ), this.framebufferWidth = Math.ceil(
      this.canvas.width * this.framebufferFactor
    ), this.framebufferHeight = Math.ceil(
      this.canvas.height * this.framebufferFactor
    ), this.computationTexture = e.createTexture(), e.bindTexture(e.TEXTURE_2D, this.computationTexture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texImage2D(
      e.TEXTURE_2D,
      0,
      e.RGBA,
      this.framebufferWidth,
      this.framebufferHeight,
      0,
      e.RGBA,
      e.FLOAT,
      null
    ), this.computationFramebuffer = e.createFramebuffer(), e.bindFramebuffer(e.FRAMEBUFFER, this.computationFramebuffer), e.framebufferTexture2D(
      e.FRAMEBUFFER,
      e.COLOR_ATTACHMENT0,
      e.TEXTURE_2D,
      this.computationTexture,
      0
    ), e.bindTexture(e.TEXTURE_2D, null), e.bindFramebuffer(e.FRAMEBUFFER, null), this.points = [];
    let o = 1 / 0, u = -1 / 0;
    this.data.forEach((a) => {
      const s = T.MercatorCoordinate.fromLngLat(a);
      this.points.push([
        s.x,
        s.y,
        a.val
      ]), a.val < o && (o = a.val), a.val > u && (u = a.val);
    }), o = o < this.minValue ? o : this.minValue, u = u > this.maxValue ? u : this.maxValue, this.points.forEach((a) => {
      a[2] = (a[2] - o) / (u - o);
    }), this.resizeFramebuffer = () => {
      if (!this.canvas || !this.canvas.width || !this.canvas.height)
        throw new Error("error: required canvas `width` & `height`");
      this.framebufferWidth = Math.ceil(
        this.canvas.width * this.framebufferFactor
      ), this.framebufferHeight = Math.ceil(
        this.canvas.height * this.framebufferFactor
      ), e.bindTexture(e.TEXTURE_2D, this.computationTexture), e.texImage2D(
        e.TEXTURE_2D,
        0,
        e.RGBA,
        this.framebufferWidth,
        this.framebufferHeight,
        0,
        e.RGBA,
        e.FLOAT,
        null
      );
    }, t.on("resize", this.resizeFramebuffer);
  }
  onRemove(t, e) {
    if (!this.resizeFramebuffer)
      throw new Error("error: required resize frame buffer callback");
    t.off("resize", this.resizeFramebuffer), e.deleteTexture(this.computationTexture), e.deleteBuffer(this.drawingVerticesBuffer), e.deleteBuffer(this.computationVerticesBuffer), e.deleteBuffer(this.indicesBuffer), e.deleteFramebuffer(this.computationFramebuffer);
  }
  prerender(t, e) {
    if (!this.framebufferWidth || !this.framebufferHeight || this.aPositionComputation === void 0 || !this.indicesNumber || !this.canvas || !this.canvas.width || !this.canvas.height)
      throw new Error("error: missing options for prerendering");
    t.disable(t.DEPTH_TEST), t.enable(t.BLEND), t.blendEquation(t.FUNC_ADD), t.blendFunc(t.ONE, t.ONE), t.clearColor(0, 0, 0, 1), t.useProgram(this.computationProgram), t.uniformMatrix4fv(this.uMatrixComputation, !1, e), t.uniform1f(this.uP, this.p), t.uniform2f(
      this.uFramebufferSize,
      this.framebufferWidth,
      this.framebufferHeight
    ), t.bindFramebuffer(t.FRAMEBUFFER, this.computationFramebuffer), t.viewport(0, 0, this.framebufferWidth, this.framebufferHeight), t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    for (let i = 0; i < this.points.length; i += 1) {
      const n = this.points.at(i);
      if (!n)
        throw new Error(`error: point not found at index: ${i}`);
      t.uniform1f(this.uUi, n[2]), t.uniform2f(this.uXi, n[0], n[1]), t.bindBuffer(t.ARRAY_BUFFER, this.computationVerticesBuffer), t.enableVertexAttribArray(this.aPositionComputation), t.vertexAttribPointer(
        this.aPositionComputation,
        2,
        t.FLOAT,
        !1,
        0,
        0
      ), this.textureCoverSameAreaAsROI ? t.drawElements(t.TRIANGLES, this.indicesNumber, t.UNSIGNED_BYTE, 0) : t.drawArrays(t.TRIANGLE_STRIP, 0, 4);
    }
    t.bindFramebuffer(t.FRAMEBUFFER, null), t.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  render(t, e) {
    if (this.aPositionDraw === void 0 || !this.canvas || !this.canvas.width || !this.canvas.height || !this.indicesNumber)
      throw new Error("error: missing options for rendering");
    t.useProgram(this.drawProgram), t.bindBuffer(t.ARRAY_BUFFER, this.drawingVerticesBuffer), t.enableVertexAttribArray(this.aPositionDraw), t.vertexAttribPointer(this.aPositionDraw, 2, t.FLOAT, !1, 0, 0), t.uniformMatrix4fv(this.uMatrixDraw, !1, e), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D, this.computationTexture), t.uniform1i(this.uComputationTexture, 0), t.uniform2f(this.uScreenSizeDraw, this.canvas.width, this.canvas.height), t.uniform1f(this.uOpacity, this.opacity), t.blendFunc(t.SRC_ALPHA, t.ONE), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.indicesBuffer), t.drawElements(t.TRIANGLES, this.indicesNumber, t.UNSIGNED_BYTE, 0);
  }
}
function p(r, t) {
  const e = r.createShader(r.VERTEX_SHADER);
  if (e)
    return _(r, e, t);
}
function x(r, t) {
  const e = r.createShader(r.FRAGMENT_SHADER);
  if (e)
    return _(r, e, t);
}
function _(r, t, e) {
  if (r.shaderSource(t, e), r.compileShader(t), !r.getShaderParameter(t, r.COMPILE_STATUS))
    throw r.getShaderInfoLog(t);
  return t;
}
function b(r, t, e) {
  const i = r.createProgram();
  if (i && (r.attachShader(i, t), r.attachShader(i, e), r.linkProgram(i), !r.getProgramParameter(i, r.LINK_STATUS)))
    throw r.getProgramInfoLog(i);
  return i;
}
export {
  P as MapboxInterpolateHeatmapLayer,
  P as default
};
//# sourceMappingURL=mapbox-gl-interpolate-heatmap.js.map
