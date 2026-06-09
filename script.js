const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-nav-toggle]');

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function forceTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

window.addEventListener('load', () => {
  window.requestAnimationFrame(forceTop);
});

window.addEventListener('pageshow', () => {
  window.requestAnimationFrame(forceTop);
});

function closeNav() {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

nav.addEventListener('click', (event) => {
  if (event.target.matches('a')) closeNav();
});

window.addEventListener('scroll', () => {
  header.classList.toggle('has-shadow', window.scrollY > 8);
});

// Scroll spy: underline nav link matching visible section
(function(){
  var navLinks = Array.from(document.querySelectorAll('.site-nav a'));
  // Map nav href → section element  (Home → hero, not the whole <main>)
  var sectionMap = navLinks.map(function(a) {
    var href = a.getAttribute('href');
    if (href === '#top') return document.querySelector('.hero');
    return document.querySelector(href);
  }).filter(Boolean);

  var visible = {};
  var observer = new IntersectionObserver(function(entries) {
    for (var i = 0; i < entries.length; i++) {
      // Identify each section by its class or id
      var key = entries[i].target.classList.contains('hero') ? 'hero'
        : entries[i].target.id || entries[i].target.className;
      visible[key] = entries[i].isIntersecting;
    }
    // Pick the first visible section (topmost in DOM order)
    var active = null;
    for (var j = 0; j < sectionMap.length; j++) {
      var key = sectionMap[j].classList.contains('hero') ? 'hero'
        : sectionMap[j].id || sectionMap[j].className;
      if (visible[key]) { active = sectionMap[j]; break; }
    }
    if (!active) return;
    var activeHref = active.classList.contains('hero') ? '#top' : '#' + (active.id || '');
    navLinks.forEach(function(a) {
      a.classList.toggle('is-active', a.getAttribute('href') === activeHref);
    });
  }, { threshold: 0.25 });

  sectionMap.forEach(function(s) { observer.observe(s); });
})();

const form = document.querySelector('.contact-form');
if (form) {
  var formSubmitting = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formSubmitting) return;
    formSubmitting = true;
    setTimeout(function(){ formSubmitting = false; }, 5000);

    var emailInput = event.currentTarget.querySelector('input[type=email]');
    var emailVal = (emailInput.value || '').trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showToast('Please enter a valid email address.', true);
      return;
    }

    var button = event.currentTarget.querySelector('button');
    var original = button.textContent;
    button.textContent = 'Sending...';
    button.disabled = true;

    var fd = new FormData(event.currentTarget);
    var phoneCode = (fd.get('phoneCode') || '').trim();
    var phoneNum = (fd.get('phone') || '').trim();
    var fullPhone = phoneCode && phoneNum ? phoneCode + ' ' + phoneNum : phoneNum;
    var countryVal = (fd.get('country') || '').trim();

    var lead = {
      customerName: (fd.get('company') || '').trim() || (fd.get('name') || '').trim(),
      contactPerson: (fd.get('name') || '').trim(),
      email: (fd.get('email') || '').trim(),
      phone: fullPhone,
      leadSource: '独立站官网',
      requirementDesc: (fd.get('message') || '').trim() + (countryVal ? '\nCountry: ' + countryVal : ''),
      referrer: document.referrer || window.location.href
    };

    // Always save locally first — never lose a lead
    try {
      var pending = JSON.parse(localStorage.getItem('pendingLeads') || '[]');
      pending.push(lead);
      localStorage.setItem('pendingLeads', JSON.stringify(pending));
    } catch(e) {}

    // Try to submit to GVA
    var url = (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8888') + '/biz/public/lead';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': '2' },
      body: JSON.stringify(lead)
    }).then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.code === 0) {
        // Remove from pending since it was sent successfully
        try {
          var p = JSON.parse(localStorage.getItem('pendingLeads') || '[]');
          p = p.filter(function(l) { return l !== lead; });
          localStorage.setItem('pendingLeads', JSON.stringify(p));
        } catch(e) {}
      }
    }).catch(function() {
      // GVA unreachable — lead already saved in localStorage, will retry later
    });

    // Always show success to the user — never show errors
    showToast('Thank you for your inquiry.<br>Our engineers will contact you via email within 24 hours.');
    button.textContent = original;
    button.disabled = false;
    event.currentTarget.reset();
  });

  // Retry unsent leads every 30 seconds
  function flushPendingLeads() {
    try {
      var pending = JSON.parse(localStorage.getItem('pendingLeads') || '[]');
      if (!pending.length) return;
    } catch(e) { return; }
    var url = (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8888') + '/biz/public/lead';
    var p = JSON.parse(localStorage.getItem('pendingLeads') || '[]');
    var remaining = [];
    var count = p.length;
    p.forEach(function(lead) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': '2' },
        body: JSON.stringify(lead)
      }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.code !== 0) remaining.push(lead);
        count--;
        if (count === 0) localStorage.setItem('pendingLeads', JSON.stringify(remaining));
      }).catch(function() {
        remaining.push(lead);
        count--;
        if (count === 0) localStorage.setItem('pendingLeads', JSON.stringify(remaining));
      });
    });
  }
  setInterval(flushPendingLeads, 30000);
  flushPendingLeads();
}

// Update these five objects when you want to change the hero copy, order, or images.
// The tab labels in index.html should stay in the same order as this array.
const heroSlides = [
  {
    title: 'SCR CATALYST SOLUTIONS',
    titleLine: 'FOR POWER GENERATION AND INDUSTRIAL EMISSIONS',
    body: `<p class="hero-subtitle-cn">Backed by Huadian Environmental  Since 1998</p>
           <p class="hero-partner-line">Manufactured by Huadian Environmental &nbsp;&nbsp;|&nbsp;&nbsp; Represented Globally by JATA Environmental</p>
           <div class="hero-blocks">
             <div class="hero-block hero-block-metric"><strong>60,000 ㎡</strong><span>Smart Manufacturing Facility</span></div>
             <div class="hero-block hero-block-metric"><strong>18,000 m³/year</strong><span>SCR Catalyst Capacity</span></div>
             <div class="hero-block hero-block-metric"><strong>USD 230M</strong><span>Average Annual Turnover</span></div>
             <div class="hero-block"><span class="hero-block-label">Core Business</span><span class="hero-block-text">Catalyst Manufacturing</span></div>
             <div class="hero-block"><span class="hero-block-label">Core Business</span><span class="hero-block-text">Catalyst Recycling</span></div>
             <div class="hero-block"><span class="hero-block-label">Core Business</span><span class="hero-block-text">Environmental EPC</span></div>
           </div>
           <a class="btn primary hero-cta" href="#contact">Discuss Your Project</a>`,
    image: './assets/slide-1.jpg',
    alt: 'Green forest and mountains reflecting clean air'
  },
  {
    title: 'Technology Heritage',
    titleLine: '',
    body: `<p class="hero-subtitle-tech">Built on Cormetech (USA) Technology<br>Industrialized Through Decades of Manufacturing Experience</p>
<p class="hero-body-text">Built on technologies introduced from <strong>Cormetech (USA)</strong>, a recognized pioneer in SCR catalyst development.</p>
           <p class="hero-body-text">Refined through decades of manufacturing experience and continuous process optimization.</p>
           <div class="hero-features-tech">
             <div class="hero-feature-tech"><span class="hero-feature-label">CORMETECH HERITAGE</span><span class="hero-feature-text">Technology platform introduced from Cormetech (USA)</span></div>
             <div class="hero-feature-tech"><span class="hero-feature-label">108-CELL EXPERTISE</span><span class="hero-feature-text">Proven capability in 108-cell SCR catalyst production</span></div>
             <div class="hero-feature-tech"><span class="hero-feature-label">FIELD-PROVEN PERFORMANCE</span><span class="hero-feature-text">Trusted in 1,000+ power generation and industrial applications</span></div>
           </div>
           <a class="btn primary hero-cta-tech" data-hero-goto="2">Explore Why Operators Choose Us</a>`,
    overlay: true,
    image: './assets/slide-3.jpg',
    alt: 'Laboratory research and testing'
  },
  {
    title: 'Why Choose Us',
    titleLine: '',
    body: `<p class="hero-subtitle-why">Built for Long-Term Performance, Not Just Initial Cost</p>
           <a class="btn primary hero-cta-why" href="#contact">Request Technical Consultation</a>
           <div class="hero-why-grid">
             <div class="hero-why-card"><span class="hero-why-label">Energy Group Backing</span><span class="hero-why-text">Manufactured by Huadian Environmental, part of Huadian Group</span></div>
             <div class="hero-why-card"><span class="hero-why-label">Fortune Global 500 Foundation</span><span class="hero-why-text">Backed by one of the world's leading energy enterprises</span></div>
             <div class="hero-why-card"><span class="hero-why-label">Proven Project Experience</span><span class="hero-why-text">SCR catalysts supplied for projects across power and industrial sectors</span></div>
             <div class="hero-why-card"><span class="hero-why-label">Lifecycle Partnership</span><span class="hero-why-text">From catalyst supply to replacement and recycling</span></div>
           </div>`,
    image: './assets/slide-2.jpg',
    alt: 'Industrial power plant'
  },
  {
    title: 'SCR Solutions for Data Center Generators',
    titleLine: '',
    body: `<p class="hero-subtitle-dc">Engineered for Backup Diesel and Gas Generator Emission Control</p>
           <div class="hero-dc-grid">
             <div class="hero-dc-card"><span class="hero-dc-label">Data Center Focus</span><span class="hero-dc-text">Optimized for backup diesel and gas generators</span></div>
             <div class="hero-dc-card"><span class="hero-dc-label">Low NOx Emissions</span><span class="hero-dc-text">Designed to support stringent environmental requirements</span></div>
             <div class="hero-dc-card"><span class="hero-dc-label">Reliable Operation</span><span class="hero-dc-text">Stable catalyst performance during intermittent duty cycles</span></div>
             <div class="hero-dc-card"><span class="hero-dc-label">Flexible Configuration</span><span class="hero-dc-text">Customized catalyst designs for various generator platforms</span></div>
           </div>
           <a class="btn primary hero-cta-dc" href="#contact">Discuss Your Project</a>`,
    image: './assets/slide-4.jpg',
    alt: 'Data center server racks'
  },
  {
    title: 'Multi-Industry Deployment',
    titleLine: '',
    body: `<p class="hero-subtitle-app">Flexible SCR catalyst solutions for diverse combustion environments</p>
           <p class="hero-body-text">Our SCR catalyst systems are engineered for deployment across a wide range of high-temperature emission sources. Beyond specific industries, our technology adapts to different combustion conditions and regulatory requirements worldwide.</p>
           <div class="hero-tag-grid">
             <span class="hero-tag">Marine Vessels</span>
             <span class="hero-tag">Power Plants</span>
             <span class="hero-tag">Gas Turbines</span>
             <span class="hero-tag">Industrial Boilers</span>
             <span class="hero-tag">Cement Kilns</span>
             <span class="hero-tag">Steel Plants</span>
             <span class="hero-tag">Petrochemical Units</span>
             <span class="hero-tag">Offshore Platforms</span>
           </div>
           <p class="hero-emphasis">Not limited to predefined industries — designed for broad industrial emission control applications.<br>China's First Classification Society-Certified SCR Catalyst Manufacturer</p>
           <a class="btn primary hero-cta-app" href="#contact">Discuss Your Project</a>`,
    image: './assets/slide-5.jpg',
    alt: 'Industrial coastline with clean sky'
  }
];

// Hero: static content, slide switching changes background image only
const heroImage = document.querySelector('[data-hero-image]');
const heroTitle = document.querySelector('[data-hero-title]');
const heroBody = document.querySelector('[data-hero-body]');
const heroContent = document.querySelector('.hero-content');
const heroTabs = Array.from(document.querySelectorAll('[data-hero-tab]'));
const heroStage = document.querySelector('[data-hero-stage]');
let activeHeroIndex = 0;
let heroTimer = null;

function setHeroSlide(index) {
  const slide = heroSlides[index];
  if (!slide || !heroImage) return;
  activeHeroIndex = index;

  heroTabs.forEach((tabButton, tabIndex) => {
    tabButton.classList.toggle('is-active', tabIndex === index);
    tabButton.setAttribute('aria-pressed', String(tabIndex === index));
  });

  heroImage.classList.add('is-changing');
  window.setTimeout(() => {
    heroImage.style.backgroundImage = "url('" + slide.image + "')";
    heroImage.setAttribute('aria-label', slide.alt);
    if (slide.title && heroTitle) {
      const line = slide.titleLine || '';
      heroTitle.innerHTML = slide.title + (line ? '<span class="hero-title-sub">' + line + '</span>' : '');
    }
    if (slide.body && heroBody) {
      heroBody.innerHTML = slide.body;
      // Bind slide-jump CTAs inside the new body
      const gotoBtn = heroBody.querySelector('[data-hero-goto]');
      if (gotoBtn) {
        gotoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const target = Number(gotoBtn.getAttribute('data-hero-goto'));
          if (!isNaN(target)) setHeroSlide(target);
        });
      }
    }
    if (heroContent) {
      heroContent.setAttribute('data-hero-index', String(index));
    }
    // Dark overlay for slides that request it
    if (heroStage) {
      heroStage.classList.toggle('slide-overlay', !!slide.overlay);
    }
    heroImage.classList.remove('is-changing');
  }, 140);
}

heroImage.addEventListener('error', () => {
  heroImage.style.backgroundImage = "url('./assets/slide-1.jpg')";
});

heroTabs.forEach((tabButton) => {
  tabButton.setAttribute('aria-pressed', String(tabButton.classList.contains('is-active')));
  tabButton.addEventListener('click', () => {
    setHeroSlide(Number(tabButton.dataset.heroTab));
  });
});

if (heroStage) {
  heroStage.addEventListener('mouseenter', () => window.clearTimeout(heroTimer));
  heroStage.addEventListener('focusin', () => window.clearTimeout(heroTimer));
}

setHeroSlide(0);

// Toast notification
function showToast(msg, isError) {
  var toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.innerHTML = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(function() { toast.classList.add('toast-show'); });
  setTimeout(function() { toast.classList.remove('toast-show'); setTimeout(function() { toast.remove(); }, 300); }, 4000);
}

// Company video: click to play, double-click fullscreen
const companyVideo = document.getElementById('companyVideo');
if (companyVideo) {
  const hero = companyVideo.closest('.video-hero');
  const playBtn = hero.querySelector('.video-play-btn');
  playBtn.addEventListener('click', () => { companyVideo.play(); });
  companyVideo.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (companyVideo.requestFullscreen) companyVideo.requestFullscreen();
  });
  companyVideo.addEventListener('play', () => hero.classList.add('playing'));
  companyVideo.addEventListener('pause', () => hero.classList.remove('playing'));
}

// Continent → Country cascading dropdown
(function(){
  var countries = {
    'North America': ['United States','Canada','Mexico','Cuba','Dominican Republic','Guatemala','Honduras','El Salvador','Nicaragua','Costa Rica','Panama','Jamaica','Bahamas','Trinidad and Tobago'],
    'South America': ['Brazil','Argentina','Chile','Colombia','Peru','Venezuela','Ecuador','Bolivia','Paraguay','Uruguay','Guyana','Suriname'],
    'Europe': ['Germany','United Kingdom','France','Italy','Spain','Netherlands','Belgium','Switzerland','Austria','Sweden','Norway','Denmark','Finland','Iceland','Ireland','Portugal','Greece','Poland','Czech Republic','Romania','Hungary','Bulgaria','Croatia','Slovakia','Slovenia','Lithuania','Latvia','Estonia','Luxembourg','Malta','Cyprus','Serbia','Ukraine','Belarus','Moldova','Georgia','Armenia','Azerbaijan'],
    'Asia': ['China','Japan','South Korea','India','Singapore','Malaysia','Indonesia','Thailand','Vietnam','Philippines','Myanmar','Bangladesh','Pakistan','Sri Lanka','Nepal','Cambodia','Laos','Mongolia','Kazakhstan','Uzbekistan','Turkmenistan','Kyrgyzstan','Tajikistan','Taiwan','Hong Kong','Macau'],
    'Middle East': ['UAE','Saudi Arabia','Qatar','Kuwait','Oman','Bahrain','Israel','Jordan','Lebanon','Iraq','Iran','Yemen','Syria','Palestine'],
    'Africa': ['South Africa','Nigeria','Egypt','Kenya','Morocco','Ethiopia','Tanzania','Ghana','Uganda','Algeria','Tunisia','Libya','Sudan','Angola','Mozambique','Zimbabwe','Zambia','Botswana','Namibia','Mauritius','Senegal','Ivory Coast','Cameroon','Rwanda'],
    'Oceania': ['Australia','New Zealand','Fiji','Papua New Guinea','Solomon Islands','Vanuatu','Samoa']
  };
  var cont = document.getElementById('continentSelect');
  var cntr = document.getElementById('countrySelect');
  Object.keys(countries).forEach(function(c){ var o=document.createElement('option'); o.value=c; o.textContent=c; cont.appendChild(o) });
  cont.addEventListener('change', function(){
    cntr.innerHTML = '<option value="">Select country</option>';
    var list = countries[cont.value] || [];
    list.forEach(function(c){ var o=document.createElement('option'); o.value=c; o.textContent=c; cntr.appendChild(o) });
  });
})();

// Gallery lightbox – factory images + cert row
const galleryImages = document.querySelectorAll('.factory-gallery img, .cert-row img');
galleryImages.forEach(img => {
  img.style.cursor = 'pointer';
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;cursor:pointer;';
    const clone = img.cloneNode(true);
    clone.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;';
    overlay.appendChild(clone);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  });
});

const serviceGalleryImages = document.querySelectorAll('.service-card-media img');
serviceGalleryImages.forEach((img) => {
  img.setAttribute('role', 'button');
  img.setAttribute('tabindex', '0');
  const openServiceImage = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;';
    const clone = img.cloneNode(true);
    clone.style.cssText = 'max-width:min(92vw, 1280px);max-height:92vh;object-fit:contain;border-radius:4px;box-shadow:0 24px 80px rgba(0,0,0,0.45);';
    overlay.appendChild(clone);
    overlay.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') overlay.remove();
    });
    document.body.appendChild(overlay);
    overlay.focus();
  };
  img.addEventListener('click', openServiceImage);
  img.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openServiceImage();
    }
  });
});

const techProofImages = document.querySelectorAll('.tech-visual img');
techProofImages.forEach((img) => {
  const openTechProof = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;';
    const clone = img.cloneNode(true);
    clone.style.cssText = 'max-width:min(92vw, 1320px);max-height:92vh;object-fit:contain;border-radius:6px;box-shadow:0 24px 80px rgba(0,0,0,0.45);';
    overlay.appendChild(clone);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  };
  img.addEventListener('click', openTechProof);
});

const productAppData = [
  {
    name: 'Conventional SCR Catalyst',
    image: './assets/product-108/product-1.png',
    industries: ['Power Plants', 'Boilers', 'Industrial Furnaces'],
    features: ['Stable performance', 'Mature formulation', 'Balanced cost-performance'],
    params: [
      ['HDD-30TN', '30×30', '4.95', '0.5', '80.7', '719'],
      ['HDD-35TN', '35×35', '4.25', '0.4', '81.3', '841'],
      ['HDD-40TN', '40×40', '3.7', '0.37', '81.2', '961'],
      ['HDD-45TN', '45×45', '3.3', '0.33', '81.2', '1082'],
      ['HDD-50TS', '50×50', '3.0', '0.4', '75.3', '1157'],
      ['HDD-55TN', '55×55', '2.8', '0.28', '79', '1335'],
      ['HDD-70TN', '70×70', '2.1', '0.22', '84', '1709'],
      ['HDD-108TN', '108×108', '1.4', '0.22', '71', '2428']
    ]
  },
  {
    name: 'Low-Temperature SCR Catalyst',
    image: './assets/product-108/product-2.png',
    industries: ['Low-Temp Applications', 'Coking Gas', 'Tail Gas Treatment'],
    features: ['Low-temperature activity', 'Fast light-off', 'Wide operating window'],
    params: [
      ['LT-30', '30×30', '4.90', '0.50', '79.5', '705'],
      ['LT-35', '35×35', '4.20', '0.40', '80.8', '832'],
      ['LT-40', '40×40', '3.70', '0.37', '80.4', '948'],
      ['LT-45', '45×45', '3.25', '0.33', '80.0', '1068']
    ]
  },
  {
    name: 'Wide-Pore SCR Catalyst',
    image: './assets/product-108/product-3.jpg',
    industries: ['High-Dust Flue Gas', 'Biomass', 'Solid Fuel Units'],
    features: ['Wider pore channel', 'Dust resistance', 'Reduced plugging risk'],
    params: [
      ['WP-35', '35×35', '4.30', '0.40', '81.0', '810'],
      ['WP-40', '40×40', '3.80', '0.38', '80.6', '920'],
      ['WP-45', '45×45', '3.40', '0.34', '80.1', '1040']
    ]
  },
  {
    name: 'Dust-Tolerant SCR Catalyst for Harsh Conditions',
    image: './assets/product-108/product-4.jpg',
    industries: ['High Dust Load', 'Harsh Industrial Sites', 'Retrofit Projects'],
    features: ['High dust tolerance', 'Stable pressure drop', 'Long service life'],
    params: [
      ['HD-40', '40×40', '3.75', '0.38', '80.3', '940'],
      ['HD-45', '45×45', '3.30', '0.34', '80.0', '1055'],
      ['HD-50', '50×50', '3.00', '0.30', '79.4', '1140']
    ]
  },
  {
    name: 'Plate-Type SCR Catalyst',
    image: './assets/product-108/product-5.png',
    industries: [
      'Waste-to-Energy (WTE)',
      'Biomass Power Plants',
      'Coal-Fired Power Plants',
      'Cement Plants',
      'Steel & Sintering Plants',
      'Iron Ore Pelletizing Plants',
      'Glass Manufacturing',
      'Petrochemical Plants',
      'Refineries',
      'Chemical Processing Plants',
      'Non-Ferrous Metal Smelters',
      'Industrial Boilers',
      'Municipal Solid Waste Incinerators'
    ],
    features: [
      'High Dust Tolerance',
      'Low Pressure Drop',
      'High Mechanical Strength',
      'Extended Service Life'
    ],
    params: [
      ['Flat plate unit', 'Smallest building block of plate catalysts.'],
      ['Corrugated plate type', 'Alternating flat and corrugated plates, wrapped by a steel shell.']
    ]
  },
  {
    name: '108-Cell SCR Catalyst for Internal Combustion Engines',
    image: './assets/product-108/product-108.png',
    industries: ['Internal Combustion Engines', 'Natural Gas Generator Sets'],
    features: ['108-cell geometry', 'High-efficiency SCR design', 'Engine-focused solution'],
    params: [
      ['HDD-108TN', '108×108', '1.4', '0.22', '71', '2428']
    ]
  }
];

function renderProductApp(index) {
  const stage = document.querySelector('[data-product-stage]');
  if (!stage) return;
  const data = productAppData[index] || productAppData[0];
  const image = stage.querySelector('[data-product-image]');
  const industries = stage.querySelector('[data-product-industries]');
  const features = stage.querySelector('[data-product-features]');
  const tbody = stage.querySelector('[data-product-params] tbody');
  const tableWrap = stage.querySelector('.param-table-wrap');
  const notes = stage.querySelector('[data-product-notes]');
  stage.setAttribute('data-active-product', String(index));

  if (image) {
    image.src = data.image + '?v=20260609';
    image.alt = data.name;
    image.onerror = () => {
      image.removeAttribute('src');
      image.alt = data.name + ' image unavailable';
    };
  }

  if (industries) {
    industries.innerHTML = data.industries.map((item) => '<span class="tag">' + item + '</span>').join('');
  }

  if (features) {
    features.innerHTML = data.features.map((item) => '<span class="tag">' + item + '</span>').join('');
  }

  if (tbody) {
    tbody.innerHTML = data.params.map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join('') + '</tr>').join('');
  }

  if (tableWrap && notes) {
    if (data.name === 'Plate-Type SCR Catalyst') {
      tableWrap.hidden = true;
      notes.hidden = false;
      notes.innerHTML = data.params.map((row) => '<div class="param-note-box"><strong>' + row[0] + '</strong><p>' + row[1] + '</p></div>').join('');
    } else {
      tableWrap.hidden = false;
      notes.hidden = true;
      notes.innerHTML = '';
    }
  }

  document.querySelectorAll('.product-app-item').forEach((btn, btnIndex) => {
    btn.classList.toggle('is-active', btnIndex === index);
  });
}

document.querySelectorAll('.product-app-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    renderProductApp(Number(btn.getAttribute('data-product-index')));
  });
});

function openProductOverlay(type) {
  const stage = document.querySelector('[data-product-stage]');
  if (!stage) return;
  const activeIndex = Number(stage.getAttribute('data-active-product') || '0');
  const data = productAppData[activeIndex] || productAppData[0];

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(7,19,32,0.92);display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;';

  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(92vw, 1280px);max-height:92vh;background:rgba(15,23,34,0.95);border:1px solid rgba(255,255,255,0.14);border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,0.45);overflow:auto;padding:18px;';

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = data.image + '?v=20260609';
    img.alt = data.name;
    img.style.cssText = 'display:block;width:100%;height:auto;max-height:84vh;object-fit:contain;border-radius:8px;background:rgba(255,255,255,0.04);';
    panel.appendChild(img);
  } else {
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;color:#fff;table-layout:fixed;';
    table.innerHTML = '<thead><tr><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Product</th><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Cell Size</th><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Pitch mm</th><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Wall Thickness mm</th><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Open Area %</th><th style="text-align:left;padding:10px 8px;color:#9ee0e8;">Specific Surface Area</th></tr></thead><tbody>' + data.params.map((row) => '<tr>' + row.map((cell) => '<td style="padding:9px 8px;border-top:1px solid rgba(255,255,255,0.10);white-space:nowrap;">' + cell + '</td>').join('') + '</tr>').join('') + '</tbody>';
    panel.appendChild(table);
  }

  overlay.appendChild(panel);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

const productImage = document.querySelector('[data-product-image]');
if (productImage) {
  productImage.addEventListener('click', () => openProductOverlay('image'));
}

const productParamZoom = document.querySelector('[data-product-zoom]');
if (productParamZoom) {
  productParamZoom.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openProductOverlay('table');
  });
}

productAppData[0] = {
  name: 'Conventional SCR Catalyst',
  image: './assets/product-108/product-1.png',
  industries: ['Power Plants', 'Coal-Fired Power Plants'],
  features: [
    'Integrated extruded structure with active performance',
    'High open area ratio with thin-wall catalyst above 80%',
    'Low pressure drop',
    'High specific surface area',
    'Low SO2 conversion',
    'Excellent abrasion resistance',
    'Operating temperature range 300-420°C',
    'Catalyst life > 24,000 hours'
  ],
  params: [
    ['HDC-16TS', '16×16', '9.3', '0.86', '80.8', '384'],
    ['HDC-18TN', '18×18', '8.2', '0.78', '80.0', '430'],
    ['HDC-18TS', '18×18', '8.2', '0.83', '79.4', '428'],
    ['HDC-20TN', '20×20', '7.4', '0.7', '80.8', '479'],
    ['HDC-20TS', '20×20', '7.4', '0.8', '78.6', '473'],
    ['HDC-20TW', '20×20', '7.4', '1', '72.8', '455'],
    ['HDC-22TN', '22×22', '6.75', '0.59', '82.5', '533'],
    ['HDC-25TN', '25×25', '5.9', '0.58', '80.2', '597']
  ]
};
productAppData[1] = {
  name: 'Low-Temperature SCR Catalyst',
  image: './assets/product-108/product-2.png',
  industries: ['Glass', 'Petrochemical', 'Metallurgy', 'Steel', 'Refractory Materials', 'Biomass Power Generation', 'Waste Incineration'],
  features: [
    'Integrated extruded structure with active performance',
    'High open area ratio, low pressure drop',
    'High specific surface area, high activity K value, low catalyst loading',
    'Suitable for flue gas with SO2 concentration < 50 mg/m3',
    'Operating temperature range 160-450°C',
    'Catalyst life > 16,000 hours'
  ],
  params: [
    ['HDW-16TS', '16×16', '9.3', '0.86', '80.8', '384'],
    ['HDW-18TS', '18×18', '8.2', '0.83', '79.4', '428'],
    ['HDW-20TS', '20×20', '7.4', '0.8', '78.6', '473'],
    ['HDW-22TN', '22×22', '6.75', '0.59', '82.5', '533'],
    ['HDW-25TN', '25×25', '5.9', '0.58', '80.2', '597'],
    ['HDW-30TN', '30×30', '4.95', '0.5', '80.7', '719'],
    ['HDW-35TN', '35×35', '4.25', '0.4', '81.3', '841'],
    ['HDW-40TN', '40×40', '3.7', '0.37', '81.2', '961'],
    ['HDW-45TN', '45×45', '3.3', '0.33', '81.2', '1082'],
    ['HDW-50TS', '50×50', '3.0', '0.4', '75.3', '1157']
  ]
};
productAppData[2] = {
  name: 'Wide-Pore SCR Catalyst',
  image: './assets/product-108/product-3.jpg',
  industries: ['Gas Generator Sets', 'Marine Vessels', 'Steel Sintering Machines', 'Internal Combustion Engines', 'Glass Kilns'],
  features: [
    'Integrated extruded structure with active performance',
    'High open area ratio (up to 80%)',
    'Low pressure drop',
    'High specific surface area',
    'High activity K value',
    'Operating temperature range 160-450°C',
    'Catalyst life > 30,000 hours'
  ],
  params: [
    ['HDD-30TN', '30×30', '4.95', '0.5', '80.7', '719'],
    ['HDD-35TN', '35×35', '4.25', '0.4', '81.3', '841'],
    ['HDD-40TN', '40×40', '3.7', '0.37', '81.2', '961'],
    ['HDD-45TN', '45×45', '3.3', '0.33', '81.2', '1082'],
    ['HDD-50TS', '50×50', '3.0', '0.4', '75.3', '1157'],
    ['HDD-55TN', '55×55', '2.8', '0.28', '79', '1335'],
    ['HDD-70TN', '70×70', '2.1', '0.22', '84', '1709'],
    ['HDD-108TN', '108×108', '1.4', '0.22', '71', '2428']
  ]
};
productAppData[3] = {
  name: 'Dust-Tolerant SCR Catalyst for Harsh Conditions',
  image: './assets/product-108/product-4.jpg',
  industries: ['Cement Kilns', 'Waste Incineration Power Generation', 'Steel Sintering'],
  features: [
    'Integrated monolithic extruded structure',
    'Full active surface design',
    'Catalyst life > 24,000 hours',
    'Suitable for high-dust flue gas conditions',
    'Can help remove dioxins and VOC pollutants',
    'Operating temperature range 160-450°C'
  ],
  params: [
    ['HDC-13TN', '13×13', '11.35', '1.5', '73.7', '298'],
    ['HDC-8×16TN', '16×8', '18.5×9.3', '1.2', '80.2', '290'],
    ['HDC-30TN', '30×30', '4.95', '0.5', '80.7', '719'],
    ['HDC-35TN', '35×35', '4.25', '0.4', '81.3', '841'],
    ['HDC-40TN', '40×40', '3.7', '0.37', '81.2', '961'],
    ['HDC-45TN', '45×45', '3.3', '0.33', '81.2', '1082'],
    ['HDC-50TS', '50×50', '3.0', '0.4', '75.3', '1157']
  ]
};
renderProductApp(0);
