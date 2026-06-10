(function(){
  try {
    var SESSION = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    var COLLECT_URL = '/api/collect';
    var country = 'Unknown';
    var continent = 'Unknown';
    var sectionTimes = {};
    var pageStart = Date.now();
    var eventQueue = [];

    // Country + continent detection via Vercel geo function
    try {
      var geoXhr = new XMLHttpRequest();
      geoXhr.open('GET', '/api/geo', true);
      geoXhr.timeout = 5000;
      geoXhr.onload = function() {
        try {
          var d = JSON.parse(geoXhr.responseText);
          country = d.country_name || 'Unknown';
          continent = d.continent || 'Unknown';
        } catch(e) {}
      };
      geoXhr.send();
    } catch(e) {}

    // Country code → continent mapping (fallback)
    var continentMap = {
      AF:'Africa', AS:'Asia', EU:'Europe', NA:'North America', SA:'South America', OC:'Oceania', AN:'Antarctica'
    };
    function setContinent(code) { continent = continentMap[code] || 'Unknown'; }

    // Track sections (existing)
    var sections = document.querySelectorAll('section[id], main[id]');
    for (var i = 0; i < sections.length; i++) {
      (function(el) {
        var id = el.id || el.tagName.toLowerCase();
        sectionTimes[id] = { enter: 0, total: 0 };
        var obs = new IntersectionObserver(function(entries) {
          for (var j = 0; j < entries.length; j++) {
            if (entries[j].isIntersecting) {
              sectionTimes[id].enter = Date.now();
            } else if (sectionTimes[id].enter > 0) {
              sectionTimes[id].total += Date.now() - sectionTimes[id].enter;
              sectionTimes[id].enter = 0;
            }
          }
        }, { threshold: 0.3 });
        obs.observe(el);
      })(sections[i]);
    }

    function queueEvent(type, value) {
      eventQueue.push({
        session: SESSION,
        country: country,
        continent: continent,
        type: type,
        value: value
      });
    }

    // Track hero tabs (existing)
    var heroTabTimes = {};
    try {
      var tabs = document.querySelectorAll('[data-hero-tab]');
      for (var i = 0; i < tabs.length; i++) {
        (function(idx) {
          heroTabTimes[idx] = { enter: 0, total: 0 };
          tabs[idx].addEventListener('click', function() {
            for (var k in heroTabTimes) {
              if (heroTabTimes[k].enter > 0) {
                heroTabTimes[k].total += Date.now() - heroTabTimes[k].enter;
                heroTabTimes[k].enter = 0;
              }
            }
            heroTabTimes[idx].enter = Date.now();
            var label = (tabs[idx].querySelector('strong') || {}).textContent || 'Tab ' + idx;
            queueEvent('hero_tab', label);
          });
        })(i);
      }
      var activeTab = document.querySelector('.hero-tab.is-active');
      if (activeTab) {
        var activeIdx = parseInt(activeTab.getAttribute('data-hero-tab') || '0');
        heroTabTimes[activeIdx].enter = Date.now();
      }
    } catch(e) {}

    // === NEW: Track product tab views ===
    var productTimes = {};
    var currentProduct = null;
    var currentProductStart = 0;
    try {
      var productItems = document.querySelectorAll('.product-app-item');
      productItems.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.getAttribute('data-product-index') || '0');
          var name = (btn.querySelector('strong') || btn).textContent.trim();
          // Close previous product
          if (currentProduct !== null && currentProductStart > 0) {
            var dur = Date.now() - currentProductStart;
            if (!productTimes[currentProduct]) productTimes[currentProduct] = 0;
            productTimes[currentProduct] += dur;
          }
          currentProduct = idx;
          currentProductStart = Date.now();
          queueEvent('product_view', JSON.stringify({ product: name, index: idx }));
        });
      });
      // Start tracking initial product if any
      var activeProduct = document.querySelector('.product-app-item.is-active');
      if (activeProduct) {
        currentProduct = parseInt(activeProduct.getAttribute('data-product-index') || '0');
        currentProductStart = Date.now();
      }
    } catch(e) {}

    // === NEW: Track video watch time ===
    var videoTime = 0;
    var videoStart = 0;
    try {
      var video = document.getElementById('companyVideo');
      if (video) {
        video.addEventListener('play', function() { videoStart = Date.now(); });
        video.addEventListener('pause', function() {
          if (videoStart > 0) { videoTime += Date.now() - videoStart; videoStart = 0; }
        });
        video.addEventListener('ended', function() {
          if (videoStart > 0) { videoTime += Date.now() - videoStart; videoStart = 0; }
          queueEvent('video_watch', JSON.stringify({ duration_ms: videoTime }));
        });
        // Track video time on page exit
        window.addEventListener('beforeunload', function() {
          if (videoStart > 0) videoTime += Date.now() - videoStart;
          if (videoTime > 1000) {
            queueEvent('video_watch', JSON.stringify({ duration_ms: videoTime }));
          }
        });
      }
    } catch(e) {}

    // === NEW: Lead event - called by contact form ===
    window.trackLead = function(leadData) {
      queueEvent('lead_submit', JSON.stringify(leadData || {}));
      flushEvents();
    };

    function flushEvents() {
      var now = Date.now();
      // Close section times
      for (var id in sectionTimes) {
        if (sectionTimes[id].enter > 0) sectionTimes[id].total += now - sectionTimes[id].enter;
        if (sectionTimes[id].total > 500) {
          queueEvent('section_view', JSON.stringify({
            section: id, duration_ms: Math.round(sectionTimes[id].total),
            total_page_ms: now - pageStart
          }));
        }
      }
      // Close hero tab times
      for (var t in heroTabTimes) {
        if (heroTabTimes[t].enter > 0) heroTabTimes[t].total += now - heroTabTimes[t].enter;
        if (heroTabTimes[t].total > 300) {
          var tabEl = document.querySelector('[data-hero-tab="'+t+'"]');
          var label = tabEl ? (tabEl.querySelector('strong') || {}).textContent || 'Tab' : 'Tab';
          queueEvent('hero_tab_view', JSON.stringify({
            tab: label, tab_index: parseInt(t),
            duration_ms: Math.round(heroTabTimes[t].total)
          }));
        }
      }
      // Close product time
      if (currentProduct !== null && currentProductStart > 0) {
        var pd = Date.now() - currentProductStart;
        if (!productTimes[currentProduct]) productTimes[currentProduct] = 0;
        productTimes[currentProduct] += pd;
        if (productTimes[currentProduct] > 500) {
          var pname = '';
          try {
            var activeBtn = document.querySelector('.product-app-item.is-active strong');
            if (activeBtn) pname = activeBtn.textContent.trim();
          } catch(e) {}
          queueEvent('product_view', JSON.stringify({
            product: pname, index: currentProduct,
            duration_ms: Math.round(productTimes[currentProduct])
          }));
        }
      }
      // Page exit
      queueEvent('page_exit', Math.round((now - pageStart) / 1000) + 's');

      if (!eventQueue.length) return;

      // localStorage backup
      try {
        var pending = JSON.parse(localStorage.getItem('alPending') || '[]');
        pending = pending.concat(eventQueue);
        localStorage.setItem('alPending', JSON.stringify(pending));
      } catch(e) {}

      // Send to /api/collect
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(COLLECT_URL, new Blob([JSON.stringify(eventQueue)], { type: 'application/json' }));
        } else {
          var x = new XMLHttpRequest();
          x.open('POST', COLLECT_URL, false);
          x.setRequestHeader('Content-Type', 'application/json');
          x.send(JSON.stringify(eventQueue));
        }
      } catch(e) {}
    }

    window.addEventListener('beforeunload', flushEvents);

    // Retry pending from localStorage
    (function() {
      try {
        var pending = JSON.parse(localStorage.getItem('alPending') || '[]');
        if (!pending.length) return;
        var x = new XMLHttpRequest();
        x.open('POST', COLLECT_URL, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.onload = function() { if (x.status === 200) localStorage.removeItem('alPending'); };
        x.send(JSON.stringify(pending));
      } catch(e) {}
    })();

  } catch(e) {}
})();
