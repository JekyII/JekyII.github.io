'use strict';

(function () {
  const MANIFEST_URL = 'blog/list.json';

  function fetchPosts() {
    return fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load blog manifest');
        }
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.posts)) {
          return [];
        }
        return data.posts
          .slice()
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      });
  }

  function renderTargets(targets, posts) {
    targets.forEach(target => {
      const limit = parseInt(target.dataset.blogLimit, 10);
      const layout = (target.dataset.blogLayout || 'list').toLowerCase();
      const subset = Number.isFinite(limit) && limit > 0 ? posts.slice(0, limit) : posts;
      target.innerHTML = '';

      if (!subset.length) {
        renderEmptyState(target);
        return;
      }

      if (layout === 'cards') {
        renderCardGrid(target, subset);
      } else {
        renderList(target, subset);
      }
    });
  }

  function renderEmptyState(target) {
    const message = document.createElement('p');
    message.className = 'blog-empty text-gray-500';
    message.textContent = 'No posts yet. Please check back soon.';
    target.appendChild(message);
  }

  function resolveUrl(post) {
    if (post.url) {
      return post.url;
    }
    if (post.slug) {
      return `blog/${post.slug}.html`;
    }
    return '#';
  }

  function resolveThumbnail(post) {
    return post.thumbnail || '';
  }

  function renderList(target, posts) {
    const list = document.createElement('ul');
    list.className = 'blog-list';

    posts.forEach(post => {
      const item = document.createElement('li');
      item.className = 'blog-list-item';

      const date = document.createElement('time');
      date.className = 'blog-list-date';
      if (post.date) {
        date.dateTime = post.date;
        date.textContent = formatDate(post.date);
      }

      const link = document.createElement('a');
      link.className = 'blog-list-link';
      link.href = resolveUrl(post);
      link.textContent = post.title || 'Untitled Post';

      const arrow = document.createElement('span');
      arrow.className = 'blog-list-arrow';
      arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '>';

      item.appendChild(date);
      item.appendChild(link);
      item.appendChild(arrow);
      list.appendChild(item);
    });

    target.appendChild(list);
  }

  function renderCardGrid(target, posts) {
    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'post-card';

      const url = resolveUrl(post);
      const thumbnailSrc = resolveThumbnail(post);

      const cardLink = document.createElement('a');
      cardLink.href = url;
      cardLink.className = 'post-card-link';
      if (post.title) {
        cardLink.setAttribute('aria-label', post.title);
      }

      if (thumbnailSrc) {
        const img = document.createElement('img');
        img.className = 'post-thumb';
        img.src = thumbnailSrc;
        img.alt = post.title ? `${post.title} thumbnail` : 'Blog post thumbnail';
        img.loading = 'lazy';

        cardLink.appendChild(img);
      }

      const body = document.createElement('div');
      body.className = 'post-body';

      const title = document.createElement('h3');
      title.className = 'post-title';
      title.textContent = post.title || 'Untitled Post';

      body.appendChild(title);

      if (post.excerpt) {
        const excerpt = document.createElement('p');
        excerpt.className = 'post-excerpt';
        excerpt.textContent = post.excerpt;
        body.appendChild(excerpt);
      }

      if (post.date || post.readingTime) {
        const meta = document.createElement('div');
        meta.className = 'post-meta';

        if (post.date) {
          const timeEl = document.createElement('time');
          timeEl.dateTime = post.date;
          timeEl.textContent = formatDate(post.date);
          meta.appendChild(timeEl);
        }

        if (post.readingTime) {
          const span = document.createElement('span');
          span.textContent = post.readingTime;
          meta.appendChild(span);
        }

        body.appendChild(meta);
      }

      cardLink.appendChild(body);
      article.appendChild(cardLink);
      target.appendChild(article);
    });
  }

  function formatDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) {
      return value;
    }
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function showError(targets) {
    targets.forEach(target => {
      target.innerHTML = '';
      const message = document.createElement('p');
      message.className = 'blog-error text-red-400';
      message.textContent = 'Unable to load posts right now. Please try again later.';
      target.appendChild(message);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const targets = Array.from(document.querySelectorAll('[data-blog-list]'));
    if (!targets.length) {
      return;
    }

    fetchPosts()
      .then(posts => {
        renderTargets(targets, posts);
      })
      .catch(() => {
        showError(targets);
      });
  });
})();
