(function attachIllustrationOverlay(root) {
  const EDGE_GAP = 8;
  const BUTTON_SIZE = 40;
  const MIN_VIEWER_WIDTH = 180;
  const MIN_VIEWER_HEIGHT = 140;

  function decodeImageBytes(base64) {
    if (typeof base64 !== "string" || !base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
      throw new Error("Invalid image payload");
    }

    let binary;
    try {
      binary = root.atob(base64);
    } catch (error) {
      throw new Error("Invalid image payload");
    }
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function formatIllustrationCount(count) {
    const value = Math.max(0, Number.parseInt(count, 10) || 0);
    return value > 99 ? "99+" : String(value);
  }

  function normalizeImageResponse(response) {
    if (!response?.ok || !/^image\/(jpeg|png|webp|gif)$/i.test(String(response.mediaType || ""))) {
      throw new Error("Image unavailable");
    }
    try {
      return {
        mediaType: response.mediaType,
        bytes: decodeImageBytes(response.base64)
      };
    } catch (error) {
      throw new Error("Image unavailable");
    }
  }

  function isDragGesture(start, end, threshold = 5) {
    return Math.hypot(Number(end.x) - Number(start.x), Number(end.y) - Number(start.y)) > threshold;
  }

  function isImageRequestCurrent(request, current) {
    return Boolean(current.visible) &&
      request.token === current.token &&
      request.bookId === current.bookId &&
      request.imageId === current.imageId;
  }

  function snapFloatingPosition(position, viewport, size = { width: BUTTON_SIZE, height: BUTTON_SIZE }) {
    const maxX = Math.max(0, viewport.width - size.width);
    const maxY = Math.max(0, viewport.height - size.height);
    const y = Math.min(maxY, Math.max(0, Number(position.y) || 0));
    const side = (Number(position.x) || 0) + size.width / 2 < viewport.width / 2 ? "left" : "right";
    return {
      side,
      x: side === "left" ? 0 : maxX,
      y,
      yRatio: maxY > 0 ? y / maxY : 0.5
    };
  }

  function clampViewerSize(size, viewport) {
    return {
      width: Math.round(Math.min(viewport.width * 0.9, Math.max(MIN_VIEWER_WIDTH, Number(size.width) || 320))),
      height: Math.round(Math.min(viewport.height * 0.9, Math.max(MIN_VIEWER_HEIGHT, Number(size.height) || 260)))
    };
  }

  function placeViewer(buttonRect, viewerSize, viewport) {
    const roomRight = viewport.width - buttonRect.right - EDGE_GAP;
    const roomLeft = buttonRect.left - EDGE_GAP;
    const side = roomRight >= viewerSize.width || roomRight >= roomLeft ? "right" : "left";
    const desiredLeft = side === "right"
      ? buttonRect.right + EDGE_GAP
      : buttonRect.left - EDGE_GAP - viewerSize.width;
    const desiredTop = buttonRect.top + (buttonRect.bottom - buttonRect.top - viewerSize.height) / 2;
    return {
      side,
      left: Math.round(Math.min(viewport.width - viewerSize.width - EDGE_GAP, Math.max(EDGE_GAP, desiredLeft))),
      top: Math.round(Math.min(viewport.height - viewerSize.height - EDGE_GAP, Math.max(EDGE_GAP, desiredTop)))
    };
  }

  function createIllustrationOverlay(options) {
    const document = options.document;
    const window = document.defaultView;
    const storage = options.storage;
    const runtime = options.runtime;
    const host = document.createElement("div");
    host.id = "intext-reader-illustrations";
    host.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:none;";
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        *{box-sizing:border-box}button{font:inherit}
        .bubble{position:absolute;display:grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid #aeb7bf;border-radius:50%;background:#fff;color:#27313a;box-shadow:0 3px 12px rgba(32,41,48,.24),inset 0 0 0 3px #f1f3f4;font:700 14px/1 system-ui;letter-spacing:0;text-align:center;cursor:grab;pointer-events:auto;touch-action:none;transition:background-color .15s,border-color .15s,box-shadow .15s,color .15s}
        .bubble:hover{border-color:#7f8b94;background:#f8f9fa;box-shadow:0 4px 14px rgba(32,41,48,.3),inset 0 0 0 3px #eceff1}.bubble:focus-visible{outline:2px solid #1a73e8;outline-offset:2px}.bubble:active{cursor:grabbing}.bubble[aria-disabled="false"]{border-color:#54626c;background:#35434d;color:#fff;box-shadow:0 3px 12px rgba(32,41,48,.3),inset 0 0 0 3px rgba(255,255,255,.14)}
        .viewer{position:absolute;width:320px;height:260px;min-width:180px;min-height:140px;max-width:90vw;max-height:90vh;padding:8px;border:1px solid rgba(0,0,0,.25);border-radius:6px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.28);pointer-events:auto;resize:both;overflow:hidden;display:none;color:#202124;font:12px/1.4 system-ui}
        .toolbar{height:28px;display:flex;align-items:center;justify-content:space-between;gap:8px}.controls{display:flex;align-items:center;gap:4px}
        .tool{width:26px;height:26px;padding:0;border:0;border-radius:4px;background:transparent;color:#202124;font-size:20px;line-height:26px;cursor:pointer}.tool:hover{background:#eef1f4}.tool:disabled{opacity:.35;cursor:default}
        .stage{height:calc(100% - 52px);min-width:0;min-height:0;display:grid;place-items:center;background:#f3f5f7;overflow:hidden}.stage img{grid-area:1/1;display:none;width:100%;height:100%;min-width:0;min-height:0;object-fit:contain;object-position:center}.stage-message{grid-area:1/1;padding:16px;color:#5f6368;text-align:center}
        .caption{height:24px;margin:0;padding-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#5f6368}
      </style>
      <button class="bubble" type="button" title="EPUB illustrations">0</button>
      <section class="viewer" aria-label="EPUB illustration viewer">
        <div class="toolbar"><span class="counter"></span><div class="controls"><button class="tool previous" type="button" title="Previous">‹</button><button class="tool next" type="button" title="Next">›</button><button class="tool close" type="button" title="Close">×</button></div></div>
        <div class="stage"><img alt=""><span class="stage-message"></span></div><p class="caption"></p>
      </section>`;
    const bubble = shadow.querySelector(".bubble");
    const viewer = shadow.querySelector(".viewer");
    const image = shadow.querySelector(".stage img");
    const stageMessage = shadow.querySelector(".stage-message");
    const counter = shadow.querySelector(".counter");
    const caption = shadow.querySelector(".caption");
    const previous = shadow.querySelector(".previous");
    const next = shadow.querySelector(".next");
    const close = shadow.querySelector(".close");
    document.documentElement.appendChild(host);

    let visible = false;
    let images = [];
    let bookId = "";
    let activeIndex = 0;
    let imageRequestToken = 0;
    let objectUrl = "";
    let storedPosition = { side: "right", yRatio: 0.5 };
    let viewerSize = { width: 320, height: 260 };
    let dragStart = null;
    let dragOrigin = null;

    function viewport() {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    function overlayText(key, fallback) {
      return typeof options.translate === "function" ? options.translate(key) : fallback;
    }

    function setStageState(state) {
      image.style.display = state === "ready" ? "block" : "none";
      stageMessage.style.display = state === "ready" ? "none" : "block";
      stageMessage.textContent = state === "loading"
        ? overlayText("illustrationLoading", "Loading illustration…")
        : state === "error"
          ? overlayText("illustrationLoadFailed", "Unable to load illustration")
          : "";
    }

    function applyBubblePosition() {
      const maxY = Math.max(0, window.innerHeight - BUTTON_SIZE);
      bubble.style.left = storedPosition.side === "left" ? "0px" : `${Math.max(0, window.innerWidth - BUTTON_SIZE)}px`;
      bubble.style.top = `${Math.round(Math.min(1, Math.max(0, storedPosition.yRatio)) * maxY)}px`;
    }

    function revokeObjectUrl() {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
      }
      image.removeAttribute("src");
      image.style.display = "none";
    }

    function closeViewer() {
      imageRequestToken += 1;
      viewer.style.display = "none";
      revokeObjectUrl();
    }

    function positionViewer() {
      const size = clampViewerSize(viewerSize, viewport());
      viewer.style.width = `${size.width}px`;
      viewer.style.height = `${size.height}px`;
      const placement = placeViewer(bubble.getBoundingClientRect(), size, viewport());
      viewer.style.left = `${placement.left}px`;
      viewer.style.top = `${placement.top}px`;
    }

    async function showImage(index) {
      if (!images[index] || !bookId) return;
      activeIndex = index;
      const request = {
        token: ++imageRequestToken,
        bookId,
        imageId: images[index].id
      };
      const currentRequestState = () => ({
        token: imageRequestToken,
        bookId,
        imageId: images[activeIndex]?.id,
        visible: viewer.style.display !== "none"
      });
      revokeObjectUrl();
      positionViewer();
      viewer.style.display = "block";
      counter.textContent = `${index + 1} / ${images.length}`;
      previous.disabled = index <= 0;
      next.disabled = index >= images.length - 1;
      caption.textContent = images[index].caption || images[index].alt || "";
      setStageState("loading");
      let response;
      try {
        response = await runtime.sendMessage({
          type: "intext-reader-image",
          action: "image-get",
          bookId: request.bookId,
          imageId: request.imageId
        });
      } catch (error) {
        if (isImageRequestCurrent(request, currentRequestState())) setStageState("error");
        return;
      }
      if (!isImageRequestCurrent(request, currentRequestState())) return;
      let normalized;
      try {
        normalized = normalizeImageResponse(response);
      } catch (error) {
        setStageState("error");
        return;
      }
      objectUrl = URL.createObjectURL(new Blob([normalized.bytes], { type: normalized.mediaType }));
      image.src = objectUrl;
      image.alt = images[index].alt || images[index].caption || "";
    }

    function updateRange(nextImages, nextBookId) {
      const nextKey = (nextImages || []).map((item) => item.id).join("|");
      const currentKey = images.map((item) => item.id).join("|");
      if (nextKey !== currentKey || nextBookId !== bookId) closeViewer();
      images = Array.isArray(nextImages) ? nextImages : [];
      bookId = String(nextBookId || "");
      bubble.textContent = formatIllustrationCount(images.length);
      bubble.setAttribute("aria-disabled", String(images.length === 0));
    }

    function setVisible(enabled) {
      visible = Boolean(enabled);
      host.style.display = visible ? "block" : "none";
      if (!visible) closeViewer();
      if (visible) applyBubblePosition();
    }

    bubble.addEventListener("pointerdown", (event) => {
      dragStart = { x: event.clientX, y: event.clientY };
      dragOrigin = { x: bubble.offsetLeft, y: bubble.offsetTop };
      bubble.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    bubble.addEventListener("pointermove", (event) => {
      if (!dragStart || !dragOrigin) return;
      const x = dragOrigin.x + event.clientX - dragStart.x;
      const y = dragOrigin.y + event.clientY - dragStart.y;
      bubble.style.left = `${Math.min(window.innerWidth - BUTTON_SIZE, Math.max(0, x))}px`;
      bubble.style.top = `${Math.min(window.innerHeight - BUTTON_SIZE, Math.max(0, y))}px`;
      if (viewer.style.display !== "none") positionViewer();
    });
    bubble.addEventListener("pointerup", (event) => {
      if (!dragStart) return;
      const dragged = isDragGesture(dragStart, { x: event.clientX, y: event.clientY });
      const snapped = snapFloatingPosition(
        { x: bubble.offsetLeft, y: bubble.offsetTop }, viewport(), { width: BUTTON_SIZE, height: BUTTON_SIZE }
      );
      storedPosition = { side: snapped.side, yRatio: snapped.yRatio };
      applyBubblePosition();
      storage.set({ epubIllustrationPosition: storedPosition });
      dragStart = null;
      dragOrigin = null;
      if (!dragged && images.length) showImage(activeIndex < images.length ? activeIndex : 0);
    });
    previous.addEventListener("click", () => showImage(Math.max(0, activeIndex - 1)));
    next.addEventListener("click", () => showImage(Math.min(images.length - 1, activeIndex + 1)));
    close.addEventListener("click", closeViewer);
    image.addEventListener("load", () => {
      if (viewer.style.display !== "none" && image.getAttribute("src")) setStageState("ready");
    });
    image.addEventListener("error", () => {
      if (viewer.style.display !== "none") setStageState("error");
    });
    viewer.addEventListener("pointerup", () => {
      viewerSize = clampViewerSize({ width: viewer.offsetWidth, height: viewer.offsetHeight }, viewport());
      storage.set({ epubIllustrationViewerSize: viewerSize });
      positionViewer();
    });
    window.addEventListener("resize", () => {
      applyBubblePosition();
      if (viewer.style.display !== "none") positionViewer();
    });

    storage.get({
      epubIllustrationPosition: storedPosition,
      epubIllustrationViewerSize: viewerSize
    }).then((values) => {
      storedPosition = values.epubIllustrationPosition || storedPosition;
      viewerSize = clampViewerSize(values.epubIllustrationViewerSize || viewerSize, viewport());
      if (visible) applyBubblePosition();
    });

    return {
      closeViewer,
      destroy() {
        closeViewer();
        host.remove();
      },
      setVisible,
      updateRange
    };
  }

  const api = {
    clampViewerSize,
    createIllustrationOverlay,
    decodeImageBytes,
    formatIllustrationCount,
    isImageRequestCurrent,
    isDragGesture,
    normalizeImageResponse,
    placeViewer,
    snapFloatingPosition
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderIllustrationOverlay = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
