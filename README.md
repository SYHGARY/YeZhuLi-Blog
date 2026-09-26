# 野猪篱 · Wild Boar Hedge

两个人的小清新静态博客：记录日常碎片、旅行足迹、读书观影与细碎思考。
纯 HTML + CSS + 少量原生 JavaScript，**零框架、零构建、零第三方依赖**，开箱即部署到 GitHub Pages。

## 三个页面

1. **封面页 `index.html`**：全屏山野场景（太阳、云、三层山丘、篱笆、两只小野猪、飘落的叶子），
   双头像与随机短句彩蛋，「推开篱门」进入博客。
2. **博客页 `blog.html`**：文章 / 归档 / 相册**融合为一条时间线**（类似 QQ 空间）——
   左侧日期（日、年月、分类），中间卡片为标题 + 正文，底部可挂多张图片；
   顶部按分类筛选，时间线按年份分段、按日期倒序。
3. **关于页 `about.html`**：两人介绍、小院大事记、博客名字的由来。

其他特性：

- 深色模式：手动切换，默认跟随系统，选择会被记住（封面场景同样适配）
- 灯箱：点击时间线图片放大，同组图片可用左右箭头 / 键盘方向键翻页
- 响应式：手机 / 平板 / 桌面一致体验；移动端汉堡菜单，时间线在窄屏退化为「日期横条 + 卡片」
- 性能：图片懒加载、全站无外部请求（字体走自托管镜像，可删）

## 目录结构

```
wild-boar-hedge/
├── index.html          # 封面页
├── blog.html           # 博客时间线（文章 + 归档 + 相册）
├── about.html          # 关于我们
├── .nojekyll           # 告诉 GitHub Pages 不要用 Jekyll 处理
├── posts/
│   ├── index.json      # 文章索引（新增文章时在这里登记）
│   └── *.md            # Markdown 正文
└── assets/
    ├── css/style.css   # 全站样式（颜色变量集中在文件顶部）
    ├── js/
    │   ├── markdown.js # 内置迷你 Markdown 渲染器 + 代码高亮
    │   ├── main.js     # 导航 / 主题 / 灯箱 / 复制等全局交互
    │   └── blog.js     # 封面短句 + 时间线渲染
    └── images/         # favicon、头像、封面、相册图
```

## 本地预览

文章通过 `fetch` 加载，**不能直接双击 HTML 打开**，在项目根目录起一个静态服务器：

```bash
# Python（任选其一）
python -m http.server 8080

# 或 Node.js
npx serve .
```

浏览器访问 <http://localhost:8080> 。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个 **Public** 仓库（例如 `wild-boar-hedge`），把本目录所有文件推上去：

   ```bash
   git init
   git add .
   git commit -m "init: 野猪篱"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/wild-boar-hedge.git
   git push -u origin main
   ```

2. 打开仓库 **Settings → Pages**：
   - **Source** 选 `Deploy from a branch`
   - **Branch** 选 `main`，目录选 `/ (root)`，保存。

3. 等一两分钟，访问：

   ```
   https://<你的用户名>.github.io/wild-boar-hedge/
   ```

> 想要 `https://<你的用户名>.github.io/` 这种短地址，把仓库命名为 `<你的用户名>.github.io` 即可。

## 怎么发一条新日志

1. 在 `posts/` 下新建 Markdown 文件，例如 `posts/autumn-soup.md`，正常写 Markdown（支持标题、列表、引用、表格、代码块、图片）。
2. 打开 `posts/index.json`，在 `posts` 数组里加一条：

   ```json
   {
     "slug": "autumn-soup",
     "title": "秋天的第一锅汤",
     "date": "2025-09-20",
     "category": "日常",
     "tags": ["秋天", "厨房"],
     "author": "阿篱",
     "cover": "assets/images/covers/autumn-soup.svg",
     "images": [
       "assets/images/covers/autumn-soup.svg",
       "assets/images/gallery/01.svg"
     ],
     "excerpt": "一句话摘要，正文加载失败时作为兜底。"
   }
   ```

   - `slug` 必须和文件名一致；日志按 `date` 自动倒序、自动归入对应年份。
   - `images` 是时间线卡片底部的多图数组：1 张大图、2 张并排、3 张及以上按三列网格排列。
   - `cover` 字段目前仅作备用，可留空；图片建议放到 `assets/images/`。

3. 提交推送，完成。

## 个性化修改

- **改 GitHub 链接（上线前必做）**：全局搜索 `your-name/wild-boar-hedge`，替换为你的仓库地址
  （封面版权处、博客页脚、关于页脚共 3 处）。
- **改颜色**：`assets/css/style.css` 顶部 `:root` 里的 CSS 变量（深色模式在 `html[data-theme="dark"]` 段，
  封面场景色在 `--cover-*` / `--hill-*` 变量）。
- **改双人资料**：编辑 `about.html` 文案；头像可直接替换 `assets/images/avatar-a.svg` / `avatar-b.svg`
  （也可换成 jpg/png 并同步修改引用）。
- **改随机短句**：`assets/js/blog.js` 中的 `QUOTES` 数组。
- **加照片**：图片放进 `assets/images/`，在对应文章的 `images` 数组里登记路径即可。

## 许可

代码随意改、随意用。写下的日子，是两个人的。
