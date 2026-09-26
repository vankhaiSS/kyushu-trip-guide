# 韩国日本九州之旅 手机攻略

这是一个适合手机查看、填写和分享的静态网页；同行实时同步使用 Firebase Realtime Database。

## 本地打开

直接打开 `index.html` 可在本机预览和编辑本机保存的内容。实时共享需要通过网页服务器打开，并完成 `firebase-config.js` 与 Firebase 项目配置；朋友打开发布网址后可免登录查看。

## 发布到 GitHub Pages

网页源文件发布在 [`vankhaiSS/kyushu-trip-guide`](https://github.com/vankhaiSS/kyushu-trip-guide)。在 GitHub 仓库设置的 Pages 中，将默认分支 `main` 的根目录设为发布源，即可生成朋友可访问的网址。Firebase 共享数据库已配置；访客免登录只读，编辑者由 Firebase UID 与数据库规则限制。

## 内容说明

- 地图按钮使用 Google Maps 搜索链接。
- 每天带有可切换的 Google Maps 内嵌地图；地图需要联网加载。
- 首页增加全程路线图，每天增加图标摘要和纵向时间轴。
- 首页和日期导航采用更明显的液态玻璃视觉：SVG 位移折射背景、彩色边缘高光与浮动玻璃层；时间轴正文仍保留高对比度，方便路上阅读。玻璃效果已写入 `index.html`，不依赖 CDN，离线也可显示（地图仍需联网）。
- 每一天在时间轴后补充安排理由、景点看点和次级餐饮建议，方便首次阅读的同行者理解行程；相关景点与列车附官方介绍链接。
- 关键时间、车次、Plan B 和临时站位提醒放在主层级。
- 餐饮、购物、晚餐和临时补充保留为可编辑区域。
- 共享模式下访客只读；编辑者使用 Google 账号登录，Realtime Database 规则按 Firebase UID 限制写入。
- 首次启用共享后，可用“导入本机旧填写”将该设备以前保存在浏览器中的非空内容合并到共享数据。
- 访客免登录读取意味着共享填写内容可被任何能访问网页或数据库端点的人读取；不要在填写区记录证件号、密码或其他私密信息。
- 已纳入阿苏男孩 11:22 到阿苏、满席时 08:25 九州横断特急1号、福冈城天守台关闭、海地狱前临时站位等修正。

## 视觉方案来源

参考 [dpawlikowski/liquid-glass](https://github.com/dpawlikowski/liquid-glass) 的 CSS + SVG 折射分层思路，并针对可直接打开的单文件网页改写；原项目采用 MIT 许可，见 `THIRD_PARTY_LICENSES.md`。未引入 React、Web Components 或在线样式服务。可安装的通用网页视觉 skill 目录里没有更适合当前单文件结构的方案；[LiquidGlass-UI](https://github.com/hwyuanzi/LiquidGlass-UI) 有配套 skill，但其模块方案需要通过 HTTP 服务加载，不适合目前直接打开本地 HTML 的使用方式。
