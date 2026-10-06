/* =====================================================================
   AtES NB - single-page behaviour
   Every section is wrapped in its own scope so shared class names
   (.card, .dot, .active ...) never collide.
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     0. Shared: image fallback, reveal-on-scroll, demo forms
     --------------------------------------------------------------- */
  function placeholderFor(label) {
    var text = String(label || 'Image').replace(/[<>&"]/g, '');
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>' +
      '<rect width="800" height="600" fill="url(#g)"/>' +
      '<text x="400" y="310" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
      'font-size="34" font-weight="700" fill="#0f172a">' + text + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function handleBrokenImage(img) {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    if (img.closest('.footer-illustration')) { img.hidden = true; return; }
    img.src = placeholderFor(img.alt);
  }

  // capture phase: <img> error events do not bubble
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') handleBrokenImage(e.target);
  }, true);

  function sweepBrokenImages() {
    $$('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) handleBrokenImage(img);
    });
  }

  // Reveal each section as it scrolls into view
  function initReveal() {
    var sections = $$('.site-section').filter(function (s) { return s.id !== 'hero' && s.id !== 'footer'; });
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    sections.forEach(function (s) { s.classList.add('reveal'); io.observe(s); });
  }

  // Settings from /js/config.js (email + Calendly). Missing values just switch that feature off.
  var CFG = window.SITE_CONFIG || {};

  // Forms: sent straight from the browser through EmailJS (free plan, no backend needed).
  function emailConfigured() {
    var m = CFG.emailjs || {};
    return !!(m.publicKey && m.serviceId && m.templateId);
  }

  function sendWithEmailJS(params) {
    var m = CFG.emailjs;
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: m.serviceId, template_id: m.templateId, user_id: m.publicKey, template_params: params })
    }).then(function (res) {
      if (res.ok) return;
      return res.text().then(function (t) { var err = new Error(t || 'send failed'); err.status = res.status; throw err; });
    });
  }

  function initForms() {
    var COOLDOWN_MS = 60 * 1000;                 // basic spam brake: one request per minute per browser
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    $$('form.js-demo-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var status = $('.form-status', form);
        if (!status) {
          status = document.createElement('p');
          status.className = 'form-status';
          status.setAttribute('role', 'status');
          form.appendChild(status);
        }
        function show(text, isError) {
          status.textContent = text;
          status.classList.toggle('form-status--error', !!isError);
        }
        function val(name) { var el = form.elements[name]; return el ? el.value : ''; }

        var name = (val('fullName') || val('fullname')).trim();
        var email = val('email').trim();
        if (!name) { show('Please enter your name.', true); return; }
        if (!EMAIL_RE.test(email)) { show('Please enter a valid email address.', true); return; }

        // Honeypot: real visitors never fill this hidden field, bots do. Pretend success and send nothing.
        if (val('website')) { show('Thank you! Your request has been sent.', false); form.reset(); return; }

        var last = 0;
        try { last = Number(localStorage.getItem('atesnb-last-quote')) || 0; } catch (err) { /* storage blocked - skip the brake */ }
        if (Date.now() - last < COOLDOWN_MS) { show('Your request was just sent. Please wait a minute before sending another.', true); return; }

        if (!emailConfigured()) {
          show('Online requests are not available right now. Please email atesnb1@gmail.com or call / WhatsApp us.', true);
          return;
        }

        var button = $('button[type="submit"]', form);
        var originalLabel = button ? button.innerHTML : '';
        if (button) { button.disabled = true; button.textContent = 'Sending...'; }
        show('Sending your request...', false);

        sendWithEmailJS({
          from_name: name,
          reply_to: email,
          company: val('company').trim() || 'Not provided',
          message: val('message').trim() || 'Not provided',
          source: form.getAttribute('data-source') === 'hero' ? 'Hero form (top of page)' : 'Book-a-call form',
          submitted_at: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        })
          .then(function () {
            try { localStorage.setItem('atesnb-last-quote', String(Date.now())); } catch (err) { /* ignore */ }
            show('Thank you! Your request has been sent. Our team will get back to you shortly.', false);
            form.reset();
          })
          .catch(function (err) {
            show(
              err && err.status === 429
                ? 'Too many requests right now. Please try again in a minute.'
                : 'Sorry, we could not send your request. Please try again, or email atesnb1@gmail.com / call / WhatsApp us.',
              true
            );
          })
          .then(function () {
            if (button) { button.disabled = false; button.innerHTML = originalLabel; }
          });
      });
    });
  }

  // Calendly: "Book a call" buttons open Calendly's popup. Its script is only fetched when it is needed.
  function initCalendly() {
    var url = (CFG.calendlyUrl || '').trim();
    if (!url) return;                            // not configured: buttons keep scrolling to the contact form
    $$('[data-calendly-row]').forEach(function (row) { row.hidden = false; });

    var loading = null;
    function load() {
      if (loading) return loading;
      loading = new Promise(function (resolve, reject) {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(css);
        var sc = document.createElement('script');
        sc.src = 'https://assets.calendly.com/assets/external/widget.js';
        sc.async = true;
        sc.onload = resolve;
        sc.onerror = reject;
        document.head.appendChild(sc);
      });
      return loading;
    }
    function warm() { load().catch(function () {}); }

    $$('[data-calendly]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        load()
          .then(function () { window.Calendly.initPopupWidget({ url: url }); })
          .catch(function () { window.open(url, '_blank', 'noopener'); });   // script blocked? open Calendly in a new tab
      });
      ['pointerenter', 'touchstart', 'focus'].forEach(function (ev) {
        el.addEventListener(ev, warm, { once: true, passive: true });        // start loading as the visitor reaches for it
      });
    });
  }

  /* ---------------------------------------------------------------
     3. Partners - fade/rise in once visible
     --------------------------------------------------------------- */
  function initPartners() {
    var section = document.getElementById('partnersSection');
    if (!section) return;
    if (!('IntersectionObserver' in window)) { section.classList.add('active'); return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.classList.add('active');
          observer.unobserve(section);
        }
      });
    }, { threshold: 0.25 });
    observer.observe(section);
  }

  /* ---------------------------------------------------------------
     5. Our Work - portfolio showcase
     --------------------------------------------------------------- */
  function initWork() {
    var root = $('.sec-5');
    if (!root) return;

    var portfolioData = [
      { bannerImg: 'banner1.webp', workImg: 'work1.webp', client: 'Miracle digital', industry: 'Electronics & communication',
        work: 'Magento Integration, Custom Magento, Performance Optimization, Data Migration, B2B Magento, API Integration, Inventory Sync, Product Management, Checkout Optimization, Analytics' },
      { bannerImg: 'banner2.webp', workImg: 'work2.webp', client: 'Remedy Liquor', industry: 'E-Commerce & Beverage',
        work: 'Custom E-Commerce Storefront, Payment Gateway Integration, Age Verification System, Catalog Management, Local Delivery API, Performance Optimization' },
      { bannerImg: 'banner3.webp', workImg: 'work3.webp', client: 'Americord', industry: 'Healthcare & Cord Blood Banking',
        work: 'HIPAA Compliant Platform, Lead Generation Funnels, Custom CRM Integration, User Portal Development, Secure Data Storage, Marketing Automation' },
      { bannerImg: 'banner4.webp', workImg: 'work4.webp', client: 'Sokolin', industry: 'Fine Wine & Luxury Goods',
        work: 'Luxury Web Redesign, High-Volume Inventory Sync, ERP Integration, Mobile Optimization, Custom Checkout Workflow, SEO Enhancements' },
      { bannerImg: 'banner5.webp', workImg: 'work5.webp', client: 'Partner Brand', industry: 'Beauty & Faishon',
        work: 'Headless Commerce, PWA Integration, Custom UI/UX Design, Global Multi-currency Checkout, Cloud Infrastructure Setup' }
    ];

    var current = 0;
    var track = $('#cardTrack', root);
    var clientName = $('#clientName', root);
    var industryName = $('#industryName', root);
    var workDescription = $('#workDescription', root);
    var mainImage = $('#mainWorkImage', root);
    var grid = $('#showcaseGrid', root);
    if (!track || !grid) return;

    function render() {
      track.innerHTML = '';
      portfolioData.forEach(function (item, index) {
        var card = document.createElement('div');
        card.className = 'card' + (index === current ? ' active' : '');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Show ' + item.client);
        var img = document.createElement('img');
        img.src = item.bannerImg;
        img.alt = item.client;
        img.width = 180; img.height = 90; img.decoding = 'async';
        card.appendChild(img);
        card.addEventListener('click', function () { select(index); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(index); }
        });
        track.appendChild(card);
      });
    }

    function select(index) {
      if (index === current) return;
      current = index;
      $$('.card', track).forEach(function (card, i) { card.classList.toggle('active', i === index); });
      grid.classList.add('fade-out');
      setTimeout(function () {
        var s = portfolioData[index];
        clientName.textContent = s.client;
        industryName.textContent = s.industry;
        workDescription.textContent = s.work;
        mainImage.alt = s.client + ' project preview';
        mainImage.removeAttribute('data-fallback');
        mainImage.src = s.workImg;
        grid.classList.remove('fade-out');
      }, 150);
    }

    render();
  }

  /* ---------------------------------------------------------------
     6. Team carousel
     --------------------------------------------------------------- */
  function initTeam() {
    var root = $('.sec-6');
    if (!root) return;

    var teamMembers = [
      { name: 'Navin Burnwal', role: 'Founder' },
      { name: 'Pallavi kumari', role: 'Listing Manager' },
      { name: 'Rohit Kumar', role: 'Lead Developer' },
      { name: 'Ms. Julia', role: 'Ui-UX Designer' },
      { name: 'Rahul saw', role: 'Marketing Manager' },
      { name: 'Nisha Kumari', role: 'E-com Executive' }
    ];

    var cards = $$('.card', root);
    var dots = $$('.dot', root);
    var memberName = $('.member-name', root);
    var memberRole = $('.member-role', root);
    var leftArrow = $('.nav-arrow.left', root);
    var rightArrow = $('.nav-arrow.right', root);
    var container = $('.carousel-container', root);
    var currentIndex = 0;
    var isAnimating = false;
    var inView = false;

    function update(newIndex) {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (newIndex + cards.length) % cards.length;

      cards.forEach(function (card, i) {
        var offset = (i - currentIndex + cards.length) % cards.length;
        card.classList.remove('center', 'left-1', 'left-2', 'right-1', 'right-2', 'hidden');
        if (offset === 0) card.classList.add('center');
        else if (offset === 1) card.classList.add('right-1');
        else if (offset === 2) card.classList.add('right-2');
        else if (offset === cards.length - 1) card.classList.add('left-1');
        else if (offset === cards.length - 2) card.classList.add('left-2');
        else card.classList.add('hidden');
      });

      dots.forEach(function (dot, i) { dot.classList.toggle('active', i === currentIndex); });

      memberName.style.opacity = '0';
      memberRole.style.opacity = '0';
      setTimeout(function () {
        memberName.textContent = teamMembers[currentIndex].name;
        memberRole.textContent = teamMembers[currentIndex].role;
        memberName.style.opacity = '1';
        memberRole.style.opacity = '1';
      }, 300);
      setTimeout(function () { isAnimating = false; }, 800);
    }

    leftArrow.addEventListener('click', function () { update(currentIndex - 1); });
    rightArrow.addEventListener('click', function () { update(currentIndex + 1); });
    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { update(i); }); });
    cards.forEach(function (card, i) { card.addEventListener('click', function () { update(i); }); });

    // keyboard arrows only act while the carousel is on screen (page-wide listener otherwise)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; }, { threshold: 0.4 })
        .observe(container);
    }
    document.addEventListener('keydown', function (e) {
      if (!inView) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') update(currentIndex - 1);
      else if (e.key === 'ArrowRight') update(currentIndex + 1);
    });

    // swipe, limited to the carousel itself
    var startX = 0;
    container.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].screenX; }, { passive: true });
    container.addEventListener('touchend', function (e) {
      var diff = startX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) update(currentIndex + (diff > 0 ? 1 : -1));
    }, { passive: true });

    update(0);
  }

  /* ---------------------------------------------------------------
     8. Stats counters - count up when scrolled into view
     --------------------------------------------------------------- */
  function initCounters() {
    var root = $('.sec-8');
    if (!root) return;
    var counters = $$('.counter', root);
    var duration = 2000;

    function run(counter) {
      var target = parseInt(counter.getAttribute('data-target'), 10) || 0;
      if (reduceMotion) { counter.textContent = target; return; }
      var start = performance.now();
      (function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = progress < 1 ? Math.floor(eased * target) : target;
        if (progress < 1) requestAnimationFrame(tick);
      })(start);
    }

    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------------------------------------------------------------
     11. Lifecycle timeline - accordion + scroll progress line
     --------------------------------------------------------------- */
  function initLifecycle() {
    var root = $('.sec-11');
    if (!root) return;
    var cards = $$('.step-card', root);

    function toggle(card) {
      var wasActive = card.classList.contains('active');
      cards.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-expanded', 'false'); });
      if (!wasActive) { card.classList.add('active'); card.setAttribute('aria-expanded', 'true'); }
    }
    cards.forEach(function (card) {
      card.addEventListener('click', function () { toggle(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(card); }
      });
    });

    var steps = $$('.step-item', root);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
      }, { threshold: 0.15 });
      steps.forEach(function (s) { io.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('is-visible'); });
    }

    var timeline = $('.timeline-wrapper', root);
    var line = $('#progressLine', root);
    var ticking = false;
    var timelineActive = !('IntersectionObserver' in window);   // measure only while the timeline is near the viewport
    function paint() {
      ticking = false;
      var rect = timeline.getBoundingClientRect();
      var progress = ((window.innerHeight / 2 - rect.top) / rect.height) * 100;
      line.style.height = Math.min(Math.max(progress, 0), 100) + '%';
    }
    function onScroll() { if (timelineActive && !ticking) { ticking = true; requestAnimationFrame(paint); } }
    if (timeline && line) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          timelineActive = entries[0].isIntersecting;
          if (timelineActive) onScroll();
        }, { rootMargin: '200px 0px' }).observe(timeline);
      } else { onScroll(); }
    }
  }

  /* ---------------------------------------------------------------
     12. Reviews slider
     --------------------------------------------------------------- */
  function initReviews() {
    var root = $('#reviews');
    if (!root) return;
    var slider = $('#reviewsSlider', root);
    var prev = $('#prevBtn', root);
    var next = $('#nextBtn', root);
    var dots = $$('.dots-pagination .dot', root);
    if (!slider) return;

    function step() {
      var card = $('.review-card', slider);
      return (card ? card.offsetWidth : 300) + 20;
    }
    next.addEventListener('click', function () { slider.scrollBy({ left: step(), behavior: 'smooth' }); });
    prev.addEventListener('click', function () { slider.scrollBy({ left: -step(), behavior: 'smooth' }); });
    slider.addEventListener('scroll', function () {
      var active = Math.round(slider.scrollLeft / step());
      dots.forEach(function (dot, i) { dot.classList.toggle('active', i === active); });
    }, { passive: true });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { slider.scrollTo({ left: step() * i, behavior: 'smooth' }); });
    });
  }

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  function boot() {
    sweepBrokenImages();
    initReveal();
    initForms();
    initCalendly();
    initPartners();
    initWork();
    initTeam();
    initCounters();
    initLifecycle();
    initReviews();
    window.addEventListener('load', sweepBrokenImages);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


/* =====================================================================
   FAQ accordion - one answer open at a time
   ===================================================================== */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  if (!items.length) return;

  function setOpen(item, open) {
    var btn = item.querySelector('.faq-q');
    item.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      items.forEach(function (other) { setOpen(other, false); });
      setOpen(item, willOpen);
    });
  });
})();
