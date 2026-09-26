/* =========================================================
   野猪篱 — 页面逻辑（三页结构）
   封面随机短句 + 博客时间线（文章 / 归档 / 相册融合）
   ========================================================= */
(function () {
  'use strict';

  var MM = window.MiniMarkdown;
  var INDEX_URL = 'posts/index.json';

  /* ============ 封面随机短句 ============ */
  var QUOTES = [
    '所谓浪漫，就是和她一起把日子过慢。',
    '山野辽阔，我们只占一小块阳光。',
    '篱笆不是为了挡住谁，是为了给牵牛花一个方向。',
    '两个人的生活，是从「今天吃什么」开始的。',
    '把小事记下来，日子就有了重量。',
    '风穿过篱笆的时候，会顺便把心事也带走。',
    '愿你有一个不赶时间的下午。',
    '我们不必成为风景，只要我们互相看得见。',
    '烤肉、热汤、旧电影，冬天就该这样过。',
    '慢慢来，比较快。',
    '一杯茶的时间，想清楚一件事就够了。',
    '散步是两个人的最短旅行。',
    '书读得慢一点，反而记得久一点。',
    '月亮今天也很好看，可惜你没抬头。',
    '我们不急，春天每年都来。',
    '所有长途跋涉，都为了回到一张餐桌。',
    '好好吃饭，好好睡觉，好好相爱。'
  ];

  /* ================= 工具 ================= */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function partsOf(date) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date || ''));
    return m ? { y: m[1], m: m[2], d: m[3] } : { y: '', m: '', d: '' };
  }

  /* 冒小图形的工具由 main.js 提供（全站可用） */
  var popShape = window.WBHPopShape;

  var BOAR_SVG = '<svg class="state-boar" viewBox="0 0 64 48" fill="none" stroke="currentColor" '
    + 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M18 18c-1-5 0-8 2.5-9.5 2 1.6 3.4 4.4 3.8 7.6"/>'
    + '<path d="M46 18c1-5 0-8-2.5-9.5-2 1.6-3.4 4.4-3.8 7.6"/>'
    + '<path d="M32 12c8.3 0 14.5 5.4 14.5 14.5C46.5 34.9 40 41 32 41S17.5 34.9 17.5 26.5C17.5 17.4 23.7 12 32 12z"/>'
    + '<circle cx="26" cy="24.5" r="1.8" fill="currentColor" stroke="none"/>'
    + '<circle cx="38" cy="24.5" r="1.8" fill="currentColor" stroke="none"/>'
    + '<path d="M27.5 32.5h9"/><circle cx="32" cy="35.6" r=".9" fill="currentColor" stroke="none"/>'
    + '<path d="M22 30.5c.6 1.8 1.8 2.6 3.2 2.4"/><path d="M42 30.5c-.6 1.8-1.8 2.6-3.2 2.4"/>'
    + '</svg>';

  function stateBox(msg) {
    return '<div class="state">' + BOAR_SVG + '<p>' + msg + '</p></div>';
  }

  /* ================= 数据 ================= */
  var cache = null;
  function loadIndex() {
    if (cache) return Promise.resolve(cache);
    return fetch(INDEX_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var posts = (data.posts || []).slice().sort(function (a, b) {
          if (a.date === b.date) return 0;
          return a.date < b.date ? 1 : -1;   /* 时间倒序 */
        });
        cache = { site: data.site || {}, posts: posts };
        return cache;
      });
  }

  /* 读取每篇正文；失败时退回摘要 */
  function withBody(p) {
    var file = p.file || ('posts/' + p.slug + '.md');
    return fetch(file, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (md) { p.__body = MM ? MM.render(md) : esc(p.excerpt || ''); return p; })
      .catch(function () { p.__body = '<p>' + esc(p.excerpt || '') + '</p>'; return p; });
  }

  /* ================= 封面随机短句 ================= */
  function initCoverQuote() {
    var el = $('#coverQuote');
    if (!el) return;
    var last = -1;
    function pick() {
      var i = Math.floor(Math.random() * QUOTES.length);
      if (QUOTES.length > 1 && i === last) i = (i + 1) % QUOTES.length;
      last = i;
      el.classList.add('is-fading');
      setTimeout(function () {
        el.textContent = QUOTES[i];
        el.classList.remove('is-fading');
      }, 400);
    }
    pick();
    setInterval(pick, 7000);
  }

  /* ================= 博客时间线 ================= */
  function tagChips(tags) {
    return (tags || []).map(function (t) {
      return '<span class="chip">#' + esc(t) + '</span>';
    }).join('');
  }

  function imagesHTML(p) {
    var imgs = (p.images && p.images.length)
      ? p.images
      : (p.cover ? [p.cover] : []);
    if (!imgs.length) return '';
    var cls = imgs.length === 1 ? 'n1'
      : (imgs.length === 2 ? 'n2'
      : (imgs.length === 4 ? 'n4' : 'n3'));
    var inner = imgs.map(function (src, i) {
      return '<a href="' + esc(src) + '" data-zoom="' + esc(src) + '" aria-label="查看大图 ' + (i + 1) + '">'
        + '<img src="' + esc(src) + '" alt="' + esc(p.title) + ' 图片 ' + (i + 1)
        + '" loading="lazy" decoding="async"></a>';
    }).join('');
    return '<div class="entry-images ' + cls + '">' + inner + '</div>';
  }

  function entryHTML(p) {
    var d = partsOf(p.date);
    var date = '<div class="entry-date">'
      + '<span class="ed-dot"></span>'
      + '<span class="ed-day">' + (d.d || '') + '</span>'
      + '<span class="ed-my">' + (d.y ? d.y + '.' + d.m : '') + '</span>'
      + (p.category ? '<span class="ed-cat">' + esc(p.category) + '</span>' : '')
      + '</div>';
    var card = '<div class="entry-card">'
      + '<h2 class="entry-title">' + esc(p.title) + '</h2>'
      + '<div class="entry-text prose">' + (p.__body || '') + '</div>'
      + imagesHTML(p)
      + '<div class="entry-foot">'
      + tagChips(p.tags)
      + (p.author ? '<span class="ef-author">由 ' + esc(p.author) + ' 记下</span>' : '')
      + '</div>'
      + '</div>';
    return '<article class="entry" data-cat="' + esc(p.category || '') + '">' + date + card + '</article>';
  }

  function yearHTML(y) {
    return '<div class="feed-year"><span class="fy-line"></span>'
      + '<span class="fy-badge"><span class="fy-year">' + y + '</span><span class="fy-label">这一年</span></span>'
      + '<span class="fy-line"></span></div>';
  }

  function initFeed() {
    var feed = $('#feed');
    if (!feed) return;
    var catBox = $('#filterCats');
    var hint = $('#resultHint');
    feed.innerHTML = stateBox('正在把日子搬出来…');

    loadIndex().then(function (d) {
      var posts = d.posts;
      if (!posts.length) { feed.innerHTML = stateBox('还没有内容，去写第一篇吧 🌱'); return; }

      /* 分类列表 */
      var catCount = {};
      posts.forEach(function (p) {
        if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1;
      });
      var cats = Object.keys(catCount).sort(function (a, b) {
        return catCount[b] - catCount[a] || a.localeCompare(b, 'zh');
      });
      var activeCat = '';

      function btn(value, label) {
        return '<button type="button" class="filter-btn" data-cat="' + esc(value) + '">' + esc(label) + '</button>';
      }
      catBox.innerHTML = btn('', '全部')
        + cats.map(function (c) { return btn(c, c + ' ' + catCount[c]); }).join('');

      function draw() {
        var list = posts.filter(function (p) { return !activeCat || p.category === activeCat; });

        /* 按年份分组输出 */
        var html = '';
        var lastY = null;
        list.forEach(function (p) {
          var y = String(p.date).slice(0, 4);
          if (y !== lastY) { html += yearHTML(y); lastY = y; }
          html += entryHTML(p);
        });
        feed.innerHTML = html || stateBox('这个分类下还没有内容 🍃');

        if (hint) hint.textContent = '共 ' + list.length + ' 条 · 按时间倒序';
        $$('.filter-btn', catBox).forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-cat') === activeCat);
        });
        if (window.WBHReveal) window.WBHReveal(feed);
      }

      catBox.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (!b) return;
        activeCat = b.getAttribute('data-cat') || '';
        draw();
      });

      /* 先取全部正文，再首绘 */
      Promise.all(posts.map(withBody)).then(draw);
    }).catch(function (err) {
      feed.innerHTML = stateBox('索引读取失败（' + esc(err.message) + '）。<br>'
        + '本地双击打开时请用本地服务器预览，例如：<br><code>python -m http.server 8080</code>');
    });
  }

  /* ============ 封面小交互 ============ */
  function initCoverInteractions() {
    var cover = $('.cover');
    if (!cover) return;

    var PETAL = '<path d="M12 2C15 6 18 9 18 13a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>';

    /* 点空白处：飘出一小簇花瓣 */
    cover.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      for (var i = 0; i < 3; i++) {
        (function (i) {
          setTimeout(function () {
            popShape('cover-petal',
              e.clientX + (Math.random() * 26 - 13),
              e.clientY + (Math.random() * 20 - 10),
              PETAL, 1700);
          }, i * 90);
        })(i);
      }
    });

    /* 鼠标左右移动时，云做视差 */
    var ca = $('.cover-cloud--a'), cb = $('.cover-cloud--b'), cc = $('.cover-cloud--c');
    cover.addEventListener('mousemove', function (e) {
      var rx = e.clientX / window.innerWidth - .5;
      if (ca) ca.style.translate = (rx * -14) + 'px 0';
      if (cb) cb.style.translate = (rx * 22) + 'px 0';
      if (cc) cc.style.translate = (rx * -30) + 'px 0';
    });
  }

  /* ============ 推门过场 ============
     点「推开篱门」/「下滑推门」/ 鼠标下滚 / 触屏上滑 / 下方向键，
     都会先把篱门推开，再进博客。 */
  function initGate() {
    var cover = $('.cover');
    if (!cover) return;

    var DURATION = 2650;   /* 与 style.css 里 .is-opening 的时间轴对齐 */
    var opening = false;

    function reduced() {
      return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function openGate() {
      if (opening) return;
      opening = true;
      if (reduced()) { location.href = 'blog.html'; return; }
      cover.classList.add('is-opening');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { location.href = 'blog.html'; }, DURATION);
    }

    /* 1) 门上的两个入口 */
    $$('a[href="blog.html"]', cover).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openGate();
      });
    });

    /* 2) 鼠标向下滚 */
    window.addEventListener('wheel', function (e) {
      if (opening || e.deltaY < 8) return;
      openGate();
    }, { passive: true });

    /* 3) 触屏上滑 */
    var touchY = 0;
    window.addEventListener('touchstart', function (e) {
      touchY = e.touches[0] ? e.touches[0].clientY : 0;
    }, { passive: true });
    window.addEventListener('touchend', function (e) {
      if (opening) return;
      var end = e.changedTouches[0] ? e.changedTouches[0].clientY : touchY;
      if (touchY - end > 44) openGate();
    }, { passive: true });

    /* 4) 键盘 */
    document.addEventListener('keydown', function (e) {
      if (opening) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') openGate();
    });

    /* 从缓存返回时，把门恢复成关着的 */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      opening = false;
      cover.classList.remove('is-opening');
      document.body.style.overflow = '';
    });
  }

  /* ================= 启动 ================= */
  function boot() {
    initCoverQuote();
    initCoverInteractions();
    initGate();
    initFeed();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
