'use strict';

(function () {
  const scriptEl = document.currentScript;
  if (!scriptEl) {
    return;
  }

  const headerSrc = scriptEl.dataset.headerSrc || 'header.html';
  const targetId = scriptEl.dataset.headerTarget || 'global-header';
  const pathDepth = parseInt(scriptEl.dataset.pathDepth || '0', 10);
  const prefix = Number.isFinite(pathDepth) && pathDepth > 0 ? '../'.repeat(pathDepth) : '';
  const navConfig = {
    home: scriptEl.dataset.navHome || prefix + 'index.html',
    about: scriptEl.dataset.navAbout || prefix + 'index.html#about-me',
    projects: scriptEl.dataset.navProjects || prefix + 'projects.html',
    blog: scriptEl.dataset.navBlog || prefix + 'blog.html'
  };

  function applyNavigationMappings(container) {
    const navAnchors = container.querySelectorAll('[data-nav]');
    navAnchors.forEach(anchor => {
      const key = anchor.getAttribute('data-nav');
      const target = key ? navConfig[key] : null;
      if (target) {
        anchor.setAttribute('href', target);
      }
    });
  }

  function ensureMatrixHover(container) {
    const applyEffect = () => {
      if (window.MatrixHover && typeof window.MatrixHover.scan === 'function') {
        window.MatrixHover.scan(container);
      }
    };

    if (window.MatrixHover && typeof window.MatrixHover.scan === 'function') {
      applyEffect();
      return;
    }

    const existing = document.querySelector('script[data-matrix-hover-script]');
    if (existing) {
      existing.addEventListener('load', applyEffect, { once: true });
      return;
    }

    const script = document.createElement('script');
  script.src = prefix + 'js/matrix-hover.js';
  script.async = true;
    script.dataset.matrixHoverScript = 'true';
    script.addEventListener('load', applyEffect, { once: true });
    document.head.appendChild(script);
  }

  function initialiseGlobalHeader(container) {
    const header = container.querySelector('.site-header');
    if (!header) {
      return;
    }

    const hamburger = header.querySelector('.hamburger');
    const mobileMenu = header.querySelector('.mobile-menu');
    if (!hamburger || !mobileMenu) {
      return;
    }

    const navLinks = mobileMenu.querySelectorAll('.nav-link');
    const mq = window.matchMedia('(min-width: 769px)');

    const openMenu = () => {
      hamburger.classList.add('active');
      mobileMenu.classList.add('active');
      document.body.classList.add('mobile-menu-open');
    };

    const closeMenu = () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
    };

    hamburger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach(link => link.addEventListener('click', closeMenu));

    const handleBreakpointChange = event => {
      if (event.matches) {
        closeMenu();
      }
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleBreakpointChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handleBreakpointChange);
    }
  }

  function loadHeader() {
    const container = document.getElementById(targetId);
    if (!container) {
      console.warn('Header container not found:', targetId);
      return;
    }

    fetch(headerSrc)
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(html => {
  container.innerHTML = html;
  applyNavigationMappings(container);
        ensureMatrixHover(container);
  requestAnimationFrame(() => initialiseGlobalHeader(container));
      })
      .catch(error => {
        console.error('Failed to load header:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader, { once: true });
  } else {
    loadHeader();
  }
})();
