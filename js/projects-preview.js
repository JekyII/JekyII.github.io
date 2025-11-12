'use strict';

(function () {
  const TARGET_SELECTOR = '[data-projects-target]';

  function whenMatrixReady(callback) {
    if (window.MatrixHover && typeof window.MatrixHover.scan === 'function') {
      callback(window.MatrixHover);
      return;
    }

    const handler = () => {
      if (window.MatrixHover && typeof window.MatrixHover.scan === 'function') {
        callback(window.MatrixHover);
        document.removeEventListener('matrix-hover:ready', handler);
      }
    };

    document.addEventListener('matrix-hover:ready', handler);
  }

  function applyMatrixHover(target) {
    whenMatrixReady(matrix => {
      matrix.scan(target);
    });
  }

  function showError(container, message) {
    if (!container) {
      return;
    }
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'max-w-3xl mx-auto text-center';
    const heading = document.createElement('h4');
    heading.className = 'text-3xl font-bold text-white mb-4';
    heading.textContent = 'Projects Unavailable';
    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-400';
    paragraph.textContent = message || 'Please reload the page or try again later.';
    wrapper.appendChild(heading);
    wrapper.appendChild(paragraph);
    container.appendChild(wrapper);
  }

  function hydrate(container, sourceSection) {
    if (!container || !sourceSection) {
      return;
    }

    const sourceClass = sourceSection.getAttribute('class');
    if (sourceClass) {
      container.className = sourceClass;
    }

    container.innerHTML = sourceSection.innerHTML;
    container.classList.add('projects-preview');

    const grid = container.querySelector('.grid');
    if (grid) {
      grid.classList.add('projects-preview-grid');
    }
    container.dataset.projectsHydrated = 'true';

    applyMatrixHover(container);
  }

  function extractSection(html, selector) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if (!selector) {
      return doc.body.firstElementChild;
    }
    return doc.querySelector(selector);
  }

  function fetchProjects(container) {
    const sourcePath = container.dataset.projectsSrc || 'projects.html';
    const selector = container.dataset.projectsSelector || '[data-projects-section]';

    fetch(sourcePath, { headers: { 'X-Requested-With': 'fetch' } })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(html => {
        const section = extractSection(html, selector);
        if (!section) {
          throw new Error('Projects section not found in source document.');
        }
        hydrate(container, section);
      })
      .catch(error => {
        console.error('Failed to load projects preview:', error);
        showError(container, 'We ran into a glitch loading the showcase.');
      });
  }

  function init() {
    const container = document.querySelector(TARGET_SELECTOR);
    if (!container) {
      return;
    }
    if (container.dataset.projectsHydrated === 'true') {
      return;
    }
    fetchProjects(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
