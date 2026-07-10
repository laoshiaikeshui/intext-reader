(function attachInteractionPolicy(root) {
  function shouldShowToastForAction(action) {
    return !["previous", "next", "hide"].includes(action);
  }

  function parseFiniteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function isPageScrollElement(element, documentLike = {}) {
    return Boolean(
      element &&
      (element === documentLike.body ||
        element === documentLike.documentElement ||
        element === documentLike.scrollingElement)
    );
  }

  function hasScrollPositionChanged(before, after, tolerance = 0.5) {
    const start = parseFiniteNumber(before, 0);
    const end = parseFiniteNumber(after, start);
    return Math.abs(end - start) > Math.max(0, parseFiniteNumber(tolerance, 0.5));
  }

  function shouldRestoreAfterScroll(values = {}) {
    return !Boolean(values.isVisible) || Boolean(values.attemptsExhausted);
  }

  function pickSignedDistance(options) {
    const {
      downNeeded,
      upNeeded,
      downTarget,
      upTarget,
      downRoom,
      upRoom
    } = options;
    const canScrollDown = downRoom > 0;
    const canScrollUp = upRoom > 0;
    const downFullyHides = downRoom >= downNeeded;
    const upFullyHides = upRoom >= upNeeded;

    if (downFullyHides && upFullyHides) {
      return downNeeded <= upNeeded ? Math.min(downTarget, downRoom) : -Math.min(upTarget, upRoom);
    }

    if (downFullyHides) {
      return Math.min(downTarget, downRoom);
    }

    if (upFullyHides) {
      return -Math.min(upTarget, upRoom);
    }

    if (canScrollDown || canScrollUp) {
      return downRoom >= upRoom ? downRoom : -upRoom;
    }

    return 0;
  }

  function calculateHideScrollDelta(values = {}) {
    const rect = values.rect || {};
    const viewportHeight = parseFiniteNumber(values.viewportHeight, 0);
    const scrollY = Math.max(0, parseFiniteNumber(values.scrollY, 0));
    const scrollHeight = Math.max(0, parseFiniteNumber(values.scrollHeight, 0));
    const margin = parseFiniteNumber(values.margin, 80);
    const overshoot = Math.max(0, parseFiniteNumber(values.overshoot, 220));
    if (viewportHeight <= 0 || scrollHeight <= viewportHeight) {
      return 0;
    }

    const top = parseFiniteNumber(rect.top, 0);
    const bottom = parseFiniteNumber(rect.bottom, top);
    const downNeeded = Math.max(1, Math.ceil(bottom + margin));
    const upNeeded = Math.max(1, Math.ceil(viewportHeight - top + margin));
    const downRoom = Math.max(0, Math.floor(scrollHeight - (scrollY + viewportHeight)));
    const upRoom = Math.max(0, Math.floor(scrollY));

    return pickSignedDistance({
      downNeeded,
      upNeeded,
      downTarget: downNeeded + overshoot,
      upTarget: upNeeded + overshoot,
      downRoom,
      upRoom
    });
  }


  function isRectVisibleInViewport(rect = {}, values = {}) {
    const width = parseFiniteNumber(values.width, 0);
    const height = parseFiniteNumber(values.height, 0);
    const margin = Math.max(0, parseFiniteNumber(values.margin, 24));
    if (width <= 0 || height <= 0) {
      return false;
    }

    const top = parseFiniteNumber(rect.top, 0);
    const bottom = parseFiniteNumber(rect.bottom, top);
    const left = parseFiniteNumber(rect.left, 0);
    const right = parseFiniteNumber(rect.right, left);
    return (
      bottom >= -margin &&
      top <= height + margin &&
      right >= -margin &&
      left <= width + margin
    );
  }
  function buildWheelScrollSteps(delta, values = {}) {
    const distance = Math.trunc(parseFiniteNumber(delta, 0));
    if (!distance) {
      return [];
    }

    const requestedStepCount = Math.max(1, Math.trunc(parseFiniteNumber(values.stepCount, 8)));
    const sign = distance > 0 ? 1 : -1;
    const absoluteDistance = Math.abs(distance);
    const stepCount = Math.min(requestedStepCount, absoluteDistance);
    const base = Math.floor(absoluteDistance / stepCount);
    let remainder = absoluteDistance % stepCount;

    return Array.from({ length: stepCount }, () => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      return sign * (base + extra);
    });
  }

  const api = {
    buildWheelScrollSteps,
    calculateHideScrollDelta,
    hasScrollPositionChanged,
    isPageScrollElement,
    isRectVisibleInViewport,
    shouldRestoreAfterScroll,
    shouldShowToastForAction
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderInteractionPolicy = api;
})(typeof globalThis !== "undefined" ? globalThis : window);


