const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v) => Math.min(1, Math.max(0, v));

// 부드러운 관성 스크롤 (Lenis)
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

// 페이지 내 앵커 이동 (상담ㆍ견적 요청 → 하단 문의 섹션 등)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#' ? null : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
});

// 히어로 로드 등장
const hero = document.querySelector('.hero');
requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));

// 스크롤 연동: 히어로 패럴랙스 + 두번째 섹션 고정/블러 등장
const heroBg = document.querySelector('.hero__bg');
const heroContent = document.querySelector('.hero__content');
const intro = document.getElementById('intro');
const introLines = [...intro.querySelectorAll('.intro__line')];
const setLine = (el, s) => {
  el.style.opacity = s.toFixed(3);
  el.style.filter = `blur(${(16 * (1 - s)).toFixed(2)}px)`;
  el.style.transform = `translateY(${(30 * (1 - s)).toFixed(1)}px)`;
};
let ticking = false;
const update = () => {
  ticking = false;
  const y = window.scrollY;
  const vh = innerHeight;

  if (!reduceMotion) {
    const p = Math.min(1, y / vh);
    heroBg.style.transform = `translateY(${(p * 120).toFixed(1)}px) scale(${(1 + p * 0.05).toFixed(3)})`;
    heroContent.style.transform = `translateY(${(p * -220).toFixed(1)}px)`;
  }

  // 고정 구간 진행률 0 → 1 : 줄별로 블러 등장 → 유지 → 다음 섹션으로
  const scrub = intro.offsetHeight - vh;
  const ip = scrub > 0 ? clamp(-intro.getBoundingClientRect().top / scrub) : 1;
  introLines.forEach((el, i) => setLine(el, reduceMotion ? 1 : clamp((ip - i * 0.12) / 0.35)));
};

// Our Partners → Our Edge : 로고가 지나가고 빈 여백이 화면 반 이상이면 Our Edge로, 다시 올리면 Partners 처음으로 이동
const partnersSec = document.getElementById('partners');
const partnersLogos = partnersSec.querySelector('.partners__logos');
const edgeSec = document.getElementById('edge');
let lastY = window.scrollY;
let snapping = false;
const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY;
const snapTo = (y) => {
  snapping = true;
  const done = () => { snapping = false; lastY = window.scrollY; };
  if (lenis) lenis.scrollTo(y, { duration: 1, lock: true, onComplete: done });
  else {
    window.scrollTo({ top: y, behavior: reduceMotion ? 'instant' : 'smooth' });
    let timer = setTimeout(done, 1200);
    addEventListener('scrollend', () => { clearTimeout(timer); done(); }, { once: true });
  }
};
addEventListener('scroll', () => {
  const y = window.scrollY;
  const dir = y - lastY;
  lastY = y;
  if (snapping || dir === 0) return;
  const start = pageTop(partnersSec);
  const end = pageTop(edgeSec);
  if (y <= start || y >= end) return;
  // 로고 아래 빈 여백이 화면의 반 이상 보이는 지점 = 기준선
  const contentBottom = pageTop(partnersLogos) + partnersLogos.offsetHeight;
  const trigger = Math.min(end - 1, Math.max(start + 1, contentBottom - innerHeight * 0.5));
  if (dir > 0 && y >= trigger) snapTo(end);
  else if (dir < 0 && y < trigger) snapTo(start);
}, { passive: true });

const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);
update();

// 섹션 요소 스크롤 등장
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

// 헤더 스크롤 배경
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 모바일 메뉴
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// Our Edge : 화면 가운데를 지나는 사진에 맞춰 텍스트·점 전환
const slides = document.querySelectorAll('.edge__slide');
const images = [...document.querySelectorAll('.edge__img')];
const dots = document.querySelectorAll('.edge__dot');
let current = 0;
const show = (i) => {
  if (i === current) return;
  current = i;
  [slides, dots].forEach((list) =>
    list.forEach((el, idx) => el.classList.toggle('is-active', idx === i))
  );
};
// 고정 구간 진행률 → 사진 트랙을 가로 이동 (사진마다 잠깐 머문 뒤 부드럽게 넘어감)
const edgeTrack = document.querySelector('.edge__track');
const lastIdx = images.length - 1;
const smooth = (x) => x * x * (3 - 2 * x);
const edgeScrub = () => edgeSec.offsetHeight - innerHeight;
const syncEdge = () => {
  const scrub = edgeScrub();
  const p = scrub > 0 ? clamp(-edgeSec.getBoundingClientRect().top / scrub) : 0;
  const seg = p * lastIdx;
  const base = Math.min(Math.floor(seg), lastIdx - 1);
  const move = smooth(clamp((seg - base - 0.15) / 0.7));
  edgeTrack.style.transform = `translateX(${(-(base + move) * 100).toFixed(3)}%)`;
  show(Math.round(base + move));
};
addEventListener('scroll', syncEdge, { passive: true });
addEventListener('resize', syncEdge);
syncEdge();
dots.forEach((dot, i) => dot.addEventListener('click', () => {
  const top = edgeSec.getBoundingClientRect().top + scrollY + (edgeScrub() * i) / lastIdx;
  if (lenis) lenis.scrollTo(top, { duration: 1.2 });
  else window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
}));

// 문의 폼
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('문의가 접수되었습니다. 빠르게 확인하고 연락드리겠습니다.');
  e.target.reset();
});
