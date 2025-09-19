// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Elements
const htmlEl = document.documentElement;
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const themeToggle = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');

const themeIconBlackhole = document.querySelector('.theme-blackhole');
const themeIconSunrise = document.querySelector('.theme-sunrise');
const themeIconBlueSun = document.querySelector('.theme-bluesun'); // reused for nebula if no dedicated icon

const grid = document.getElementById('grid');
const searchBox = document.getElementById('searchBox');
const categoryList = document.getElementById('categoryList');
const resetFilters = document.getElementById('resetFilters');
const toggleAnimations = document.getElementById('toggleAnimations');
const emptyState = document.getElementById('emptyState');

const blackholeRise = document.getElementById('blackhole-rise');
const sunriseSweep = document.getElementById('sunrise-sweep');
const bluesunWave = document.getElementById('bluesun-wave'); // nebula also uses this overlay
const cursorGlass = document.querySelector('.cursor-glass');

// Categories (Windows, Android, iOS/Web, Websites, Database, Developing)
const CATEGORIES = [
  { key: 'all',        label: 'All', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"/></svg></span>` },
  { key: 'windows',    label: 'Windows', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 4l8-1v9H3V4zm10-1l8-1v10h-8V3zM3 13h8v8l-8-1v-7zm10 0h8v9l-8-1v-8z"/></svg></span>` },
  { key: 'android',    label: 'Android', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4l1-2 .9.44L9 4h6l-.9-1.56.9-.44 1 2H8zm9 4a1 1 0 011 1v7a2 2 0 01-2 2h-1v3a1 1 0 01-2 0v-3H11v3a1 1 0 01-2 0v-3H8a2 2 0 01-2-2V9a1 1 0 011-1h10zM6 9v7a1 1 0 001 1h10a1 1 0 001-1V9H6z"/></svg></span>` },
  { key: 'iosweb',     label: 'iOS/Web', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 100 18 9 9 0 000-18zm-1 2.06V11H5.06A7 7 0 0111 5.06zM5.06 13H11v5.94A7 7 0 015.06 13zM13 18.94V13h5.94A7 7 0 0113 18.94zM13 11V5.06A7 7 0 0118.94 11H13z"/></svg></span>` },
  { key: 'websites',   label: 'Websites', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 100 18 9 9 0 000-18zm7 9a7 7 0 01-1.07 3.75H6.07A7 7 0 1119 12z"/></svg></span>` },
  { key: 'database',   label: 'Database Projects', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7 3 3 4.79 3 7v10c0 2.21 4 4 9 4s9-1.79 9-4V7c0-2.21-4-4-9-4zm0 2c4.42 0 7 .98 7 2s-2.58 2-7 2-7-.98-7-2 2.58-2 7-2zm0 12c-4.42 0-7-.98-7-2V9.73C6.11 10.5 8.7 11 12 11s5.89-.5 7-1.27V15c0 1.02-2.58 2-7 2z"/></svg></span>` },
  { key: 'developing', label: 'Developing', icon: `<span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z"/></svg></span>` },
];

// Theme cycle (added "nebula")
const THEMES = ['blackhole','sunrise','bluesun','nebula'];
let activeCategory = 'all';

// Preserve original card nodes so regrouping doesn't lose items
const ALL_CARDS = grid ? Array.from(grid.querySelectorAll('article.card')) : [];

// Center scrolling helper (scroll an element to the vertical middle of viewport)
// Center scrolling helper (scroll an element to the vertical middle of viewport)
function scrollToCenter(el) {
  if (!el) return;

  // Do nothing on phones (keep page scroll natural on mobile)
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
    return;
  }

  const rect = el.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const targetTop = rect.top + scrollY - (window.innerHeight / 2 - rect.height / 2);
  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

/* Build category list with counts and icons */
function buildCategoryList(){
  if(!categoryList) return;
  const counts = countByCategory();
  categoryList.innerHTML = '';
  CATEGORIES.forEach(cat=>{
    const count = cat.key === 'all' ? counts.all : (counts[cat.key] || 0);
    const btn = document.createElement('button');
    btn.className = 'glass cat-btn group w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition';
    btn.dataset.cat = cat.key;
    btn.setAttribute('aria-pressed', cat.key === activeCategory ? 'true':'false');
    btn.innerHTML = `
      <span class="flex items-center gap-2 font-semibold">
        ${cat.icon}
        <span>${cat.label}</span>
      </span>
      <span class="chip">${count}</span>
    `;
    btn.addEventListener('click', ()=>{
      activeCategory = cat.key;
      buildCategoryList();
      applyFiltersNoBlink();
      // After filtering, center the first visible item (or the grid) in viewport
      requestAnimationFrame(()=>{
        const firstVisible = grid?.querySelector('article.card, .group-header');
        scrollToCenter(firstVisible || grid);
      });
    });
    categoryList.appendChild(btn);
  });
}

function countByCategory(){
  const counts = { all: ALL_CARDS.length };
  ALL_CARDS.forEach(card=>{
    const cat = card.getAttribute('data-cat') || '';
    counts[cat] = (counts[cat]||0)+1;
  });
  return counts;
}

/* No-blink filter + grouped "All" view */
function applyFiltersNoBlink(){
  if(!grid) return;
  const q = (searchBox?.value || '').trim().toLowerCase();

  // Determine matched cards
  const matches = ALL_CARDS.filter(card=>{
    const cat = card.getAttribute('data-cat') || '';
    const tags = (card.getAttribute('data-tags')||'').toLowerCase();
    const name = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
    const matchCat = (activeCategory === 'all') || (cat === activeCategory);
    const matchText = !q || tags.includes(q) || name.includes(q);
    return matchCat && matchText;
  });

  // Rebuild grid content (keep equal heights via CSS; no flicker)
  const frag = document.createDocumentFragment();

  if(activeCategory !== 'all'){
    matches.forEach(card=> frag.appendChild(card));
  } else {
    // Grouped by category with headers
    CATEGORIES.forEach(cat=>{
      if(cat.key === 'all') return;
      const groupCards = matches.filter(c => (c.getAttribute('data-cat')||'') === cat.key);
      if(groupCards.length){
        const header = document.createElement('div');
        header.className = 'group-header';
        header.textContent = `${cat.label} (${groupCards.length})`;
        frag.appendChild(header);
        groupCards.forEach(c => frag.appendChild(c));
      }
    });
  }

  grid.innerHTML = '';
  if(matches.length){
    grid.appendChild(frag);
    matches.forEach(card=>{
      card.style.display = '';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  }

  // Rebind effects to moved nodes
  bindTilt();
  rebindReveal();

  emptyState?.classList.toggle('hidden', matches.length > 0);
}

/* Pointer-driven effects */
document.addEventListener('pointermove', (e)=>{
  // Liquid button sheen
  document.querySelectorAll('.liquid-btn').forEach(btn=>{
    const r = btn.getBoundingClientRect();
    const x = ((e.clientX - r.left)/r.width)*100;
    const y = ((e.clientY - r.top)/r.height)*100;
    btn.style.setProperty('--x', x+'%');
    btn.style.setProperty('--y', y+'%');
  });
  // Cursor glass spotlight
  if(cursorGlass){
    cursorGlass.style.left = e.clientX + 'px';
    cursorGlass.style.top  = e.clientY + 'px';
  }
});

/* Tilt effect binder (also sets per-card liquid glow origin) */
function bindTilt(el){
  const targetEls = el ? [el] : document.querySelectorAll('.tilt');
  targetEls.forEach(elm=>{
    const strength = 12;
    let raf = null;
    function onMove(e){
      const r = elm.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - 0.5;
      const py = (e.clientY - r.top)/r.height - 0.5;
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        elm.style.transform = `rotateY(${px*strength}deg) rotateX(${-(py*strength)}deg)`;
        const mx = ((e.clientX - r.left)/r.width)*100;
        const my = ((e.clientY - r.top)/r.height)*100;
        elm.style.setProperty('--mx', `${mx}%`);
        elm.style.setProperty('--my', `${my}%`);
      });
    }
    elm.addEventListener('pointermove', onMove);
    elm.addEventListener('pointerleave', ()=>{ elm.style.transform = 'rotateY(0deg) rotateX(0deg)'; });
  });
}
bindTilt();

/* Reveal on view (re-usable) */
let observer = null;
function rebindReveal(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  },{ threshold:.14 });
  document.querySelectorAll('.card,.feature,.stat').forEach(el=>{
    el.classList.add('reveal');
    observer.observe(el);
  });
}
rebindReveal();

// Build categories and initial filter
buildCategoryList();
applyFiltersNoBlink();

/* Patch: Fix Project X image and replace Project Nova with Project Aegis */
(function fixAndReplaceProjects(){
  // Fix Project X image (if present)
  const imgX = document.querySelector('img[alt="Project X"]');
  if (imgX) {
    imgX.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=60&auto=format&fit=crop';
  }
  // Replace Project Nova -> Project Aegis (if present)
  const imgNova = document.querySelector('img[alt="Project Nova"]');
  if (imgNova) {
    imgNova.alt = 'Project Aegis';
    imgNova.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=60&auto=format&fit=crop';
    const card = imgNova.closest('.card');
    if (card) {
      const titleEl = card.querySelector('.card-title');
      if (titleEl) titleEl.innerHTML = titleEl.innerHTML.replace('Project Nova', 'Project Aegis');
      const descEl = card.querySelector('.card-desc');
      if (descEl) descEl.textContent = 'High-throughput transcoding orchestrator with auto-scaling.';
    }
  }
})();

/* Cosmos background: multi-color star types with unique sizes/speeds + constellations + comets + neutron star + 4 themes + orbit tracks */
(function cosmos(){
  const canvas = document.getElementById('cosmos');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, cx, cy, t=0;
  let pointer = {x: 0.5, y: 0.5};

  // Orbit track tuning (the "ellipse road" where planets travel) — REDUCED OPACITY BY 50%
  const ORBIT_OPACITY = 0.15;  // was 0.30; now 50% lower
  const ORBIT_WIDTH   = 1.1;   // base px at 1x DPR
  const ORBIT_SHADOW  = 0;     // optional glow (0..20)

  // Stars with varied colors, sizes, and unique blink speeds
  const STARS_COUNT = 280;
  const stars = [];

  // Simple star "types" to vary color/size/twinkle
  const STAR_TYPES = [
    { name:'blue',   rgb:['160,210,255','140,200,255'], size:[0.9,1.6], tw:[0.012,0.024] },
    { name:'white',  rgb:['230,240,255','200,230,255'], size:[0.7,1.3], tw:[0.006,0.016] },
    { name:'yellow', rgb:['255,240,200','255,220,160'], size:[0.8,1.5], tw:[0.008,0.018] },
    { name:'orange', rgb:['255,210,160','255,190,150'], size:[1.0,1.9], tw:[0.007,0.017] },
    { name:'mag',    rgb:['255,170,220','200,160,255'], size:[0.9,1.7], tw:[0.010,0.022] },
  ];
  const TYPE_WEIGHTS = [0.25, 0.25, 0.20, 0.18, 0.12];

  function pickType(){
    const r = Math.random();
    let acc = 0;
    for (let i=0;i<TYPE_WEIGHTS.length;i++){
      acc += TYPE_WEIGHTS[i];
      if (r <= acc) return STAR_TYPES[i];
    }
    return STAR_TYPES[STAR_TYPES.length-1];
  }

  // Constellations (star patterns): faint lines connecting small local chains
  let constellations = []; // array of segments: {x1,y1,x2,y2,alpha}
  function buildConstellations(){
    constellations = [];
    const COLS = 4, ROWS = 3;
    const cellW = w / COLS;
    const cellH = h / ROWS;
    for(let cyi=0; cyi<ROWS; cyi++){
      for(let cxi=0; cxi<COLS; cxi++){
        const cellStars = stars.filter(s => s.x >= cxi*cellW && s.x < (cxi+1)*cellW && s.y >= cyi*cellH && s.y < (cyi+1)*cellH);
        if(cellStars.length < 4) continue;
        const pool = cellStars.slice().sort(()=>Math.random()-0.5);
        const chainLen = 3 + Math.floor(Math.random()*3); // 3..5
        const chain = pool.slice(0, chainLen);
        for(let i=0;i<chain.length-1;i++){
          const a = chain[i], b = chain[i+1];
          const alpha = 0.08 + Math.random()*0.06; // faint
          constellations.push({ x1:a.x, y1:a.y, x2:b.x, y2:b.y, alpha });
        }
      }
    }
  }

  // Comets with glowing tails
  const comets = [];
  let cometTimer = 0;
  function resetCometTimer(){
    cometTimer = Math.floor(600 + Math.random()*1200); // frames between 10s and ~20s at 60fps
  }
  function spawnComet(){
    const edge = Math.floor(Math.random()*4);
    let x, y, vx, vy;
    const speed = (2 + Math.random()*2) * devicePixelRatio; // px/frame
    switch(edge){
      case 0: // top -> down-right
        x = Math.random()*w; y = -50*devicePixelRatio;
        vx = (Math.random()*0.5+0.2)*speed; vy = (Math.random()*0.8+0.4)*speed;
        break;
      case 1: // right -> left-down
        x = w+50*devicePixelRatio; y = Math.random()*h;
        vx = -(Math.random()*0.8+0.4)*speed; vy = (Math.random()*0.5+0.2)*speed;
        break;
      case 2: // bottom -> up-left
        x = Math.random()*w; y = h+50*devicePixelRatio;
        vx = -(Math.random()*0.5+0.2)*speed; vy = -(Math.random()*0.8+0.4)*speed;
        break;
      default: // left -> right-up
        x = -50*devicePixelRatio; y = Math.random()*h;
        vx = (Math.random()*0.8+0.4)*speed; vy = -(Math.random()*0.5+0.2)*speed;
        break;
    }
    const life = Math.floor(300 + Math.random()*240); // frames
    comets.push({ x,y,vx,vy, life, trail: [] });
    resetCometTimer();
  }

  function starThemeAdjustment(typeRGB){
    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    if(theme==='sunrise'){
      return typeRGB.replace(/(\d+),(\d+),(\d+)/, (m,r,g,b)=>`${Math.min(255, parseInt(r)+10)},${Math.min(255, parseInt(g)+10)},${Math.max(0, parseInt(b)-10)}`);
    }
    if(theme==='nebula'){
      return typeRGB.replace(/(\d+),(\d+),(\d+)/, (m,r,g,b)=>`${Math.min(255, parseInt(r)+10)},${Math.max(0, parseInt(g)-5)},${Math.min(255, parseInt(b)+10)}`);
    }
    return typeRGB;
  }

  function rebuildStars(){
    stars.length = 0;
    for(let i=0;i<STARS_COUNT;i++){
      const type = pickType();
      const rgb = starThemeAdjustment(type.rgb[Math.floor(Math.random()*type.rgb.length)]);
      const sz = (type.size[0] + Math.random()*(type.size[1]-type.size[0])) * devicePixelRatio;
      const tw = type.tw[0] + Math.random()*(type.tw[1]-type.tw[0]);
      stars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        baseR: sz,
        r: sz,
        a: Math.random()*Math.PI*2,  // twinkle phase
        tw,                           // unique twinkle speed
        blinkAt: Math.random()*600+200,
        blinkDur: Math.floor(Math.random()*24)+8,
        blinking: 0,
        rgb
      });
    }
    buildConstellations();
  }

  function resize(){
    w = canvas.width = innerWidth * devicePixelRatio;
    h = canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    cx = w/2; cy = h/2;
    rebuildStars();
  }

  const planets = [
    { a: 90,  b: 60,  size: 3.5, speed: 0.018, hue: 190, trail: [] },
    { a: 140, b: 85,  size: 4.5, speed: 0.012, hue: 280, trail: [] },
    { a: 200, b: 120, size: 6.0, speed: 0.009, hue: 140, trail: [] },
    { a: 270, b: 160, size: 7.5, speed: 0.007, hue: 20,  trail: [] },
    { a: 360, b: 220, size: 9.0, speed: 0.005, hue: 50,  trail: [] },
  ];
  const neutron = { a: 420, b: 290, speed: 0.0042, size: 5.5*devicePixelRatio, angle: 0 };

  function drawOrbit(a,b){
    ctx.save();
    ctx.translate(cx, cy);
    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    const rgb = theme==='sunrise' ? '255,200,140'
              : theme==='bluesun' ? '120,200,255'
              : theme==='nebula'  ? '200,170,255'
              : '160,200,255';
    ctx.strokeStyle = `rgba(${rgb}, ${ORBIT_OPACITY})`;
    ctx.lineWidth = ORBIT_WIDTH * devicePixelRatio;
    if (ORBIT_SHADOW > 0){
      ctx.shadowColor = `rgba(${rgb}, ${Math.min(ORBIT_OPACITY, 0.6)})`;
      ctx.shadowBlur = ORBIT_SHADOW * devicePixelRatio;
    }
    ctx.beginPath();
    ctx.ellipse(0,0,a,b,0,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStars(){
    for(const s of stars){
      s.a += s.tw;
      let pulse = 0.55 + 0.45*Math.sin(s.a*60);
      if(s.blinking > 0){
        pulse *= 0.1;
        s.blinking--;
      }else if(--s.blinkAt <= 0){
        s.blinking = s.blinkDur;
        s.blinkAt = Math.random()*600+200;
      }
      const rr = s.baseR*(0.75 + 0.5*pulse);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${s.rgb},${0.22 + 0.6*pulse})`;
      ctx.arc(s.x, s.y, rr, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function drawConstellations(){
    if(!constellations.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    const color = theme==='sunrise' ? '255,210,150' :
                  theme==='nebula'  ? '200,170,255' :
                                      '160,200,255';
    ctx.lineWidth = 0.8 * devicePixelRatio;
    for(const seg of constellations){
      // REDUCED STAR PATTERN (CONSTELLATION) OPACITY BY 50%
      ctx.strokeStyle = `rgba(${color}, ${seg.alpha * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawComets(){
    if(cometTimer-- <= 0) spawnComet();

    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    const headColor = theme==='sunrise' ? '255,220,170' :
                      theme==='nebula'  ? '200,180,255' :
                                          '200,230,255';
    const tailColor = theme==='sunrise' ? '255,200,150' :
                      theme==='nebula'  ? '160,140,240' :
                                          '140,200,255';

    for(let i=comets.length-1; i>=0; i--){
      const c = comets[i];
      c.x += c.vx;
      c.y += c.vy;
      c.life--;

      c.trail.push({ x:c.x, y:c.y });
      if(c.trail.length > 42) c.trail.shift();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for(let j=0;j<c.trail.length;j++){
        const p = c.trail[j];
        const alpha = (j / c.trail.length) * 0.35;
        const rad = (1.5 + j*0.15) * devicePixelRatio;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${tailColor}, ${alpha})`;
        ctx.arc(p.x, p.y, rad, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(${headColor}, 0.9)`;
      ctx.arc(c.x, c.y, 2.8*devicePixelRatio, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      if(c.life <= 0 || c.x < -100*devicePixelRatio || c.x > w+100*devicePixelRatio || c.y < -100*devicePixelRatio || c.y > h+100*devicePixelRatio){
        comets.splice(i,1);
      }
    }
  }

  function drawCenter(){
    ctx.save();
    ctx.translate(cx, cy);

    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    if(theme === 'sunrise'){
      const R = 50*devicePixelRatio;
      const g = ctx.createRadialGradient(0,0,0, 0,0,R);
      g.addColorStop(0, 'rgba(255,230,160,1)');
      g.addColorStop(0.5,'rgba(255,180,80,0.95)');
      g.addColorStop(1,'rgba(255,120,60,0.22)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();
      ctx.shadowColor = 'rgba(255,200,120,0.6)';
      ctx.shadowBlur = 40*devicePixelRatio;
      ctx.beginPath(); ctx.arc(0,0,R*0.7,0,Math.PI*2); ctx.fill();
    } else if (theme === 'bluesun'){
      const R = 46*devicePixelRatio;
      const g = ctx.createRadialGradient(0,0,0, 0,0,R);
      g.addColorStop(0,'rgba(140,220,255,1)');
      g.addColorStop(0.55,'rgba(100,180,255,0.95)');
      g.addColorStop(1,'rgba(60,120,255,0.22)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();
      ctx.shadowColor = 'rgba(120,200,255,0.6)';
      ctx.shadowBlur = 42*devicePixelRatio;
      ctx.beginPath(); ctx.arc(0,0,R*0.72,0,Math.PI*2); ctx.fill();
    } else if (theme === 'nebula'){
      // Nebula: soft purple/teal cloud core
      const R = 60*devicePixelRatio;
      const g1 = ctx.createRadialGradient(0,0,0, 0,0,R);
      g1.addColorStop(0,'rgba(200,180,255,0.9)');
      g1.addColorStop(1,'rgba(120,80,200,0.15)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g1;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();
      const g2 = ctx.createRadialGradient(0,0,0, 0,0,R*0.7);
      g2.addColorStop(0,'rgba(120,210,255,0.8)');
      g2.addColorStop(1,'rgba(60,120,255,0.12)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(0,0,R*0.7,0,Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const R = 40*devicePixelRatio;
      const g = ctx.createRadialGradient(0,0,0, 0,0,R);
      g.addColorStop(0,'rgba(0,0,0,1)');
      g.addColorStop(1,'rgba(0,0,0,0.2)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();

      // Accretion disk (kept semi-transparent)
      const diskR = 72*devicePixelRatio;
      ctx.lineWidth = 16*devicePixelRatio;
      const grad = ctx.createLinearGradient(-diskR,0,diskR,0);
      grad.addColorStop(0,'rgba(120,180,255,0.075)');
      grad.addColorStop(0.5,'rgba(110,231,255,0.25)');
      grad.addColorStop(1,'rgba(168,139,250,0.075)');
      ctx.strokeStyle = grad;
      ctx.save();
      ctx.rotate(0.35 + Math.sin(t*0.005)*0.1);
      ctx.beginPath();
      ctx.ellipse(0,0,diskR*1.45,diskR*0.55,0,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlanets(){
    const parallaxX = (pointer.x-0.5)*6*devicePixelRatio;
    const parallaxY = (pointer.y-0.5)*6*devicePixelRatio;

    planets.forEach((p, idx)=>{
      const A = p.a*devicePixelRatio;
      const B = p.b*devicePixelRatio;

      // Draw orbit track (ellipse road) with reduced opacity
      drawOrbit(A, B);

      const ang = t*p.speed + idx*0.8;
      const x = cx + Math.cos(ang)*A + parallaxX;
      const y = cy + Math.sin(ang)*B + parallaxY;

      // trail
      p.trail.push({x,y});
      if(p.trail.length>20) p.trail.shift();
      for(let i=0;i<p.trail.length;i++){
        const tr = p.trail[i];
        const alpha = i/p.trail.length*0.45;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${alpha})`;
        ctx.arc(tr.x, tr.y, (p.size*0.5)*devicePixelRatio, 0, Math.PI*2);
        ctx.fill();
      }

      // planet body
      const r = p.size*devicePixelRatio;
      const grad = ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.2, x,y,r);
      grad.addColorStop(0, `hsla(${p.hue},80%,75%,1)`);
      grad.addColorStop(1, `hsla(${p.hue},70%,45%,0.9)`);
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    });
  }

  function drawNeutronStar(){
    const A = neutron.a*devicePixelRatio;
    const B = neutron.b*devicePixelRatio;

    // Show the neutron star orbit track too
    drawOrbit(A, B);

    const ang = t*neutron.speed;
    const x = cx + Math.cos(ang)*A;
    const y = cy + Math.sin(ang)*B;

    // beams rotate
    neutron.angle = (neutron.angle + 0.06) % (Math.PI*2);

    // beams
    const beamLen = 56*devicePixelRatio;
    const beamW   = 2.2*devicePixelRatio;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(neutron.angle);
    ctx.globalCompositeOperation = 'lighter';
    const theme = htmlEl.getAttribute('data-theme') || 'blackhole';
    ctx.strokeStyle = theme==='sunrise' ? 'rgba(255,210,140,0.55)' :
                      theme==='bluesun' ? 'rgba(120,200,255,0.65)' :
                      theme==='nebula'  ? 'rgba(200,160,255,0.60)' :
                                          'rgba(160,210,255,0.55)';
    ctx.lineWidth = beamW;
    ctx.beginPath(); ctx.moveTo(0, -beamLen); ctx.lineTo(0, beamLen); ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // core
    const r = neutron.size;
    const g = ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.2, x,y,r);
    if(theme==='sunrise'){
      g.addColorStop(0,'rgba(255,230,160,1)');
      g.addColorStop(1,'rgba(255,140,80,0.9)');
    }else if(theme==='bluesun'){
      g.addColorStop(0,'rgba(160,230,255,1)');
      g.addColorStop(1,'rgba(90,160,255,0.92)');
    }else if(theme==='nebula'){
      g.addColorStop(0,'rgba(210,190,255,1)');
      g.addColorStop(1,'rgba(140,120,240,0.92)');
    }else{
      g.addColorStop(0,'rgba(200,230,255,1)');
      g.addColorStop(1,'rgba(130,180,255,0.92)');
    }
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }

  function frame(){
    ctx.clearRect(0,0,w,h);
    drawStars();
    drawConstellations();
    drawCenter();
    drawPlanets();
    drawNeutronStar();
    drawComets();
    t += 1;
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e)=>{ pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight; });
  resize(); 
  resetCometTimer();
  frame();

  // Allow theme switch to recolor/rebuild stars and constellations
  window.__cosmosSetTheme = ()=>{ rebuildStars(); };
})();

/* Theme toggle: 4 themes cycle (blackhole → sunrise → bluesun → nebula) */
function setTheme(theme){
  htmlEl.setAttribute('data-theme', theme);
  window.__cosmosSetTheme?.(theme);
  themeIconBlackhole?.classList.toggle('hidden', theme!=='blackhole');
  themeIconSunrise?.classList.toggle('hidden', theme!=='sunrise');
  // Reuse blue icon for both bluesun and nebula if you don't have a dedicated nebula icon
  themeIconBlueSun?.classList.toggle('hidden', !(theme==='bluesun' || theme==='nebula'));
  try { localStorage.setItem('isuruhub-theme', theme); } catch(_){}
}

function animateTheme(next){
  const current = htmlEl.getAttribute('data-theme') || 'blackhole';
  if(current === next) return;
  const overlay = next === 'sunrise' ? sunriseSweep : (next === 'bluesun' || next === 'nebula' ? bluesunWave : blackholeRise);
  overlay?.classList.add('active');
  setTimeout(()=> setTheme(next), 150);
  setTimeout(()=> overlay?.classList.remove('active'), 900);
}

function nextTheme(){
  const current = htmlEl.getAttribute('data-theme') || 'blackhole';
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx+1)%THEMES.length];
  animateTheme(next);
}

themeToggle?.addEventListener('click', nextTheme);
themeToggleMobile?.addEventListener('click', nextTheme);

// Initialize theme
(function initTheme(){
  let saved = null;
  try { saved = localStorage.getItem('isuruhub-theme'); } catch(_){}
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'sunrise' : 'blackhole');
  setTheme(initial);
})();

/* Mobile menu */
menuToggle?.addEventListener('click', ()=>{
  const open = mobileMenu?.classList.toggle('hidden') === false;
  menuToggle.setAttribute('aria-expanded', open ? 'true':'false');
});

/* Smooth scroll for in-page anchors (center the target) */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if(id?.length>1){
      e.preventDefault();
      const target = document.querySelector(id);
      if (target) scrollToCenter(target);
      mobileMenu?.classList.add('hidden');
      menuToggle?.setAttribute('aria-expanded','false');
    }
  });
});

/* Toggle animations helper (optional placeholder) */
toggleAnimations?.addEventListener('click', ()=>{
  const off = document.body.dataset.anim === 'off';
  if(off){
    delete document.body.dataset.anim;
    location.reload();
  }else{
    document.body.dataset.anim = 'off';
  }
});