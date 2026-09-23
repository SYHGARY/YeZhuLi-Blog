/* =========================================================
   野猪篱 Wild Boar Hedge — 迷你 Markdown 渲染器 + 轻量高亮
   零依赖 · window.MiniMarkdown
   支持：标题 / 段落 / 粗体 斜体 删除线 / 行内代码 / 链接 /
         图片(可居中) / 引用 / 有序无序列表(可嵌套) / 表格 /
         分割线 / 围栏代码块(JS TS HTML CSS JSON Bash Python YAML)
   ========================================================= */
(function (global) {
  'use strict';

  /* ================= 1. 基础工具 ================= */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function attr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }
  function slugify(t) {
    return String(t).toLowerCase().trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  }

  /* ================= 2. 代码高亮 =================
     每条规则必须「只含非捕获组」，这样外层包一层 ( ) 后，
     第 k 条规则就固定对应 m[k+1]。
     ================================================= */
  var GRAMMARS = {
    js: [
      ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
      ['string', /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/],
      ['keyword', /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|delete|void|type|interface|enum|implements|readonly|as|satisfies|declare|namespace|public|private|protected|static|null|undefined|true|false|NaN)\b/],
      ['number', /\b(?:0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/]
    ],
    html: [
      ['comment', /<!--[\s\S]*?-->/],
      ['keyword', /<!DOCTYPE[^>]*>|<\/?[A-Za-z][\w:-]*|\/?>/],
      ['string', /"(?:[^"]*)"|'(?:[^']*)'/],
      ['number', /\b\d+(?:\.\d+)?\b/]
    ],
    css: [
      ['comment', /\/\*[\s\S]*?\*\//],
      ['keyword', /@[\w-]+|[\w-]+(?=\s*:)|::?[\w-]+|\.[\w-]+|#[\w-]+/],
      ['string', /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/],
      ['number', /-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch)?\b/]
    ],
    json: [
      ['keyword', /"(?:\\.|[^"\\])*"(?=\s*:)/],
      ['string', /"(?:\\.|[^"\\])*"/],
      ['keyword', /\b(?:true|false|null)\b/],
      ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/]
    ],
    bash: [
      ['comment', /#[^\n]*/],
      ['string', /"(?:\\.|[^"\\])*"|'[^']*'/],
      ['keyword', /\b(?:if|then|else|elif|fi|for|in|while|do|done|case|esac|function|return|echo|printf|cd|ls|cp|mv|rm|mkdir|touch|cat|grep|sed|awk|curl|wget|git|npm|npx|pnpm|yarn|node|python|pip|export|source|sudo|chmod|docker|make)\b|(?:^|\s)-{1,2}[\w-]+/],
      ['number', /\b\d+\b/]
    ],
    python: [
      ['comment', /#[^\n]*/],
      ['string', /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/],
      ['keyword', /\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|with|try|except|finally|raise|lambda|yield|async|await|pass|break|continue|global|nonlocal|assert|del|None|True|False|self|print|len|range|open|int|str|float|list|dict|set|tuple)\b/],
      ['number', /\b\d+(?:\.\d+)?\b/]
    ],
    yaml: [
      ['comment', /#[^\n]*/],
      ['keyword', /^[ \t-]*[\w.$-]+(?=\s*:)/],
      ['string', /"(?:[^"]*)"|'(?:[^']*)'/],
      ['number', /\b\d+(?:\.\d+)?\b/]
    ]
  };

  var ALIAS = {
    js: 'js', javascript: 'js', mjs: 'js', cjs: 'js', jsx: 'js', node: 'js', ts: 'js', typescript: 'js', tsx: 'js',
    html: 'html', htm: 'html', xml: 'html', svg: 'html', vue: 'html',
    css: 'css', scss: 'css', less: 'css',
    json: 'json', jsonc: 'json',
    bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', terminal: 'bash',
    py: 'python', python: 'python',
    yml: 'yaml', yaml: 'yaml'
  };

  function highlight(code, lang) {
    var key = String(lang || '').replace(/^language-/, '').toLowerCase();
    var name = ALIAS[key] || (GRAMMARS[key] ? key : null);
    var rules = name ? GRAMMARS[name] : null;
    if (!rules) return esc(code);

    var re = new RegExp(rules.map(function (r) { return '(' + r[1].source + ')'; }).join('|'), 'gm');
    var out = '', last = 0, m;

    while ((m = re.exec(code)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue; }
      if (m.index > last) out += esc(code.slice(last, m.index));
      for (var k = 0; k < rules.length; k++) {
        if (m[k + 1] !== undefined) {
          out += '<span class="tok-' + rules[k][0] + '">' + esc(m[k + 1]) + '</span>';
          break;
        }
      }
      last = m.index + m[0].length;
    }
    out += esc(code.slice(last));
    return out;
  }

  /* ================= 3. 行内解析 ================= */
  function inline(text) {
    var store = [];
    function stash(html) { store.push(html); return '\u0001' + (store.length - 1) + '\u0001'; }

    var t = esc(text);

    // 行内代码（最先处理，内部不再解析）
    t = t.replace(/`([^`]+)`/g, function (m, code) { return stash('<code>' + code + '</code>'); });

    // 图片 ![alt](src "title")
    t = t.replace(/!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"([^"]*)")?\s*\)/g, function (m, alt, src, title) {
      return stash('<img src="' + src + '" alt="' + alt + '"'
        + (title ? ' title="' + title + '"' : '') + ' loading="lazy" decoding="async">');
    });

    // 链接 [text](href "title")
    t = t.replace(/\[([^\]]+)\]\(\s*([^\s)]+)(?:\s+"([^"]*)")?\s*\)/g, function (m, txt, href, title) {
      var ext = /^https?:/i.test(href);
      return stash('<a href="' + href + '"' + (title ? ' title="' + title + '"' : '')
        + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>');
    });

    // 自动链接 <https://...>
    t = t.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, function (m, url) {
      return stash('<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>');
    });

    // 强调
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, '$1<em>$2</em>')
      .replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

    // 还原占位
    t = t.replace(/\u0001(\d+)\u0001/g, function (m, i) { return store[Number(i)] || ''; });

    // 单个换行 → <br>（对中文写作习惯更友好）
    t = t.replace(/\n/g, '<br>\n');
    return t;
  }

  /* ================= 4. 块级解析 ================= */
  function render(src) {
    var lines = String(src == null ? '' : src)
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '    ')
      .split('\n');
    var total = lines.length;
    var out = [];
    var idMap = {};

    /* ---- 局部工具 ---- */
    function nextId(text) {
      var base = slugify(String(text).replace(/[*_`~]/g, ''));
      var n = idMap[base] = (idMap[base] || 0) + 1;
      return n > 1 ? base + '-' + n : base;
    }
    function listRE(line) { return /^( *)(?:([-*+])|(\d{1,9})[.)])\s+(.*)$/.exec(line); }
    function fenceRE(line) { return /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`~]*)[ \t]*$/.exec(line); }
    function hrRE(line) { return /^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line); }
    function headingRE(line) { return /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line); }
    function quoteRE(line) { return /^ {0,3}>/.test(line); }

    function splitRow(line) {
      var s = String(line).trim();
      if (s.charAt(0) === '|') s = s.slice(1);
      if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
      return s.split('|').map(function (c) { return c.trim(); });
    }
    function isDelimRow(cells) {
      if (!cells.length) return false;
      return cells.every(function (c) { return /^:?-{2,}:?$/.test(c); });
    }
    function startsTable(arr, k) {
      if (k + 1 >= arr.length) return false;
      if (String(arr[k]).indexOf('|') === -1) return false;
      var a = splitRow(arr[k]);
      var b = splitRow(arr[k + 1]);
      return a.length > 0 && a.length === b.length && isDelimRow(b);
    }
    function isBlockStart(k) {
      var L = lines[k];
      if (L == null) return true;
      if (/^\s*$/.test(L)) return true;
      if (/^ {0,3}(`{3,}|~{3,})/.test(L)) return true;
      if (hrRE(L)) return true;
      if (/^ {0,3}#{1,6}\s+/.test(L)) return true;
      if (quoteRE(L)) return true;
      if (listRE(L)) return true;
      return startsTable(lines, k);
    }

    /* ---- 代码块 ---- */
    function codeBlock(code, lang) {
      var l = (lang || 'text').toLowerCase();
      return '<div class="code-block" data-lang="' + attr(l) + '">'
        + '<button class="code-copy" type="button" data-copy>复制</button>'
        + '<pre><code class="language-' + attr(l) + '">' + highlight(code, l) + '</code></pre>'
        + '</div>';
    }

    /* ---- 列表（可在任意数组上递归） ---- */
    function parseList(arr, start, baseIndent) {
      var first = listRE(arr[start]);
      if (!first) return { html: '', next: start };
      var ordered = !!first[3];
      var html = ordered ? '<ol>' : '<ul>';
      var i = start, produced = 0;

      while (i < arr.length) {
        var m = listRE(arr[i]);
        if (!m) break;
        var indent = m[1].length;
        if (indent !== baseIndent) break;
        if (!!m[3] !== ordered) break;

        var body = [m[4]];
        var nested = [];
        i++;

        while (i < arr.length) {
          var L = arr[i];
          if (/^\s*$/.test(L)) {
            var nxt = arr[i + 1];
            if (nxt && /^ {2,}\S/.test(nxt)) { body.push(''); i++; continue; }
            break;
          }
          var ind = /^( *)/.exec(L)[1].length;
          var lm = listRE(L);
          if (lm && ind <= baseIndent) break;
          if (ind > baseIndent) { nested.push(L); i++; continue; }
          if (lm) break;
          body.push(L.trim());
          i++;
        }

        var inner = inline(body.join('\n'));
        if (nested.length) {
          var minInd = Infinity;
          nested.forEach(function (s) {
            var n = /^( *)/.exec(s)[1].length;
            if (n < minInd) minInd = n;
          });
          if (!isFinite(minInd)) minInd = 0;
          var nr = parseList(nested, 0, minInd);
          if (nr.next > 0) inner += nr.html;
          if (nr.next < nested.length) inner += '<p>' + inline(nested.slice(nr.next).join('\n')) + '</p>';
        }
        html += '<li>' + inner + '</li>';
        produced++;
      }

      if (!produced) return { html: '', next: start };
      html += ordered ? '</ol>' : '</ul>';
      return { html: html, next: i };
    }

    /* ---- 表格 ---- */
    function parseTable(start) {
      var head = splitRow(lines[start]);
      var sep = splitRow(lines[start + 1]);
      var aligns = sep.map(function (c) {
        var l = c.charAt(0) === ':', r = c.charAt(c.length - 1) === ':';
        return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
      });
      var t = '<table><thead><tr>';
      head.forEach(function (c, k) {
        t += '<th' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(c) + '</th>';
      });
      t += '</tr></thead><tbody>';
      var i = start + 2;
      while (i < total && lines[i].indexOf('|') > -1 && !/^\s*$/.test(lines[i])) {
        var cells = splitRow(lines[i]);
        t += '<tr>';
        for (var k = 0; k < head.length; k++) {
          t += '<td' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>'
            + inline(cells[k] || '') + '</td>';
        }
        t += '</tr>';
        i++;
      }
      t += '</tbody></table>';
      return { html: t, next: i };
    }

    /* ---- 段落（含「纯图片段落居中」） ---- */
    function paragraph(text) {
      var t = String(text).trim();
      var only = /^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"([^"]*)")?\s*\)$/.exec(t);
      if (only) {
        return '<figure class="img-center">'
          + '<img src="' + only[2] + '" alt="' + attr(only[1]) + '"'
          + (only[3] ? ' title="' + attr(only[3]) + '"' : '')
          + ' loading="lazy" decoding="async">'
          + (only[1] ? '<figcaption>' + esc(only[1]) + '</figcaption>' : '')
          + '</figure>';
      }
      return '<p>' + inline(t) + '</p>';
    }

    /* ---- 主循环 ---- */
    var i = 0;
    while (i < total) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      /* 围栏代码块 */
      var mf = fenceRE(line);
      if (mf) {
        var fenceChar = mf[1].charAt(0);
        var fenceLen = mf[1].length;
        var buf = [];
        i++;
        while (i < total) {
          var mc = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
          if (mc && mc[1].charAt(0) === fenceChar && mc[1].length >= fenceLen) { i++; break; }
          buf.push(lines[i]);
          i++;
        }
        out.push(codeBlock(buf.join('\n'), mf[2]));
        continue;
      }

      /* 分割线 */
      if (hrRE(line)) { out.push('<hr>'); i++; continue; }

      /* 标题 */
      var mh = headingRE(line);
      if (mh) {
        var lvl = mh[1].length;
        out.push('<h' + lvl + ' id="' + nextId(mh[2]) + '">' + inline(mh[2]) + '</h' + lvl + '>');
        i++;
        continue;
      }

      /* 引用 */
      if (quoteRE(line)) {
        var q = [];
        while (i < total && (quoteRE(lines[i])
          || (/^\s*$/.test(lines[i]) && i + 1 < total && quoteRE(lines[i + 1])))) {
          q.push(lines[i].replace(/^ {0,3}> ?/, ''));
          i++;
        }
        out.push('<blockquote>' + render(q.join('\n')) + '</blockquote>');
        continue;
      }

      /* 列表 */
      if (listRE(line)) {
        var lr = parseList(lines, i, listRE(line)[1].length);
        if (lr.next > i) { out.push(lr.html); i = lr.next; continue; }
      }

      /* 表格 */
      if (startsTable(lines, i)) {
        var tr = parseTable(i);
        out.push(tr.html);
        i = tr.next;
        continue;
      }

      /* 段落 */
      var pbuf = [];
      while (i < total && !isBlockStart(i)) { pbuf.push(lines[i]); i++; }
      if (!pbuf.length) { pbuf.push(lines[i]); i++; }   // 兜底，防死循环
      out.push(paragraph(pbuf.join('\n')));
    }

    return out.join('\n');
  }

  /* ================= 5. 纯文本摘要 ================= */
  function excerpt(md, max) {
    var t = String(md == null ? '' : md)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+[.)]\s+/gm, '')
      .replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    max = max || 90;
    return t.length > max ? t.slice(0, max).trim() + '…' : t;
  }

  global.MiniMarkdown = {
    render: render,
    inline: inline,
    highlight: highlight,
    escape: esc,
    excerpt: excerpt
  };
})(window);