/**
 * Global scroll animation functionality
 * Works across all pages to animate elements on scroll
 */
(function () {
    let listenersAttached = false;

    function revealAnimatedElements() {
        const elements = document.querySelectorAll('.fade-in-section, .slide-in-left, .slide-in-right, .scale-in');
        const viewportThreshold = window.innerHeight - 150;

        elements.forEach(element => {
            if (element.classList.contains('is-visible')) {
                return;
            }
            if (element.getBoundingClientRect().top < viewportThreshold) {
                element.classList.add('is-visible');
            }
        });
    }

    function ensureListeners() {
        if (listenersAttached) {
            return;
        }
        window.addEventListener('scroll', revealAnimatedElements, { passive: true });
        window.addEventListener('resize', revealAnimatedElements);
        listenersAttached = true;
    }

    function animateHeroImmediately() {
        const heroSection = document.querySelector('.fade-in-section');
        if (!heroSection || heroSection.classList.contains('is-visible')) {
            return;
        }
        setTimeout(() => heroSection.classList.add('is-visible'), 120);
    }

    function initAnimations() {
        ensureListeners();
        revealAnimatedElements();
        animateHeroImmediately();
    }

    document.addEventListener('DOMContentLoaded', initAnimations);
    document.addEventListener('site:content-updated', initAnimations);
})();

