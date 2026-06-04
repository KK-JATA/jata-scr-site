(function(){
  try {
    var SESSION = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    var COLLECT_URL = '/api/collect';
    var country = 'Unknown';
    var sectionTimes = {};
    var pageStart = Date.now();
    var eventQueue = [];

    // Country detection via same-origin Vercel function (no cross-origin prompt)
    try {
      var geoXhr = new XMLHttpRequest();
      geoXhr.open('GET', '/api/geo', true);
      geoXhr.timeout = 5000;
      geoXhr.onload = function() {
        try { var d = JSON.parse(geoXhr.responseText); country = d.country_name || 'Unknown'; } catch(e) {}
      };
      geoXhr.send();
    } catch(e) {}

    // Track sections
    var sections = document.querySelectorAll('section[id], main[id], footer');
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
      eventQueue.push({ session: SESSION, country: country, type: type, value: value });
    }

    // Track hero tab views
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

    // Flush: POST queued events to /api/collect, with localStorage fallback
    function flushEvents() {
      var now = Date.now();
      for (var id in sectionTimes) {
        if (sectionTimes[id].enter > 0) sectionTimes[id].total += now - sectionTimes[id].enter;
        if (sectionTimes[id].total > 500) {
          queueEvent('section_view', JSON.stringify({
            section: id, duration_ms: Math.round(sectionTimes[id].total),
            total_page_ms: now - pageStart
          }));
        }
      }
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
      queueEvent('page_exit', Math.round((now - pageStart) / 1000) + 's');

      if (!eventQueue.length) return;

      // Always back up to localStorage
      try {
        var pending = JSON.parse(localStorage.getItem('alPending') || '[]');
        pending = pending.concat(eventQueue);
        localStorage.setItem('alPending', JSON.stringify(pending));
      } catch(e) {}

      // Try to send to /api/collect
      try {
        if (navigator.sendBeacon) {
          var blob = new Blob([JSON.stringify(eventQueue)], { type: 'application/json' });
          navigator.sendBeacon(COLLECT_URL, blob);
        } else {
          var x = new XMLHttpRequest();
          x.open('POST', COLLECT_URL, false);
          x.setRequestHeader('Content-Type', 'application/json');
          x.send(JSON.stringify(eventQueue));
        }
      } catch(e) {}
    }

    window.addEventListener('beforeunload', flushEvents);

    // Retry unsent localStorage events on next visit
    (function retryPending() {
      try {
        var pending = JSON.parse(localStorage.getItem('alPending') || '[]');
        if (!pending.length) return;
        var x = new XMLHttpRequest();
        x.open('POST', COLLECT_URL, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.onload = function() {
          if (x.status === 200) {
            localStorage.removeItem('alPending');
          }
        };
        x.send(JSON.stringify(pending));
      } catch(e) {}
    })();

  } catch(e) {}
})();
