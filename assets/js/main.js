/* =========================================================
   野猪篱 — 全局交互
   主题切换 / 移动端导航 / 导航高亮 / 代码复制 /
   图片灯箱 / 锚点平滑滚动 / 页脚年份 / 图片加载兜底
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'wbh-theme';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ================= 0. 通用小特效 ================= */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var HEART_PATH = '<path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2 5 5.5 5c2 0 3.5 1.2 4.5 2.6'
    + 'C11 6.2 12.5 5 14.5 5 18 5 19.6 8.6 22 11.7 19.5 16.3 12 21 12 21z"/>';

  /* 在指定位置冒一个小图形，动画结束自己销毁。dx 省略时随机左右飘 */
  function popShape(cls, x, y, inner, life, dx) {
    var s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('class', cls);
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'currentColor');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx',
      Math.round(dx == null ? Math.random() * 64 - 32 : dx) + 'px');
    s.innerHTML = inner;
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, life);
  }
  window.WBHPopShape = popShape;

  /* 页脚两只野猪：隔几秒自己跳一下，顺手给对方冒颗爱心 */
  function initBoarIdle() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    $$('.footer-boars').forEach(function (box) {
      var boars = $$('svg', box);
      if (boars.length < 2) return;

      function tick() {
        var i = Math.random() < .5 ? 0 : 1;
        var me = boars[i], you = boars[1 - i];

        me.classList.add('is-hopping');
        setTimeout(function () { me.classList.remove('is-hopping'); }, 1000);

        var a = me.getBoundingClientRect();
        var b = you.getBoundingClientRect();
        var dir = (b.left + b.width / 2) - (a.left + a.width / 2);
        /* 爱心朝对方那边飘过去 */
        popShape('heart-pop', a.left + a.width / 2, a.top, HEART_PATH, 1600, dir * 0.45);

        setTimeout(tick, 3600 + Math.random() * 4200);
      }
      setTimeout(tick, 2200 + Math.random() * 2600);
    });
  }

  /* 点任意一只野猪（封面的两只、页脚的两只）都冒爱心 */
  function initBoarHearts() {
    $$('.cover-boars,.footer-boars').forEach(function (box) {
      var kids = $$('svg', box);
      (kids.length ? kids : [box]).forEach(function (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          var r = el.getBoundingClientRect();
          var cx = e.clientX || (r.left + r.width / 2);
          var cy = e.clientY || (r.top + r.height / 2);
          for (var i = 0; i < 3; i++) {
            (function (i) {
              setTimeout(function () {
                popShape('heart-pop',
                  cx + (Math.random() * 32 - 16),
                  cy - 6 + (Math.random() * 14 - 7),
                  HEART_PATH, 1500);
              }, i * 120);
            })(i);
          }
        });
      });
    });
  }

  /* ================= 0.5 鼠标跟随特效 ================= */
  var SPARK_SHAPES = [
    { cls: '', path: '<path d="M12 2C15 6 18 9 18 13a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>' },
    { cls: 'cursor-spark--pollen', path: '<circle cx="12" cy="12" r="7.5"/>' },
    { cls: 'cursor-spark--leaf', path: '<path d="M20 4C10 5 5 11 4 20c9 0 15-5 16-16z"/>' }
  ];

  function initCursorFX() {
    if (window.matchMedia) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      /* 触摸设备没有光标，跳过 */
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    }

    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var tx = window.innerWidth * .5, ty = window.innerHeight * .35;
    var gx = tx, gy = ty;
    var lastX = tx, lastY = ty, acc = 0, live = 0;

    /* 拖尾：走过一段距离就留一片花瓣 / 花粉 / 小叶 */
    function spark(x, y) {
      if (live > 14) return;
      var s = SPARK_SHAPES[(Math.random() * SPARK_SHAPES.length) | 0];
      var el = document.createElementNS(SVG_NS, 'svg');
      el.setAttribute('class', 'cursor-spark ' + s.cls);
      el.setAttribute('viewBox', '0 0 24 24');
      el.setAttribute('fill', 'currentColor');
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--dx', Math.round(Math.random() * 28 - 14) + 'px');
      el.style.setProperty('--dy', Math.round(Math.random() * 22 + 14) + 'px');
      el.innerHTML = s.path;
      document.body.appendChild(el);
      live++;
      setTimeout(function () { el.remove(); live--; }, 1000);
    }

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-on');
      acc += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      if (acc > 30) {
        acc = 0;
        lastX = e.clientX; lastY = e.clientY;
        spark(e.clientX, e.clientY);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.classList.remove('is-on');
    });

    /* 光晕轻轻跟上来；圈变小了，跟得太慢会像掉队的点，所以收得紧一点 */
    (function follow() {
      gx += (tx - gx) * .2;
      gy += (ty - gy) * .2;
      glow.style.transform = 'translate3d(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ================= 1. 主题切换 ================= */
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* 隐私模式忽略 */ }
  }
  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function setTheme(t, silent) {
    var theme = t === 'dark' ? 'dark' : 'light';
    var apply = function () {
      root.setAttribute('data-theme', theme);
      if (!silent) {
        document.dispatchEvent(new CustomEvent('wbh:theme', { detail: { theme: theme } }));
      }
    };
    root.classList.add('theme-fade');
    if (document.startViewTransition) {
      try { document.startViewTransition(apply); } catch (e) { apply(); }
    } else {
      apply();
    }
    setTimeout(function () { root.classList.remove('theme-fade'); }, 900);
  }

  function initTheme() {
    var btns = $$('[data-theme-toggle]');

    function syncLabel() {
      var dark = isDark();
      var text = dark ? '切换到浅色模式' : '切换到深色模式';
      btns.forEach(function (b) {
        b.setAttribute('aria-label', text);
        b.setAttribute('title', text);
      });
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        setTheme(next, false);
        saveTheme(next);
        syncLabel();
      });
    });
    syncLabel();

    // 用户没手动选过时，跟随系统
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) {
      var onChange = function (e) {
        if (!storedTheme()) { setTheme(e.matches ? 'dark' : 'light', true); syncLabel(); }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ================= 2. 移动端导航 ================= */
  function initNav() {
    var btn = $('[data-nav-toggle]');
    var menu = $('#navMenu');
    if (!btn || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      var open = menu.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) close(); });
  }

  /* 封面透明导航：滚动后落底 */
  function initGhostNav() {
    var nav = document.querySelector('.site-nav--ghost');
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.pageYOffset > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================= 3. 导航高亮 ================= */
  function initNavActive() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!file) file = 'index.html';
    $$('.nav-menu a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
      var hit = href === file;
      if (hit) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ================= 4. 代码块复制 ================= */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function initCodeCopy() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var block = b.closest('.code-block');
      var code = block && block.querySelector('code');
      if (!code) return;
      var original = b.textContent;
      copyText(code.textContent).then(function () {
        b.textContent = '已复制 ✓';
      }, function () {
        b.textContent = '复制失败';
      }).then(function () {
        setTimeout(function () { b.textContent = original; }, 1600);
      });
    });
  }

  /* ================= 5. 图片灯箱（事件委托，支持动态图片与翻页） ================= */
  function initLightbox() {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '图片预览');
    box.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="关闭">×</button>'
      + '<button class="lightbox-nav lightbox-prev" type="button" aria-label="上一张">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>'
      + '<img alt="">'
      + '<button class="lightbox-nav lightbox-next" type="button" aria-label="下一张">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>'
      + '<p class="lightbox-count" aria-hidden="true"></p>';
    document.body.appendChild(box);
    var boxImg = box.querySelector('img');
    var counter = box.querySelector('.lightbox-count');
    var lastFocus = null;
    var urls = [];
    var cur = 0;

    function show(i) {
      cur = (i + urls.length) % urls.length;
      boxImg.src = urls[cur].src;
      boxImg.alt = urls[cur].alt || '';
      if (counter) counter.textContent = urls.length > 1 ? (cur + 1) + ' / ' + urls.length : '';
      box.classList.toggle('has-multi', urls.length > 1);
    }
    function open(list, i) {
      lastFocus = document.activeElement;
      urls = list;
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      show(i);
      box.querySelector('.lightbox-close').focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      boxImg.removeAttribute('src');
      urls = [];
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-zoom]');
      if (el) {
        var group = el.closest('.entry-images,.gallery');
        var peers = group ? $$('[data-zoom]', group) : [el];
        var list = peers.map(function (p) {
          var thumb = p.tagName === 'IMG' ? p : p.querySelector('img');
          return {
            src: p.getAttribute('data-zoom')
              || (thumb && (thumb.getAttribute('data-full') || thumb.currentSrc || thumb.src)),
            alt: thumb ? thumb.alt : ''
          };
        }).filter(function (x) { return x.src; });
        var at = 0;
        var targetSrc = el.getAttribute('data-zoom');
        list.forEach(function (x, i) { if (targetSrc && x.src === targetSrc) at = i; });
        if (!list.length) return;
        e.preventDefault();
        open(list, at);
        return;
      }
      if (box.classList.contains('is-open')) {
        if (e.target === box || e.target.closest('.lightbox-close')) close();
        else if (e.target.closest('.lightbox-prev')) show(cur - 1);
        else if (e.target.closest('.lightbox-next')) show(cur + 1);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* ================= 6. 锚点平滑滚动（避开固定导航） ================= */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 88;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.pushState) history.pushState(null, '', '#' + id);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ================= 7. 页脚年份 ================= */
  function initYear() {
    var y = new Date().getFullYear();
    $$('[data-year]').forEach(function (el) { el.textContent = y; });
  }

  /* ================= 8. 图片加载兜底 ================= */
  function initImgFallback() {
    // 封面图挂了 → 退化成装饰性占位（不显示破图）
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG' || img.dataset.fbDone) return;
      img.dataset.fbDone = '1';
      var holder = img.closest('.card-cover');
      if (holder) {
        holder.classList.add('card-cover--empty');
        img.remove();
      } else {
        img.classList.add('img-broken');
      }
    }, true);
  }

  /* ================= 9. 滚动显现（克制，可降级） ================= */
  var REVEAL_SEL = '.entry,.feed-year,.person,.story,.filters';
  var revealIO = null;

  function armReveal(scope) {
    if (!revealIO) return;
    var nodes = $$(REVEAL_SEL, scope);
    nodes.forEach(function (n) {
      if (n.__revealed) return;
      n.__revealed = true;
      n.classList.add('reveal');
      /* 同级卡片轻微错峰 */
      var sibs = Array.prototype.slice.call(n.parentNode.children).filter(function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      n.style.transitionDelay = (Math.min(sibs.indexOf(n) % 4, 3) * 80) + 'ms';
      revealIO.observe(n);
    });
  }

  function initReveal() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revealIO.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    armReveal(document);
    window.WBHReveal = armReveal;
  }

  /* ================= 启动 ================= */
  function boot() {
    initBoarHearts();
    initBoarIdle();
    initCursorFX();
    initTheme();
    initNav();
    initGhostNav();
    initNavActive();
    initCodeCopy();
    initLightbox();
    initAnchors();
    initYear();
    initImgFallback();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();