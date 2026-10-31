# YouTube Premium — Tizen 3.0 Kiadás (2017-es Samsung Okostévékhez)

<div align="center">

🌍 **Select Language / Válasszon nyelvet:**  
[**🇬🇧 English**](README.md) • [**🇨🇿 Čeština**](README.cs.md) • [**🇭🇺 Magyar**](README.hu.md) • [**🇨🇳 简体中文**](README.zh-CN.md) • [**🇮🇳 हिन्दी**](README.hi.md) • [**🇪🇸 Español**](README.es.md)

</div>

---

Könnyűsúlyú, erőforrás-kímélő javítás a hivatalos **YouTube TV (`https://www.youtube.com/tv`)** klienshez, kifejezetten a **Tizen 3.0 rendszert futtató 2017-es Samsung Okostévékhez** (`17_KANTM_UHD` platform — **QLED Q7F/Q8C/Q9F**, **MU6000–MU9000**, **The Frame 2017**) és **YouTube Premium** előfizetőknek tervezve.

## Miért készült ez a javítás?
A **Tizen 3.0 (2017)** rendszerű Samsung tévéken a mai YouTube TV alkalmazás több súlyos hibától szenved, miközben a szokásos közösségi módosítások (mint a normál *TizenTube*) vagy összeomlanak a tévé régi **Node.js `v4.4.3` (ES5)** környezete miatt, vagy feleslegesen terhelik a processzort reklámblokkoló szkriptekkel, amelyekre **YouTube Premium** előfizetéssel nincs is szükség.

## ✨ Főbb javítások és funkciók
1. **🎵 YouTube Music „Art Track” és 1:1-es statikus albumborítók fagyásának javítása (`720×720`, `1080×1080` és `704×720`):**
   - A Tizen 3.0 hardveres videódekódere lefagy `currentTime = 0` értéknél, amikor a YouTube alacsony bitrátájú, statikus albumborítós zeneszámot küld.
   - Ez a módosítás automatikusan felismeri az ilyen zeneszámokat, a videósávot egy **virtuális MSE `SourceBuffer`-be** irányítja (megkerülve a hibás hardveres dekódert), tisztán lejátssza a hangot, és nagy felbontásban megjeleníti az albumborítót (teljes képernyőn és Mini-lejátszóban is).
2. **🎬 4K videók tekerésénél jelentkező fekete képernyő javítása:**
   - Eltávolítja a `.XT6t8b` vezérlőréteg átlátszatlan fekete hátterét, így 4K videók tekerésekor a kép végig látható marad.
3. **🖼️ Zökkenőmentes Mini-lejátszó (Kép a képben) `0.00s` hangkimaradással:**
   - Lejátszás közben a **Vissza (`Return`)** gomb megnyomására a zene nem áll le és nem indul elölről, hanem a lejátszó **nulla hangkimaradással** lekicsinyül a jobb alsó sarokba.
   - A távirányító **Kék gombjával** (vagy a felső keresősáv melletti ikonnal) azonnal visszatérhet teljes képernyőre.
4. **🎮 Samsung Smart Remote `Play/Pause` gomb (`keyCode 10252`) teljes támogatása:**
   - Regisztrálja mind a 24 Samsung multimédiás gombot, így a megállítás és a folytatás is tökéletesen működik teljes képernyőn és Mini-lejátszóban egyaránt.
5. **⚡ Tiszta ES5 háttérszolgáltatás (Nulla felesleges terhelés):**
   - 100%-ban tiszta **ES5 JavaScriptben** íródott külső függőségek nélkül, kifejezetten a Tizen 3.0 belső Node.js `v4.4.3` motorjához.

---

## 🛠️ Telepítés saját Samsung TV-re (Lépésről lépésre)

Mivel minden Samsung TV megköveteli, hogy a `.wgt` telepítőcsomagot a **tévé saját egyedi azonosítóját (DUID) tartalmazó ingyenes Samsung fejlesztői tanúsítvánnyal** írják alá, a csomag tartalmaz egy **[`install_to_tv.bat`](install_to_tv.bat)** automatikus telepítőt, amely egyetlen kattintással elvégzi az aláírást és a telepítést.

### 1. lépés: Fejlesztői mód (Developer Mode) bekapcsolása a TV-n
1. Nyissa meg a tévén az **Apps (Alkalmazások)** menüt.
2. A távirányítón nyomja meg egymás után az **`1` `2` `3` `4` `5`** gombokat.
3. A megjelenő **Developer mode** ablakban:
   - Állítsa a **Developer mode** kapcsolót **On** állásba.
   - A **Host PC IP** mezőbe írja be a számítógépe helyi IP-címét (pl. `192.168.1.100`).
4. Nyomjon **OK**-t, majd **indítsa újra a tévét** (tartsa nyomva a távirányító bekapcsológombját kb. 5 másodpercig, amíg meg nem jelenik a Samsung logó).

### 2. lépés: Ingyenes Samsung tanúsítvány létrehozása a Tizen Studio-ban (Csak egyszer kell)
1. Telepítse a **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)** programot (a Package Managerben telepítse a **TV Extensions** és a **Samsung Certificate Extension** csomagokat).
2. A **Tizen Device Manager**-ben adja hozzá a tévé IP-címét, és kapcsolja **On** állásba.
3. Nyissa meg a **Tizen Certificate Manager**-t:
   - Kattintson a **`+`** gombra -> válassza a **Samsung** -> **TV** lehetőséget.
   - Hozzon létre egy új profilt, jelentkezzen be Samsung-fiókjával az **Author Certificate** létrehozásához, majd készítse el a **Distributor Certificate**-et (a csatlakoztatott TV DUID azonosítója automatikusan bekerül).

### 3. lépés: Egykattintásos telepítő futtatása
1. Kattintson duplán az **[`install_to_tv.bat`](install_to_tv.bat)** fájlra.
2. A szkript **automatikusan felismeri a tanúsítványprofil nevét** a Tizen Studio-ból — csak nyomjon `Enter`-t, majd írja be a **tévé IP-címét**.
3. A szkript a `%TEMP%` mappában aláírja a `YouTubePremium.wgt` csomagot, feltelepíti a tévére, majd automatikusan törli az ideiglenes fájlokat.
