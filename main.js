/* ============================================================
   PORTFOLIO — main.js
   Covers: dataLayer tracking, hero role animation,
           sticky nav, mobile menu, contact form, footer year
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   dataLayer helper
   All custom events funnel through here so every push is
   consistent and easy to map in GTM.
   ------------------------------------------------------------ */
function trackEvent(eventName, eventLabel, extraParams = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    event_label: eventLabel,
    ...extraParams
  });
}

/* Make trackEvent globally available so inline onclick="" attrs work */
window.trackEvent = trackEvent;

/* ------------------------------------------------------------
   Track all [data-track] anchor clicks automatically
   ------------------------------------------------------------ */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-track]');
  if (!el) return;
  trackEvent('link_click', el.dataset.track, {
    link_text: el.innerText?.trim() || '',
    link_href: el.href || ''
  });
});

/* ------------------------------------------------------------
   Hero role swap animation
   Cycles between "Data Scientist" and "Analytics Engineer"
   ------------------------------------------------------------ */
(function heroRoleSwap() {
  const roles = ['Data Scientist', 'Analytics Engineer'];
  const el = document.getElementById('role-display');
  if (!el) return;

  let current = 0;

  function swap() {
    // Slide out
    el.classList.add('slide-out');

    setTimeout(function () {
      current = (current + 1) % roles.length;
      el.textContent = roles[current];

      // Snap to bottom, then slide up
      el.classList.remove('slide-out');
      el.classList.add('slide-in');

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.remove('slide-in');
          el.classList.add('visible');
        });
      });

      // Clean up
      setTimeout(function () { el.classList.remove('visible'); }, 600);
    }, 450);
  }

  // Kick off after a short pause, then repeat every 3.5 s
  setTimeout(function () {
    swap();
    setInterval(swap, 3500);
  }, 2000);
})();

/* ------------------------------------------------------------
   Sticky nav — add .scrolled shadow after first scroll
   ------------------------------------------------------------ */
(function stickyNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ------------------------------------------------------------
   Mobile hamburger menu
   ------------------------------------------------------------ */
(function mobileMenu() {
  const btn   = document.getElementById('nav-hamburger');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    trackEvent('mobile_nav_toggle', open ? 'open' : 'close');
  });

  // Close on any nav link click
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ------------------------------------------------------------
   Contact form — client-side validation + dataLayer events
   This wires to a mailto: fallback by default.
   Swap the body of handleSubmit for Formspree, Netlify Forms,
   or any backend endpoint you prefer.
   ------------------------------------------------------------ */
(function contactForm() {
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const btn    = document.getElementById('submit-btn');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name    = form.elements['name'].value.trim();
    const email   = form.elements['email'].value.trim();
    const message = form.elements['message'].value.trim();

    if (!name || !email || !message) {
      status.style.color = '#F87171';
      status.textContent = 'Please fill in name, email, and message.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.style.color = '#F87171';
      status.textContent = 'Please enter a valid email address.';
      return;
    }

    trackEvent('form_submit', 'contact_form', { form_name: 'contact' });

    /* ---- Default: open mailto (replace with fetch() for a real backend) ---- */
    const subject = encodeURIComponent(form.elements['subject'].value || 'Portfolio contact');
    const body    = encodeURIComponent(
      'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
    );
    window.location.href = 'mailto:invictus.marketing.td@gmail.com?subject=' + subject + '&body=' + body;

    status.style.color = '#00C2CB';
    status.textContent = 'Opening your mail client…';
    btn.disabled       = true;
    btn.textContent    = 'Sent ✓';

    setTimeout(function () {
      btn.disabled    = false;
      btn.textContent = 'Send Message';
      status.textContent = '';
      form.reset();
    }, 4000);
  });
})();

/* ------------------------------------------------------------
   Tableau embed interaction tracking
   Fires when user interacts with any .tableau-embed-wrap
   ------------------------------------------------------------ */
document.querySelectorAll('.tableau-embed-wrap').forEach(function (wrap) {
  wrap.addEventListener('click', function () {
    trackEvent('tableau_interaction', wrap.id || 'tableau_embed', {
      dashboard_id: wrap.id
    });
  });
});

/* ------------------------------------------------------------
   Resume download tracking (belt-and-suspenders for any
   download attr link missed by the inline onclick)
   ------------------------------------------------------------ */
document.querySelectorAll('a[download]').forEach(function (a) {
  a.addEventListener('click', function () {
    trackEvent('resume_download', a.dataset.track || 'resume', {
      file_name: a.getAttribute('href')
    });
  });
});

/* ------------------------------------------------------------
   Section visibility tracking with IntersectionObserver
   Fires a dataLayer event the first time each section
   enters the viewport (useful for scroll-depth in GA4).
   ------------------------------------------------------------ */
(function sectionTracking() {
  const sections = document.querySelectorAll('section[id]');
  if (!('IntersectionObserver' in window)) return;

  const seen = new Set();

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !seen.has(entry.target.id)) {
        seen.add(entry.target.id);
        trackEvent('section_view', entry.target.id, {
          section_id: entry.target.id
        });
      }
    });
  }, { threshold: 0.25 });

  sections.forEach(function (s) { observer.observe(s); });
})();

/* ------------------------------------------------------------
   Footer — dynamic year
   ------------------------------------------------------------ */
const yrEl = document.getElementById('footer-year');
if (yrEl) yrEl.textContent = new Date().getFullYear();
