# Quiet Worlds

白色纹理纸感、手绘自然场景的 ambient sound app 功能原型。

## 功能

- Rain / Fireplace / Forest / Ocean / Snow 五个场景。
- 0–1 连续强度控制，同时改变 Canvas 动画和声音。
- Rain 使用两段真实户外雨声录音，带平滑循环及音量匹配。
- 5 / 10 / 15 / 30 分钟、自定义 1–360 分钟和关闭定时。
- 播放、暂停、收藏和设置。

Rain 是批准的参考场景。Fireplace 已完成手绘 SVG 壁炉与三层实录音频；其余三个场景仍保留原有合成原型，本阶段未扩建。

## 部署到 GitHub Pages

1. 将本目录内容（包括 `.github` 隐藏目录）上传到目标仓库的 `main` 分支。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
3. 在 **Actions → Deploy Quiet Worlds to GitHub Pages → Run workflow** 运行首次部署；之后推送到 `main` 会自动发布。
4. 部署完成后，从工作流的 `github-pages` 环境打开网站地址。

如果仓库默认分支不是 `main`，请同步修改 `.github/workflows/pages.yml` 的分支名。
仓库是否支持 Pages 取决于可见性和 GitHub 套餐。此项目不需要构建步骤、服务端、API key 或 npm 依赖。

参考：[GitHub Pages 自定义工作流官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 本地预览

在本目录运行 `python3 -m http.server 4173 --directory dist`，然后打开 `http://localhost:4173`。
不要直接双击 HTML：雨声通过 HTTP 加载，并且浏览器需要用户点击播放后才能启动音频。

## 文件结构

- `dist/index.html`：界面。
- `dist/styles.css`：白色纸感、布局和控件样式。
- `dist/app.js`：场景、实时 Canvas、分层音频、强度滑杆、播放及定时器。
- `dist/fireplace.js`：静止砖壁炉与连续强度驱动的 SVG 火焰、余烬、火花，以及等功率三层混音参数。
- `dist/audio/`：两段雨声录音及署名。
- `.github/workflows/pages.yml`：自动部署。

## 音频授权

两段雨声由 InspectorJ 创作，来自 Freesound，使用 CC BY 4.0 授权。作者、原始链接及播放时的修改说明见 [音频署名](dist/audio/CREDITS.md)，并保留在应用设置中。音频许可不代表其他项目代码自动使用同一许可。

壁炉使用 PagDev / OpenGameArt 的 CC0 烧柴音频“Fireplace Sound loop”，以无损编码的 44.1 kHz 双声道 WAV 提供，从同一素材的不同段落派生三个音频层。没有额外加入鸟虫、音乐或合成火声。低频抑制、柔和峰值处理及不同循环长度混合表现余烬、温和燃烧和旺火。详情与来源同见音频署名。

v3 炉体按用户批准图案，用内置图像生成工具制作成单张透明蜡笔纹理插画。火焰、木柴、余烬和火花是独立 SVG 图层，不使用预渲染视频或动画帧序列。素材与完整提示词见 [插画说明](dist/art/README.md)。

v4 调整壁炉构图：主体横向放大约 25%，收紧画面上下留白；木柴缩短、变细、下移，两根后置、一根低矮前置，让火焰自然露出。壁炉独立使用紧凑的响应式场景高度，Rain 及其他场景的布局不变。
