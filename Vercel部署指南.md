# 🚀 Vercel 部署指南

> 将你的工作台部署到云端，手机随时随地访问！

---

## 📋 准备工作

### 你需要准备的：
1. 一个 GitHub 账号（如果没有，先去 [github.com](https://github.com) 注册）
2. 一个 Vercel 账号（可以用 GitHub 账号直接登录）
3. 5-10 分钟时间

### 你需要上传的文件：
```
d:\TRAE/
├── index.html       # 主页面
├── styles.css       # 样式文件
├── app.js           # 功能脚本
├── manifest.json    # PWA 配置
├── sw.js            # Service Worker
└── vercel.json      # Vercel 配置
```

---

## 🎯 方式一：直接拖拽部署（最简单，推荐）

### 第1步：注册 Vercel
1. 打开 [vercel.com](https://vercel.com)
2. 点击「Sign Up」→ 选择「Continue with GitHub」
3. 授权 GitHub 登录，完成注册

### 第2步：拖拽部署
1. 登录后，点击右上角的「Add New...」→「Project」
2. 在「Import Git Repository」下方，找到「Or deploy a template」
3. 点击「Browse Templates」→ 滚动到底部，找到「Drag and Drop」区域
4. 打开 `d:\TRAE` 文件夹
5. 选中所有文件，直接拖拽到 Vercel 的部署区域
6. 等待上传完成

### 第3步：完成部署
1. 部署完成后，Vercel 会给你一个访问链接，如：
   - `https://你的项目名.vercel.app`
2. 点击链接，测试是否正常工作
3. 手机打开链接，添加到桌面即可！

**预计时间：3-5 分钟** ⏱️

---

## 🎯 方式二：GitHub + Vercel 自动部署（推荐长期使用）

### 第1步：创建 GitHub 仓库
1. 登录 [github.com](https://github.com)
2. 点击右上角「+」→「New repository」
3. 填写仓库信息：
   - Repository name: `my-workbench`（或你喜欢的名字）
   - Description: `个人工作台 - 任务管理与进度追踪`
   - 选择「Public」（公开）
4. 点击「Create repository」

### 第2步：上传文件到 GitHub
**方式A：使用 Git（如果你熟悉 Git）**
```bash
cd d:\TRAE
git init
git add .
git commit -m "初始化工作台"
git branch -M main
git remote add origin https://github.com/你的用户名/my-workbench.git
git push -u origin main
```

**方式B：直接上传（推荐新手）**
1. 在 GitHub 仓库页面，点击「uploading an existing file」
2. 打开 `d:\TRAE` 文件夹
3. 将所有文件拖拽到上传区域
4. 填写 Commit 信息：`初始化工作台`
5. 点击「Commit changes」

### 第3步：连接 Vercel
1. 登录 [vercel.com](https://vercel.com)
2. 点击「Add New...」→「Project」
3. 选择「Import Git Repository」
4. 找到你刚创建的 `my-workbench` 仓库
5. 点击「Import」

### 第4步：配置部署
1. Project Name: 填写你喜欢的名字（会作为访问链接的一部分）
2. Framework Preset: 选择「Other」
3. Root Directory: `./`（默认）
4. 点击「Deploy」

### 第5步：等待部署完成
1. 大约等待 1-2 分钟
2. 部署成功后，你会看到庆祝动画 🎉
3. 点击「Continue to Dashboard」
4. 在 Dashboard 中找到你的访问链接：
   - `https://你的项目名.vercel.app`

### 第6步：添加到手机桌面
1. 手机浏览器打开你的 Vercel 链接
2. iOS Safari：点击「分享」→「添加到主屏幕」
3. Android Chrome：点击菜单「⋮」→「添加到主屏幕」
4. 大功告成！以后从桌面一键打开 📱

**预计时间：10-15 分钟** ⏱️

---

## 🔧 高级配置（可选）

### 自定义域名
如果你有自己的域名，可以在 Vercel 中绑定：
1. 进入项目 Dashboard → Settings → Domains
2. 输入你的域名，如 `workbench.yourdomain.com`
3. 按照提示添加 DNS 解析记录
4. 等待证书自动配置完成

### 自动更新
每次你在 GitHub 上更新代码，Vercel 会自动重新部署：
1. 本地修改文件
2. `git add . && git commit -m "更新说明" && git push`
3. Vercel 自动检测并部署（约1分钟）

---

## 🐛 常见问题

### Q1: 部署后页面空白？
**A:** 检查浏览器控制台是否有错误。通常是 JS 文件路径问题。

### Q2: 手机访问很慢？
**A:** Vercel 默认使用全球 CDN，应该很快。如果慢，尝试：
- 清除浏览器缓存
- 检查网络连接
- 稍后重试（CDN 节点可能正在预热）

### Q3: PWA 不生效？
**A:** 确保：
- 使用 HTTPS（Vercel 默认提供）
- manifest.json 和 sw.js 都已上传
- 在浏览器中打开 `chrome://manifest` 检查

### Q4: 如何查看部署日志？
**A:** 
1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击「Deployments」标签
4. 点击任意部署记录查看详细日志

---

## 📊 部署成功后

### 你将获得：
✅ 一个永久访问链接（如 `https://xxx.vercel.app`）
✅ 全球 CDN 加速，访问快速
✅ HTTPS 安全加密
✅ PWA 支持，可添加到桌面
✅ 离线缓存功能
✅ 自动部署（如用 GitHub 方式）

### 数据说明：
⚠️ 所有数据保存在浏览器本地（localStorage）
⚠️ 不同设备/浏览器数据不互通
⚠️ 清除浏览器数据会丢失记录

---

## 💡 使用建议

1. **添加到桌面**：像原生APP一样使用
2. **微信收藏**：把链接收藏到微信，快速访问
3. **定期导出数据**：在设置中导出JSON备份
4. **多设备同步**：考虑用飞书多维表格方案（数据云端存储）

---

## 🎉 开始部署吧！

现在就去 [vercel.com](https://vercel.com) 开始你的部署之旅！

遇到任何问题，随时问我！