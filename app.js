/* Listly landing — interactions */
(function () {
  "use strict";

  /* ---- nav: toggle solid background + drop dark text once past hero ---- */
  var nav = document.getElementById("nav");
  var hero = document.getElementById("top");
  function onScroll() {
    var past = window.scrollY > 40;
    nav.classList.toggle("scrolled", past);
    // keep light-on-dark while hero still covers the top of the viewport
    var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    nav.classList.toggle("on-dark", heroBottom > 72);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- scroll reveal ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- FAQ: single-open accordion ---- */
  var faqs = document.querySelectorAll("details.faq");
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        faqs.forEach(function (o) { if (o !== d) o.open = false; });
      }
    });
  });

  /* ---- hero: animated dot-sphere (canvas) ---- */
  var canvas = document.getElementById("orb-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // build a lat/long grid of points on the unit sphere (dotted-globe look)
    var pts = [];
    var LAT = 42, LON = 66;
    for (var la = 0; la <= LAT; la++) {
      var theta = Math.PI * (la / LAT);          // 0..PI  (pole to pole)
      var ringY = Math.cos(theta);
      var ringR = Math.sin(theta);
      for (var lo = 0; lo < LON; lo++) {
        var phi = (2 * Math.PI) * (lo / LON);
        pts.push({
          x: ringR * Math.cos(phi),
          y: ringY,
          z: ringR * Math.sin(phi),
          tw: Math.random() * Math.PI * 2       // twinkle phase
        });
      }
    }

    var tilt = -0.40;                            // look slightly down onto the globe
    var cosX = Math.cos(tilt), sinX = Math.sin(tilt);

    function draw(ay, time) {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      var R = Math.min(W, H) * 0.40;
      var cosY = Math.cos(ay), sinY = Math.sin(ay);

      ctx.globalCompositeOperation = "lighter";

      // warm core glow that makes the centre luminous
      var glowR = R * 1.02;
      var grd = ctx.createRadialGradient(cx, cy - R * 0.06, 0, cx, cy - R * 0.06, glowR);
      grd.addColorStop(0, "rgba(232,134,46,0.42)");
      grd.addColorStop(0.42, "rgba(196,84,24,0.16)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy - R * 0.06, glowR, 0, Math.PI * 2);
      ctx.fill();

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        // rotate around Y, then tilt around X
        var x = p.x * cosY - p.z * sinY;
        var zr = p.x * sinY + p.z * cosY;
        var y = p.y * cosX - zr * sinX;
        var z = p.y * sinX + zr * cosX;

        var depth = (z + 1) / 2;                 // 0 = back, 1 = front
        var sx = cx + x * R;
        var sy = cy + y * R;

        var tw = 0.8 + 0.2 * Math.sin(time * 0.0011 + p.tw);
        var d2 = depth * depth;
        var size = (0.45 + d2 * 2.3) * tw;
        var alpha = (0.04 + d2 * 0.96) * tw;

        // warmer + brighter toward the front
        var r = Math.round(214 + depth * 41);    // 214 -> 255
        var g = Math.round(102 + depth * 103);   // 102 -> 205
        var b = Math.round(34 + depth * 116);    //  34 -> 150
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    if (reduce) {
      draw(0.6, 0);
    } else {
      var start = performance.now();
      (function loop(now) {
        var t = now - start;
        draw(t * 0.00018, t);
        requestAnimationFrame(loop);
      })(start);
    }
  }
})();
