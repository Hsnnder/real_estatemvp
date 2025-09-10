(function(){
  const ready = (fn)=>{
    if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  };

  ready(()=>{
    const overlay = document.getElementById('siteMenuOverlay');
    if (!overlay) return;
    const panel = overlay.querySelector('.menu-panel');
    const toggles = document.querySelectorAll('.menu-toggle');
    const closeBtn = overlay.querySelector('.menu-close');

    function openMenu(){
      overlay.classList.add('is-open');
      // Ensure CSS transition runs (in case of same-tick style application)
      requestAnimationFrame(()=>{
        panel.classList.add('is-open');
      });
      document.body.style.overflow = 'hidden';
    }
    function closeMenu(){
      // Slide panel out first, then fade overlay
      panel.classList.remove('is-open');
      const onEnd = (e)=>{
        if (e && e.propertyName !== 'transform') return;
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
      };
      panel.addEventListener('transitionend', onEnd, { once: true });
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(onEnd, 350);
    }

    toggles.forEach(btn=>btn.addEventListener('click', openMenu));
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeMenu(); });
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });
  });
})();
