/* ============================================================
   model3d.js — 极简软件 3D 渲染器（无第三方依赖）
   用于医患沟通示意模型：主动脉夹层 / 急性心肌梗死 / 肺动脉栓塞
   坐标约定：x 向右，y 向上，z 朝向观察者
   ============================================================ */
(function (global) {
  'use strict';

  var PI = Math.PI;

  function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); }
  function norm(v) { var l = len(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }

  /* ---------- 颜色 ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /* ---------- 路径平滑（Chaikin） ---------- */
  function chaikin(pts, iters) {
    var out = pts;
    for (var k = 0; k < iters; k++) {
      var next = [out[0]];
      for (var i = 0; i < out.length - 1; i++) {
        var a = out[i], b = out[i + 1];
        next.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25, a[2] * .75 + b[2] * .25]);
        next.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75, a[2] * .25 + b[2] * .75]);
      }
      next.push(out[out.length - 1]);
      out = next;
    }
    return out;
  }

  /* ---------- 管状体（可剖开、可带壁厚） ---------- */
  function tube(pts, rFn, opt) {
    opt = opt || {};
    var seg = opt.seg || 9;
    var arc = opt.arc == null ? 1 : opt.arc;
    var gapCenter = opt.gapCenter == null ? PI / 2 : opt.gapCenter;
    var colorFn = opt.colorFn || function () { return hex2rgb(opt.color || '#E3B4A5'); };
    var wall = opt.wall == null ? 0 : opt.wall;
    var base = hex2rgb(opt.color || '#E3B4A5');

    var gap = 2 * PI - arc * 2 * PI;
    var start = gapCenter + gap / 2;
    var sweep = arc * 2 * PI;

    var mesh = { v: [], f: [], hot: [] };
    var n = pts.length;

    // 每个截面的局部坐标系
    var frames = [];
    for (var i = 0; i < n; i++) {
      var t = norm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
      var ref = [0, 0, 1];
      if (Math.abs(dot(t, ref)) > .94) ref = [0, 1, 0];
      var nn = norm(cross(ref, t));
      var bb = norm(cross(t, nn));
      frames.push({ t: t, n: nn, b: bb });
    }

    var ringLen = seg + 1;
    // 外层
    for (var i2 = 0; i2 < n; i2++) {
      var p = pts[i2], fr = frames[i2], r = rFn(i2 / (n - 1));
      for (var j = 0; j <= seg; j++) {
        var a = start + sweep * (j / seg);
        var rad = [fr.n[0] * Math.cos(a) + fr.b[0] * Math.sin(a),
                   fr.n[1] * Math.cos(a) + fr.b[1] * Math.sin(a),
                   fr.n[2] * Math.cos(a) + fr.b[2] * Math.sin(a)];
        mesh.v.push([p[0] + rad[0] * r, p[1] + rad[1] * r, p[2] + rad[2] * r]);
      }
    }
    // 内层
    var innerStart = mesh.v.length;
    if (wall > 0) {
      for (var i3 = 0; i3 < n; i3++) {
        var p3 = pts[i3], fr3 = frames[i3], r3 = rFn(i3 / (n - 1)) * (1 - wall);
        for (var j3 = 0; j3 <= seg; j3++) {
          var a3 = start + sweep * (j3 / seg);
          var rad3 = [fr3.n[0] * Math.cos(a3) + fr3.b[0] * Math.sin(a3),
                      fr3.n[1] * Math.cos(a3) + fr3.b[1] * Math.sin(a3),
                      fr3.n[2] * Math.cos(a3) + fr3.b[2] * Math.sin(a3)];
          mesh.v.push([p3[0] + rad3[0] * r3, p3[1] + rad3[1] * r3, p3[2] + rad3[2] * r3]);
        }
      }
    }

    function pushRingFaces(offset, flip) {
      for (var i = 0; i < n - 1; i++) {
        var tt = i / (n - 1);
        var col = colorFn(tt);
        for (var j = 0; j < seg; j++) {
          var a = offset + i * ringLen + j;
          var b = a + 1;
          var c = a + ringLen + 1;
          var d = a + ringLen;
          var p0 = mesh.v[a], p1 = mesh.v[b], p2 = mesh.v[c];
          var nrm = norm(cross(sub(p1, p0), sub(p2, p0)));
          if (flip) nrm = [-nrm[0], -nrm[1], -nrm[2]];
          mesh.f.push({ i: [a, b, c, d], c: col, n: nrm });
        }
      }
    }
    pushRingFaces(0, false);
    if (wall > 0) pushRingFaces(innerStart, true);

    // 剖切缝的壁厚截面（让开口看起来有厚度）
    if (wall > 0) {
      [0, seg].forEach(function (j) {
        for (var i = 0; i < n - 1; i++) {
          var a = i * ringLen + j;
          var b = (i + 1) * ringLen + j;
          var c = innerStart + (i + 1) * ringLen + j;
          var d = innerStart + i * ringLen + j;
          var p0 = mesh.v[a], p1 = mesh.v[b], p2 = mesh.v[c];
          var nrm = norm(cross(sub(p1, p0), sub(p2, p0)));
          mesh.f.push({ i: [a, b, c, d], c: mix(base, [255, 255, 255], .38), n: nrm });
        }
      });
    }
    return mesh;
  }

  /* ---------- 椭球（心室） ---------- */
  function ellipsoid(opt) {
    var rx = opt.rx, ry = opt.ry, rz = opt.rz;
    var cu = opt.cu || 14, cv = opt.cv || 24;
    var center = opt.center || [0, 0, 0];
    var colorFn = opt.colorFn || function () { return [180, 74, 74]; };
    var mesh = { v: [], f: [], hot: [] };
    for (var i = 0; i <= cu; i++) {
      var th = PI * i / cu;
      for (var j = 0; j <= cv; j++) {
        var ph = 2 * PI * j / cv;
        mesh.v.push([
          center[0] + rx * Math.sin(th) * Math.cos(ph),
          center[1] + ry * Math.cos(th),
          center[2] + rz * Math.sin(th) * Math.sin(ph)
        ]);
      }
    }
    for (var i2 = 0; i2 < cu; i2++) {
      for (var j2 = 0; j2 < cv; j2++) {
        var a = i2 * (cv + 1) + j2;
        var b = a + 1;
        var c = a + cv + 1;
        var d = c + 1;
        var p0 = mesh.v[a], p1 = mesh.v[b], p2 = mesh.v[d];
        var nrm = norm([p0[0] / (rx * rx), p0[1] / (ry * ry), p0[2] / (rz * rz)]);
        mesh.f.push({ i: [a, b, d, c], c: colorFn(p0, th2(i2, cu), ph2(j2, cv)), n: nrm });
      }
    }
    function th2(i, n) { return i / n; }
    function ph2(j, n) { return j / n; }
    return mesh;
  }

  /* ---------- 沿曲线铺一条"带"（内膜片 / 斑块） ---------- */
  function ribbon(pts, widthFn, colorFn, mesh) {
    var n = pts.length;
    var startIdx = mesh.v.length;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var tan = norm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
      var ref = [0, 0, 1];
      if (Math.abs(dot(tan, ref)) > .94) ref = [0, 1, 0];
      var nn = norm(cross(ref, tan));
      var bb = norm(cross(tan, nn));
      var r = widthFn(t);
      mesh.v.push([pts[i][0] - bb[0] * r, pts[i][1] - bb[1] * r, pts[i][2] - bb[2] * r]);
      mesh.v.push([pts[i][0] + bb[0] * r, pts[i][1] + bb[1] * r, pts[i][2] + bb[2] * r]);
    }
    for (var i2 = 0; i2 < n - 1; i2++) {
      var a = startIdx + i2 * 2;
      var b = a + 2;
      var c = a + 3;
      var d = a + 1;
      var p0 = mesh.v[a], p1 = mesh.v[b], p2 = mesh.v[c];
      var nrm = norm(cross(sub(p1, p0), sub(p2, p0)));
      mesh.f.push({ i: [a, b, c, d], c: colorFn(i2 / (n - 1)), n: nrm, two: true });
    }
  }

  function merge(target, src) {
    var off = target.v.length;
    for (var i = 0; i < src.v.length; i++) target.v.push(src.v[i]);
    for (var j = 0; j < src.f.length; j++) {
      var f = src.f[j];
      target.f.push({ i: f.i.map(function (k) { return k + off; }), c: f.c, n: f.n, two: f.two });
    }
    if (src.hot) for (var k = 0; k < src.hot.length; k++) target.hot.push(src.hot[k]);
    return target;
  }

  /* ---------- 整体旋转（让模型带一点自然倾角） ---------- */
  function rotMesh(mesh, ax, ay) {
    var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    function rt(p) {
      var x = p[0] * cy + p[2] * sy;
      var z = -p[0] * sy + p[2] * cy;
      var y = p[1] * cx - z * sx;
      var z2 = p[1] * sx + z * cx;
      return [x, y, z2];
    }
    for (var i = 0; i < mesh.v.length; i++) mesh.v[i] = rt(mesh.v[i]);
    for (var j = 0; j < mesh.f.length; j++) mesh.f[j].n = rt(mesh.f[j].n);
    for (var k = 0; k < mesh.hot.length; k++) mesh.hot[k].p = rt(mesh.hot[k].p);
  }

  /* ---------- 模型 1：主动脉夹层 ---------- */
  function buildDissection() {
    var mesh = { v: [], f: [], hot: [] };
    var spine = chaikin([
      [3, -100, -3], [1, -66, -1], [0, -30, 1], [2, 0, 3],
      [8, 30, 4], [20, 52, 4], [38, 62, 3], [56, 56, 2], [64, 38, 0],
      [66, 12, -2], [66, -18, -4], [64, -56, -5], [62, -96, -5]
    ], 1);

    var rFn = function (t) {
      if (t < .35) return 31 - t * 10;
      if (t < .62) return 27.5 - (t - .35) * 8;
      return 25 - (t - .62) * 9;
    };

    // 血管壁（剖开，缺口朝向观察者）
    merge(mesh, tube(spine, rFn, {
      seg: 10, arc: .68, wall: .16,
      colorFn: function (t) {
        return mix(hex2rgb('#EFC3B2'), hex2rgb('#E0A793'), t);
      }
    }));

    // 内膜片：位于管腔中央的隔膜，制造真腔 / 假腔
    var inner = spine.slice(2, spine.length - 2).map(function (p) { return [p[0], p[1], p[2] + 1]; });
    ribbon(inner, function (t) { return 24 + 2 * Math.sin(t * 3); }, function (t) {
      // 破口附近用亮红强调
      if (t > .50 && t < .58) return hex2rgb('#F26A5A');
      return mix(hex2rgb('#C2453A'), hex2rgb('#9E2F2A'), t);
    }, mesh);

    // 假腔内的血栓沉积（淡紫灰窄带）
    var thrombus = spine.slice(4, spine.length - 4).map(function (p) { return [p[0] + 8, p[1], p[2] + 12]; });
    ribbon(thrombus, function (t) { return 9; }, function () { return hex2rgb('#A98C93'); }, mesh);

    mesh.hot = [
      { p: [12, 8, 26], title: '内膜破口', body: '血管内壁撕裂出一个小口，血液从真腔冲进管壁中层，把血管壁"劈"成两层。' },
      { p: [-16, -34, 20], title: '假腔', body: '被劈开的夹层腔，血流在里面淤积、形成血栓，越胀越大，压迫真腔。' },
      { p: [46, 66, 10], title: '主动脉弓', body: '弓部向上发出供应脑和上肢的分支，夹层累及这里时脑供血会受影响。' }
    ];
    return mesh;
  }

  /* ---------- 模型 2：急性心肌梗死 ---------- */
  function buildAmi() {
    var mesh = { v: [], f: [], hot: [] };
    var lv = ellipsoid({
      rx: 46, ry: 62, rz: 44, cu: 18, cv: 26,
      colorFn: function (p, tu, pv) {
        // 前壁 + 心尖区梗死（暗紫红），其余心肌（砖红）
        var front = p[2] > 6;
        var apex = p[1] < 6;
        if (front && apex) return mix(hex2rgb('#6E2B4C'), hex2rgb('#8A3552'), (p[1] + 60) / 120);
        return mix(hex2rgb('#C2564F'), hex2rgb('#9E3B39'), (p[1] + 60) / 120);
      }
    });
    // 心尖塑形：底部收窄并向左前偏移，避免看起来像鸡蛋
    for (var vi = 0; vi < lv.v.length; vi++) {
      var pv = lv.v[vi];
      var tt = Math.max(0, (0 - pv[1]) / 62);
      var kk = 1 - 0.22 * tt * tt;
      pv[0] = pv[0] * kk - 9 * tt * tt;
      pv[2] = pv[2] * kk + 4 * tt * tt;
    }
    merge(mesh, lv);

    // 前降支（LAD）：沿心室表面走行
    var lad = [];
    for (var i = 0; i <= 26; i++) {
      var th = PI * (0.10 + 0.80 * i / 26);
      var ph = 1.15 + 0.35 * (i / 26);
      lad.push([46 * Math.sin(th) * Math.cos(ph) * 1.02,
                62 * Math.cos(th) * 1.02,
                44 * Math.sin(th) * Math.sin(ph) * 1.02 + 2]);
    }
    lad = chaikin(lad, 1);
    merge(mesh, tube(lad, function (t) {
      if (t > .44 && t < .56) return 2.4;       // 狭窄段
      if (t > .56) return 4.2;
      return 5.8;
    }, {
      seg: 8, arc: 1, color: '#B3323C', wall: 0
    }));

    // 斑块 / 血栓阻塞处
    merge(mesh, tube([
      [lad[26][0], lad[26][1], lad[26][2]],
      [lad[29][0], lad[29][1], lad[29][2]]
    ], function () { return 6.4; }, { seg: 8, arc: 1, color: '#E8A93F', wall: 0 }));

    mesh.hot = [
      { p: [12, 18, 46], title: '冠状动脉狭窄', body: '供应心肌的冠状动脉被斑块堵住，血流过不去，心肌开始缺血。' },
      { p: [-26, -34, 30], title: '心肌坏死区', body: '持续缺血超过 20 分钟，这块心肌就会坏死，坏死范围越大，心脏泵血能力越差。' },
      { p: [0, 62, 10], title: '左心室', body: '心脏的主泵。前壁梗死会直接影响收缩力，出现低血压、心衰甚至休克。' }
    ];
    rotMesh(mesh, -0.10, -0.30);
    return mesh;
  }

  /* ---------- 模型 3：肺动脉栓塞 ---------- */
  function buildPe() {
    var mesh = { v: [], f: [], hot: [] };

    var trunk = chaikin([[0, 92, 0], [0, 62, 2], [0, 36, 2], [1, 20, 0]], 1);
    merge(mesh, tube(trunk, function (t) { return 25 - t * 5; }, {
      seg: 10, arc: .7, wall: .14,
      colorFn: function (t) { return mix(hex2rgb('#B9C7E8'), hex2rgb('#9FB0D8'), t); }
    }));

    var right = chaikin([[1, 20, 0], [18, 16, 2], [34, 8, 2], [48, -2, 0]], 1);
    merge(mesh, tube(right, function (t) { return 18 - t * 7; }, {
      seg: 9, arc: .72, wall: .14,
      colorFn: function (t) { return mix(hex2rgb('#B9C7E8'), hex2rgb('#A2B2DA'), t); }
    }));

    var left = chaikin([[1, 20, 0], [-16, 18, 2], [-32, 10, 2], [-46, 0, 0]], 1);
    merge(mesh, tube(left, function (t) { return 17 - t * 7; }, {
      seg: 9, arc: .72, wall: .14,
      colorFn: function (t) { return mix(hex2rgb('#B9C7E8'), hex2rgb('#A2B2DA'), t); }
    }));

    // 血栓：堵在右肺动脉内
    merge(mesh, tube([[26, 12, 0], [40, 2, 0]], function (t) {
      return 7.4 * Math.sin(Math.PI * (0.12 + t * 0.76));
    }, { seg: 8, arc: 1, color: '#8E2F3A', wall: 0 }));

    mesh.hot = [
      { p: [8, 74, 12], title: '肺动脉主干', body: '从右心室把血送到肺里换氧的通道，血栓卡在这里最危险。' },
      { p: [34, 6, 4], title: '血栓阻塞', body: '多来自下肢深静脉的血栓，脱落后随血流卡在肺动脉分支，肺组织无法换气。' },
      { p: [-24, 14, 6], title: '对侧分支', body: '一侧堵塞后，另一侧要承担全部血流，心脏负荷骤增，可能出现右心衰竭。' }
    ];
    return mesh;
  }

  /* ---------- 渲染器 ---------- */
  var LIGHT = norm([-0.42, 0.62, 0.78]);

  function bboxSize(mesh) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (var i = 0; i < mesh.v.length; i++) {
      var p = mesh.v[i];
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0), cy: (y0 + y1) / 2 };
  }

  function Viewer(canvas, modelId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mesh = MODELS[modelId] ? MODELS[modelId]() : buildDissection();
    this.yaw = -0.34;
    this.pitch = 0.16;
    this.zoom = 1;
    this.spin = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.raf = null;
    this.dead = false;
    this.bb = bboxSize(this.mesh);
    this.offY = this.bb.cy;
    this.bind();
    this.resize();
    this.loop();
  }

  Viewer.prototype.fitScale = function () {
    if (!this.bb || !this.W) return;
    var s = Math.min(this.W / (this.bb.w * 1.24), this.H / (this.bb.h * 1.24));
    this.scale = s * this.zoom;
  };

  Viewer.prototype.resize = function () {
    var c = this.canvas;
    var w = c.clientWidth || 420;
    var h = c.clientHeight || 340;
    if (!w || !h) return;
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    this.W = w;
    this.H = h;
    this.cx = w / 2;
    this.cy = h / 2;
    this.fitScale();
  };

  Viewer.prototype.bind = function () {
    var self = this;
    var dragging = false, lx = 0, ly = 0;

    function down(e) {
      dragging = true;
      var t = e.touches ? e.touches[0] : e;
      lx = t.clientX; ly = t.clientY;
      self.canvas.classList.add('is-grabbing');
      self.spin = false;
      if (self.onSpinChange) self.onSpinChange(false);
    }
    function move(e) {
      if (!dragging || self.dead) return;
      var t = e.touches ? e.touches[0] : e;
      var dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY;
      self.yaw += dx * 0.012;
      self.pitch = Math.max(-0.85, Math.min(0.85, self.pitch + dy * 0.009));
      if (e.cancelable) e.preventDefault();
    }
    function up() {
      dragging = false;
      self.canvas.classList.remove('is-grabbing');
    }

    this.canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    this.canvas.addEventListener('touchstart', down, { passive: true });
    this.canvas.addEventListener('touchmove', move, { passive: false });
    this.canvas.addEventListener('touchend', up);

    this.canvas.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 12) return;
      self.zoom = Math.max(.7, Math.min(1.8, self.zoom - e.deltaY * 0.0012));
      self.fitScale();
      e.preventDefault();
    }, { passive: false });
  };

  Viewer.prototype.project = function (p) {
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    var cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var x1 = p[0] * cy + p[2] * sy;
    var z1 = -p[0] * sy + p[2] * cy;
    var y1 = p[1] - this.offY;
    var y2 = y1 * cp - z1 * sp;
    var z2 = y1 * sp + z1 * cp;
    var k = 900 / (900 - z2 * 0.9);
    return {
      x: this.cx + x1 * k * this.scale,
      y: this.cy - y2 * k * this.scale,
      z: z2,
      k: k
    };
  };

  Viewer.prototype.frame = function () {
    var W = this.W, H = this.H, dpr = this.dpr;
    if (this.spin) {
      this.yaw += 0.006;
      this.pitch = 0.16 + Math.sin(this.yaw * .8) * .06;
    }
    var ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    var cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var mesh = this.mesh;
    var sv = new Array(mesh.v.length);
    for (var i = 0; i < mesh.v.length; i++) {
      var p = mesh.v[i];
      var x1 = p[0] * cy + p[2] * sy;
      var z1 = -p[0] * sy + p[2] * cy;
      var y1 = p[1] - this.offY;
      var y2 = y1 * cp - z1 * sp;
      var z2 = y1 * sp + z1 * cp;
      var k = 900 / (900 - z2 * 0.9);
      sv[i] = { x: this.cx + x1 * k * this.scale, y: this.cy - y2 * k * this.scale, z: z2 };
    }

    var list = [];
    for (var j = 0; j < mesh.f.length; j++) {
      var f = mesh.f[j];
      var fa = sv[f.i[0]], fb = sv[f.i[1]], fc = sv[f.i[2]], fd = sv[f.i[3]];
      var zavg = (fa.z + fb.z + fc.z + fd.z) / 4;
      // 视空间法线
      var nx = f.n[0], ny = f.n[1], nz = f.n[2];
      var vnx = nx * cy + nz * sy;
      var vnz = -nx * sy + nz * cy;
      var vny = ny * cp - vnz * sp;
      var vnz2 = ny * sp + vnz * cp;
      var l = Math.sqrt(vnx * vnx + vny * vny + vnz2 * vnz2) || 1;
      var d = Math.abs((vnx * LIGHT[0] + vny * LIGHT[1] + vnz2 * LIGHT[2]) / l);
      var shade = 0.30 + 0.70 * Math.pow(d, 0.85);
      shade += 0.10 * Math.pow(1 - Math.abs(vnz2 / l), 2); // 边缘光
      list.push({ z: zavg, f: f, s: shade });
    }
    list.sort(function (a, b) { return a.z - b.z; });

    for (var m = 0; m < list.length; m++) {
      var it = list[m], face = it.f, sh = Math.min(1.06, it.s);
      var idx = face.i;
      ctx.beginPath();
      ctx.moveTo(sv[idx[0]].x, sv[idx[0]].y);
      for (var q = 1; q < idx.length; q++) ctx.lineTo(sv[idx[q]].x, sv[idx[q]].y);
      ctx.closePath();
      var c = face.c;
      var cr = Math.min(255, Math.round(c[0] * sh));
      var cg = Math.min(255, Math.round(c[1] * sh));
      var cb = Math.min(255, Math.round(c[2] * sh));
      ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')';
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  };

  Viewer.prototype.loop = function () {
    var self = this;
    function tick() {
      if (self.dead) return;
      self.frame();
      if (self.onFrame) self.onFrame();
      self.raf = requestAnimationFrame(tick);
    }
    this.raf = requestAnimationFrame(tick);
  };

  Viewer.prototype.setModel = function (id) {
    this.mesh = MODELS[id]();
    this.bb = bboxSize(this.mesh);
    this.offY = this.bb.cy;
    this.yaw = -0.34;
    this.pitch = 0.16;
    this.zoom = 1;
    this.fitScale();
  };

  Viewer.prototype.reset = function () {
    this.yaw = -0.34;
    this.pitch = 0.16;
    this.zoom = 1;
    this.resize();
  };

  Viewer.prototype.destroy = function () {
    this.dead = true;
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  var MODELS = {
    dissection: buildDissection,
    ami: buildAmi,
    pe: buildPe
  };

  global.M3D = {
    create: function (canvas, modelId) { return new Viewer(canvas, modelId); },
    models: MODELS
  };

})(window);
