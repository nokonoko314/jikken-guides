/* 資料モード
   オンにすると、自分で選んだ授業資料（PDF）が画面全体に表示され、
   決めたキーを押している間だけ手順書が見える。
   PDFはこのブラウザの中（IndexedDB）にだけ保存し、どこにも送らない。 */
(function(){
  'use strict';
  var root = document.documentElement;
  var LAB = document.body.dataset.lab || 'lab';
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var touchOnly = matchMedia('(hover: none)').matches;

  var ls = {
    get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
    set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  };

  /* ── IndexedDB：選んだPDFを保存 ── */
  function db(){
    return new Promise(function(res, rej){
      try{
        var r = indexedDB.open('jg-cover', 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore('files'); };
        r.onsuccess = function(){ res(r.result); };
        r.onerror = function(){ rej(r.error); };
      }catch(e){ rej(e); }
    });
  }
  function idb(mode, fn){
    return db().then(function(d){
      return new Promise(function(res, rej){
        var tx = d.transaction('files', mode); var st = tx.objectStore('files');
        var q = fn(st); tx.oncomplete = function(){ res(q && q.result); }; tx.onerror = function(){ rej(tx.error); };
      });
    });
  }
  var saveFile = function(f){ return idb('readwrite', function(s){ return s.put({name:f.name, blob:f}, LAB); }); };
  var loadFile = function(){ return idb('readonly', function(s){ return s.get(LAB); }); };
  var dropFile = function(){ return idb('readwrite', function(s){ return s.delete(LAB); }); };

  /* ── 設定 ── */
  var cfg = { on: ls.get('jg-cover-on') === '1', code: ls.get('jg-cover-code') || 'KeyV', label: ls.get('jg-cover-label') || 'V' };
  function saveCfg(){ ls.set('jg-cover-on', cfg.on ? '1' : '0'); ls.set('jg-cover-code', cfg.code); ls.set('jg-cover-label', cfg.label); }

  /* ── 画面の部品 ── */
  var cover = document.createElement('div');
  cover.className = 'cover'; cover.setAttribute('aria-hidden', 'true');
  cover.innerHTML = '<div class="cover-bar"><span class="cover-name"></span><span class="cover-count"></span></div><div class="cover-pages"></div><div class="cover-hint" hidden></div>';
  document.body.appendChild(cover);
  var coverName = cover.querySelector('.cover-name'), coverCount = cover.querySelector('.cover-count');
  var pagesEl = cover.querySelector('.cover-pages'), hintEl = cover.querySelector('.cover-hint');

  var btn = document.getElementById('cover-btn');
  var panel = document.getElementById('cover-panel');
  if(!btn || !panel) return;
  var sw = panel.querySelector('#cover-on'), fileIn = panel.querySelector('#cover-file');
  var fileLabel = panel.querySelector('.cp-file-name'), keyLabel = panel.querySelector('.cp-key');
  var keyBtn = panel.querySelector('#cover-key'), delBtn = panel.querySelector('#cover-del');
  var msg = panel.querySelector('.cp-msg');

  var current = null;      // {name, blob}
  var rendered = false;
  var originalTitle = document.title;

  function setMsg(t){ msg.textContent = t || ''; }
  function refreshUI(){
    btn.textContent = '資料モード ' + (cfg.on ? 'オン' : 'オフ');
    btn.classList.toggle('on', cfg.on);
    btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    sw.checked = cfg.on; sw.disabled = !current || touchOnly;
    fileLabel.textContent = current ? current.name : 'まだ選ばれていません';
    delBtn.hidden = !current;
    keyLabel.textContent = cfg.label;
    document.querySelectorAll('.cover-keyname').forEach(function(s){ s.textContent = cfg.label; });
  }
  function apply(){
    var active = cfg.on && current && !touchOnly;
    root.classList.toggle('cover-on', !!active);
    if(active){
      document.title = current.name;
      if(!rendered) render();
    } else {
      document.title = originalTitle; root.classList.remove('peek');
    }
    refreshUI();
  }

  /* ── PDFを描画（pdf.js） ── */
  function loadPdfJs(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = PDFJS;
      s.onload = function(){ window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER; res(window.pdfjsLib); };
      s.onerror = function(){ rej(new Error('PDFの表示部品を読み込めませんでした')); };
      document.head.appendChild(s);
    });
  }
  function render(){
    if(!current) return;
    rendered = true; pagesEl.innerHTML = ''; coverName.textContent = current.name; coverCount.textContent = '';
    loadPdfJs().then(function(lib){
      return current.blob.arrayBuffer().then(function(buf){ return lib.getDocument({data:buf}).promise; });
    }).then(function(pdf){
      coverCount.textContent = pdf.numPages + ' ページ';
      var width = Math.min(980, window.innerWidth * 0.92), dpr = Math.min(window.devicePixelRatio || 1, 2);
      var chain = Promise.resolve();
      for(var i = 1; i <= pdf.numPages; i++){
        (function(n){
          chain = chain.then(function(){ return pdf.getPage(n); }).then(function(page){
            var v1 = page.getViewport({scale:1}); var vp = page.getViewport({scale: width / v1.width * dpr});
            var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
            c.style.width = width + 'px'; c.style.height = (vp.height / dpr) + 'px';
            pagesEl.appendChild(c);
            return page.render({canvasContext:c.getContext('2d'), viewport:vp}).promise;
          });
        })(i);
      }
      return chain;
    }).catch(function(e){ rendered = false; setMsg(e.message || 'PDFを表示できませんでした'); });
  }

  /* ── キー操作：押している間だけ手順書を見せる ── */
  var capturing = false;
  function isTyping(t){ return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }
  document.addEventListener('keydown', function(e){
    if(capturing){
      if(e.key === 'Escape'){ capturing = false; keyBtn.textContent = 'キーを変更'; return; }
      if(['Tab','Shift','Control','Alt','Meta',' '].indexOf(e.key) >= 0){ setMsg('文字キーかファンクションキーを選んでください'); return; }
      e.preventDefault();
      cfg.code = e.code; cfg.label = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      saveCfg(); capturing = false; keyBtn.textContent = 'キーを変更'; setMsg(''); refreshUI(); return;
    }
    if(!root.classList.contains('cover-on') || isTyping(e.target)) return;
    if(e.code === cfg.code){ e.preventDefault(); root.classList.add('peek'); }
  });
  document.addEventListener('keyup', function(e){ if(e.code === cfg.code) root.classList.remove('peek'); });
  window.addEventListener('blur', function(){ root.classList.remove('peek'); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) root.classList.remove('peek'); });

  /* ── 設定パネル ── */
  btn.addEventListener('click', function(){ panel.hidden = !panel.hidden; refreshUI(); });
  document.addEventListener('click', function(e){
    if(!panel.hidden && !panel.contains(e.target) && e.target !== btn){ panel.hidden = true; refreshUI(); }
  });
  sw.addEventListener('change', function(){
    cfg.on = sw.checked; saveCfg(); panel.hidden = true; apply();
    if(cfg.on){
      hintEl.textContent = cfg.label + ' キーを押している間だけ手順書が表示されます';
      hintEl.hidden = false; setTimeout(function(){ hintEl.hidden = true; }, 2500);
    }
  });
  fileIn.addEventListener('change', function(){
    var f = fileIn.files && fileIn.files[0]; if(!f) return;
    if(f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)){ setMsg('PDFファイルを選んでください'); return; }
    current = {name:f.name, blob:f}; rendered = false; setMsg('');
    saveFile(f).catch(function(){ setMsg('このブラウザには保存できませんでした。開いている間だけ使えます'); });
    apply();
  });
  delBtn.addEventListener('click', function(){
    dropFile().catch(function(){}); current = null; rendered = false; pagesEl.innerHTML = '';
    cfg.on = false; saveCfg(); apply();
  });
  keyBtn.addEventListener('click', function(){ capturing = true; keyBtn.textContent = '使うキーを押してください'; setMsg('やめるときは Esc'); });

  if(touchOnly) setMsg('キーボードのないスマホ・タブレットでは使えません');

  loadFile().then(function(r){ if(r && r.blob){ current = r; } apply(); }).catch(function(){ apply(); });
  refreshUI();
})();
