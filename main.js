
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  function revealNow(el){ el.classList.add('in'); }
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { revealNow(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    /* failsafe: reveal anything at/above the fold shortly after load, in case the
       observer misses its first callback (keeps below-fold scroll animations intact) */
    var failsafe = function () {
      var vh = window.innerHeight || 800;
      revealEls.forEach(function (el) {
        if (el.classList.contains('in')) return;
        if (el.getBoundingClientRect().top < vh + 120) { revealNow(el); io.unobserve(el); }
      });
    };
    setTimeout(failsafe, 250);
    window.addEventListener('load', failsafe);
  } else {
    revealEls.forEach(revealNow);
  }

  /* animated counters */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = prefix + target.toLocaleString() + suffix; return; }
    var start = null, dur = 2800; /* gentle, unhurried count-up */
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4); /* ease-out quart: quick lead-in, soft landing */
      el.textContent = prefix + Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* progress bar */
  var bar = document.getElementById('fundbar');
  if (bar) {
    setTimeout(function () { bar.style.width = bar.getAttribute('data-width'); }, 350);
  }

  /* mobile nav */
  var toggle = document.getElementById('navtoggle');
  var links = document.getElementById('navlinks');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* partner marquee — duplicate the strip for a seamless infinite loop */
  var track = document.getElementById('ptrack');
  if (track && !reduced) {
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (k) {
      var c = k.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  }

  /* gallery filters */
  var filterBtns = document.querySelectorAll('.filters button');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('.gal figure').forEach(function (fig) {
        fig.classList.toggle('hidden', f !== 'all' && fig.getAttribute('data-cat') !== f);
      });
    });
  });

  /* lightbox (gallery page only) */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lb-img');
    var lbClose = document.getElementById('lb-close');
    var lbTrigger = null;
    var openLb = function (img) {
      lbTrigger = document.activeElement;
      lbImg.src = img.src; lbImg.alt = img.alt;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    document.querySelectorAll('.gal figure, .mphoto').forEach(function (fig) {
      var img = fig.querySelector('img');
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'View image: ' + img.alt);
      fig.addEventListener('click', function () { openLb(img); });
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(img); }
      });
    });
    var closeLb = function () {
      lb.classList.remove('open'); lbImg.src = '';
      document.body.style.overflow = '';
      if (lbTrigger && lbTrigger.focus) lbTrigger.focus();
    };
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });
  }

  /* interest deep-link (Request a screening →) */
  document.querySelectorAll('[data-interest="screening"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('f-interest');
      if (sel) sel.value = 'Requesting a cardiac screening';
    });
  });

  /* lead form -> mailto (contact page only) */
  var form = document.getElementById('leadform');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name');
    var email = document.getElementById('f-email');
    var okName = name.value.trim().length > 1;
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    document.getElementById('e-name').style.display = okName ? 'none' : 'block';
    document.getElementById('e-email').style.display = okEmail ? 'none' : 'block';
    if (!okName) { name.focus(); return; }
    if (!okEmail) { email.focus(); return; }
    var org = document.getElementById('f-org').value.trim();
    var interest = document.getElementById('f-interest').value;
    var msg = document.getElementById('f-msg').value.trim();
    var subject = encodeURIComponent('[Website] ' + interest + ' — ' + name.value.trim());
    var body = encodeURIComponent(
      'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
      (org ? '\nOrganization: ' + org : '') +
      '\nInterest: ' + interest +
      (msg ? '\n\n' + msg : '')
    );
    window.location.href = 'mailto:admin@trueamorfoundation.com?subject=' + subject + '&body=' + body;
    document.getElementById('formok').style.display = 'block';
  });

  /* site music — every page. Browsers require a user gesture before sound can
     start: we try autoplay, fall back to the first tap/click/key, and float a
     ♪ button so visitors can pause it. The track resumes where it left off as
     visitors move between pages, and a pause sticks for the whole visit. */
  (function () {
    var audio = new Audio('/audio/anniversary.m4a');
    audio.loop = true;
    audio.volume = 0.55;
    audio.preload = 'auto';

    var off = false, saved = 0;
    try {
      off = sessionStorage.getItem('taf-music-off') === '1';
      saved = parseFloat(sessionStorage.getItem('taf-music-t')) || 0;
    } catch (e) {}
    if (saved > 0) audio.addEventListener('loadedmetadata', function () {
      try { audio.currentTime = saved; } catch (e) {}
    });
    var lastSave = 0;
    function saveTime() { try { sessionStorage.setItem('taf-music-t', audio.currentTime); } catch (e) {} }
    audio.addEventListener('timeupdate', function () {
      var now = Date.now();
      if (now - lastSave > 2000) { lastSave = now; saveTime(); }
    });
    window.addEventListener('pagehide', saveTime);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'music-toggle paused';
    btn.setAttribute('aria-label', 'Play music');
    btn.textContent = '♪';
    document.body.appendChild(btn);

    function setUI(playing) {
      btn.classList.toggle('paused', !playing);
      btn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    }
    function tryPlay() {
      audio.play().then(function () { setUI(true); disarm(); }).catch(function () { setUI(false); });
    }
    function onFirst(e) {
      if (btn.contains(e.target)) return;
      if (!off && audio.paused) tryPlay();
    }
    function arm() {
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) {
        document.addEventListener(t, onFirst, { passive: true });
      });
    }
    function disarm() {
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) {
        document.removeEventListener(t, onFirst);
      });
    }
    btn.addEventListener('click', function () {
      if (audio.paused) {
        off = false;
        try { sessionStorage.removeItem('taf-music-off'); } catch (e) {}
        tryPlay();
      } else {
        audio.pause(); setUI(false); disarm();
        off = true;
        try { sessionStorage.setItem('taf-music-off', '1'); } catch (e) {}
      }
    });
    arm();
    if (!off) tryPlay(); else setUI(false);
  })();

  /* one-year anniversary (Aug 6, 2026) — banner + confetti, home page only.
     Active Aug 5–17, 2026; add ?confetti to the URL to preview any time. */
  (function () {
    var now = new Date();
    var inWindow = now >= new Date(2026, 7, 5) && now < new Date(2026, 7, 18);
    if (!inWindow && !/[?&]confetti/.test(window.location.search)) return;
    var annobar = document.getElementById('annobar');
    if (annobar) annobar.hidden = false;
    if (reduced) return;
    if (!document.querySelector('section.hero')) return;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    var ctx, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; }

    var colors = ['#F3A3BB', '#F9C6D4', '#D9698A', '#E784A1', '#FFD98E', '#FFFFFF'];
    var pieces = [];
    var COUNT = window.innerWidth < 700 ? 150 : 260;
    for (var i = 0; i < COUNT; i++) {
      var heart = Math.random() < 0.18;
      pieces.push({
        x: Math.random(),
        y: -Math.random() * 1.35 - 0.05,
        w: heart ? 11 + Math.random() * 6 : 6 + Math.random() * 6,
        heart: heart,
        color: colors[(Math.random() * colors.length) | 0],
        vy: 0.9 + Math.random() * 1.4,
        sway: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22
      });
    }

    function drawHeart(c, s) {
      c.beginPath();
      c.moveTo(0, s * 0.35);
      c.bezierCurveTo(-s * 0.55, -s * 0.10, -s * 0.30, -s * 0.50, 0, -s * 0.20);
      c.bezierCurveTo(s * 0.30, -s * 0.50, s * 0.55, -s * 0.10, 0, s * 0.35);
      c.fill();
    }

    var start = null, DURATION = 11000;
    function frame(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = elapsed > DURATION - 1200 ? Math.max(0, (DURATION - elapsed) / 1200) : 1;
      var alive = false;
      pieces.forEach(function (p) {
        p.y += p.vy * 0.0045;
        p.phase += 0.03 * p.sway;
        p.rot += p.vr;
        if (p.y < 1.05) alive = true; else return;
        var py = p.y * H;
        if (py < -24 * dpr) return;
        ctx.save();
        ctx.translate((p.x + Math.sin(p.phase) * 0.02) * W, py);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.heart) {
          drawHeart(ctx, p.w * dpr);
        } else {
          var flutter = Math.max(0.25, Math.abs(Math.cos(p.phase)));
          ctx.fillRect(-p.w * dpr / 2, -p.w * dpr * flutter / 2, p.w * dpr, p.w * dpr * flutter * 0.62);
        }
        ctx.restore();
      });
      if (elapsed < DURATION && alive) requestAnimationFrame(frame);
      else { canvas.remove(); window.removeEventListener('resize', size); }
    }

    setTimeout(function () {
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      size();
      window.addEventListener('resize', size);
      requestAnimationFrame(frame);
    }, 500);
  })();
})();
