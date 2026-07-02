/* ============================================================
   PORTFOLIO — consent.js
   GDPR / US state privacy law consent manager. Gates Google
   Consent Mode v2 signals for GTM/GA4 based on explicit user
   choice, or a detected Global Privacy Control (GPC) signal
   honored as an opt-out.
   ============================================================ */

'use strict';

(function () {
  var STORAGE_KEY = 'cookie_consent_v1';
  var CONSENT_VERSION = 1;

  var banner           = document.getElementById('consent-banner');
  var modal             = document.getElementById('consent-modal');
  var analyticsToggle   = document.getElementById('consent-analytics');

  function applyConsent(consent) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied'
    });
  }

  function trackEventSafe(name, label, params) {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent(name, label, params);
    }
  }

  function loadConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consent, method) {
    var record = {
      necessary: true,
      analytics: !!consent.analytics,
      method: method,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    applyConsent(record);
    hideBanner();
    hideModal();
    trackEventSafe('consent_update', method, record);
    return record;
  }

  function hideBanner() { if (banner) banner.setAttribute('hidden', ''); }
  function showBanner() { if (banner) banner.removeAttribute('hidden'); }
  function hideModal()  { if (modal)  modal.setAttribute('hidden', ''); }
  function showModal() {
    if (!modal) return;
    var existing = loadConsent();
    if (analyticsToggle) analyticsToggle.checked = existing ? existing.analytics : false;
    modal.removeAttribute('hidden');
  }

  function gpcRequested() {
    return navigator.globalPrivacyControl === true;
  }

  function init() {
    var existing = loadConsent();

    if (existing) {
      applyConsent(existing);
      return;
    }

    if (gpcRequested()) {
      saveConsent({ analytics: false }, 'gpc');
      return;
    }

    showBanner();
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-consent-action]');
    if (!el) return;
    var action = el.dataset.consentAction;

    if (action === 'accept-all') {
      saveConsent({ analytics: true }, 'accept_all');
    } else if (action === 'reject-all') {
      saveConsent({ analytics: false }, 'reject_all');
    } else if (action === 'open-preferences') {
      showModal();
    } else if (action === 'save-preferences') {
      saveConsent({ analytics: !!(analyticsToggle && analyticsToggle.checked) }, 'preferences');
    } else if (action === 'close-preferences') {
      hideModal();
      if (!loadConsent()) showBanner();
    } else if (action === 'reopen-preferences') {
      showBanner();
      showModal();
    }
  });

  document.addEventListener('DOMContentLoaded', init);
})();
