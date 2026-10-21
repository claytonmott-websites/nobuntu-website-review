/* Nobuntu site behaviour: navigation, reveal on scroll, forms, sticky CTA. */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  /* Header border on scroll */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('.label').textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggle.click();
    });
  }

  /* Reveal on scroll */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  /* Content is visible at rest. Only items still below the fold on load are
     held back, and they fade in as they scroll into view. */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) {
      if (el.closest('.hero, .page-hero')) return;
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('is-pending'); io.observe(el); }
    });
  }

  /* Sticky CTA (lander, mobile) appears once the hero has scrolled away */
  var sticky = document.querySelector('.sticky-cta');
  var heroEl = document.querySelector('[data-hero]');
  if (sticky && heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle('is-visible', !entries[0].isIntersecting);
    }).observe(heroEl);
  }

  /* Forms: prefill interest from ?interest=, then submit.
     Set data-endpoint on the form to the live handler (for example the
     Cloudflare worker) before launch. With no endpoint the form shows a
     preview notice instead of pretending to send. */
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get('interest');
  document.querySelectorAll('form[data-signup]').forEach(function (form) {
    if (wanted) {
      var box = form.querySelector('input[name="interest"][value="' + wanted + '"]');
      if (box) box.checked = true;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var interests = form.querySelectorAll('input[name="interest"]:checked');
      var err = form.querySelector('.interest-error');
      if (interests.length === 0) {
        if (err) err.hidden = false;
        form.querySelector('input[name="interest"]').focus();
        return;
      }
      if (err) err.hidden = true;
      if (!form.reportValidity()) return;
      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return;

      var wrap = form.closest('[data-form-wrap]') || form;
      var endpoint = form.getAttribute('data-endpoint');
      var done = function (preview) {
        wrap.classList.add('is-sent');
        var note = wrap.querySelector('.preview-note');
        if (note) note.hidden = !preview;
        var focusTarget = wrap.querySelector('.form-success');
        if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus(); }
      };
      if (!endpoint) { done(true); return; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(); done(false); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Try again'; }
          alert('Something went wrong. Please email info@nobuntu.digital.');
        });
    });
  });

  /* Footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
