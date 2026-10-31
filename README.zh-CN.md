# YouTube Premium — Tizen 3.0 专版 (适用于 2017 款三星智能电视)

<div align="center">

🌍 **Select Language / 选择语言:**  
[**🇬🇧 English**](README.md) • [**🇨🇿 Čeština**](README.cs.md) • [**🇭🇺 Magyar**](README.hu.md) • [**🇨🇳 简体中文**](README.zh-CN.md) • [**🇮🇳 हिन्दी**](README.hi.md) • [**🇪🇸 Español**](README.es.md)

</div>

---

专为运行 **Tizen 3.0 的 2017 款三星智能电视**（平台 `17_KANTM_UHD` — **QLED Q7F/Q8C/Q9F**、**MU6000–MU9000**、**The Frame 2017**）及 **YouTube Premium** 订阅用户打造的轻量级、零冗余官方 **YouTube TV (`https://www.youtube.com/tv`)** 修复版本。

## 为什么需要这个项目？
在运行 **Tizen 3.0 (2017)** 的三星电视上，如今的 YouTube TV 网页端存在多个严重 Bug；而常见的社区修改版（如标准版 *TizenTube*）要么因为电视内置的旧版 **Node.js `v4.4.3`（仅支持 ES5）** 而崩溃，要么包含了大量 **YouTube Premium** 用户根本不需要的广告拦截脚本，导致电视 CPU 卡顿。

## ✨ 核心修复与功能
1. **🎵 修复 YouTube Music 静态专辑封面 (Art Track) 与非 16:9 视频卡死问题（`1:1` 方形 `720×720`、`1080×1080` 及 CD 封面 `704×720`、`1056×1080`）：**
   - 当 YouTube 传输超低码率的静态专辑封面视频流时，Tizen 3.0 的硬件 MSE 视频解码器会卡死在 `currentTime = 0` (`decodedFrames = 0`)。
   - 本插件自动检测音乐封面曲目，将视频流重定向至**虚拟 MSE `SourceBuffer`**（绕过有 Bug 的硬件视频解码器），正常播放原生高音质音频流，并在屏幕上渲染高清专辑封面（支持全屏与迷你播放器）。
2. **🎬 修复 4K 视频快进/呼出进度条时的黑屏问题：**
   - 移除 `app-quality-root` 激活状态下 `.XT6t8b` 控件层的不透明黑色背景，使 4K 视频在快进或查看进度条时依然保持画面可见。
3. **🖼️ 零中断 (`0.00s`) 迷你播放器（画中画 PiP）：**
   - 播放时按下遥控器 **返回键 (`Back`)** 不会停止播放，而是将播放器无缝缩小至右下角（迷你播放器），**声音 0.00 秒不中断、不重新开始**。
   - 按下遥控器上的 **蓝色按键**（或点击顶部搜索栏旁的图标）即可无缝返回全屏。
4. **🎮 完整支持三星智能遥控器 `播放/暂停` 键 (`keyCode 10252`)：**
   - 在本地 `file://` 域注册全部 24 个三星多媒体硬件按键，在全屏和迷你播放器模式下均可可靠地暂停与恢复播放。
5. **⚡ 纯 ES5 后台服务（零额外性能开销）：**
   - 后台服务 ([`service-nextgen/service/dist/index.js`](service-nextgen/service/dist/index.js)) 采用 100% 纯 **ES5 JavaScript** 编写，无任何外部依赖，完美运行于 Tizen 3.0 内置的 Node.js `v4.4.3`。

---

## 🛠️ 安装教程（分步指南）

由于每台零售版三星电视都要求 `.wgt` 安装包使用包含**您电视唯一设备 ID (DUID)** 的免费三星开发者证书进行签名，本仓库提供了 **[`install_to_tv.bat`](install_to_tv.bat)** 自动脚本，可自动检测您的证书并一键完成签名与安装。

### 第一步：在三星电视上开启开发者模式 (Developer Mode)
1. 打开电视上的 **Apps（应用）** 界面。
2. 使用遥控器依次按下数字键 **`1` `2` `3` `4` `5`**。
3. 在弹出的 **Developer mode** 窗口中：
   - 将 **Developer mode** 设为 **On**。
   - 在 **Host PC IP** 中输入您电脑的局域网 IP 地址（例如 `192.168.1.100`）。
4. 点击 **OK**，然后**冷重启电视**（按住遥控器电源键约 5 秒钟，直到重新出现三星开机标志）。

### 第二步：在 Tizen Studio 中创建免费三星证书（仅需一次）
1. 下载并安装 **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)**（在 Package Manager 中安装 **TV Extensions** 和 **Samsung Certificate Extension**）。
2. 打开 **Tizen Device Manager** -> 点击 **Remote Device Manager** (`+`) -> 添加电视 IP 地址并将连接开关设为 **On**。
3. 打开 **Tizen Certificate Manager**：
   - 点击 **`+`** -> 选择 **Samsung** -> **TV**。
   - 创建新配置文件，登录三星账号生成 **Author Certificate**，并生成 **Distributor Certificate**（已连接电视的 DUID 会自动填入）。

### 第三步：运行一键安装脚本
1. 双击运行 **[`install_to_tv.bat`](install_to_tv.bat)**。
2. 脚本会**自动检测您在 Tizen Studio 中的证书配置名称** — 按 `Enter` 确认并输入**电视的 IP 地址**即可。
3. 脚本将在 `%TEMP%` 临时目录中构建并签名 `YouTubePremium.wgt`，推送并安装到电视，完成后自动清理所有临时文件。
