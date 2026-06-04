(function(){
  try {
    var SESSION = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    var GVA = (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8888') + '/biz/analytics/event';
    var country = 'Unknown';
    var sectionTimes = {};
    var pageStart = Date.now();

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

    function sendEvent(type, value) {
      try {
        var payload = JSON.stringify({ session: SESSION, country: country, type: type, value: value });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(GVA, payload);
        } else {
          var x = new XMLHttpRequest();
          x.open('POST', GVA, true);
          x.setRequestHeader('Content-Type', 'application/json');
          x.send(payload);
        }
      } catch(e) {}
    }

    // Track hero tab views
    var heroTabTimes = {};
    try {
      var tabs = document.querySelectorAll('[data-hero-tab]');
      for (var i = 0; i < tabs.length; i++) {
        (function(idx) {
          heroTabTimes[idx] = { enter: 0, total: 0 };
          tabs[idx].addEventListener('click', function() {
            // Close previous tab
            for (var k in heroTabTimes) {
              if (heroTabTimes[k].enter > 0) {
                heroTabTimes[k].total += Date.now() - heroTabTimes[k].enter;
                heroTabTimes[k].enter = 0;
              }
            }
            // Start tracking new tab
            heroTabTimes[idx].enter = Date.now();
            var label = (tabs[idx].querySelector('strong') || {}).textContent || 'Tab ' + idx;
            sendEvent('hero_tab', label);
          });
        })(i);
      }
      // Start tracking initial active tab (index 0)
      var activeTab = document.querySelector('.hero-tab.is-active');
      if (activeTab) {
        var activeIdx = parseInt(activeTab.getAttribute('data-hero-tab') || '0');
        heroTabTimes[activeIdx].enter = Date.now();
      }
    } catch(e) {}

    window.addEventListener('beforeunload', function() {
      var now = Date.now();
      for (var id in sectionTimes) {
        if (sectionTimes[id].enter > 0) sectionTimes[id].total += now - sectionTimes[id].enter;
        if (sectionTimes[id].total > 500) {
          sendEvent('section_view', JSON.stringify({
            section: id, duration_ms: Math.round(sectionTimes[id].total),
            total_page_ms: now - pageStart
          }));
        }
      }
      // Report hero tab durations
      for (var t in heroTabTimes) {
        if (heroTabTimes[t].enter > 0) heroTabTimes[t].total += now - heroTabTimes[t].enter;
        if (heroTabTimes[t].total > 300) {
          var tabEl = document.querySelector('[data-hero-tab="'+t+'"]');
          var label = tabEl ? (tabEl.querySelector('strong') || {}).textContent || 'Tab' : 'Tab';
          sendEvent('hero_tab_view', JSON.stringify({
            tab: label, tab_index: parseInt(t),
            duration_ms: Math.round(heroTabTimes[t].total)
          }));
        }
      }
      sendEvent('page_exit', Math.round((now - pageStart) / 1000) + 's');
    });
  } catch(e) {}
})();
