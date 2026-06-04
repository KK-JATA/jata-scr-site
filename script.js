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

const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
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
             <div class="hero-block hero-block-metric"><strong>60,000 m²</strong><span>Smart Manufacturing Facility</span></div>
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

function scheduleNextSlide() {
  window.clearTimeout(heroTimer);
  heroTimer = window.setTimeout(() => {
    setHeroSlide((activeHeroIndex + 1) % heroSlides.length);
    scheduleNextSlide();
  }, 9000);
}

function restartAutoRotate() {
  scheduleNextSlide();
}

heroTabs.forEach((tabButton) => {
  tabButton.setAttribute('aria-pressed', String(tabButton.classList.contains('is-active')));
  tabButton.addEventListener('click', () => {
    setHeroSlide(Number(tabButton.dataset.heroTab));
    restartAutoRotate();
  });
});

if (heroStage) {
  heroStage.addEventListener('mouseenter', () => window.clearTimeout(heroTimer));
  heroStage.addEventListener('mouseleave', restartAutoRotate);
  heroStage.addEventListener('focusin', () => window.clearTimeout(heroTimer));
  heroStage.addEventListener('focusout', restartAutoRotate);
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

// Gallery lightbox — factory images + cert row
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
