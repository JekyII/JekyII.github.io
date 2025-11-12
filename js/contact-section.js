'use strict';

(function () {
  const TARGET_SELECTOR = '[data-contact-target]';

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

  const RECAPTCHA_SRC = 'https://www.google.com/recaptcha/api.js?render=6LcXZQcsAAAAABK6vB3Nexn-drNny6XPnzV58dXk';
  let recaptchaPromise = null;

  function loadRecaptchaScript() {
    if (typeof window !== 'undefined' && window.grecaptcha) {
      return Promise.resolve(window.grecaptcha);
    }

    if (recaptchaPromise) {
      return recaptchaPromise;
    }

    recaptchaPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-recaptcha-script]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.grecaptcha || null), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = RECAPTCHA_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.recaptchaScript = 'true';
      script.addEventListener('load', () => resolve(window.grecaptcha || null), { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });

    return recaptchaPromise;
  }

  function setupRecaptcha(container) {
    // For v3, no setup needed, script is loaded with render parameter
  }

  function showError(container, message) {
    if (!container) {
      return;
    }

    container.innerHTML = '';
    container.className = 'py-20 px-4 sm:px-6 lg:px-8';

    const wrapper = document.createElement('div');
    wrapper.className = 'max-w-lg mx-auto text-center';

    const heading = document.createElement('h2');
    heading.className = 'text-3xl font-bold text-white mb-4';
    heading.textContent = 'Contact Unavailable';

    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-400';
    paragraph.textContent = message || 'Please refresh the page or try again later.';

    wrapper.appendChild(heading);
    wrapper.appendChild(paragraph);
    container.appendChild(wrapper);
  }

  function hydrate(container, section) {
    if (!container || !section) {
      return;
    }

    if (section.getAttribute('class')) {
      container.className = section.getAttribute('class');
    }

    container.setAttribute('id', section.getAttribute('id') || 'contact');
    container.innerHTML = section.innerHTML;
    container.dataset.contactHydrated = 'true';

    applyMatrixHover(container);
    setupRecaptcha(container);
    loadRecaptchaScript(); // Ensure reCAPTCHA script is loaded

    // Handle form submission
    const form = container.querySelector('.contact-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Execute reCAPTCHA v3
        const siteKey = '6LcXZQcsAAAAABK6vB3Nexn-drNny6XPnzV58dXk';
        try {
          const token = await window.grecaptcha.execute(siteKey, { action: 'submit' });

          // Prepare form data
          const formData = new FormData(form);
          formData.append('g-recaptcha-response', token);

          const response = await fetch('api/submit.php', {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (result.success) {
            // Replace form with success message
            container.innerHTML = `
              <div class="max-w-lg mx-auto text-center py-20 px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-white mb-4">Message Sent!</h2>
                <p class="text-gray-400">${result.message}</p>
              </div>
            `;
          } else {
            alert('Error: ' + result.message);
          }
        } catch (error) {
          console.error('reCAPTCHA or submission error:', error);
          alert('There was an error. Please try again.');
        }
      });
    }
  }

  function extractSection(html, selector) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if (!selector) {
      return doc.body.firstElementChild;
    }
    return doc.querySelector(selector);
  }

  function fetchContact(container) {
    const sourcePath = container.dataset.contactSrc || 'contact.html';
    const selector = container.dataset.contactSelector || '[data-contact-section]';

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
          throw new Error('Contact section not found in source document.');
        }
        hydrate(container, section);
      })
      .catch(error => {
        console.error('Failed to load contact section:', error);
        showError(container, 'We hit a hiccup loading the contact form.');
      });
  }

  function init() {
    const containers = document.querySelectorAll(TARGET_SELECTOR);
    if (!containers.length) {
      return;
    }

    containers.forEach(container => {
      if (container.dataset.contactHydrated === 'true') {
        return;
      }
      fetchContact(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
