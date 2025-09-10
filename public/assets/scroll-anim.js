/* Scroll-based reveal + subtle continuous motion for listing cards */
(function () {
  const docReady = (fn) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      requestAnimationFrame(fn);
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  };

  docReady(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(document.querySelectorAll('.reveal-on-scroll'));
    const fades = Array.from(document.querySelectorAll('.fade-in'));
    if (!cards.length && !fades.length) return;

    // Staggered reveal for both cards and sections using fade-in
    const allToObserve = [...new Set([...cards, ...fades])];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // Small stagger based on DOM order
          const idx = allToObserve.indexOf(el);
          el.style.setProperty('--delay', Math.min(idx * 60, 600) + 'ms');
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { root: null, threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    allToObserve.forEach(el => io.observe(el));

    if (prefersReduced) return; // Skip continuous motion

    // Subtle continuous translate based on viewport position
    let ticking = false;
    const maxOffset = 8; // px

    const updateScrollTransforms = () => {
      ticking = false;
      const vh = window.innerHeight || 1;
      cards.forEach((el) => {
        if (!el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        // Normalize element center to [-1, 1]
        const center = rect.top + rect.height / 2;
        const n = ((center / vh) * 2) - 1; // -1 top, 0 middle, 1 bottom
        const offset = (-n) * maxOffset; // move opposite scroll direction subtly
        el.style.setProperty('--scroll-y', offset.toFixed(2) + 'px');
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollTransforms);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Initial position
    onScroll();
  });
})();

