/* Cleveland Clinic Connected public site: contact links, the section bands,
   the package roadmap, the priority wheel and the partner highlights carousel. Everything still reads
   correctly without JavaScript: the roadmap is static and the stories stack. */
(function () {
  "use strict";
  var CONFIG = window.CC_CONFIG || {};
  var email = CONFIG.contactEmail || "ccconnected@ccf.org";
  function $(s, root) { return (root || document).querySelector(s); }
  function $all(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Settings ---------- */
  if (CONFIG.showPrototypeNotice === false) {
    if ($("#protoNote")) $("#protoNote").hidden = true;
    $all(".photo-slot").forEach(function (el) { el.hidden = true; });
  }
  $all('a[href^="mailto:"]').forEach(function (a) {
    var q = a.getAttribute("href").split("?")[1];
    a.href = "mailto:" + email + (q ? "?" + q : "");
    if (a.id === "footerEmail" || a.classList.contains("custom-ask-email")) a.textContent = email;
  });
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Menu on tablets and phones ---------- */
  var menuBtn = $(".menu-btn"), menu = $("#mobileMenu");
  if (menuBtn && menu) {
    var setMenu = function (open) {
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
    $all("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 1000 && !menu.hidden) setMenu(false); });
  }

  /* ---------- Hero globe: points on a sphere, with arcs from Cleveland to member cities ---------- */
  (function () {                            /* own scope: these names are reused further down */
  var cv = $(".hero-globe");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d");
    var DEG = Math.PI / 180;
    var toXYZ = function (lat, lon) { lat *= DEG; lon *= DEG; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; };
    var pts = [], N = 1500, ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {             /* evenly spread points (Fibonacci sphere) */
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    var home = toXYZ(41.5, -81.7);            /* Cleveland */
    var cities = [[21.0, 105.8], [10.8, 106.7], [41.3, 69.3], [45.8, 16.0], [38.9, -120.0], [39.2, -85.9], [28.6, -80.8]].map(function (c) { return toXYZ(c[0], c[1]); });
    var slerp = function (a, b, t) {
      var d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))), s = Math.sin(d) || 1;
      var k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
      return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2, d];
    };
    var arcs = cities.map(function (c) {
      var seg = [], d = slerp(home, c, 0)[3];
      for (var t = 0; t <= 1.0001; t += 1 / 48) {
        var p = slerp(home, c, t), lift = 1 + (0.04 + d * 0.05) * Math.sin(Math.PI * t);
        seg.push([p[0] * lift, p[1] * lift, p[2] * lift]);
      }
      return seg;
    });
    var W = 0, H = 0, dpr = 1, rot = 0.85, tilt = 0.72, last = null, onScreen = true;
    var size = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    var proj = function (p, R, cx, cy) {
      var cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      var x = p[0] * cr + p[2] * sr, z = -p[0] * sr + p[2] * cr;
      var y = p[1] * ct - z * st; z = p[1] * st + z * ct;
      return [cx + x * R, cy - y * R, z];
    };
    var draw = function (time) {
      if (!W) size();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var small = W < 520, R = Math.min(W * (small ? 0.42 : 0.4), H * (small ? 0.44 : 0.42)), cx = W * (small ? 0.5 : 0.5), cy = H * 0.52;
      /* soft glow behind the globe */
      var g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.25);
      g.addColorStop(0, "rgba(31,155,224,0.20)"); g.addColorStop(0.6, "rgba(60,180,140,0.08)"); g.addColorStop(1, "rgba(7,28,56,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2); ctx.fill();
      /* points: brighter in front, blue at the top shading to green at the bottom */
      for (var i = 0; i < pts.length; i++) {
        var q = proj(pts[i], R, cx, cy), front = (q[2] + 1) / 2;
        var mix = (pts[i][1] + 1) / 2;
        var rr = Math.round(95 + (31 - 95) * mix), gg = Math.round(203 + (155 - 203) * mix), bb = Math.round(128 + (224 - 128) * mix);
        ctx.fillStyle = "rgba(" + rr + "," + gg + "," + bb + "," + (0.1 + 0.85 * front * front).toFixed(3) + ")";
        var s = 0.9 + 1.9 * front;
        ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
      }
      /* arcs from Cleveland to member cities, each with a light travelling along it */
      for (var a = 0; a < arcs.length; a++) {
        var seg = arcs[a], P = seg.map(function (p) { return proj(p, R, cx, cy); });
        for (var k = 1; k < P.length; k++) {
          var z = (P[k][2] + P[k - 1][2]) / 2; if (z < -0.15) continue;
          ctx.strokeStyle = "rgba(143,214,162," + (0.25 + 0.6 * Math.max(0, z)).toFixed(3) + ")";
          ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(P[k - 1][0], P[k - 1][1]); ctx.lineTo(P[k][0], P[k][1]); ctx.stroke();
        }
        var tt = ((time / 3200) + a / arcs.length) % 1, idx = Math.floor(tt * (P.length - 1)), m = P[idx];
        if (m[2] > -0.1) { ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.max(0, m[2])).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(m[0], m[1], 1.8, 0, Math.PI * 2); ctx.fill(); }
        var end = P[P.length - 1];
        if (end[2] > -0.05) { ctx.fillStyle = "rgba(143,214,162,0.95)"; ctx.beginPath(); ctx.arc(end[0], end[1], 2.6, 0, Math.PI * 2); ctx.fill(); }
      }
      var h = proj(home, R, cx, cy);
      if (h[2] > -0.05) {
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(h[0], h[1], 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h[0], h[1], 8 + 3 * Math.sin(time / 500), 0, Math.PI * 2); ctx.stroke();
      }
    };
    var loop = function (t) {
      if (last === null) last = t;
      var dt = Math.min(64, t - last); last = t;
      if (onScreen && !document.hidden) { rot += dt * 0.00007; draw(t); }
      requestAnimationFrame(loop);
    };
    if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(performance.now()); }).observe(cv);
    else window.addEventListener("resize", function () { size(); draw(performance.now()); });
    size();
    if (reduceMotion) { draw(0); }
    else {
      if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }).observe(cv);
      requestAnimationFrame(loop);
    }
  }
  })();

  /* ---------- Section bands: draw in when they scroll into view ---------- */
  var bars = $all(".section-bar");
  if (bars.length && !reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("bar-anim");
    var barObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); barObs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    bars.forEach(function (el) { barObs.observe(el); });
  }

  /* ---------- Package roadmap: fill in on first view ---------- */
  var rm = $("#roadmap");
  if (rm) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      rm.classList.add("rm-anim");
      var rmObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          rmObs.disconnect();
          rm.classList.add("is-in");
          setTimeout(function () { rm.classList.remove("rm-anim", "is-in"); }, 2800);
        });
      }, { threshold: 0.3 });
      rmObs.observe(rm);
    }
  }

  /* ---------- Existing hospitals: priority wheel ---------- */
  var ex = $("#explorer");
  if (ex) {
    var segs = $all(".seg", ex), rot = $(".wheel-rot", ex), wheel = $(".wheel", ex), hub = $("#hubTitle"), hubKicker = $("#hubKicker"), hubBox = $(".hub", ex);
    var current = 0, turn = 0;   /* running rotation in degrees, so the wheel always turns the short way */
    var stacked = window.matchMedia("(max-width: 900px)");
    var face = function () { return stacked.matches ? 90 : 0; };   /* point at the panel: right, or down when stacked */
    var select = function (i, focus) {
      var seg = segs[i], key = seg.getAttribute("data-key");
      segs.forEach(function (s, k) { var on = k === i; s.setAttribute("aria-selected", String(on)); s.setAttribute("tabindex", on ? "0" : "-1"); });
      $all(".pri", ex).forEach(function (pnl) { pnl.classList.toggle("is-on", pnl.id === "pri-" + key); });
      hub.textContent = seg.getAttribute("data-title");
      hubKicker.textContent = seg.getAttribute("data-short");
      hubBox.style.setProperty("--d", seg.style.getPropertyValue("--d"));
      var target = face() - parseFloat(seg.getAttribute("data-angle"));
      turn += ((target - turn) % 360 + 540) % 360 - 180;
      rot.style.transform = "rotate(" + turn + "deg)";
      wheel.style.setProperty("--counter", (-turn) + "deg");
      var rad = turn * Math.PI / 180;   /* "screen up" in the turned wheel, for the floating motion and shadow */
      wheel.style.setProperty("--upx", (-Math.sin(rad)).toFixed(4));
      wheel.style.setProperty("--upy", (-Math.cos(rad)).toFixed(4));
      current = i;
      if (focus) seg.focus();
    };
    segs.forEach(function (s, i) {
      s.addEventListener("click", function () { wheel.classList.remove("is-hinting"); select(i, false); });
      s.addEventListener("keydown", function (e) {
        var n = segs.length;
        wheel.classList.remove("is-hinting");
        if (e.key === "Enter" || e.key === " ") { select(i, false); e.preventDefault(); }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { select((i + 1) % n, true); e.preventDefault(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { select((i + n - 1) % n, true); e.preventDefault(); }
      });
    });
    if (stacked.addEventListener) stacked.addEventListener("change", function () { select(current, false); });
    var hint = $(".wheel-hint", ex);
    if (hint && window.matchMedia("(hover: none)").matches) {
      hint.lastChild.textContent = hint.lastChild.textContent.replace("Click", "Tap");
    }
    ex.classList.add("no-anim");
    select(0, false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { ex.classList.remove("no-anim"); }); });
    /* "See the story" opens that partner in the carousel */
    $all(".proof-link", ex).forEach(function (a) {
      a.addEventListener("click", function () { if (window.CCStories) window.CCStories.go(parseInt(a.getAttribute("data-story"), 10)); });
    });
  }

  /* ---------- Partner highlights carousel ---------- */
  var root = $("#stories"), track = $("#storiesTrack");
  if (!root || !track) return;
  var slides = $all(".story", track);
  if (slides.length < 2) return;
  var controls = $(".stories-controls", root), bar = $(".stories-progress", root);
  var nowEl = $("#storiesNow"), allEl = $("#storiesAll"), pauseBtn = $(".stories-pause", root);
  /* Each story shows its photos one after another (PHOTO ms each), then moves on.
     A story stays up at least MIN_DWELL ms so there is time to read it. */
  var PHOTO = 3500, MIN_DWELL = 10000;
  var index = 0, elapsed = 0, last = null, shownPhoto = -1;
  var photoSets = slides.map(function (s) { return $all(".story-photo img", s); });
  var photoDots = slides.map(function (s, i) {
    var box = $(".photo-dots", s); if (!box) return [];
    box.innerHTML = ""; box.removeAttribute("aria-hidden");
    return photoSets[i].map(function (img, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Photo " + (k + 1) + " of " + photoSets[i].length);
      b.addEventListener("click", function () { elapsed = k * (dwell(i) / photoSets[i].length); showPhoto(k); });
      box.appendChild(b);
      return b;
    });
  });
  function dwell(i) { return Math.max(MIN_DWELL, photoSets[i].length * PHOTO); }
  function showPhoto(k) {
    if (k === shownPhoto) return;
    shownPhoto = k;
    photoSets[index].forEach(function (img, j) { img.classList.toggle("is-on", j === k); });
    photoDots[index].forEach(function (d, j) { d.classList.toggle("is-on", j === k); d.setAttribute("aria-current", j === k ? "true" : "false"); });
  }
  var userPaused = reduceMotion, focused = false, visible = false;

  controls.hidden = false;
  allEl.textContent = slides.length;
  var dots = slides.map(function (s, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Show highlight " + (i + 1) + ": " + s.querySelector(".story-name").textContent);
    b.innerHTML = '<span class="fill"></span>';
    b.addEventListener("click", function () { go(i, true); });
    bar.appendChild(b);
    return b;
  });

  function render() {
    slides.forEach(function (s, i) {
      var on = i === index;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", String(!on));
      if (on) s.removeAttribute("inert"); else s.setAttribute("inert", "");
    });
    dots.forEach(function (d, i) {
      d.classList.toggle("is-past", i < index);
      d.setAttribute("aria-current", i === index ? "true" : "false");
      d.querySelector(".fill").style.setProperty("--p", i < index ? 1 : 0);
    });
    nowEl.textContent = index + 1;
  }
  function go(i, byUser) {
    index = (i + slides.length) % slides.length;
    elapsed = 0;
    render();
    shownPhoto = -1; showPhoto(0);
    if (byUser) track.setAttribute("aria-live", "polite");
  }
  window.CCStories = { go: function (i) { go(i, true); } };
  function playing() { return !userPaused && !focused && visible && !document.hidden; }
  function setPaused(p) {
    userPaused = p;
    root.classList.toggle("is-paused", p);
    pauseBtn.setAttribute("aria-label", p ? "Start automatic rotation" : "Pause automatic rotation");
    track.setAttribute("aria-live", p ? "polite" : "off");
  }
  function tick(t) {
    if (last === null) last = t;
    var dt = t - last; last = t;
    if (playing()) {
      elapsed += dt;
      if (elapsed >= dwell(index)) { go(index + 1, false); }
    }
    var D = dwell(index), n = photoSets[index].length;
    if (n > 1) showPhoto(Math.min(n - 1, Math.floor(elapsed / (D / n))));
    var fill = dots[index].querySelector(".fill");
    fill.style.setProperty("--p", Math.min(elapsed / D, 1).toFixed(4));
    requestAnimationFrame(tick);
  }

  pauseBtn.addEventListener("click", function () { setPaused(!userPaused); });
  $(".stories-prev", root).addEventListener("click", function () { go(index - 1, true); });
  $(".stories-next", root).addEventListener("click", function () { go(index + 1, true); });
  /* Keyboard focus inside the carousel stops the rotation; a mouse click on a control does not */
  root.addEventListener("focusin", function (e) {
    var kb = true;
    try { kb = e.target.matches(":focus-visible"); } catch (err) { /* older browsers: treat as keyboard */ }
    focused = kb;
  });
  root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) focused = false; });
  root.addEventListener("keydown", function () { focused = true; });
  controls.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(index + 1, true); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(index - 1, true); e.preventDefault(); }
  });

  /* Swipe on touch screens */
  var x0 = null, y0 = null;
  track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { x0 = e.clientX; y0 = e.clientY; } });
  track.addEventListener("pointerup", function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1), true);
  });
  track.addEventListener("pointercancel", function () { x0 = null; });

  /* Rotate only while the carousel is on screen, so every visitor starts on the first story */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0.35 }).observe(root);
  } else { visible = true; }

  setPaused(userPaused);
  render();
  showPhoto(0);
  requestAnimationFrame(tick);
})();
