/* =========================================================
   构建脚本：扫描 posts/*.md 的 YAML frontmatter，生成 posts/index.json
   Netlify 部署时自动运行，不需要本地操作
   ========================================================= */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_FILE = path.join(POSTS_DIR, 'index.json');

function parseFrontmatter(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { meta: {}, body: text };
  const raw = text.slice(4, end).trim();
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const meta = {};
  let listKey = null;
  raw.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const listMatch = line.match(/^\s*-\s*(.+?)\s*$/);
    if (listMatch && listKey) {
      meta[listKey].push(listMatch[1].replace(/^["']|["']$/g, ''));
      return;
    }
    listKey = null;
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      let val = kv[2].trim();
      if (val === '') { meta[key] = []; listKey = key; }
      else { meta[key] = val.replace(/^["']|["']$/g, ''); }
    }
  });
  return { meta, body };
}

const site = {
  name: '野猪篱',
  nameEn: 'Wild Boar Hedge',
  description: '两个人的生活博客，记录日常碎片、旅行足迹、读书观影与细碎思考。'
};

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
const posts = files.map((file) => {
  const slug = file.replace(/\.md$/, '');
  const text = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { meta } = parseFrontmatter(text);
  return {
    slug: slug,
    title: meta.title || slug,
    date: meta.date || '1970-01-01',
    category: meta.category || '日常',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    author: meta.author || '',
    cover: meta.cover || '',
    images: Array.isArray(meta.images) ? meta.images : (meta.cover ? [meta.cover] : []),
    excerpt: meta.excerpt || ''
  };
});

const out = { site, posts };
fs.writeFileSync(INDEX_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('index.json 已生成，共 ' + posts.length + ' 篇文章');
