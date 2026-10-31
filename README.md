# YouTube Premium — Tizen 3.0 Edition (Samsung 2017 Smart TVs)

🌍 **[🇬🇧 English Documentation](#-english-documentation)** | **[🇨🇿 Česká dokumentace (Czech Guide)](#-česká-dokumentace)**

---

## 🇬🇧 English Documentation

A lightweight, zero-bloat fix for the official **YouTube TV (`https://www.youtube.com/tv`)** web client designed specifically for **2017 Samsung Smart TVs running Tizen 3.0** (platform `17_KANTM_UHD` — **QLED Q7F/Q8C/Q9F**, **MU6000–MU9000**, **The Frame 2017**) and **YouTube Premium** subscribers.

### Why does this exist?
On 2017 Samsung TVs running **Tizen 3.0**, today's YouTube Leanback web app suffers from multiple breaking bugs. Meanwhile, heavy community mods (like standard *TizenTube*) either crash on Tizen 3.0 due to the TV's ancient built-in **Node.js `v4.4.3` (ES5-only)** runtime, or slow down the TV's CPU with AdBlock/SponsorBlock scripts that **YouTube Premium** subscribers don't need.

### ✨ Key Fixes & Features
1. **🎵 YouTube Music "Art Track" & Non-16:9 Static Cover Fix (`1:1` squares `720×720`, `1080×1080` & CD rectangles `704×720`, `1056×1080`):**
   - Tizen 3.0's hardware MSE video decoder freezes at `currentTime = 0` (`decodedFrames = 0`) whenever YouTube serves an ultra-low-bitrate static album cover video stream.
   - This mod automatically detects Art Tracks / non-16:9 music videos, redirects the video stream into a **Virtual MSE `SourceBuffer`** (bypassing the buggy hardware video decoder), plays the native audio stream, and renders crisp high-resolution album artwork on screen (both in Fullscreen and Mini-Player).
2. **🎬 4K Video Timeline / Seek Black Screen Fix:**
   - Removes the opaque black background on `.XT6t8b` player overlays when `app-quality-root` is active, so 4K video playback remains completely visible while seeking or viewing player controls.
3. **🖼️ Seamless Mini-Player (Picture-in-Picture) with `0.00s` Audio Interruption:**
   - Pressing **Back (`Return`)** during playback shrinks the player into the bottom-right corner (**Mini-Player**) while you browse YouTube — **with zero audio interruption or track restart**.
   - Press the **Blue button** on your remote (or click the top-bar icon next to Search) to return to Fullscreen.
4. **リモコン Full Samsung Smart Remote `Play/Pause` (`keyCode 10252`) Support:**
   - Registers all 24 Samsung hardware multimedia keys (`MediaPlayPause`, `MediaPlay`, `MediaPause`, `MediaFastForward`, `MediaRewind`, color buttons) on the local `file://` widget origin and reliably toggles both **Pause** and **Resume** (`play(false, true)`) in Fullscreen and Mini-Player modes.
5. **⚡ Pure ES5 Background Service (Zero Overhead):**
   - The background service ([`service-nextgen/service/dist/index.js`](service-nextgen/service/dist/index.js)) is written in 100% pure **ES5 JavaScript** with zero external npm dependencies, running natively on Tizen 3.0's internal Node.js `v4.4.3`.
   - No AdBlock, SponsorBlock, or DeArrow overhead — a 100% clean native experience for **YouTube Premium** accounts.

---

### 🛠️ How to Install on Your Samsung TV (Step-by-Step)

Because every retail Samsung TV requires `.wgt` packages to be signed with a **free Samsung Developer Certificate containing your specific TV's Device Unique ID (DUID)**, this repository includes an automated **[`install_to_tv.bat`](install_to_tv.bat)** script that signs the package with your certificate and installs it onto your TV in one click.

#### Step 1: Enable Developer Mode on your Samsung TV
1. Open the **Apps** screen on your Samsung TV.
2. Using your remote control, press **`1` `2` `3` `4` `5`**.
3. In the **Developer mode** dialog:
   - Switch **Developer mode** to **On**.
   - Enter your computer's local IP address (e.g., `192.168.1.100`) under **Host PC IP**.
4. Click **OK** and **cold-reboot your TV** (hold the **Power** button on the remote for ~5 seconds until the Samsung boot logo appears).

#### Step 2: Create a Free Samsung Certificate in Tizen Studio (One-Time Setup)
1. Download and install **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)** (and install **TV Extensions** + **Samsung Certificate Extension** in Package Manager).
2. Open **Tizen Device Manager** -> click **Remote Device Manager** (`+`) -> add your TV's IP address and flip the connection toggle to **On**.
3. Open **Tizen Certificate Manager**:
   - Click **`+`** -> select **Samsung** -> **TV**.
   - Create a new certificate profile, sign in with your Samsung Account to generate an **Author Certificate**, and generate a **Distributor Certificate** (your connected TV's DUID will be added automatically).

#### Step 3: Run the 1-Click Automated Installer
1. Double-click **[`install_to_tv.bat`](install_to_tv.bat)**.
2. The script **automatically detects your active Certificate Profile** from Tizen Studio — just press `Enter` to confirm and type your **TV's IP address**.
3. The script will:
   - Build and sign `YouTubePremium.wgt` in `%TEMP%` using your certificate,
   - Push and install **YouTubePremium** onto your TV,
   - Automatically clean up all temporary `.wgt` and signature files when done.

---
---

## 🇨🇿 Česká dokumentace

Odlehčená oprava oficiálního klienta **YouTube TV (`youtube.com/tv`)** navržená speciálně pro chytré televize **Samsung z roku 2017 se systémem Tizen 3.0** (platforma `17_KANTM_UHD` — řady **QLED Q7F/Q8C/Q9F**, **MU6000–MU9000**, **The Frame 2017**) a předplatitele **YouTube Premium**.

### Proč tato úprava vznikla?
Na starších televizích Samsung s **Tizenem 3.0 (2017)** trpí dnešní webový klient YouTube TV několika zásadními chybami a běžné komunitní modifikace (jako standardní *TizenTube*) na nich buď padají kvůli zastaralému **Node.js v4.4.3 (ES5)** v televizi, nebo zbytečně zatěžují procesor skripty pro blokování reklam, které uživatel s **YouTube Premium** vůbec nepotřebuje.

### ✨ Hlavní opravy a funkce
1. **🎵 Oprava přehrávání YouTube Music „Art Tracků“ a ne-16:9 skladeb (`1:1` čtverce `720×720`, `1080×1080` a CD obaly `704×720`, `1056×1080`):**
   - Hardwarový MSE dekodér na Tizenu 3.0 zamrzne na `currentTime = 0` (`decodedFrames = 0`), jakmile mu YouTube pošle statické video se čtvercovým obalem alba a nízkým datovým tokem.
   - Mod automaticky detekuje statické hudební skladby, přesměruje video stopu do **virtuálního MSE `SourceBufferu`** (čímž obejde zaseknutý hardwarový dekodér TV), pustí čistou audio stopu a vykreslí obal alba ve vysokém rozlišení přímo na obrazovku (včetně podpory v Mini-přehrávači).
2. **🎬 Oprava černé obrazovky u 4K videí při vyvolání časové osy:**
   - Odstraňuje neprůhledné černé pozadí překryvné vrstvy (`.XT6t8b`) při stisknutí šipek/OK během přehrávání 4K videa, takže obraz videa zůstává při přetáčení normálně viditelný.
3. **🖼️ Plynulý Mini-přehrávač (Obraz v obraze) s `0.00s` výpadkem zvuku:**
   - Stisknutí tlačítka **Zpět (`Back`)** během přehrávání neskončí zastavením skladby, ale plynule zmenší přehrávač do pravého dolního rohu (Mini-přehrávač) **bez jakéhokoliv přerušení nebo restartu hudby**.
   - Pro návrat přes celou obrazovku stačí stisknout **Modré tlačítko** na ovladači nebo ikonu v horní liště vedle vyhledávání.
4. **リモコン Plná podpora tlačítka `Play/Pause` na Samsung Smart Ovladači (`keyCode 10252`):**
   - Registruje všechna multimediální tlačítka (`MediaPlayPause`, `MediaPlay`, `MediaPause`, `MediaFastForward`, `MediaRewind`, barevná tlačítka) přímo na lokálním `file://` originu widgetu a spolehlivě ovládá jak pozastavení, tak opětovné spuštění (`play(false, true)`) na celou obrazovku i v Mini-přehrávači.
5. **⚡ Čistý ES5 běh bez zátěže (Zero Overhead):**
   - Služba na pozadí ([`service-nextgen/service/dist/index.js`](service-nextgen/service/dist/index.js)) je napsaná v čistém **ES5 JavaScriptu** bez externích závislostí, takže nativně běží na interním **Node.js v4.4.3** v Tizenu 3.0.
   - Žádný AdBlock, SponsorBlock ani DeArrow — 100% čisté prostředí pro účty s **YouTube Premium**.

---

### 🛠️ Jak aplikaci nainstalovat do vlastní televize Samsung (Krok za krokem)

Protože každá televize Samsung vyžaduje balíček `.wgt` podepsaný **bezplatným vývojářským certifikátem obsahujícím unikátní ID vaší televize (DUID)**, je součástí tohoto repozitáře skript **[`install_to_tv.bat`](install_to_tv.bat)**, který balíček sám podepíše vaším certifikátem a nahraje do TV.

#### 1. Zapnutí režimu vývojáře (Developer Mode) na TV
1. Na televizi otevřete aplikaci **Apps (Aplikace)**.
2. Na dálkovém ovladači postupně namačkejte čísla **`1` `2` `3` `4` `5`**.
3. Vyskočí okno **Developer mode**:
   - Přepněte **Developer mode** na **On**.
   - Do pole **Host PC IP** zadejte IP adresu vašeho počítače (např. `192.168.1.100`).
4. Potvrďte **OK** a **restartujte televizi** (podržte tlačítko vypnutí na ovladači cca 5 sekund, dokud se neobjeví logo Samsung).

#### 2. Vytvoření bezplatného certifikátu v Tizen Studiu (jen jednou)
1. Stáhněte a nainstalujte **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)** (v *Package Manageru* nainstalujte **TV Extensions** a **Samsung Certificate Extension**).
2. Otevřete **Tizen Device Manager**, klikněte na **Remote Device Manager** (`+`), zadejte IP adresu vaší TV a přepněte spojení na **On**.
3. Otevřete **Tizen Certificate Manager**:
   - Klikněte na **`+`** -> zvolte **Samsung** -> **TV**.
   - Vytvořte nový profil (např. `MojeTV`), vytvořte nový **Author Certificate** (přihlaste se účtem Samsung) a nový **Distributor Certificate** (automaticky se vyplní DUID připojené televize).

#### 3. Automatické sestavení, podpis a instalace jedním kliknutím
1. Spusťte soubor **[`install_to_tv.bat`](install_to_tv.bat)** dvojklikem.
2. Skript si **automaticky načte váš certifikační profil** z Tizen Studia — stačí potvrdit klávesou `Enter` a zadat **IP adresu vaší televize**.
3. Skript sám sestaví a podepíše `YouTubePremium.wgt` v dočasné složce `%TEMP%`, nainstaluje aplikaci do TV a po sobě všechny dočasné soubory automaticky uklidí.

---

## 📁 Project Structure / Struktura projektu

- [`config.xml`](config.xml) — Tizen Web Application manifest (`YouTubePremium`, `required_version="3.0"`).
- [`service-nextgen/service/dist/index.js`](service-nextgen/service/dist/index.js) — Pure ES5 Node.js (`v4.4.3`) background service (local SDB client + WebSocket CDP injector).
- [`src/yt_tizen3_premium_mod.js`](src/yt_tizen3_premium_mod.js) — Readable source code of the client mod injected into `youtube.com/tv`.
- [`tizenbrew-ui/dist/index.html`](tizenbrew-ui/dist/index.html) — Launcher page registering Samsung hardware remote control keys.
- [`install_to_tv.bat`](install_to_tv.bat) — 1-click automated certificate signer & TV installer script.
