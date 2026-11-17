/* ============================================================
   stage.js — stage-layout.css の挙動側
   依存なし。<script src="stage.js" defer> で読み込む。
   ============================================================ */
(function () {
  'use strict';

  var BP        = '(max-width: 1023px)';
  var params    = new URLSearchParams(location.search);
  var skipIntro = params.has('skipIntro');
  var noAnim    = params.has('noAnim');

  function isWide() {
    return !(window.matchMedia && window.matchMedia(BP).matches);
  }
  function prefersReduced() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------------------------------------------------------
     1. ビューポート実寸をCSS変数に流す
        SPのMV高さ calc(100vh - ヘッダ - パンくず) のため
     --------------------------------------------------------- */
  function updateViewportVars() {
    var h = function (sel) {
      var el = document.querySelector(sel);
      return el ? el.getBoundingClientRect().height : 0;
    };
    var root = document.documentElement.style;
    root.setProperty('--global-nav-height', h('.globalNav') + 'px');
    root.setProperty('--breadcrumb-height', h('.breadcrumb-wrap') + 'px');
  }

  /* ---------------------------------------------------------
     2. 終端逃がし
        最後のブロックが画面に入ったら、ガターの固定要素を
        同じ量だけ上へ押し出す。フッターに被らせないため。
     --------------------------------------------------------- */
  function updateStagePosition() {
    var last  = document.querySelector('.js-stage-last');
    var items = document.querySelectorAll('.block-stage-pc ._logo-pc, .js-stage-pin');

    if (!last || !items.length || !isWide()) {
      items.forEach(function (el) { el.style.transform = ''; });
      return;
    }
    var top = last.getBoundingClientRect().top;
    var v   = top < window.innerHeight
            ? 'translateY(' + (top - window.innerHeight) + 'px)'
            : '';
    items.forEach(function (el) { el.style.transform = v; });
  }

  /* ---------------------------------------------------------
     3. イントロ
        ロゴ表示 → MVが scale(2) から縮む → ロゴ消える
        パターンを複数持たせる場合は data-intro-patterns に
        カンマ区切りで色を書く: data-intro-patterns="#DFDCD4,#8E7A6B"
     --------------------------------------------------------- */
  function initIntro() {
    var body = document.body;
    var wrap = document.querySelector('.block-wrap');

    // 背景パターンの抽選
    if (wrap && wrap.dataset.introPatterns) {
      var list = wrap.dataset.introPatterns.split(',').map(function (s) { return s.trim(); });
      var pick = list[Math.floor(Math.random() * list.length)];
      document.documentElement.style.setProperty('--stage-bg', pick);
      document.documentElement.setAttribute('data-intro-pattern', pick);
    }

    if (noAnim) body.classList.add('is-no-anim');

    if (skipIntro || prefersReduced() || !document.querySelector('.block-mv')) {
      body.classList.add('is-intro-skip');
      return;
    }

    body.classList.add('is-intro-logo');
    setTimeout(function () {
      body.classList.remove('is-intro-logo');
      body.classList.add('is-intro-main');
    }, 900);
  }

  /* ---------------------------------------------------------
     4. スクロールイン
     --------------------------------------------------------- */
  function initInview() {
    var targets = document.querySelectorAll('.mod-inview');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || prefersReduced()) {
      targets.forEach(function (el) { el.classList.add('is-inview'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-inview');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     5. アンカーのスムーススクロール
     --------------------------------------------------------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        ev.preventDefault();
        t.scrollIntoView({
          behavior: prefersReduced() ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  }

  function init() {
    updateViewportVars();
    initIntro();
    initInview();
    initAnchors();
    updateStagePosition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  addEventListener('scroll', updateStagePosition, { passive: true });
  addEventListener('resize', function () {
    updateViewportVars();
    updateStagePosition();
  });
  addEventListener('orientationchange', updateViewportVars);
})();
