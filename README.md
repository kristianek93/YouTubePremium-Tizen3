# YouTube Premium — Tizen 3.0 Edition (Samsung 2017 Smart TVs)

Odlehčená oprava oficiálního klienta **YouTube TV (`youtube.com/tv`)** navržená speciálně pro chytré televize **Samsung z roku 2017 se systémem Tizen 3.0** (platforma `17_KANTM_UHD` — řady **QLED Q7F/Q8C/Q9F**, **MU6000–MU9000**, **The Frame 2017**) a předplatitele **YouTube Premium**.

> **English summary below** — Lightweight native YouTube TV fix for 2017 Samsung Tizen 3.0 TVs (fixes frozen 1:1 YouTube Music Art Tracks, 4K black screen on timeline seek, Smart Remote Play/Pause key `10252`, and adds a zero-interruption Mini-Player on the Back button).

---

## 🇨🇿 Co tato úprava řeší (Proč vznikla?)

Na starších televizích Samsung s **Tizenem 3.0 (2017)** trpí dnešní webový klient YouTube TV několika zásadními chybami a běžné komunitní modifikace (jako standardní *TizenTube*) na nich buď padají kvůli zastaralému **Node.js v4.4.3 (ES5)** v televizi, nebo zbytečně zatěžují procesor skripty pro blokování reklam, které uživatel s **YouTube Premium** vůbec nepotřebuje.

### Hlavní opravy a funkce:
1. **🎵 Oprava přehrávání YouTube Music „Art Tracků“ a ne-16:9 skladeb (1:1 čtverce `720×720`, `1080×1080` a CD obaly `704×720`, `1056×1080`):**
   - Hardwarový MSE dekodér na Tizenu 3.0 zamrzne na `currentTime = 0` (`decodedFrames = 0`), jakmile mu YouTube pošle statické video s čtvercovým obalem alba a nízkým datovým tokem.
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

## 🛠️ Jak aplikaci nainstalovat do vlastní televize Samsung (Krok za krokem)

Protože každá televize Samsung vyžaduje balíček `.wgt` podepsaný **bezplatným vývojářským certifikátem obsahujícím unikátní ID vaší televize (DUID)**, je součástí tohoto repozitáře skript **[`install_to_tv.bat`](install_to_tv.bat)**, který balíček sám podepíše vaším certifikátem a nahraje do TV.

### 1. Zapnutí režimu vývojáře (Developer Mode) na TV
1. Na televizi otevřete aplikaci **Apps (Aplikace)**.
2. Na dálkovém ovladači postupně namačkejte čísla **`1` `2` `3` `4` `5`**.
3. Vyskočí okno **Developer mode**:
   - Přepněte **Developer mode** na **On**.
   - Do pole **Host PC IP** zadejte IP adresu vašeho počítače (např. `192.168.1.100`).
4. Potvrďte **OK** a **restartujte televizi** (podržte tlačítko vypnutí na ovladači cca 5 sekund, dokud se neobjeví logo Samsung).

### 2. Vytvoření bezplatného certifikátu v Tizen Studiu (jen jednou)
1. Stáhněte a nainstalujte **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)** (stačí verze CLI nebo IDE + v *Package Manageru* nainstalovat **TV Extensions** a **Samsung Certificate Extension**).
2. Otevřete **Tizen Device Manager**, klikněte na **Remote Device Manager** (`+`), zadejte IP adresu vaší TV a přepněte spojení na **On**.
3. Otevřete **Tizen Certificate Manager**:
   - Klikněte na **`+`** -> zvolte **Samsung** -> **TV**.
   - Vytvořte nový profil (např. `MojeTV`), vytvořte nový **Author Certificate** (přihlaste se účtem Samsung) a nový **Distributor Certificate** (automaticky se vyplní DUID připojené televize).

### 3. Automatické sestavení, podpis a instalace jedním kliknutím
1. Spusťte soubor **[`install_to_tv.bat`](install_to_tv.bat)** dvojklikem.
2. Skript si **automaticky načte váš certifikační profil** z Tizen Studia — stačí potvrdit klávesou `Enter` a zadat **IP adresu vaší televize**.
3. Skript sám:
   - zabalí a podepíše [`YouTubePremium.wgt`](config.xml) vaším certifikátem,
   - vymaže dočasné podpisové soubory ze složky projektu,
   - nahraje aplikaci do televize a nainstaluje ji pod názvem **YouTubePremium**.

---

## 🇬🇧 English Summary & Features

**YouTube Premium — Tizen 3.0 Edition** is a lightweight, zero-bloat fix for the official YouTube Leanback web client (`https://www.youtube.com/tv`) tailored specifically for **2017 Samsung Smart TVs running Tizen 3.0** (`17_KANTM_UHD`, built-in Node.js `v4.4.3`).

### Key Fixes
- **YouTube Music Art Track & Non-16:9 Video Fix:** Bypasses Tizen 3.0's hardware MSE video decoder bug on static 1:1 (`720×720`, `1080×1080`) and rectangular CD (`704×720`, `1056×1080`) album covers using a custom Virtual Video `SourceBuffer` + high-res artwork overlay.
- **4K Video Controls Black Screen Fix:** Forces transparency on `.XT6t8b` player overlays when `app-quality-root` is active so 4K video playback remains visible while seeking.
- **Seamless Zero-Interruption Mini-Player (PiP):** Pressing `Back` (`10009`) shrinks the active player to the bottom-right corner with `0.00s` audio interruption. Press the `Blue` button (`406`) or the top-bar icon to return to fullscreen.
- **Samsung Smart Remote `Play/Pause` (`10252`) Fix:** Registers all 24 Samsung TV multimedia keys on the local `file://` widget origin and reliably toggles both pause and resume in Fullscreen and Mini-Player modes.

### Quick Install (Windows)
1. Enable **Developer Mode** on your Samsung TV (`Apps` -> press `12345` -> set **On** + enter your PC IP -> reboot TV).
2. Create a free Samsung TV certificate in **Tizen Studio Certificate Manager** connected to your TV.
3. Run **[`install_to_tv.bat`](install_to_tv.bat)** — it auto-detects your Tizen Studio certificate profile, signs `YouTubePremium.wgt`, and installs it directly onto your TV.

---

## 📁 Struktura projektu / Project Structure

- [`config.xml`](config.xml) — Tizen Web Application manifest (`YouTubePremium`, `required_version="3.0"`).
- [`service-nextgen/service/dist/index.js`](service-nextgen/service/dist/index.js) — Čistá ES5 Node.js (`v4.4.3`) služba běžící na pozadí TV (lokální SDB klient + WebSocket CDP injektor).
- [`src/yt_tizen3_premium_mod.js`](src/yt_tizen3_premium_mod.js) — Čitelný zdrojový kód klientského modu vstřikovaného do `youtube.com/tv`.
- [`tizenbrew-ui/dist/index.html`](tizenbrew-ui/dist/index.html) — Startovací obrazovka registrující hardwarová tlačítka dálkového ovladače Samsung.
- [`install_to_tv.bat`](install_to_tv.bat) — Automatický skript pro podepsání vlastním certifikátem a instalaci do TV.
