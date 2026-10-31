# YouTube Premium — Edición Tizen 3.0 (Smart TVs Samsung 2017)

<div align="center">

🌍 **Select Language / Seleccionar idioma:**  
[**🇬🇧 English**](README.md) • [**🇨🇿 Čeština**](README.cs.md) • [**🇭🇺 Magyar**](README.hu.md) • [**🇨🇳 简体中文**](README.zh-CN.md) • [**🇮🇳 हिन्दी**](README.hi.md) • [**🇪🇸 Español**](README.es.md)

</div>

---

Una corrección ligera y sin sobrecarga para el cliente oficial **YouTube TV (`https://www.youtube.com/tv`)** diseñada específicamente para **Smart TVs Samsung de 2017 con Tizen 3.0** (plataforma `17_KANTM_UHD` — series **QLED Q7F/Q8C/Q9F**, **MU6000–MU9000**, **The Frame 2017**) y suscriptores de **YouTube Premium**.

## ✨ Principales correcciones y funciones
1. **🎵 Corrección de "Art Tracks" de YouTube Music y portadas estáticas 1:1 (`720×720`, `1080×1080` y `704×720`):**
   - El decodificador de video por hardware de Tizen 3.0 se congela en `currentTime = 0` cuando YouTube envía pistas musicales con imagen estática de baja tasa de bits.
   - Este mod detecta automáticamente las pistas musicales estáticas, redirige el flujo de video a un **`SourceBuffer` MSE virtual**, reproduce el audio nativo sin cortes y muestra la portada del álbum en alta resolución (tanto en pantalla completa como en el Mini-reproductor).
2. **🎬 Corrección de pantalla negra en videos 4K al mostrar controles o adelantar:**
   - Elimina el fondo negro opaco de la capa `.XT6t8b` para que el video 4K siga viéndose mientras usas la barra de progreso.
3. **🖼️ Mini-reproductor (Picture-in-Picture) con `0.00s` de interrupción de audio:**
   - Al pulsar el botón **Atrás (`Return`)** durante la reproducción, el video se reduce a la esquina inferior derecha **sin interrumpir ni reiniciar la música**.
   - Pulsa el **botón Azul** del mando para volver a pantalla completa.
4. **🎮 Soporte completo para el botón `Play/Pause` del mando Samsung Smart Remote (`keyCode 10252`):**
   - Registra las 24 teclas multimedia de Samsung y permite pausar y reanudar tanto en pantalla completa como en el Mini-reproductor.
5. **⚡ Servicio en segundo plano en ES5 puro (Cero sobrecarga):**
   - Escrito 100% en **JavaScript ES5** sin dependencias externas para ejecutarse de forma nativa en el **Node.js `v4.4.3`** interno de Tizen 3.0.

---

## 🛠️ Cómo instalar en tu TV Samsung (Paso a paso)

Dado que cada televisor Samsung requiere que los paquetes `.wgt` estén firmados con un **Certificado de Desarrollador de Samsung gratuito que contenga el DUID único de tu TV**, este repositorio incluye el script automático **[`install_to_tv.bat`](install_to_tv.bat)**.

### Paso 1: Activar el Modo Desarrollador en la TV
1. Abre la pantalla **Apps** en tu TV Samsung.
2. Con el mando a distancia, pulsa **`1` `2` `3` `4` `5`**.
3. Activa **Developer mode** en **On** e introduce la IP local de tu PC en **Host PC IP**.
4. Pulsa **OK** y **reinicia la TV** manteniendo pulsado el botón de encendido del mando durante 5 segundos.

### Paso 2: Crear un certificado gratuito en Tizen Studio (Solo una vez)
1. Instala **[Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)** (con **TV Extensions** y **Samsung Certificate Extension**).
2. Conecta tu TV en **Tizen Device Manager**.
3. En **Tizen Certificate Manager**, haz clic en **`+`** -> **Samsung** -> **TV** y crea tu perfil de certificado.

### Paso 3: Ejecutar el instalador automático en 1 clic
1. Haz doble clic en **[`install_to_tv.bat`](install_to_tv.bat)**.
2. El script **detecta automáticamente el nombre de tu certificado** en Tizen Studio — solo pulsa `Enter` e introduce la **dirección IP de tu TV**.
3. El script firmará `YouTubePremium.wgt` en `%TEMP%`, instalará la aplicación en tu TV y limpiará automáticamente los archivos temporales.
