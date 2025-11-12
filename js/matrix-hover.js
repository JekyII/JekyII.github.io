"use strict";

(function () {
  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const PROX_TARGETS = new WeakMap();
  const DEFAULT_PROXIMITY_RADIUS = 20; // pixels
  const HEADING_PROXIMITY_RADIUS = 40; // pixels
  const PROX_MUTATION_INTERVAL = 900; // milliseconds
  const RANDOM_CHAR_POOL = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).join('');

  class MatrixProximityEffect {
    constructor(element) {
      this.element = element;
      this.characters = [];
      this.pointer = null;
      this.frameRequested = false;
      this.metricsDirty = true;
      this.prefersReducedMotion = false;
      this.disabled = false;

      if (!element || element.dataset.matrixProximityInit === 'true') {
        this.disabled = true;
        return;
      }

      if (typeof window.matchMedia === 'function') {
        this.motionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
        this.prefersReducedMotion = this.motionMedia.matches;
        this.motionListener = event => this.handleMotionChange(event);
        if (typeof this.motionMedia.addEventListener === 'function') {
          this.motionMedia.addEventListener('change', this.motionListener);
        } else if (typeof this.motionMedia.addListener === 'function') {
          this.motionMedia.addListener(this.motionListener);
        }
      }

      if (this.prefersReducedMotion) {
        this.disabled = true;
        return;
      }

      if (!this.prepareCharacters()) {
        this.disabled = true;
        return;
      }

      const tagName = (element.tagName || '').toUpperCase();
      this.proximityRadius = tagName && /^H[1-6]$/.test(tagName)
        ? HEADING_PROXIMITY_RADIUS
        : DEFAULT_PROXIMITY_RADIUS;
      this.proximityRadiusSquared = this.proximityRadius * this.proximityRadius;

      this.element.dataset.matrixProximityInit = 'true';
      this.element.classList.add('matrix-proximity-target');

      this.bindEvents();
    }

    prepareCharacters() {
      if (typeof document.createTreeWalker !== 'function' || typeof NodeFilter === 'undefined') {
        return false;
      }
      const walker = document.createTreeWalker(this.element, NodeFilter.SHOW_TEXT, null);
      const replacements = [];
      let node = walker.nextNode();
      let previousWasWhitespace = true;
      let producedAny = false;

      while (node) {
        const value = node.textContent;
        if (value && value.length) {
          const fragment = document.createDocumentFragment();
          for (let i = 0; i < value.length; i += 1) {
            const sourceChar = value[i];
            const category = categorizeChar(sourceChar);
            let renderChar = sourceChar;

            if (category === 'whitespace') {
              if (!producedAny) {
                continue;
              }
              if (previousWasWhitespace) {
                continue;
              }
              renderChar = ' ';
              previousWasWhitespace = true;
            } else if (category === 'nbsp') {
              renderChar = '\u00A0';
              previousWasWhitespace = false;
            } else {
              previousWasWhitespace = false;
            }

            const span = document.createElement('span');
            span.className = 'matrix-proximity-char';
            span.style.whiteSpace = 'inherit';
            span.textContent = renderChar;

            fragment.appendChild(span);
            this.characters.push({
              span,
              original: renderChar,
              source: sourceChar,
              category,
              timer: null,
              isMutating: false,
              centerX: 0,
              centerY: 0
            });

            producedAny = true;
          }

          if (fragment.childNodes.length) {
            replacements.push({ node, fragment });
          }
        }
        node = walker.nextNode();
      }

      replacements.forEach(({ node: targetNode, fragment }) => {
        if (targetNode.parentNode) {
          targetNode.parentNode.replaceChild(fragment, targetNode);
        }
      });

      this.trimTrailingWhitespace();

      return this.characters.length > 0;
    }

    bindEvents() {
      this.onMouseMove = event => this.handleMouseMove(event);
      this.onMouseLeave = () => this.handleMouseLeave();
      this.onMouseEnter = () => {
        this.metricsDirty = true;
      };
      this.onTouchMove = event => this.handleTouchMove(event);
      this.onTouchEnd = () => this.handleMouseLeave();
      this.onResize = () => this.handleResize();

      this.element.addEventListener('mousemove', this.onMouseMove);
      this.element.addEventListener('mouseleave', this.onMouseLeave);
      this.element.addEventListener('mouseenter', this.onMouseEnter);
      this.element.addEventListener('touchmove', this.onTouchMove, { passive: true });
      this.element.addEventListener('touchend', this.onTouchEnd);
      this.element.addEventListener('touchcancel', this.onTouchEnd);
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.onResize);
      }
    }

    handleMotionChange(event) {
      this.prefersReducedMotion = event.matches;
      if (this.prefersReducedMotion) {
        this.stopAll();
      } else {
        this.metricsDirty = true;
      }
    }

    handleMouseMove(event) {
      if (this.prefersReducedMotion) {
        return;
      }
      this.setPointer(event.clientX, event.clientY);
    }

    handleTouchMove(event) {
      if (this.prefersReducedMotion || !event.touches || !event.touches.length) {
        return;
      }
      const touch = event.touches[0];
      this.setPointer(touch.clientX, touch.clientY);
    }

    handleMouseLeave() {
      this.pointer = null;
      this.stopAll();
    }

    handleResize() {
      this.metricsDirty = true;
      if (this.pointer && !this.frameRequested) {
        this.frameRequested = true;
        requestAnimationFrame(() => this.updateProximity());
      }
    }

    setPointer(x, y) {
      this.pointer = { x, y };
      this.metricsDirty = true;
      if (!this.frameRequested) {
        this.frameRequested = true;
        requestAnimationFrame(() => this.updateProximity());
      }
    }

    updateProximity() {
      this.frameRequested = false;
      if (!this.pointer) {
        return;
      }
      if (this.metricsDirty) {
        this.updateMetrics();
      }

      const { x, y } = this.pointer;
      this.characters.forEach(char => {
        if (!isMutableCategory(char.category)) {
          this.stopMutation(char);
          return;
        }
        const dx = char.centerX - x;
        const dy = char.centerY - y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared <= this.proximityRadiusSquared) {
          this.startMutation(char);
        } else {
          this.stopMutation(char);
        }
      });
    }

    updateMetrics() {
      this.metricsDirty = false;
      this.characters.forEach(char => {
        const rect = char.span.getBoundingClientRect();
        char.centerX = rect.left + rect.width / 2;
        char.centerY = rect.top + rect.height / 2;
      });
    }

    trimTrailingWhitespace() {
      while (this.characters.length && this.characters[this.characters.length - 1].category === 'whitespace') {
        const char = this.characters.pop();
        if (char && char.span && char.span.parentNode) {
          char.span.parentNode.removeChild(char.span);
        }
      }
    }

    startMutation(char) {
      if (char.isMutating) {
        return;
      }
      char.isMutating = true;
      char.span.classList.add('is-mutating');

      const mutate = () => {
        if (!char.isMutating) {
          return;
        }
        const nextChar = pickVariantForCategory(char.original, char.category);
        char.span.textContent = nextChar;
        char.timer = window.setTimeout(mutate, PROX_MUTATION_INTERVAL + Math.random() * 80);
      };

      mutate();
    }

    stopMutation(char) {
      if (!char.isMutating) {
        return;
      }
      char.isMutating = false;
      if (char.timer) {
        clearTimeout(char.timer);
        char.timer = null;
      }
      char.span.textContent = char.original;
      char.span.classList.remove('is-mutating');
    }

    stopAll() {
      this.characters.forEach(char => this.stopMutation(char));
    }
  }

  function categorizeChar(char) {
    if (char === '\u00A0') {
      return 'nbsp';
    }
    if (/\s/.test(char)) {
      return 'whitespace';
    }
    return 'char';
  }

  function isMutableCategory(category) {
    return category === 'char';
  }

  function pickVariantForCategory(original, category) {
    if (category !== 'char' || !RANDOM_CHAR_POOL.length) {
      return original;
    }

    let candidate = original;
    let guard = 0;
    const poolLength = RANDOM_CHAR_POOL.length;
    while (candidate === original && guard < 10) {
      candidate = RANDOM_CHAR_POOL[Math.floor(Math.random() * poolLength)];
      guard += 1;
    }
    return candidate;
  }

  function shouldSkip(element) {
    if (!element || !element.dataset) {
      return false;
    }
    return element.dataset.matrixHover === 'off' || element.dataset.matrixProximity === 'off';
  }

  function attach(element) {
    return attachProximity(element);
  }

  function attachProximity(element) {
    if (!element) {
      return null;
    }
    if (shouldSkip(element)) {
      return null;
    }
    if (PROX_TARGETS.has(element)) {
      return PROX_TARGETS.get(element);
    }
    const instance = new MatrixProximityEffect(element);
    if (instance.disabled) {
      return null;
    }
    PROX_TARGETS.set(element, instance);
    return instance;
  }

  function scan(root = document) {
    if (!root) {
      return;
    }
    const selector = [
      'h1:not([data-matrix-proximity="off"])',
      'h2:not([data-matrix-proximity="off"])',
      'h3:not([data-matrix-proximity="off"])',
      'h4:not([data-matrix-proximity="off"])',
      'h5:not([data-matrix-proximity="off"])',
      'h6:not([data-matrix-proximity="off"])',
      'p:not([data-matrix-proximity="off"])',
      'li:not([data-matrix-proximity="off"])',
      'ol:not([data-matrix-proximity="off"])',
      'ul:not([data-matrix-proximity="off"])',
      'blockquote:not([data-matrix-proximity="off"])',
      'figure:not([data-matrix-proximity="off"])',
      'header a:not([data-matrix-proximity="off"])',
      'footer a:not([data-matrix-proximity="off"])'
    ].join(', ');

    root.querySelectorAll(selector).forEach(el => {
      if (el.dataset && el.dataset.matrixHover === 'off') {
        return;
      }
      attachProximity(el);
    });
  }

  window.MatrixHover = {
    attach,
    attachProximity,
    scan
  };

  document.dispatchEvent(new CustomEvent('matrix-hover:ready'));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
  } else {
    scan();
  }
})();
