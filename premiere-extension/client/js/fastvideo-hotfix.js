/* FASTVIDEO Hotfix v1.10.2 */
(function () {
  'use strict';
  function byId(id) { return document.getElementById(id); }
  function injectStyles() {
    if (document.getElementById('fastvideo-hotfix-style')) return;
    var style = document.createElement('style');
    style.id = 'fastvideo-hotfix-style';
    style.textContent = [
      '.hotfix-hidden-advanced{display:none!important}',
      '.video-source-actions{display:flex;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap}',
      '.video-source-btn{width:auto!important;min-width:138px;padding:8px 12px!important}',
      '#dropzone-video{min-height:150px}',
      '#dropzone-video .dropzone-hint{max-width:360px;margin:0 auto;line-height:1.4}',
      '#prompt{min-height:96px!important;line-height:1.55!important;user-select:text!important;-webkit-user-select:text!important;cursor:text!important}',
      'textarea,input{user-select:text!important;-webkit-user-select:text!important}',
      '.progress{position:sticky;bottom:8px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
      '.progress-label{font-weight:600;color:var(--text)!important}',
      '#btn-start.is-working{opacity:.85;pointer-events:none}',
      '.dropzone-video.hotfix-ready{border-style:solid}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function setProgress(label, pct) {
    var box = byId('progress');
    var fill = byId('progress-fill');
    var txt = byId('progress-label');
    if (!box || !fill || !txt) return;
    var n = Math.max(0, Math.min(100, Number(pct) || 0));
    box.classList.remove('hidden');
    fill.style.width = n + '%';
    txt.textContent = label + ' ' + Math.round(n) + '%';
  }
  function finishProgress() {
    setProgress('Sugestões prontas', 100);
    setTimeout(function () {
      var box = byId('progress');
      if (box) box.classList.add('hidden');
    }, 900);
  }
  function improvePrompt() {
    var prompt = byId('prompt');
    if (!prompt || prompt.dataset.hotfixPrompt === '1') return;
    prompt.dataset.hotfixPrompt = '1';
    prompt.setAttribute('spellcheck', 'true');
    prompt.style.userSelect = 'text';
    prompt.style.webkitUserSelect = 'text';
    ['keydown','keyup','keypress','mousedown','mouseup','click','dblclick','selectstart'].forEach(function (evt) {
      prompt.addEventListener(evt, function (e) { e.stopPropagation(); });
    });
    prompt.addEventListener('keydown', function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && String(e.key).toLowerCase() === 'a') {
        e.preventDefault();
        prompt.focus();
        prompt.select();
      }
      if (mod && String(e.key).toLowerCase() === 'enter') {
        e.preventDefault();
        var btn = byId('btn-start');
        if (btn && !btn.disabled) btn.click();
      }
    });
    function grow() {
      prompt.style.height = 'auto';
      prompt.style.height = Math.max(96, Math.min(220, prompt.scrollHeight + 6)) + 'px';
    }
    prompt.addEventListener('input', grow);
    setTimeout(grow, 100);
  }
  function simplifyVideoBox() {
    var dz = byId('dropzone-video');
    if (!dz || dz.dataset.hotfixUnified === '1') return;
    dz.dataset.hotfixUnified = '1';
    dz.classList.add('hotfix-ready');
    var title = dz.querySelector('.dropzone-title');
    var hint = dz.querySelector('.dropzone-hint');
    if (title) title.textContent = 'Arraste um vídeo aqui';
    if (hint) hint.textContent = 'ou clique para abrir e pesquisar. Também aceita o clipe selecionado no Premiere.';
    var inner = dz.querySelector('.dropzone-inner') || dz;
    var actions = document.createElement('div');
    actions.className = 'video-source-actions';
    actions.innerHTML = '<button type="button" class="btn-secondary video-source-btn" id="hotfix-open-file">Abrir e pesquisar</button><button type="button" class="btn-secondary video-source-btn" id="hotfix-use-project">Usar selecionado no Premiere</button>';
    inner.appendChild(actions);
    var openBtn = byId('hotfix-open-file');
    var projectBtn = byId('hotfix-use-project');
    if (openBtn) openBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); dz.click();
    });
    if (projectBtn) projectBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var legacy = byId('btn-use-selected');
      if (legacy) legacy.click();
    });
    var advanced = document.querySelector('.advanced-toggle');
    if (advanced) advanced.classList.add('hotfix-hidden-advanced');
  }
  function improveProgress() {
    var start = byId('btn-start');
    if (start && start.dataset.hotfixProgress !== '1') {
      start.dataset.hotfixProgress = '1';
      start.addEventListener('click', function () {
        if (start.disabled) return;
        start.classList.add('is-working');
        setProgress('Preparando análise...', 3);
        var pct = 6;
        clearInterval(window.__fvProgressTimer);
        window.__fvProgressTimer = setInterval(function () {
          var results = byId('results');
          if (results && !results.classList.contains('hidden') && results.querySelector('.result-card')) {
            clearInterval(window.__fvProgressTimer);
            start.classList.remove('is-working');
            finishProgress();
            return;
          }
          pct = Math.min(92, pct + (pct < 45 ? 5 : pct < 75 ? 3 : 1));
          var label = pct < 25 ? 'Preparando arquivo...' : pct < 55 ? 'Transcrevendo áudio...' : pct < 82 ? 'Encontrando cortes...' : 'Organizando sugestões...';
          setProgress(label, pct);
        }, 850);
      }, true);
    }
    var insert = byId('btn-insert');
    if (insert && insert.dataset.hotfixProgress !== '1') {
      insert.dataset.hotfixProgress = '1';
      insert.addEventListener('click', function () {
        if (!insert.disabled) setProgress('Inserindo na timeline...', 70);
      }, true);
    }
    var resultsBox = byId('results');
    if (resultsBox && resultsBox.dataset.hotfixObserver !== '1') {
      resultsBox.dataset.hotfixObserver = '1';
      var observer = new MutationObserver(function () {
        if (!resultsBox.classList.contains('hidden') && resultsBox.querySelector('.result-card')) {
          clearInterval(window.__fvProgressTimer);
          var start = byId('btn-start');
          if (start) start.classList.remove('is-working');
          finishProgress();
        }
      });
      observer.observe(resultsBox, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });
    }
  }
  function init() {
    injectStyles();
    improvePrompt();
    simplifyVideoBox();
    improveProgress();
    console.log('[FASTVIDEO][Hotfix] v1.10.2 aplicado');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
