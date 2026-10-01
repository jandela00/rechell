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
// 문장 타이핑 : 글자를 span으로 나눠 자리를 잡고, 화면에 들어오면 한 글자씩 표시
const introChars = [];
intro.querySelectorAll('.intro__line').forEach((line) => {
  const text = line.textContent;
  line.textContent = '';
  line.setAttribute('aria-hidden', 'true');
  [...text].forEach((ch) => {
    const s = document.createElement('span');
    s.className = 'intro__char';
    s.textContent = ch;
    line.appendChild(s);
    introChars.push(s);
  });
});
const typeSpeed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--type-speed')) || 90;
const typeIntro = () => {
  let i = 0;
  const step = () => {
    const ch = introChars[i];
    ch.classList.add('is-typed');
    i += 1;
    if (i < introChars.length) setTimeout(step, ch.nextSibling ? typeSpeed : typeSpeed * 4); // 줄 끝에서 잠깐 쉼
  };
  step();
};
const introIO = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { typeIntro(); introIO.disconnect(); }
}, { rootMargin: '0px 0px -50% 0px' });
introIO.observe(intro);
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

};

// Our Partners : 섹션이 화면 절반 이상 들어오면 로고가 자동으로 하나씩 페이드 업
const partnersSec = document.getElementById('partners');
const edgeSec = document.getElementById('edge');
partnersSec.querySelectorAll('.partners__logos li').forEach((li, i) => li.style.setProperty('--i', i));
const partnersIO = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { partnersSec.classList.add('is-in'); partnersIO.disconnect(); }
}, { rootMargin: '0px 0px -50% 0px' });
partnersIO.observe(partnersSec);

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
const edgePin = edgeSec.querySelector('.edge__pin');
const edgeScrub = () => edgeSec.offsetHeight - edgePin.offsetHeight;
const EDGE_HOLD = 0.12;
const syncEdge = () => {
  const scrub = edgeScrub();
  const raw = scrub > 0 ? clamp(-edgeSec.getBoundingClientRect().top / scrub) : 0;
  const p = clamp((raw - EDGE_HOLD) / (1 - EDGE_HOLD * 2)); // 들어오면 잠깐 멈춤 → 3장 롤링 → 끝에서 잠깐 머문 뒤 다음 섹션
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
