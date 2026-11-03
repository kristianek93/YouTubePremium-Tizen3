// YouTube TV Mod for Samsung Tizen 3.0 (QE75Q7FAM) - YouTube Premium Edition
// Features:
// 1. Universal Art Track / Non-16:9 / Static Cover Fix (1:1 squares, 704x720 CD rectangles, Topic/ATV tracks)
// 2. Automatic Mini-Player (Picture-in-Picture) on Back button (Zpět) & Settings menu WITH exact timestamp resume
// 3. Samsung Smart Remote MediaPlayPause (10252) / MediaPlay (415) / MediaPause (19) support
// 4. No AdBlock / SponsorBlock / DeArrow overhead (clean YouTube Premium experience)

(function () {
  // Always attempt to register Tizen hardware remote keys if window.tizen is available
  function registerTizenKeys() {
    try {
      if (typeof window.tizen !== 'undefined' && window.tizen.tvinputdevice) {
        var keys = [
          'MediaPlayPause',
          'MediaRewind',
          'MediaFastForward',
          'MediaPlay',
          'MediaPause',
          'MediaStop',
          'MediaRecord',
          'MediaTrackPrevious',
          'MediaTrackNext',
          'ColorF0Red',
          'ColorF1Green',
          'ColorF2Yellow',
          'ColorF3Blue',
          '0',
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          'Search',
          'Info'
        ];
        for (var i = 0; i < keys.length; i++) {
          try {
            window.tizen.tvinputdevice.registerKey(keys[i]);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
  registerTizenKeys();

  if (
    window.location &&
    window.location.hostname &&
    window.location.hostname.indexOf('youtube.com') === -1
  ) {
    return;
  }

  // Support clean hot-reload / re-injection
  if (window.__ttPremiumModInterval) {
    clearInterval(window.__ttPremiumModInterval);
  }
  if (window.__ttKeydownHandler) {
    window.removeEventListener('keydown', window.__ttKeydownHandler, true);
    document.removeEventListener('keydown', window.__ttKeydownHandler, true);
  }
  if (window.__ttKeyupHandler) {
    window.removeEventListener('keyup', window.__ttKeyupHandler, true);
    document.removeEventListener('keyup', window.__ttKeyupHandler, true);
  }
  if (window.__ttPipButtonObserver) {
    try {
      window.__ttPipButtonObserver.disconnect();
    } catch (e) {}
  }

  var isFirstLoad = !window.__ttPremiumModLoaded;
  window.__ttPremiumModLoaded = true;
  console.info('[TT-Premium] Initializing Tizen 3.0 Art Track Fix + Back Mini-Player + Smart Remote Keys...');

  if (!Object.values) {
    Object.values = function (obj) {
      var res = [];
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          res.push(obj[k]);
        }
      }
      return res;
    };
  }

  if (typeof window.isPipPlaying === 'undefined') {
    window.isPipPlaying = false;
  }
  if (!window.__tt1x1Active) {
    window.__tt1x1Active = null;
  }
  if (!window.__tt1x1ById) {
    window.__tt1x1ById = {};
  }
  if (typeof window.__ttLastPlaybackTime === 'undefined') {
    window.__ttLastPlaybackTime = 0;
  }
  if (typeof window.__ttLastVideoId === 'undefined') {
    window.__ttLastVideoId = '';
  }
  if (typeof window.__ttLastPlaybackConfig === 'undefined') {
    window.__ttLastPlaybackConfig = null;
  }

  // Retroactively upgrade any already-cached Art Tracks
  try {
    for (var cachedId in window.__tt1x1ById) {
      var cached = window.__tt1x1ById[cachedId];
      if (
        cached &&
        !cached.is1x1 &&
        cached.thumbUrl &&
        cached.thumbUrl.indexOf('googleusercontent.com') !== -1
      ) {
        cached.is1x1 = true;
      }
    }
    if (
      window.__tt1x1Active &&
      !window.__tt1x1Active.is1x1 &&
      window.__tt1x1Active.thumbUrl &&
      window.__tt1x1Active.thumbUrl.indexOf('googleusercontent.com') !== -1
    ) {
      window.__tt1x1Active.is1x1 = true;
    }
  } catch (e) {}

  var PlayerService = null;
  var pipTransitionInProgress = false;

  // Remove any leftover toast notification element if present
  try {
    var oldToast = document.getElementById('tt-premium-toast');
    if (oldToast && oldToast.parentNode) {
      oldToast.parentNode.removeChild(oldToast);
    }
  } catch (e) {}

  // Notifications disabled for a 100% clean native YouTube Premium UI
  function showModToast() {}

  // =========================================================================
  // 1. HELPER: RESOLVE COMMAND, PLAYER SERVICE & FULLSCREEN DETECTION
  // =========================================================================
  function isFullscreenPlayerActive() {
    if (window.isPipPlaying) return false;
    var hash = (window.location && window.location.hash) || '';
    if (hash.indexOf('#/watch') === 0) return true;
    var ytlrPlayer = document.querySelector('ytlr-player');
    if (
      ytlrPlayer &&
      (ytlrPlayer.classList.contains('ytLrPlayerEnabled') ||
        ytlrPlayer.classList.contains('ExC9Fb'))
    ) {
      return true;
    }
    return false;
  }

  function resolveCommand(cmd, extra) {
    if (!window._yttv) return;
    for (var key in window._yttv) {
      if (
        window._yttv[key] &&
        window._yttv[key].instance &&
        typeof window._yttv[key].instance.resolveCommand === 'function'
      ) {
        return window._yttv[key].instance.resolveCommand(cmd, extra);
      }
    }
  }

  function patchPlayerServiceMethods(ps) {
    if (!ps) return;
    if (!ps.__ttWarningPatched) {
      ps.__ttWarningPatched = true;
      if (typeof ps.triggerAudioPlaybackWarning === 'function') {
        ps.triggerAudioPlaybackWarning = function () {};
      }
    }
    if (!ps.__ttSeamlessPipPatchedV2) {
      ps.__ttSeamlessPipPatchedV2 = true;
      var origPsStop = ps.__ttOrigStop || ps.stop;
      ps.__ttOrigStop = origPsStop;
      if (typeof origPsStop === 'function') {
        ps.stop = function (a, b) {
          if ((window.__ttSuppressStop || window.isPipPlaying) && !b) {
            return;
          }
          return origPsStop.apply(this, arguments);
        };
      }
      var origPsLoadVideo = ps.__ttOrigLoadVideo || ps.loadVideo;
      ps.__ttOrigLoadVideo = origPsLoadVideo;
      if (typeof origPsLoadVideo === 'function') {
        ps.loadVideo = function (a) {
          if (window.__ttReturningFromPip) {
            var videoEl = document.querySelector('video');
            var curVid =
              this.loadedPlaybackConfig &&
              this.loadedPlaybackConfig.watchEndpoint &&
              this.loadedPlaybackConfig.watchEndpoint.videoId;
            var reqVid = a && a.watchEndpoint && a.watchEndpoint.videoId;
            if (
              curVid &&
              reqVid &&
              curVid === reqVid &&
              videoEl &&
              (videoEl.readyState >= 1 || this.isPlaybackInitiated)
            ) {
              this.Oe = a;
              return Promise.resolve();
            }
          }
          return origPsLoadVideo.apply(this, arguments);
        };
      }
    }
  }

  function getPlayerService() {
    if (
      PlayerService &&
      (PlayerService.loadedPlaybackConfig || typeof PlayerService.loadVideo === 'function')
    ) {
      patchPlayerServiceMethods(PlayerService);
      return PlayerService;
    }
    try {
      if (!window._yttv) return null;
      var holder = null;
      for (var k in window._yttv) {
        var item = window._yttv[k];
        if (item && item.mappings) {
          holder = item;
          break;
        }
      }
      if (holder) {
        if (typeof holder.get === 'function') {
          try {
            PlayerService = holder.get('PlayerService');
          } catch (e1) {}
        }
        if (!PlayerService && holder.mappings && typeof holder.mappings.get === 'function') {
          try {
            PlayerService = holder.mappings.get('PlayerService');
          } catch (e2) {}
        }
        var PlaybackPreviewService = null;
        if (typeof holder.get === 'function') {
          try {
            PlaybackPreviewService = holder.get('PlaybackPreviewService');
          } catch (e3) {}
        } else if (holder.mappings && typeof holder.mappings.get === 'function') {
          try {
            PlaybackPreviewService = holder.mappings.get('PlaybackPreviewService');
          } catch (e4) {}
        }
        if (PlaybackPreviewService && !PlaybackPreviewService.__ttPipPatched) {
          PlaybackPreviewService.__ttPipPatched = true;
          var origStart = PlaybackPreviewService.start;
          var origStop = PlaybackPreviewService.stop;
          if (typeof origStart === 'function') {
            PlaybackPreviewService.start = function () {
              if (window.isPipPlaying) return;
              return origStart.apply(this, arguments);
            };
          }
          if (typeof origStop === 'function') {
            PlaybackPreviewService.stop = function () {
              if (window.isPipPlaying) return;
              return origStop.apply(this, arguments);
            };
          }
        }
      }
      if (!PlayerService) {
        for (var k2 in window._yttv) {
          var inst = window._yttv[k2] && window._yttv[k2].instance;
          if (inst && (inst.loadedPlaybackConfig || typeof inst.loadVideo === 'function')) {
            PlayerService = inst;
            break;
          }
        }
      }
      patchPlayerServiceMethods(PlayerService);
    } catch (e) {}
    return PlayerService;
  }

  function getActiveVideoIdFromPlayer() {
    try {
      var ps = getPlayerService();
      var vid =
        ps &&
        ps.loadedPlaybackConfig &&
        ps.loadedPlaybackConfig.watchEndpoint &&
        ps.loadedPlaybackConfig.watchEndpoint.videoId;
      if (vid) return vid;
    } catch (e) {}
    try {
      var hash = window.location.hash || '';
      var m = hash.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (m) return m[1];
    } catch (e) {}
    return '';
  }

  function updateSavedPlaybackProgress() {
    try {
      if (pipTransitionInProgress) return;
      var ps = getPlayerService();
      var videoEl = document.querySelector('video');
      var t = 0;
      if (videoEl && videoEl.currentTime > 0.5) {
        t = videoEl.currentTime;
      } else if (ps && typeof ps.getCurrentTime === 'function') {
        var pst = ps.getCurrentTime();
        if (pst > 0.5) t = pst;
      }
      var vid = getActiveVideoIdFromPlayer();
      if (vid && vid !== window.__ttLastVideoId) {
        window.__ttLastVideoId = vid;
        window.__ttLastPlaybackTime = t;
      } else if (t > 0.5) {
        window.__ttLastPlaybackTime = t;
      }
      if (ps && ps.loadedPlaybackConfig && ps.loadedPlaybackConfig.watchEndpoint) {
        window.__ttLastPlaybackConfig = ps.loadedPlaybackConfig;
      }
    } catch (e) {}
  }

  function is1x1CurrentlyActive() {
    var currentVid = getActiveVideoIdFromPlayer();
    if (currentVid && window.__tt1x1ById[currentVid] !== undefined) {
      return !!window.__tt1x1ById[currentVid].is1x1;
    }
    return !!(window.__tt1x1Active && window.__tt1x1Active.is1x1);
  }

  function getActive1x1Info() {
    var currentVid = getActiveVideoIdFromPlayer();
    if (currentVid && window.__tt1x1ById[currentVid] && window.__tt1x1ById[currentVid].is1x1) {
      return window.__tt1x1ById[currentVid];
    }
    if (window.__tt1x1Active && window.__tt1x1Active.is1x1) {
      return window.__tt1x1Active;
    }
    return null;
  }

  // =========================================================================
  // 2. UNIVERSAL ART TRACK / NON-16:9 DETECTION & ALBUM ARTWORK OVERLAY
  // =========================================================================
  function detectArtTrackOrNonStandardVideo(r, videoFormats, thumbUrl) {
    var vd = (r && r.videoDetails) || {};

    var isNonStandardAspect = videoFormats.every(function (f) {
      if (!f.width || !f.height) return false;
      var ratio = f.width / f.height;
      return ratio < 1.30;
    });

    var isMusicAtv =
      vd.musicVideoType === 'MUSIC_VIDEO_TYPE_ATV' ||
      (typeof thumbUrl === 'string' && thumbUrl.indexOf('googleusercontent.com') !== -1) ||
      (typeof vd.author === 'string' && vd.author.indexOf(' - Topic') !== -1) ||
      (typeof vd.shortDescription === 'string' &&
        (vd.shortDescription.indexOf('Provided to YouTube by ') === 0 ||
          vd.shortDescription.indexOf('Auto-generated by YouTube.') !== -1));

    var isUltraLowBitrateStatic = videoFormats.some(function (f) {
      return (
        f.mimeType &&
        f.mimeType.indexOf('video/mp4') === 0 &&
        Number(f.height) >= 720 &&
        Number(f.bitrate) > 0 &&
        Number(f.bitrate) < 140000
      );
    });

    return !!(isNonStandardAspect || isMusicAtv || isUltraLowBitrateStatic);
  }

  function handlePlayerResponseFor1x1(r) {
    try {
      if (!r || !r.streamingData || !Array.isArray(r.streamingData.adaptiveFormats)) return;

      var adaptive = r.streamingData.adaptiveFormats;
      var videoFormats = [];
      var audioFormats = [];

      for (var i = 0; i < adaptive.length; i++) {
        var fmt = adaptive[i];
        if (!fmt || typeof fmt.mimeType !== 'string') continue;
        if (fmt.mimeType.indexOf('video/') === 0) {
          videoFormats.push(fmt);
        } else if (fmt.mimeType.indexOf('audio/') === 0) {
          audioFormats.push(fmt);
        }
      }

      if (videoFormats.length === 0) return;

      var videoId = (r.videoDetails && r.videoDetails.videoId) || '';
      var title = (r.videoDetails && r.videoDetails.title) || '';
      var author = (r.videoDetails && r.videoDetails.author) || '';
      var lengthSeconds = Number((r.videoDetails && r.videoDetails.lengthSeconds) || 0);
      var thumbs =
        (r.videoDetails && r.videoDetails.thumbnail && r.videoDetails.thumbnail.thumbnails) || [];
      var thumbUrl =
        thumbs.length > 0
          ? thumbs[thumbs.length - 1].url
          : videoId
          ? 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg'
          : '';

      var isArtTrack = detectArtTrackOrNonStandardVideo(r, videoFormats, thumbUrl);
      var firstVid = videoFormats[0] || {};
      var aspectW = Number(firstVid.width) || 720;
      var aspectH = Number(firstVid.height) || 720;

      var info = {
        is1x1: isArtTrack,
        videoId: videoId,
        title: title,
        author: author,
        lengthSeconds: lengthSeconds,
        aspectW: aspectW,
        aspectH: aspectH,
        thumbUrl: thumbUrl,
        fallbackThumbUrl: videoId ? 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg' : '',
        ts: Date.now()
      };

      if (videoId) {
        window.__tt1x1ById[videoId] = info;
      }
      window.__tt1x1Active = info;

      if (isArtTrack && audioFormats.length > 0) {
        console.info(
          '[TT-1x1] Detected Art Track (' + aspectW + 'x' + aspectH + '):',
          videoId,
          title
        );
        showModToast(
          '🎵 Oprava Art Tracku (' + aspectW + '×' + aspectH + '): ' + (title || videoId),
          3500
        );
        var mp4Videos = videoFormats.filter(function (f) {
          return f.mimeType.indexOf('video/mp4') === 0;
        });
        var pool = mp4Videos.length > 0 ? mp4Videos : videoFormats;
        pool.sort(function (a, b) {
          return (Number(a.bitrate) || 9999999) - (Number(b.bitrate) || 9999999);
        });
        r.streamingData.adaptiveFormats = audioFormats.concat([pool[0]]);
      }

      setTimeout(update1x1Overlay, 50);
    } catch (err) {
      console.warn('[TT-1x1] handlePlayerResponseFor1x1 error:', err);
    }
  }

  var origJSONParse = window.__ttOrigJSONParse || window.JSON.parse;
  window.__ttOrigJSONParse = origJSONParse;

  function customJSONParse() {
    var r = origJSONParse.apply(this, arguments);
    if (r && r.streamingData && r.streamingData.adaptiveFormats) {
      handlePlayerResponseFor1x1(r);
    }
    return r;
  }
  window.JSON.parse = customJSONParse;

  function patchYttvJSON() {
    if (!window._yttv) return;
    for (var key in window._yttv) {
      if (window._yttv[key] && window._yttv[key].JSON && window._yttv[key].JSON.parse) {
        window._yttv[key].JSON.parse = customJSONParse;
      }
    }
  }

  function ensureOverlayElement() {
    var wrap = document.getElementById('tt-1x1-artwork-wrap');
    if (wrap) return wrap;

    wrap = document.createElement('div');
    wrap.id = 'tt-1x1-artwork-wrap';
    wrap.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;display:none;align-items:center;justify-content:center;pointer-events:none;z-index:1;background:transparent;';

    var img = document.createElement('img');
    img.id = 'tt-1x1-artwork-img';
    img.style.cssText =
      'height:72vh;width:auto;max-width:85vw;object-fit:contain;border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,0.9);background:#111;';
    img.onerror = function () {
      var info = getActive1x1Info();
      if (info && info.fallbackThumbUrl && img.src !== info.fallbackThumbUrl) {
        img.src = info.fallbackThumbUrl;
      }
    };

    wrap.appendChild(img);

    var playerHost =
      document.querySelector('.html5-video-player') ||
      document.querySelector('ytlr-player') ||
      document.body;
    var videoEl = playerHost.querySelector('video');
    if (videoEl && videoEl.parentNode) {
      videoEl.parentNode.insertBefore(wrap, videoEl.nextSibling);
    } else {
      playerHost.appendChild(wrap);
    }
    return wrap;
  }

  function update1x1Overlay() {
    try {
      var info = getActive1x1Info();
      var wrap = ensureOverlayElement();
      var img = document.getElementById('tt-1x1-artwork-img');
      var isFullscreenPlayer = isFullscreenPlayerActive();
      var isPip = !!window.isPipPlaying;

      if (!info || !info.is1x1 || (!isFullscreenPlayer && !isPip)) {
        wrap.style.display = 'none';
        return;
      }

      var videoEl = document.querySelector('video');
      if (videoEl && videoEl.parentNode && wrap.parentNode !== videoEl.parentNode) {
        videoEl.parentNode.insertBefore(wrap, videoEl.nextSibling);
      }

      if (img && info.thumbUrl && img.getAttribute('data-vid') !== info.videoId) {
        img.setAttribute('data-vid', info.videoId);
        img.src = info.thumbUrl;
      }

      if (isPip) {
        var pipWidth = window.innerWidth / 3.5;
        var pipHeight = window.innerHeight / 3.5;
        wrap.style.cssText =
          'position:fixed;top:68vh;left:68vw;width:' +
          pipWidth +
          'px;height:' +
          pipHeight +
          'px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:11;background:#080808;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,0.85);';
        if (img) {
          img.style.cssText =
            'height:' +
            pipHeight +
            'px;width:auto;max-width:' +
            pipWidth +
            'px;object-fit:contain;border-radius:6px;';
        }
      } else {
        wrap.style.cssText =
          'position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;background:#000;';
        if (img) {
          img.style.cssText =
            'height:72vh;width:auto;max-width:85vw;object-fit:contain;border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,0.9);';
        }
      }
    } catch (e) {}
  }

  // =========================================================================
  // 3. VIRTUAL VIDEO SOURCEBUFFER (BYPASSES TIZEN 3.0 HW VIDEO DECODER)
  // =========================================================================
  function patchVideoElementFor1x1(videoEl) {
    if (!videoEl) return;
    if (!videoEl.__ttTimeListenerAdded) {
      videoEl.__ttTimeListenerAdded = true;
      videoEl.addEventListener('timeupdate', updateSavedPlaybackProgress);
    }
    if (videoEl.__tt1x1Patched) return;
    videoEl.__tt1x1Patched = true;

    var origGetQuality = videoEl.getVideoPlaybackQuality;
    if (typeof origGetQuality === 'function') {
      videoEl.getVideoPlaybackQuality = function () {
        if (is1x1CurrentlyActive()) {
          var frames = Math.max(1, Math.floor((videoEl.currentTime || 0) * 25));
          return {
            creationTime: performance.now(),
            totalVideoFrames: frames,
            droppedVideoFrames: 0,
            corruptedVideoFrames: 0
          };
        }
        return origGetQuality.apply(this, arguments);
      };
    }

    try {
      var desc = Object.getOwnPropertyDescriptor(
        HTMLVideoElement.prototype,
        'webkitDecodedFrameCount'
      );
      if (desc && desc.get && !HTMLVideoElement.prototype.__ttWebkitFramesPatched) {
        HTMLVideoElement.prototype.__ttWebkitFramesPatched = true;
        Object.defineProperty(HTMLVideoElement.prototype, 'webkitDecodedFrameCount', {
          configurable: true,
          get: function () {
            if (is1x1CurrentlyActive()) {
              return Math.max(1, Math.floor((this.currentTime || 0) * 25));
            }
            return desc.get.call(this);
          }
        });
      }
    } catch (e) {}
  }

  function createVirtualSourceBuffer(mediaSource) {
    var listeners = {};
    var updating = false;
    var mode = 'segments';
    var timestampOffset = 0;
    var appendWindowStart = 0;
    var appendWindowEnd = Infinity;
    var timescale = 1000;
    var hasAppendedMedia = false;
    var virtualStart = Infinity;
    var virtualEnd = 0;
    var timerId = null;

    var sb = {
      __isVirtualVideoBuffer: true,
      onupdatestart: null,
      onupdate: null,
      onupdateend: null,
      onerror: null,
      onabort: null,

      addEventListener: function (type, cb) {
        if (!cb) return;
        if (!listeners[type]) listeners[type] = [];
        if (listeners[type].indexOf(cb) === -1) {
          listeners[type].push(cb);
        }
      },

      removeEventListener: function (type, cb) {
        if (!listeners[type]) return;
        var idx = listeners[type].indexOf(cb);
        if (idx !== -1) listeners[type].splice(idx, 1);
      },

      dispatchEvent: function (evt) {
        var type = evt.type;
        var propHandler = sb['on' + type];
        if (typeof propHandler === 'function') {
          try {
            propHandler.call(sb, evt);
          } catch (e) {}
        }
        var list = listeners[type] ? listeners[type].slice() : [];
        for (var i = 0; i < list.length; i++) {
          try {
            list[i].call(sb, evt);
          } catch (e) {}
        }
        return true;
      },

      appendBuffer: function (data) {
        if (updating) {
          throw new Error('InvalidStateError: SourceBuffer is still updating');
        }
        updating = true;

        try {
          var u8 = null;
          if (data instanceof Uint8Array) {
            u8 = data;
          } else if (data instanceof ArrayBuffer) {
            u8 = new Uint8Array(data);
          } else if (data && data.buffer instanceof ArrayBuffer) {
            u8 = new Uint8Array(
              data.buffer,
              data.byteOffset || 0,
              data.byteLength || data.buffer.byteLength
            );
          }
          if (u8 && u8.length > 0) {
            parseSegmentTimestamps(u8);
          }
        } catch (e) {}

        sb.dispatchEvent(new Event('updatestart'));
        timerId = setTimeout(function () {
          timerId = null;
          updating = false;
          sb.dispatchEvent(new Event('update'));
          sb.dispatchEvent(new Event('updateend'));
        }, 1);
      },

      remove: function (start, end) {
        if (updating) {
          throw new Error('InvalidStateError: SourceBuffer is still updating');
        }
        updating = true;
        if (start <= virtualStart && end >= virtualEnd) {
          hasAppendedMedia = false;
          virtualStart = Infinity;
          virtualEnd = 0;
        } else if (end >= virtualEnd && start > virtualStart) {
          virtualEnd = start;
        }

        sb.dispatchEvent(new Event('updatestart'));
        timerId = setTimeout(function () {
          timerId = null;
          updating = false;
          sb.dispatchEvent(new Event('update'));
          sb.dispatchEvent(new Event('updateend'));
        }, 1);
      },

      abort: function () {
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        if (updating) {
          updating = false;
          sb.dispatchEvent(new Event('abort'));
          sb.dispatchEvent(new Event('updateend'));
        }
      },

      changeType: function () {}
    };

    function parseSegmentTimestamps(u8) {
      var len = u8.length;
      var foundMedia = false;
      var segDtsSec = -1;

      for (var i = 0; i + 8 <= len; i++) {
        if (u8[i] === 0x6d && u8[i + 1] === 0x64 && u8[i + 2] === 0x68 && u8[i + 3] === 0x64) {
          var ver = u8[i + 4];
          var tsOff = ver === 1 ? i + 24 : i + 16;
          if (tsOff + 4 <= len) {
            var ts =
              ((u8[tsOff] << 24) |
                (u8[tsOff + 1] << 16) |
                (u8[tsOff + 2] << 8) |
                u8[tsOff + 3]) >>>
              0;
            if (ts > 0) timescale = ts;
          }
        }
        if (u8[i] === 0x6d && u8[i + 1] === 0x6f && u8[i + 2] === 0x6f && u8[i + 3] === 0x66) {
          foundMedia = true;
        }
        if (u8[i] === 0x74 && u8[i + 1] === 0x66 && u8[i + 2] === 0x64 && u8[i + 3] === 0x74) {
          foundMedia = true;
          var tfVer = u8[i + 4];
          if (tfVer === 1 && i + 16 <= len) {
            var high =
              ((u8[i + 8] << 24) | (u8[i + 9] << 16) | (u8[i + 10] << 8) | u8[i + 11]) >>> 0;
            var low =
              ((u8[i + 12] << 24) | (u8[i + 13] << 16) | (u8[i + 14] << 8) | u8[i + 15]) >>> 0;
            segDtsSec = (high * 4294967296 + low) / (timescale || 1000);
          } else if (tfVer === 0 && i + 12 <= len) {
            var dts0 =
              ((u8[i + 8] << 24) | (u8[i + 9] << 16) | (u8[i + 10] << 8) | u8[i + 11]) >>> 0;
            segDtsSec = dts0 / (timescale || 1000);
          }
        }
        if (u8[i] === 0x1f && u8[i + 1] === 0x43 && u8[i + 2] === 0xb6 && u8[i + 3] === 0x75) {
          foundMedia = true;
        }
      }

      if (foundMedia) {
        hasAppendedMedia = true;
        if (segDtsSec >= 0) {
          var adjSec = segDtsSec + timestampOffset;
          if (adjSec < virtualStart) virtualStart = adjSec;
          if (adjSec + 5.5 > virtualEnd) virtualEnd = adjSec + 5.5;
        } else {
          if (virtualStart === Infinity) virtualStart = 0;
          virtualEnd += 5.5;
        }
      }
    }

    Object.defineProperties(sb, {
      mode: {
        get: function () {
          return mode;
        },
        set: function (v) {
          mode = v;
        }
      },
      updating: {
        get: function () {
          return updating;
        }
      },
      timestampOffset: {
        get: function () {
          return timestampOffset;
        },
        set: function (v) {
          timestampOffset = Number(v) || 0;
        }
      },
      appendWindowStart: {
        get: function () {
          return appendWindowStart;
        },
        set: function (v) {
          appendWindowStart = Number(v) || 0;
        }
      },
      appendWindowEnd: {
        get: function () {
          return appendWindowEnd;
        },
        set: function (v) {
          appendWindowEnd = Number(v);
        }
      },
      buffered: {
        get: function () {
          var audioSb = mediaSource.__ttAudioSb;
          var hasAudioRange = false;
          var audioStart = 0;
          var audioEnd = 0;
          if (audioSb && audioSb.buffered && audioSb.buffered.length > 0) {
            try {
              hasAudioRange = true;
              audioStart = audioSb.buffered.start(0);
              audioEnd = audioSb.buffered.end(audioSb.buffered.length - 1);
            } catch (e) {}
          }

          if (!hasAppendedMedia && !hasAudioRange) {
            return {
              length: 0,
              start: function () {
                throw new RangeError('IndexSizeError');
              },
              end: function () {
                throw new RangeError('IndexSizeError');
              }
            };
          }

          var s = virtualStart !== Infinity ? virtualStart : hasAudioRange ? audioStart : 0;
          if (hasAudioRange && audioStart < s) s = audioStart;

          var e = Math.max(virtualEnd, hasAudioRange ? audioEnd : 0);
          if (e <= s) e = s + 5.5;

          var info = getActive1x1Info();
          if (info && info.lengthSeconds > 0 && e > info.lengthSeconds) {
            e = info.lengthSeconds;
          }

          return {
            length: 1,
            start: function (idx) {
              if (idx !== 0) throw new RangeError('IndexSizeError');
              return s;
            },
            end: function (idx) {
              if (idx !== 0) throw new RangeError('IndexSizeError');
              return e;
            }
          };
        }
      }
    });

    return sb;
  }

  function installMediaSourceHook() {
    if (typeof window.MediaSource === 'undefined') return;

    var origAddSourceBuffer =
      window.MediaSource.__ttOrigAddSb || window.MediaSource.prototype.addSourceBuffer;
    var origRemoveSourceBuffer =
      window.MediaSource.__ttOrigRemoveSb || window.MediaSource.prototype.removeSourceBuffer;
    window.MediaSource.__ttOrigAddSb = origAddSourceBuffer;
    window.MediaSource.__ttOrigRemoveSb = origRemoveSourceBuffer;
    window.MediaSource.__tt1x1Hooked = true;

    window.MediaSource.prototype.addSourceBuffer = function (mimeType) {
      var mime = String(mimeType || '');
      var active1x1 = is1x1CurrentlyActive();

      if (mime.indexOf('audio/') === 0) {
        var audioSb = origAddSourceBuffer.call(this, mimeType);
        this.__ttAudioSb = audioSb;
        var videoEl = document.querySelector('video');
        if (videoEl) patchVideoElementFor1x1(videoEl);
        setTimeout(update1x1Overlay, 50);
        return audioSb;
      }

      if (mime.indexOf('video/') === 0 && active1x1) {
        console.info('[TT-1x1] Bypassing Tizen 3.0 hardware video decoder for:', mime);
        var videoEl2 = document.querySelector('video');
        if (videoEl2) patchVideoElementFor1x1(videoEl2);
        setTimeout(update1x1Overlay, 50);
        return createVirtualSourceBuffer(this);
      }

      setTimeout(update1x1Overlay, 50);
      return origAddSourceBuffer.call(this, mimeType);
    };

    window.MediaSource.prototype.removeSourceBuffer = function (sb) {
      if (sb && sb.__isVirtualVideoBuffer) {
        try {
          sb.abort();
        } catch (e) {}
        return;
      }
      return origRemoveSourceBuffer.call(this, sb);
    };
  }

  installMediaSourceHook();

  // =========================================================================
  // 4. MINI-PLAYER (PICTURE-IN-PICTURE) ON BACK BUTTON (ZPĚT) WITH RESUME
  // =========================================================================
  function ensureWatchOverlayFixStyle() {
    if (!document.head) return;
    var st = document.getElementById('tt-watch-overlay-fix');
    if (!st) {
      st = document.createElement('style');
      st.id = 'tt-watch-overlay-fix';
      st.textContent =
        'ytlr-watch-default .XT6t8b, .XT6t8b { background-color: transparent !important; }';
      document.head.appendChild(st);
    }
  }

  function resetVideoFullscreenStyles() {
    var videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.style.width = '100vw';
      videoElement.style.height = '100vh';
      videoElement.style.top = '0px';
      videoElement.style.left = '0px';
    }
    var ytlrPlayer = document.querySelector('ytlr-player');
    if (ytlrPlayer) {
      ytlrPlayer.style.removeProperty('background-color');
    }
    setTimeout(update1x1Overlay, 50);
  }

  function enforceSeekToTimestamp(targetSec) {
    if (!targetSec || targetSec <= 2) return;
    var attempts = 0;
    var seekTimer = setInterval(function () {
      attempts++;
      var videoEl = document.querySelector('video');
      var ps = getPlayerService();
      var cur = (videoEl && videoEl.currentTime) || 0;
      if (cur >= targetSec - 2) {
        clearInterval(seekTimer);
        return;
      }
      if (videoEl && videoEl.readyState >= 1) {
        try {
          if (ps && typeof ps.seekTo === 'function') {
            ps.seekTo(targetSec);
          }
        } catch (e1) {}
        try {
          videoEl.currentTime = targetSec;
        } catch (e2) {}
      }
      if (attempts >= 12) {
        clearInterval(seekTimer);
      }
    }, 350);
  }

  function enablePip() {
    var ps = getPlayerService();
    if (!ps || pipTransitionInProgress) return;

    var videoElement = document.querySelector('video');
    var ytlrPlayer = document.querySelector('ytlr-player');
    var ytlrPlayerContainer = document.querySelector('ytlr-player-container');
    if (!videoElement || !ytlrPlayer || !ytlrPlayerContainer) return;

    var nowVideoTime = Math.floor(videoElement.currentTime || 0);
    var nowPsTime = 0;
    try {
      if (typeof ps.getCurrentTime === 'function') {
        nowPsTime = Math.floor(ps.getCurrentTime() || 0);
      }
    } catch (e) {}
    var cachedTime = Math.floor(window.__ttLastPlaybackTime || 0);
    var timestamp = Math.max(nowVideoTime, nowPsTime, cachedTime, 0);

    var rawConfig = ps.loadedPlaybackConfig || window.__ttLastPlaybackConfig;
    var savedConfig = null;
    try {
      if (rawConfig) {
        savedConfig = origJSONParse(JSON.stringify(rawConfig));
      }
    } catch (e) {
      savedConfig = rawConfig;
    }

    // Suppress PlayerService.stop() during route exit so <video> and MediaSource
    // keep playing with 0.00s interruption!
    pipTransitionInProgress = true;
    window.__ttSuppressStop = true;
    window.isPipPlaying = true;

    function applySeamlessPipStyles() {
      if (!window.isPipPlaying) return;
      ytlrPlayerContainer.style.zIndex = '10';
      ytlrPlayer.style.display = 'block';
      ytlrPlayer.style.backgroundColor = 'rgba(0,0,0,0)';

      videoElement.style.removeProperty('inset');
      var pipWidth = window.innerWidth / 3.5;
      var pipHeight = window.innerHeight / 3.5;
      videoElement.style.width = pipWidth + 'px';
      videoElement.style.height = pipHeight + 'px';
      videoElement.style.top = '68vh';
      videoElement.style.left = '68vw';
      update1x1Overlay();
    }

    applySeamlessPipStyles();
    setTimeout(applySeamlessPipStyles, 50);
    setTimeout(applySeamlessPipStyles, 150);
    setTimeout(applySeamlessPipStyles, 350);
    setTimeout(applySeamlessPipStyles, 600);

    resolveCommand({
      signalAction: {
        signal: 'HISTORY_BACK'
      }
    });

    setTimeout(function () {
      if ((window.location && window.location.hash || '').indexOf('#/watch') === 0) {
        resolveCommand({
          signalAction: {
            signal: 'HISTORY_BACK'
          }
        });
      }
    }, 120);

    // Fallback: only reload video if playback was unexpectedly stopped/uninitiated
    setTimeout(function () {
      pipTransitionInProgress = false;
      if (window.isPipPlaying && (!ps.isPlaybackInitiated || ps.state <= 0)) {
        var targetConfig = savedConfig || ps.loadedPlaybackConfig || window.__ttLastPlaybackConfig;
        if (targetConfig) {
          targetConfig.startTime = timestamp;
          if (targetConfig.watchEndpoint) {
            targetConfig.watchEndpoint.startTimeSeconds = timestamp;
            try {
              delete targetConfig.watchEndpoint.watchEndpointSupportedOnesieConfig;
            } catch (e) {}
          }
          ps.loadVideo(targetConfig);
          enforceSeekToTimestamp(timestamp);
        }
      }
      applySeamlessPipStyles();
    }, 450);

    setTimeout(function () {
      window.__ttSuppressStop = false;
    }, 1000);
  }

  function pipToFullscreen() {
    if (window.__ttPipPauseDelayTimer) {
      clearTimeout(window.__ttPipPauseDelayTimer);
      window.__ttPipPauseDelayTimer = null;
    }
    var ps = getPlayerService();
    var cfg = (ps && ps.loadedPlaybackConfig) || window.__ttLastPlaybackConfig;
    if (!ps || !cfg) return;
    var videoEl = document.querySelector('video');
    var ytlrPlayer = document.querySelector('ytlr-player');
    var ytlrPlayerContainer = document.querySelector('ytlr-player-container');

    // 1. INSTANT (0ms) visual maximize & resume on top of current screen
    window.__ttReturningFromPip = true;
    window.__ttSuppressStop = true;
    window.isPipPlaying = false;

    if (ytlrPlayerContainer) {
      ytlrPlayerContainer.style.zIndex = '10';
    }
    if (ytlrPlayer) {
      ytlrPlayer.style.display = 'block';
      ytlrPlayer.style.backgroundColor = '#000';
    }
    resetVideoFullscreenStyles();
    update1x1Overlay();
    resumePlaybackReliably(ps, videoEl);

    // 2. Navigate YouTube TV UI back to #/watch in the background without stopping playback
    var resumeSec = Math.max(
      Math.floor((videoEl && videoEl.currentTime) || 0),
      Math.floor(window.__ttLastPlaybackTime || 0)
    );
    cfg.startTime = resumeSec;
    if (cfg.watchEndpoint) {
      cfg.watchEndpoint.startTimeSeconds = resumeSec;
    }
    var command = {
      clickTrackingParams: cfg.clickTrackingParams,
      commandMetadata: cfg.commandMetadata,
      watchEndpoint: cfg.watchEndpoint
    };
    resolveCommand(command);

    // Release temporary z-index only AFTER #/watch route is active so player UI overlays work
    var checkAttempts = 0;
    var zIndexTimer = setInterval(function () {
      checkAttempts++;
      var onWatch = ((window.location && window.location.hash) || '').indexOf('#/watch') === 0;
      if (onWatch || checkAttempts >= 25) {
        clearInterval(zIndexTimer);
        if (!window.isPipPlaying) {
          if (ytlrPlayerContainer) ytlrPlayerContainer.style.removeProperty('z-index');
          if (ytlrPlayer) ytlrPlayer.style.removeProperty('background-color');
          resetVideoFullscreenStyles();
        }
      }
    }, 120);

    setTimeout(function () {
      resumePlaybackReliably(ps, videoEl);
    }, 120);
    setTimeout(function () {
      window.__ttSuppressStop = false;
      window.__ttReturningFromPip = false;
    }, 3500);
  }

  function patchResolveCommandForPip() {
    if (!window._yttv) return false;
    for (var key in window._yttv) {
      if (
        window._yttv[key] &&
        window._yttv[key].instance &&
        typeof window._yttv[key].instance.resolveCommand === 'function'
      ) {
        if (window._yttv[key].instance.__ttResolvePatchedV3) return true;
        window._yttv[key].instance.__ttResolvePatchedV3 = true;
        var ogResolve =
          window._yttv[key].instance.__ttOrigResolve || window._yttv[key].instance.resolveCommand;
        window._yttv[key].instance.__ttOrigResolve = ogResolve;
        window._yttv[key].instance.resolveCommand = function (cmd, extra) {
          if (
            cmd &&
            cmd.customAction &&
            (cmd.customAction.action === 'ENTER_PIP' || cmd.customAction.action === 'ENTER_MP')
          ) {
            enablePip();
            return true;
          }
          if (
            cmd &&
            cmd.commandExecutorCommand &&
            Array.isArray(cmd.commandExecutorCommand.commands)
          ) {
            for (var ci = 0; ci < cmd.commandExecutorCommand.commands.length; ci++) {
              var subCmd = cmd.commandExecutorCommand.commands[ci];
              if (
                subCmd &&
                subCmd.customAction &&
                (subCmd.customAction.action === 'ENTER_PIP' ||
                  subCmd.customAction.action === 'ENTER_MP')
              ) {
                enablePip();
                return true;
              }
            }
          }
          try {
            if (cmd && cmd.openPopupAction && cmd.openPopupAction.uniqueId === 'playback-settings') {
              var items =
                cmd.openPopupAction.popup &&
                cmd.openPopupAction.popup.overlaySectionRenderer &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer
                  .actionPanel &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer
                  .actionPanel.overlayPanelRenderer &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer
                  .actionPanel.overlayPanelRenderer.content &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer
                  .actionPanel.overlayPanelRenderer.content.overlayPanelItemListRenderer &&
                cmd.openPopupAction.popup.overlaySectionRenderer.overlay.overlayTwoPanelRenderer
                  .actionPanel.overlayPanelRenderer.content.overlayPanelItemListRenderer.items;
              if (Array.isArray(items)) {
                items.splice(2, 0, {
                  compactLinkRenderer: {
                    title: { simpleText: 'Mini přehrávač (Zpět)' },
                    icon: { iconType: 'CLEAR_COOKIES' },
                    serviceEndpoint: {
                      commandExecutorCommand: {
                        commands: [{ customAction: { action: 'ENTER_PIP' } }]
                      }
                    }
                  }
                });
              }
            }
          } catch (eMenu) {}
          if (cmd && cmd.watchEndpoint && cmd.watchEndpoint.videoId) {
            var ytlrPlayerContainer = document.querySelector('ytlr-player-container');
            var ytlrPlayer = document.querySelector('ytlr-player');
            if (window.isPipPlaying && cmd.watchEndpoint.videoId === getActiveVideoIdFromPlayer()) {
              window.__ttReturningFromPip = true;
              window.__ttSuppressStop = true;
              window.isPipPlaying = false;
              if (ytlrPlayerContainer) ytlrPlayerContainer.style.zIndex = '10';
              if (ytlrPlayer) {
                ytlrPlayer.style.display = 'block';
                ytlrPlayer.style.backgroundColor = '#000';
              }
              resetVideoFullscreenStyles();
              update1x1Overlay();
              var watchPoll = 0;
              var watchTimer = setInterval(function () {
                watchPoll++;
                var onWatch = ((window.location && window.location.hash) || '').indexOf('#/watch') === 0;
                if (onWatch || watchPoll >= 25) {
                  clearInterval(watchTimer);
                  if (!window.isPipPlaying) {
                    if (ytlrPlayerContainer) ytlrPlayerContainer.style.removeProperty('z-index');
                    if (ytlrPlayer) ytlrPlayer.style.removeProperty('background-color');
                    resetVideoFullscreenStyles();
                  }
                }
              }, 120);
              setTimeout(function () {
                window.__ttSuppressStop = false;
                window.__ttReturningFromPip = false;
              }, 3500);
            } else {
              window.__ttReturningFromPip = false;
              window.__ttSuppressStop = false;
              window.isPipPlaying = false;
              if (ytlrPlayerContainer) ytlrPlayerContainer.style.removeProperty('z-index');
              resetVideoFullscreenStyles();
            }
          }
          return ogResolve.call(this, cmd, extra);
        };
        return true;
      }
    }
    return false;
  }

  // =========================================================================
  // 5. WINDOW CAPTURE KEYDOWN: ZPĚT -> MINI-PLAYER & SMART REMOTE PLAY/PAUSE
  // =========================================================================
  function resumePlaybackReliably(ps, videoEl) {
    try {
      if (ps && ps.zt && typeof ps.zt.set === 'function') {
        ps.zt.set(false);
      }
    } catch (e) {}
    try {
      if (ps && typeof ps.play === 'function') {
        ps.play(false, true);
      }
    } catch (e) {}
    try {
      if (window._yttv && window._yttv.un && typeof window._yttv.un.playVideo === 'function') {
        window._yttv.un.playVideo();
      }
    } catch (e) {}
    try {
      if (videoEl && videoEl.paused) {
        videoEl.play();
      }
    } catch (e) {}
  }

  function pausePlaybackReliably(ps, videoEl) {
    try {
      if (ps && typeof ps.pause === 'function') {
        ps.pause(true);
      }
    } catch (e) {}
    try {
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
    } catch (e) {}
  }

  function handleSmartRemotePlayPause(keyCode, evt) {
    var ps = getPlayerService();
    var videoEl = document.querySelector('video');
    if (!ps && !videoEl) return false;

    // 10252 = Samsung Smart Remote MediaPlayPause, 179 = Standard MediaPlayPause
    if (keyCode === 10252 || keyCode === 179) {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      if (evt.repeat) {
        return true;
      }
      var nowTs = Date.now();
      if (window.__ttLastPlayPauseTs && nowTs - window.__ttLastPlayPauseTs < 55) {
        return true;
      }
      window.__ttLastPlayPauseTs = nowTs;

      // Double-press Play/Pause while Mini-Player is playing (< 0.5s):
      // cancel the 0.5s delayed pause and immediately maximize to Fullscreen without ever pausing!
      if (window.isPipPlaying && window.__ttPipPauseDelayTimer) {
        clearTimeout(window.__ttPipPauseDelayTimer);
        window.__ttPipPauseDelayTimer = null;
        pipToFullscreen();
        return true;
      }

      var isPaused =
        (videoEl && videoEl.paused) || (ps && (!ps.isPlaying || ps.state === 2));
      if (isPaused) {
        resumePlaybackReliably(ps, videoEl);
        if (window.isPipPlaying) {
          pipToFullscreen();
        }
      } else {
        if (window.isPipPlaying) {
          // 0.5s delay before pausing in Mini-Player so a double-press maximizes seamlessly
          window.__ttPipPauseDelayTimer = setTimeout(function () {
            window.__ttPipPauseDelayTimer = null;
            if (window.isPipPlaying) {
              pausePlaybackReliably(getPlayerService(), document.querySelector('video'));
            }
          }, 500);
        } else {
          pausePlaybackReliably(ps, videoEl);
        }
      }
      return true;
    }
    // 415 = MediaPlay, 250 = Internal PLAY, 71 = Keyboard Play
    if (keyCode === 415 || keyCode === 250 || keyCode === 71) {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      var wasPausedInPip =
        window.isPipPlaying &&
        ((videoEl && videoEl.paused) || (ps && (!ps.isPlaying || ps.state === 2)));
      resumePlaybackReliably(ps, videoEl);
      if (wasPausedInPip) {
        pipToFullscreen();
      }
      return true;
    }
    // 19 = MediaPause, 74 = Keyboard Pause
    if (keyCode === 19 || keyCode === 74) {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      pausePlaybackReliably(ps, videoEl);
      return true;
    }
    // 417 = MediaFastForward (+10s), 412 = MediaRewind (-10s)
    if (keyCode === 417 && ps && typeof ps.seekRelative === 'function') {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      ps.seekRelative(10);
      return true;
    }
    if (keyCode === 412 && ps && typeof ps.seekRelative === 'function') {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      ps.seekRelative(-10);
      return true;
    }
    return false;
  }

  // Attach to window in capture phase so we intercept BEFORE YouTube TV's window listener
  window.__ttKeydownHandler = function (evt) {
    var code = evt.keyCode;

    if (
      code === 10252 ||
      code === 179 ||
      code === 415 ||
      code === 250 ||
      code === 71 ||
      code === 19 ||
      code === 74 ||
      code === 417 ||
      code === 412
    ) {
      if (handleSmartRemotePlayPause(code, evt)) {
        return false;
      }
    }

    var isBackKey = code === 27 || code === 10009 || code === 8;
    if (isBackKey && !window.isPipPlaying && !pipTransitionInProgress) {
      if (isFullscreenPlayerActive()) {
        var ytPopupOpen = !!document.querySelector(
          'ytlr-overlay-section, ytlr-multi-page-menu, ytlr-engagement-panel-section-list-renderer'
        );
        if (!ytPopupOpen) {
          evt.preventDefault();
          evt.stopPropagation();
          if (typeof evt.stopImmediatePropagation === 'function') {
            evt.stopImmediatePropagation();
          }
          enablePip();
          return false;
        }
      }
    } else if (code === 406 && window.isPipPlaying) {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      pipToFullscreen();
      return false;
    } else if (code === 39 && window.isPipPlaying) {
      if (document.querySelector('ytlr-search-text-box > .zylon-focus')) {
        pipToFullscreen();
      }
    }
  };
  window.addEventListener('keydown', window.__ttKeydownHandler, true);

  window.__ttKeyupHandler = function (evt) {
    var code = evt.keyCode;
    if (
      code === 10252 ||
      code === 179 ||
      code === 415 ||
      code === 250 ||
      code === 19 ||
      code === 417 ||
      code === 412
    ) {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof evt.stopImmediatePropagation === 'function') {
        evt.stopImmediatePropagation();
      }
      return false;
    }
  };
  window.addEventListener('keyup', window.__ttKeyupHandler, true);

  // Add top-bar button to return from PiP to Fullscreen
  window.__ttPipButtonObserver = new MutationObserver(function () {
    if (!window.isPipPlaying) return;
    var searchBar = document.querySelector('ytlr-search-bar');
    if (searchBar && !document.querySelector('#tt-pip-button')) {
      var pipButton = document.createElement('ytlr-search-voice');
      pipButton.style.left = '10.25em';
      pipButton.id = 'tt-pip-button';
      pipButton.setAttribute('idomkey', 'ytLrSearchBarSearchVoice');
      pipButton.setAttribute('tabindex', '0');
      pipButton.classList.add('ytLrSearchVoiceHost', 'ytLrSearchBarSearchVoice');
      var pipButtonMicButton = document.createElement('ytlr-search-voice-mic-button');
      pipButtonMicButton.setAttribute('hybridnavfocusable', 'true');
      pipButtonMicButton.setAttribute('tabindex', '-1');
      pipButtonMicButton.classList.add('ytLrSearchVoiceMicButtonHost', 'zylon-ve');
      var pipIcon = document.createElement('yt-icon');
      pipIcon.setAttribute('tabindex', '-1');
      pipIcon.classList.add(
        'ytContribIconTvArrowLeft',
        'ytContribIconHost',
        'ytLrSearchVoiceMicButtonIcon'
      );
      pipButtonMicButton.appendChild(pipIcon);
      pipButton.appendChild(pipButtonMicButton);
      pipButton.addEventListener('click', function () {
        if (window.isPipPlaying) pipToFullscreen();
      });
      pipButton.addEventListener('keydown', function (e) {
        if ((e.keyCode === 13 || e.keyCode === 32) && window.isPipPlaying) {
          e.preventDefault();
          e.stopPropagation();
          pipToFullscreen();
        }
      });
      searchBar.appendChild(pipButton);
    }
  });

  if (document.body) {
    window.__ttPipButtonObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      window.__ttPipButtonObserver.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Periodic maintenance for _yttv hooks, playback progress saving, and 1:1 overlay
  window.__ttPremiumModInterval = setInterval(function () {
    patchYttvJSON();
    getPlayerService();
    patchResolveCommandForPip();
    updateSavedPlaybackProgress();
    ensureWatchOverlayFixStyle();
    update1x1Overlay();
    var videoEl = document.querySelector('video');
    if (videoEl) patchVideoElementFor1x1(videoEl);
    try {
      if (document.body && !document.body.classList.contains('app-quality-root')) {
        document.body.classList.add('app-quality-root');
      }
      if (!window.isPipPlaying) {
        var ytlrPlayer = document.querySelector('ytlr-player');
        if (ytlrPlayer && ytlrPlayer.style.backgroundColor === 'rgb(0, 0, 0)') {
          ytlrPlayer.style.removeProperty('background-color');
        }
      }
    } catch (e) {}
  }, 400);
  ensureWatchOverlayFixStyle();
  updateSavedPlaybackProgress();
  update1x1Overlay();
})();
