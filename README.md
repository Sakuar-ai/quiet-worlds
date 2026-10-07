# Quiet Worlds

## Shared world icons — icons-17

`dist/world-icons.js` is the single source of truth: `WORLD_ICONS` stores one drawing and palette per world, and `worldIcon(id)` renders it with unique SVG paint-server IDs. Both the scene header and Choose a World call this exact function; only their existing CSS sizes differ. Rain is cloud/rain, Fireplace flame/crossed logs, Forest three pines, Ocean a rounded multi-curl wave group, Snow a lavender snowflake. New scene-related UI must call `worldIcon(id)` rather than draw its own symbol. Add future worlds to this registry once. `world-art.js` only re-exports the shared API; it contains no separate art. Sliders keep their existing interaction handles. `npm run test:icons` verifies identical SVG artwork/paint in both contexts, unique IDs, five-world switching, and captures each world at mobile sizes for visual review. Listening layouts, scene drawings, audio and controls are unchanged.

## Settings / credits presentation — settings-16

Gentle settings contains unique preferences only (slow movement, keep screen awake) plus one quiet **Sound credits & licenses** navigation row. The top-right Timer is the only timer entry point; do not duplicate primary controls in settings. That secondary credits sheet is the single in-app attribution surface, grouped by Rain, Fireplace, Forest, Ocean, Snow and future Cat. Add new external audio credits only there (`#credits-sheet` in `dist/index.html`) and retain provenance in `dist/audio/CREDITS.md`; never add source paragraphs to the main settings panel. Worlds without external recordings have only a short status note. Back returns to settings; dismiss returns focus to its visible opener. Timer functionality, audio, world visuals and intensity interaction are unchanged.

当前版本为 **fireplace-14（visionear-regions-2）**。用户已确认原录音 7:40 附近的低火修订，并于 2026-10-06 明确授权发布。清单 `reviewStatus: APPROVED`；后续声音改动须重新经过试听确认。本版替换旧 audio-13 壁炉音频。

使用用户已认可的 visionear 录音，**不再线性播放整段**。低火限定为原始 **07:40–08:20，从 07:40 起播**，循环不带入更早片段；中火仍为 00:40–02:00，默认 42–50% 从用户指出的约 01:00 起播。两段分别循环，周期 36 秒 / 76 秒，没有重新拼成一条线性序列。0–30% 低火，30% 以上中火，边界有 ±2% 防抖。没有确认干净的更强片段，因此 70–100% 保持中火，不用音量、滤波或叠层伪造咆哮。

跨档使用 4 秒 cos/sin 等功率交叉淡化，稳定时一段、切换时最多相邻两段，结束后停掉离开的声音。快速反向拖动从当前混合角度继续，不会叠加第三段；暂停、恢复、快速反向和边界防抖均纳入测试。保留上一轮局部峰值修整，无新增 EQ、压缩、降噪、增益匹配、音效碎片或随机调度。滑杆在同一档内不触发重播，录音时间不会自动触发升/降档。视觉与其他声音不变。

`npm run test:audio` 执行生产 AudioMixer / FireplaceAudio，原生 OfflineAudioContext 导出 60 秒默认中火、低火及中→低→中切换；另有 160 秒固定中火多循环测试和快速操作压力测试。不是手写 DSP 近似，也不是 Safari/iPhone 硬件录音。`npm run test:spectral` 核对未改音色、正确分段定位、接缝及五频段（需 Python numpy/scipy/soundfile）。中火约 01:00、低火约 07:40 的位置都来自用户听感反馈，试听版本已获确认。CI 用已批准源片段的采样指纹验证保真，无须部署 88 MB 中间文件。

`scripts/prepare-fire-regions.py` 从上一轮已认可的无损长录音生成独立分段（不是拼接序列）。如需重新生成，先提供用户原始 WAV 并运行 `scripts/prepare-visionear.py`；生成器默认恢复为待试听状态，不自动批准新素材。当前加载两段 FLAC 总计约 22 MB，解码约 46 MB；不加载也不部署 88 MB 的中间长录音。手机尺寸由浏览器回归测试检查；原生离线音频测试不等同于真实 iPhone 耳机听测。

白色纹理纸感、手绘自然场景的 ambient sound app 功能原型。

## 功能

- Rain / Fireplace / Forest / Ocean / Snow 五个场景。
- 0–1 连续强度控制，同时改变 Canvas 动画和声音。
- Rain 使用两段真实户外雨声录音，带平滑循环及音量匹配。
- 5 / 10 / 15 / 30 分钟、自定义 1–360 分钟和关闭定时。
- 播放、暂停、收藏和设置。

Rain 是批准的参考场景。Fireplace 使用手绘 SVG 壁炉和滑杆选择的真实燃烧片段；其余三个场景仍保留原有合成原型，本阶段未扩建。

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
- `dist/fireplace.js`：静止砖壁炉与连续强度驱动的 SVG 火焰、余烬、火花。
- `dist/fireplace-audio.js`：稳定实录区域、4 秒相邻交叉淡化、预制段内循环接缝，无额外事件。
- `dist/audio/`：两段雨声录音及署名。
- `.github/workflows/pages.yml`：自动部署。

## 音频授权

两段雨声由 InspectorJ 创作，来自 Freesound，使用 CC BY 4.0 授权。作者、原始链接及播放时的修改说明见 [音频署名](dist/audio/CREDITS.md)，应用内统一在 **Sound credits & licenses** 展示。音频许可不代表其他项目代码自动使用同一许可。

壁炉使用 visionear / Freesound “Aachen_Burning Fireplace Crackling Fire Sounds.wav”（CC0）。来源、局部修改与采样规格见 [音频署名](dist/audio/CREDITS.md)。

旧 audio-13 和未发布的 audio-14 草稿使用 kingsrow 的 34.2 秒录音与短事件；fireplace-14 已替换这些架构。部署成功与否以对应 GitHub Actions 工作流为准。

## 当前 Fireplace 视觉（v12 最终燃烧形态微调）

按用户最新参考图重做拱形砖石、深炭棕炉膛、堆叠木柴、石质炉台和局部蜡笔笔触。静态 PNG 不含火焰或火星；前排木柴从同一素材精确分层，实时火焰根部被木柴遮挡，木柴下方的余烬及木边的暖光随强度变化。砖石与木柴不移动。

炉体保持 v7 已确认的可用场景宽度 69.9%，原素材、分层与比例不变，不另建放大场景。16 个火星粒子分别缓慢升起、漂移、淡出：低强度偶尔 0–1 颗，默认约 3–5 颗，最高约 8–13 颗。Rain 的场景区域、标题和控件尺寸、滑杆位置、白色纸感全部沿用；音频、定时、播放、世界选择器及其他场景不变。素材、分层说明及原始生成提示词见 [v6 素材说明](dist/art/REFERENCE-V6.md)。

v8 保留 v7 炉体大小、火焰、木柴与火星，仅新增独立的局部环境底层：不规则浅桃色／杏色颜料晕染、边缘稀疏的短铅笔笔触，以及炉台下方少量暖色横向笔触。强度连续控制暖光范围和深浅，只有非常缓慢轻微的明暗变化；不画烟、不添加家具，不使用整页底色或径向光圈。静态手绘笔触只生成一次，更新时只改变底层的透明度与缩放，炉体不缩放。原 PNG 与全部音频文件不变。

v9 不增加或重画任何物件、纹理，仅细调现有强度响应。余烬端暖光更局部、更淡，保留中等火势的柔和暖意，旺火端的暖光范围比 v8 扩大约 11%、透明度参数增强约 20%；炉台反光更宽、更清楚。旺火主焰基准高度只增加约 6%，摆动略活跃；火星仍错峰渐隐，数量上限只增加一颗，低强度则更少、更轻。

v10 仅调整燃烧关系，并轻化砖纹／炉膛排线。原 PNG 不重画、不替换；显示时保留 82% 原图并混入 18% 局部平滑色层，减轻细密排线的视觉强度，木柴用原图切片保留。新增横向木柴遮挡切片，让火焰根部被木柴打断；13 个小炭块、暗橙红余烬和 9 条缝隙余烬连接火焰与木柴。木柴受热边缘有克制的暖色笔触，下缘稍暗；暖边限制在木柴轮廓内，缝隙余烬不会涂满木柴表面。v9 环境光、火星、主火焰强度参数、尺寸、布局及所有音频均不变。

v11 保持布局、炉体、暖光、原有火星与音频不变。在木柴接触火焰的位置加入六组克制的焦褐短笔触与暖边热斑，让三束小火舌从木缝中显现，并补充后排木柴对火焰根部的遮挡。余烬床稍有加强；三颗复用的小余烬偶尔短距离落入炭床并淡去。所有热度变化仅随强度与循环相位起伏：木柴不缩小、不下沉、不消失、不烧尽，没有燃料、补柴、坍塌或积灰机制。

v12 优先改进 35–60% 火势。复用原有 7 个主焰、4 个底部火舌、3 个木缝火舌，调整轮廓宽度、起点、弯曲与相互重叠：中心火焰更连贯，两侧及木缝更活跃，不整体放大主焰。余烬底部改为彼此隔开的暗红／暖橙热区，原有 13 个炭块重新分布，不增加木纹、砖纹或装饰。移除 Fireplace 的额外诗意文案；原有环境暖光、尺寸、布局、音频和无燃料消耗原则不变。

## 验证

`npm ci && npm run build` 校验静态发布文件；`npx playwright install chromium && npm run test:ui` 在 Chromium 中检查 390×844、393×852、375×812、430×932、375×667 五种 iPhone 竖屏尺寸。

`npm run test:audio` 验证一个持续源、随机非重叠事件、暂停／恢复／切换释放、低高火势密度差异，以及 FLAC 的浏览器原生解码；用真实 Web Audio 离线渲染低／中／高各 96 秒，测量峰值、响度差、循环边界，保存各 45 秒试听文件（包含循环接缝）。这是信号及浏览器检查，不替代用户佩戴耳机的主观长时间试听。v13 不改批准的 v12 视觉，手机截图亦按 v12 比较。

测试逐像素对比批准的 Rain，测量切换前后的场景、标题、定时、滑杆和播放按钮位置，并保存并排截图和 0/50/100% 火势画面。另对 3 分钟动画采样，检查不同强度的可见火星数量及独立运动；校验原始 PNG 未被修改。GitHub Pages 仅在这些检查通过后发布；截图在工作流的 `iphone-layout-checks` 附件中。桌面浏览器模拟不等同于实体 iPhone/Safari 真机测试。

环境层检查另保存 0 / 50 / 100% 暖光截图、三档并排图与 35 / 50 / 60% 燃烧区前后近景，断言暖光随强度扩散、炉体位置尺寸未变、背景仍为白色。校验没有增加绘制节点，火焰分布变宽但主焰高度不整体放大，余烬热区保留断口。验证遮挡顺序、木柴暖边裁切、缝隙余烬遮罩、18% 排线弱化比例及强度联动；关闭两个版本的动态热度层并排除已移除文案后，木柴与壁炉逐像素一致。另检查 0 秒至 7 天的动画相位采样中木柴形状及节点数量不变、焦痕仅随强度可逆变化，以及连续拖动滑杆与三分钟余烬掉落采样。长时间相位采样不等同于连续运行七天。
