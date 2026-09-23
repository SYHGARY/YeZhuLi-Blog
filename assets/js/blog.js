/* =========================================================
   野猪篱 — 博客逻辑
   仅 index / posts / archive / post 四个页面引入
   ========================================================= */
(function () {
  'use strict';

  var MM = window.MiniMarkdown;
  var INDEX_URL = 'posts/index.json';

  /* ============ 唯一需要你手动改的地方：Giscus 配置 ============
     1) 仓库需公开，并在 Settings → General → Features 打开 Discussions
     2) 安装 https://github.com/apps/giscus
     3) 打开 https://giscus.app/zh-CN ，填入仓库，选 Discussion 分类
     4) 把生成的 repo / repoId / categoryId 抄到下面
     留空则显示「评论未接入」的提示，不影响其它功能。
     =============================================================== */
  var GISCUS = {
    repo: '',                                   // 例如 'your-name/wild-boar-hedge'
    repoId: '',                                 // 例如 'R_kgDOLxxxxx'
    category: 'Announcements',                  // Discussion 分类名
    categoryId: '',                             // 例如 'DIC_kwDOLxxxx'
    mapping: 'pathname',
    lang: 'zh-CN'
  };

  /* ============ 首页随机短句 ============ */
  var QUOTES = [
    { text: '所谓浪漫，就是和她一起把日子过慢。', from: '野猪篱' },
    { text: '山野辽阔，我们只占一小块阳光。', from: '野猪篱' },
    { text: '篱笆不是为了挡住谁，是为了给牵牛花一个方向。', from: '野猪篱' },
    { text: '两个人的生活，是从「今天吃什么」开始的。', from: '日常' },
    { text: '把小事记下来，日子就有了重量。', from: '野猪篱' },
    { text: '风穿过篱笆的时候，会顺便把心事也带走。', from: '山野笔记' },
    { text: '愿你有一个不赶时间的下午。', from: '野猪篱' },
    { text: '我们不必成为风景，只要我们互相看得见。', from: '野猪篱' },
    { text: '烤肉、热汤、旧电影，冬天就该这样过。', from: '冬季清单' },
    { text: '慢慢来，比较快。', from: '老话' },
    { text: '一杯茶的时间，想清楚一件事就够了。', from: '野猪篱' },
    { text: '散步是两个人的最短旅行。', from: '野猪篱' },
    { text: '书读得慢一点，反而记得久一点。', from: '读书笔记' },
    { text: '月亮今天也很好看，可惜你没抬头。', from: '野猪篱' },
    { text: '我们不急，春天每年都来。', from: '野猪篱' },
    { text: '所有长途跋涉，都为了回到一张餐桌。', from: '野猪篱' },
    { text: '野猪不挑食，我们也是——生活给什么就吃什么，再添点盐。', from: '野猪篱' },
    { text: '好好吃饭，好好睡觉，好好相爱。', from: '野猪篱' }
  ];

  /* ================= 工具 ================= */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }
  function postUrl(p) { return 'post.html?slug=' + encodeURIComponent(p.slug); }
  function ymOf(date) { return String(date || '').slice(0, 7); }
  function fmtDate(s, style) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (!m) return esc(s || '');
    return style === 'cn'
      ? m[1] + ' 年 ' + Number(m[2]) + ' 月 ' + Number(m[3]) + ' 日'
      : m[1] + '-' + m[2] + '-' + m[3];
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
          return a.date < b.date ? 1 : -1;   // 时间倒序
        });
        cache = { site: data.site || {}, posts: posts };
        return cache;
      });
  }

  /* ================= 片段 ================= */
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

  function skeletonCards(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '<div class="skeleton"></div>';
    return s;
  }
  function stateBox(msg) {
    return '<div class="state">' + BOAR_SVG + '<p>' + msg + '</p></div>';
  }
  function tagChips(tags, limit) {
    return (tags || []).slice(0, limit || 3).map(function (t) {
      return '<span class="chip">#' + esc(t) + '</span>';
    }).join('');
  }

  function cardHTML(p) {
    var cover = p.cover
      ? '<div class="card-cover"><img src="' + esc(p.cover) + '" alt="' + esc(p.title)
        + '" loading="lazy" decoding="async"></div>'
      : '<div class="card-cover card-cover--empty" aria-hidden="true"></div>';
    var chips = tagChips(p.tags, 3);
    return '<article class="card fade-in">'
      + cover
      + '<div class="card-body">'
      + '<h3 class="card-title"><a href="' + postUrl(p) + '">' + esc(p.title) + '</a></h3>'
      + '<p class="card-excerpt">' + esc(p.excerpt || '') + '</p>'
      + '<div class="card-meta">'
      + '<time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time>'
      + (p.category ? '<span class="dot">·</span><span>' + esc(p.category) + '</span>' : '')
      + (chips ? '<span class="dot">·</span>' + chips : '')
      + '</div>'
      + '</div>'
      + '</article>';
  }

  /* ================= 首页 ================= */
  function initHome() {
    var grid = $('#latestPosts');
    if (!grid) return;
    var limit = Number(grid.getAttribute('data-limit') || 6);
    grid.innerHTML = skeletonCards(3);

    loadIndex().then(function (d) {
      var list = d.posts.slice(0, limit);
      grid.innerHTML = list.length
        ? list.map(cardHTML).join('')
        : stateBox('还没有文章，去 <code>posts/</code> 写第一篇吧 🌱');
    }).catch(function (err) {
      grid.innerHTML = stateBox('文章索引读取失败（' + esc(err.message)
        + '）。<br>如果你是双击打开 HTML，请用本地服务器预览，例如：<br>'
        + '<code>python -m http.server 8080</code>');
    });
  }

  /* ================= 文章列表页 ================= */
  function initList() {
    var grid = $('#postList');
    if (!grid) return;
    var catBox = $('#filterCats');
    var tagBox = $('#filterTags');
    var hint = $('#resultHint');
    grid.innerHTML = skeletonCards(6);

    loadIndex().then(function (d) {
      var posts = d.posts;

      /* 分类：按数量降序 */
      var catCount = {};
      posts.forEach(function (p) {
        if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1;
      });
      var cats = Object.keys(catCount).sort(function (a, b) {
        return catCount[b] - catCount[a] || a.localeCompare(b, 'zh');
      });

      /* 标签：按数量降序，最多取 20 个 */
      var tagCount = {};
      posts.forEach(function (p) {
        (p.tags || []).forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; });
      });
      var tags = Object.keys(tagCount).sort(function (a, b) {
        return tagCount[b] - tagCount[a] || a.localeCompare(b, 'zh');
      }).slice(0, 20);

      var state = { cat: param('cat'), tag: param('tag') };
      if (state.cat && cats.indexOf(state.cat) === -1) state.cat = '';
      if (state.tag && tags.indexOf(state.tag) === -1) state.tag = '';

      function btn(key, value, label) {
        return '<button type="button" class="filter-btn" data-key="' + key
          + '" data-value="' + esc(value) + '">' + esc(label) + '</button>';
      }
      catBox.innerHTML = btn('cat', '', '全部') + cats.map(function (c) { return btn('cat', c, c); }).join('');
      tagBox.innerHTML = btn('tag', '', '全部') + tags.map(function (t) { return btn('tag', t, t); }).join('');

      function draw() {
        var list = posts.filter(function (p) {
          var okCat = !state.cat || p.category === state.cat;
          var okTag = !state.tag || (p.tags || []).indexOf(state.tag) > -1;
          return okCat && okTag;
        });

        grid.innerHTML = list.length
          ? list.map(cardHTML).join('')
          : stateBox('这个筛选下还没有文章 🍃');
        if (hint) hint.textContent = '共 ' + list.length + ' 篇 · 按时间倒序';

        $$('.filter-btn', catBox).forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-value') === state.cat);
        });
        $$('.filter-btn', tagBox).forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-value') === state.tag);
        });

        var q = [];
        if (state.cat) q.push('cat=' + encodeURIComponent(state.cat));
        if (state.tag) q.push('tag=' + encodeURIComponent(state.tag));
        if (history.replaceState) {
          history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : ''));
        }
      }

      document.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (!b || !b.getAttribute('data-key')) return;
        state[b.getAttribute('data-key')] = b.getAttribute('data-value');
        draw();
      });

      draw();
    }).catch(function (err) {
      grid.innerHTML = stateBox('文章索引读取失败（' + esc(err.message) + '）。');
    });
  }

  /* ================= 归档页 ================= */
  function initArchive() {
    var box = $('#archiveBox');
    if (!box) return;
    box.innerHTML = stateBox('正在整理…');

    loadIndex().then(function (d) {
      if (!d.posts.length) { box.innerHTML = stateBox('还没有文章 🌱'); return; }

      var years = {};
      d.posts.forEach(function (p) {
        var y = String(p.date).slice(0, 4);
        var m = String(p.date).slice(5, 7);
        if (!years[y]) years[y] = {};
        if (!years[y][m]) years[y][m] = [];
        years[y][m].push(p);
      });

      box.innerHTML = Object.keys(years).sort().reverse().map(function (y) {
        var months = Object.keys(years[y]).sort().reverse();
        var total = months.reduce(function (a, m) { return a + years[y][m].length; }, 0);
        return '<section class="archive-year fade-in">'
          + '<div class="archive-year-head"><h2>' + y + '</h2><span class="count">' + total + ' 篇</span></div>'
          + months.map(function (m) {
            return '<p class="archive-month">' + y + '.' + m + '</p>'
              + '<ul class="archive-list">'
              + years[y][m].map(function (p) {
                return '<li>'
                  + '<time class="a-date" datetime="' + esc(p.date) + '">' + String(p.date).slice(8, 10) + '</time>'
                  + '<a class="a-title" href="' + postUrl(p) + '">' + esc(p.title) + '</a>'
                  + '<span class="a-tags">' + tagChips(p.tags, 2) + '</span>'
                  + '</li>';
              }).join('')
              + '</ul>';
          }).join('')
          + '</section>';
      }).join('');
    }).catch(function (err) {
      box.innerHTML = stateBox('归档读取失败（' + esc(err.message) + '）。');
    });
  }

  /* ================= 文章详情页 ================= */
  function initPost() {
    var host = $('#postArticle');
    if (!host) return;
    var slug = param('slug');

    if (!slug) {
      host.innerHTML = stateBox('没有指定文章。<br><a href="posts.html">← 回到文章列表</a>');
      return;
    }
    host.innerHTML = stateBox('正在展开书页…');

    loadIndex().then(function (d) {
      var idx = -1;
      d.posts.forEach(function (p, i) { if (p.slug === slug) idx = i; });
      if (idx === -1) {
        host.innerHTML = stateBox('没有找到这篇文章，可能链接过期了。<br><a href="posts.html">← 回到文章列表</a>');
        return null;
      }
      var meta = d.posts[idx];
      var file = meta.file || ('posts/' + meta.slug + '.md');
      return fetch(file, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status + '（' + file + '）');
          return r.text();
        })
        .then(function (md) { renderPost(meta, md, d.posts, idx); });
    }).catch(function (err) {
      host.innerHTML = stateBox('内容加载失败：' + esc(err.message)
        + '。<br>如果你是在本地双击打开的 HTML，请用本地服务器预览：<br><code>python -m http.server 8080</code>');
    });
  }

  function navHTML(older, newer) {
    function cell(p, kind) {
      if (!p) {
        return '<a class="pn-empty" aria-disabled="true"><span class="pn-label">'
          + (kind === 'older' ? '上一篇' : '下一篇') + '</span>'
          + '<span class="pn-title">' + (kind === 'older' ? '已经是最早一篇了' : '已经是最新一篇了') + '</span></a>';
      }
      return '<a href="' + postUrl(p) + '"' + (kind === 'newer' ? ' class="pn-next-link"' : '') + '>'
        + '<span class="pn-label">' + (kind === 'older' ? '上一篇' : '下一篇') + '</span>'
        + '<span class="pn-title">' + esc(p.title) + '</span></a>';
    }
    return '<nav class="post-nav" aria-label="文章导航">'
      + '<div>' + cell(newer, 'newer') + '</div>'
      + '<div class="pn-next">' + cell(older, 'older') + '</div>'
      + '</nav>';
  }

  function renderPost(meta, md, all, idx) {
    var older = all[idx + 1] || null;   // 更早
    var newer = all[idx - 1] || null;   // 更新

    document.title = meta.title + ' · 野猪篱';
    var desc = document.querySelector('meta[name="description"]');
    if (desc && meta.excerpt) desc.setAttribute('content', meta.excerpt);

    var html = ''
      + '<a class="post-back" href="posts.html">← 回到文章列表</a>'
      + '<header class="post-header">'
      + (meta.category ? '<span class="chip">' + esc(meta.category) + '</span>' : '')
      + '<h1>' + esc(meta.title) + '</h1>'
      + '<div class="post-meta">'
      + '<time datetime="' + esc(meta.date) + '">' + fmtDate(meta.date, 'cn') + '</time>'
      + (meta.author ? '<span class="dot">·</span><span>' + esc(meta.author) + '</span>' : '')
      + ((meta.tags || []).length ? '<span class="dot">·</span>' + tagChips(meta.tags, 5) : '')
      + '</div>'
      + '</header>'
      + (meta.cover
        ? '<img class="post-cover" src="' + esc(meta.cover) + '" alt="' + esc(meta.title)
          + '" loading="lazy" decoding="async">'
        : '')
      + '<div class="prose">' + MM.render(md) + '</div>'
      + navHTML(older, newer);

    var host = $('#postArticle');
    host.className = 'post-article';
    host.innerHTML = html;
    window.scrollTo(0, 0);
  }

  /* ================= Giscus 评论 ================= */
  function giscusTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark_dimmed' : 'light';
  }

  function initGiscus() {
    var mount = $('#giscusMount');
    if (!mount) return;

    if (!GISCUS.repo || !GISCUS.repoId || !GISCUS.categoryId) {
      mount.innerHTML = '<div class="state" style="padding:30px 16px">'
        + '<p>评论系统还没有接入 🌿</p>'
        + '<p style="font-size:13px;line-height:1.9">'
        + '打开 <code>assets/js/blog.js</code>，把顶部 Giscus 的 '
        + '<code>repo</code> / <code>repoId</code> / <code>categoryId</code> 填上即可启用。'
        + '</p></div>';
      return;
    }

    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', GISCUS.repo);
    s.setAttribute('data-repo-id', GISCUS.repoId);
    s.setAttribute('data-category', GISCUS.category);
    s.setAttribute('data-category-id', GISCUS.categoryId);
    s.setAttribute('data-mapping', GISCUS.mapping);
    s.setAttribute('data-strict', '1');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'top');
    s.setAttribute('data-lang', GISCUS.lang);
    s.setAttribute('data-loading', 'lazy');
    s.setAttribute('data-theme', giscusTheme());
    mount.appendChild(s);

    // 主题切换时同步 Giscus 配色
    document.addEventListener('wbh:theme', function () {
      var frame = document.querySelector('iframe.giscus-frame');
      if (!frame) return;
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusTheme() } } },
        'https://giscus.app'
      );
    });
  }

  /* ================= 随机短句彩蛋 ================= */
  function initQuote() {
    var textEl = $('#quoteText');
    if (!textEl) return;
    var fromEl = $('#quoteFrom');
    var btn = $('#quoteRefresh');
    var last = -1;

    function pick() {
      var i = Math.floor(Math.random() * QUOTES.length);
      if (QUOTES.length > 1 && i === last) i = (i + 1) % QUOTES.length;
      last = i;
      var q = QUOTES[i];

      textEl.classList.add('is-fading');
      setTimeout(function () {
        textEl.textContent = q.text;
        if (fromEl) fromEl.textContent = q.from ? '— ' + q.from : '';
        textEl.classList.remove('is-fading');
      }, 170);
    }

    if (btn) btn.addEventListener('click', pick);
    pick();
  }

  /* ================= 启动 ================= */
  function boot() {
    initHome();
    initList();
    initArchive();
    initPost();
    initGiscus();
    initQuote();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();