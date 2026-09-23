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
    root.setAttribute('data-theme', theme);
    if (!silent) {
      document.dispatchEvent(new CustomEvent('wbh:theme', { detail: { theme: theme } }));
    }
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

  /* ================= 3. 导航高亮 ================= */
  function initNavActive() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!file) file = 'index.html';
    $$('.nav-menu a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
      var hit = href === file
        || (file === 'post.html' && href === 'posts.html')
        || (file === '404.html' && href === 'index.html');
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

  /* ================= 5. 图片灯箱 ================= */
  function initLightbox() {
    var triggers = $$('[data-zoom]');
    if (!triggers.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '图片预览');
    box.innerHTML = '<button class="lightbox-close" type="button" aria-label="关闭">×</button><img alt="">';
    document.body.appendChild(box);
    var boxImg = box.querySelector('img');
    var lastFocus = null;

    function open(src, alt) {
      lastFocus = document.activeElement;
      boxImg.src = src;
      boxImg.alt = alt || '';
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox-close').focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      boxImg.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    triggers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        var thumb = el.tagName === 'IMG' ? el : el.querySelector('img');
        var src = el.getAttribute('data-zoom')
          || (thumb && (thumb.getAttribute('data-full') || thumb.currentSrc || thumb.src));
        if (!src) return;
        e.preventDefault();
        open(src, thumb ? thumb.alt : '');
      });
    });

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('lightbox-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
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

  /* ================= 启动 ================= */
  function boot() {
    initTheme();
    initNav();
    initNavActive();
    initCodeCopy();
    initLightbox();
    initAnchors();
    initYear();
    initImgFallback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();