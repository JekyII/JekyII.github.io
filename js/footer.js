'use strict';

(function () {
  const scriptEl = document.currentScript;
  if (!scriptEl) {
    return;
  }

  const footerSrc = scriptEl.dataset.footerSrc || 'footer.html';
  const targetId = scriptEl.dataset.footerTarget || 'global-footer';
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

  function loadFooter() {
    const container = document.getElementById(targetId);
    if (!container) {
      console.warn('Footer container not found:', targetId);
      return;
    }

    fetch(footerSrc)
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(html => {
  container.innerHTML = html;
  applyNavigationMappings(container);
      })
      .catch(error => {
        console.error('Failed to load footer:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter, { once: true });
  } else {
    loadFooter();
  }
})();
