/* 情報工学実験 手順書 — 共通スクリプト
   ・ユーザ名とIPの入力に合わせて {{USER}} {{IP}} を書き換える
   ・コピー、完了チェック、目次、表示テーマの切り替え */
(function(){
  'use strict';
  var body = document.body;
  var LAB = body.dataset.lab || 'lab';
  var store = {
    get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
    set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  };

  /* テーマ（一覧ページでも使う） */
  var root = document.documentElement;
  var savedTheme = store.get('jg-theme');
  if(savedTheme) root.setAttribute('data-theme', savedTheme);
  var themeBtn = document.getElementById('theme-btn');
  if(themeBtn){
    themeBtn.addEventListener('click', function(){
      var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var nx = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', nx); store.set('jg-theme', nx);
    });
  }

  if(!document.querySelector('.step')) return; // 一覧ページはここまで
  // 入力欄は回によってない場合もある（ユーザ名だけ・IPだけ・どちらもなし）
  var uIn = document.getElementById('v-user'), ipIn = document.getElementById('v-ip');

  /* 入力値はすべての回で共通にする */
  if(uIn) uIn.value = store.get('jg-user') || '';
  if(ipIn) ipIn.value = store.get('jg-ip') || '';

  var WHERE = {
    local: ['w-local', body.dataset.labelLocal || 'サーバで直接入力'],
    ssh:   ['w-ssh',   body.dataset.labelSsh   || 'サーバ（SSH経由）'],
    win:   ['w-win',   body.dataset.labelWin   || '自分のPCのPowerShell']
  };
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function vals(){return {u:(uIn && uIn.value.trim())||'ユーザ名', ip:(ipIn && ipIn.value.trim())||'IPアドレス'}}
  function fill(t, html){
    var v = vals();
    if(!html) return t.replace(/\{\{USER\}\}/g, v.u).replace(/\{\{IP\}\}/g, v.ip);
    return esc(t).replace(/\{\{USER\}\}/g,'<span class="ph">'+esc(v.u)+'</span>').replace(/\{\{IP\}\}/g,'<span class="ph">'+esc(v.ip)+'</span>');
  }
  function fallbackCopy(t){
    var ta=document.createElement('textarea'); ta.value=t; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy')}catch(e){} document.body.removeChild(ta);
  }

  /* コードブロック */
  var blocks = [].slice.call(document.querySelectorAll('.code'));
  blocks.forEach(function(b){
    var pre = b.querySelector('pre:not(.out)');
    b._tpl = pre ? pre.textContent : '';
    /* 実行結果の例（pre.out）は、見出しを付けてコマンドの下に置く */
    b._outs = [].slice.call(b.querySelectorAll('pre.out'));
    b._outs.forEach(function(o){
      o._tpl = o.textContent;
      var ot = document.createElement('div'); ot.className = 'out-top';
      ot.textContent = o.dataset.label || '実行結果の例';
      b.insertBefore(ot, o);
    });
    var w = WHERE[b.dataset.where] || WHERE.ssh;
    if(!pre){ /* 結果だけのブロック（コピーするものはない） */
      b.classList.add('result-only');
      if(b._outs[0]) b._outs[0].previousSibling.textContent = b.dataset.label || b._outs[0].dataset.label || '実行結果の例';
      return;
    }
    var top = document.createElement('div'); top.className = 'code-top';
    var badge = document.createElement('span'); badge.className = 'where ' + w[0]; badge.textContent = b.dataset.label || w[1];
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'copy'; btn.textContent = 'コピー';
    btn.setAttribute('aria-label', (b.dataset.label || w[1]) + 'のコマンドをコピー');
    btn.addEventListener('click', function(){
      var text = fill(b._tpl, false);
      var done = function(){ btn.textContent='コピーしました'; btn.classList.add('ok');
        setTimeout(function(){ btn.textContent='コピー'; btn.classList.remove('ok'); }, 1600); };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done, function(){ fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
    top.appendChild(badge); top.appendChild(btn); b.insertBefore(top, pre);
  });

  function render(){
    var v = vals();
    blocks.forEach(function(b){ if(b._tpl){ b.querySelector('pre:not(.out)').innerHTML = fill(b._tpl, true); } b._outs.forEach(function(o){ o.innerHTML = fill(o._tpl, true); }); });
    document.querySelectorAll('.liveuser').forEach(function(s){ s.textContent = v.u; });
    document.querySelectorAll('.liveip').forEach(function(s){ s.textContent = v.ip; });
  }
  if(uIn) uIn.addEventListener('input', function(){ store.set('jg-user', uIn.value); render(); });
  if(ipIn) ipIn.addEventListener('input', function(){ store.set('jg-ip', ipIn.value); render(); });
  render();

  /* 目次と完了チェック */
  var steps = [].slice.call(document.querySelectorAll('.step:not([data-notoc])'));
  /* 完了チェックは手順の最後に置く（読み終えてから押せるように） */
  steps.forEach(function(s){
    var t = s.querySelector('.step-head .done-toggle');
    if(!t) return;
    var foot = document.createElement('div'); foot.className = 'step-foot';
    var sp = t.querySelector('span'); if(sp) sp.textContent = 'この手順を完了にする';
    foot.appendChild(t); s.appendChild(foot);
  });
  var tocs = [document.getElementById('toc'), document.getElementById('toc-inline')].filter(Boolean);
  var state = {}; try{ state = JSON.parse(store.get(LAB + '-done') || '{}') }catch(e){ state = {} }
  steps.forEach(function(s, i){
    s._lis = tocs.map(function(ol){
      var li = document.createElement('li'); var a = document.createElement('a'); a.href = '#' + s.id;
      if(ol.id === 'toc'){
        var n = document.createElement('span'); n.className = 'tn'; n.textContent = String(i+1).padStart(2,'0');
        var t = document.createElement('span'); t.textContent = s.dataset.title;
        a.appendChild(n); a.appendChild(t);
        if(s.classList.contains('extra')){ var x=document.createElement('span'); x.className='tx'; x.textContent='補足'; t.appendChild(x); }
      } else { a.textContent = s.dataset.title + (s.classList.contains('extra') ? '（補足）' : ''); }
      li.appendChild(a); ol.appendChild(li); return li;
    });
    var cb = s.querySelector('.done-toggle input');
    if(cb){
      cb.checked = !!state[s.id];
      cb.addEventListener('change', function(){ state[s.id] = cb.checked; store.set(LAB + '-done', JSON.stringify(state)); update(); });
    }
  });
  var pText = document.getElementById('prog-text'), pFill = document.getElementById('prog-fill');
  function update(){
    var n = 0;
    steps.forEach(function(s){
      var d = !!state[s.id]; s.classList.toggle('done', d);
      s._lis.forEach(function(li){ li.classList.toggle('done', d); });
      if(d) n++;
    });
    if(pText) pText.textContent = n + ' / ' + steps.length;
    if(pFill) pFill.style.width = (steps.length ? n / steps.length * 100 : 0) + '%';
  }
  update();

  /* 今読んでいる手順を目次で示す */
  if('IntersectionObserver' in window){
    var current = null;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) current = e.target; });
      steps.forEach(function(s){ s._lis.forEach(function(li){ li.classList.toggle('active', s === current); }); });
    }, {rootMargin:'-30% 0px -60% 0px'});
    steps.forEach(function(s){ io.observe(s); });
  }
})();
(function(){
  function openFromHash(){
    var id = decodeURIComponent(location.hash.slice(1)); if(!id) return;
    var t = document.getElementById(id);
    if(t && t.tagName === 'DETAILS'){ t.open = true; setTimeout(function(){ t.scrollIntoView({block:'start'}); }, 0); }
  }
  window.addEventListener('hashchange', openFromHash);
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#pf-"]');
    if(a && location.hash === a.getAttribute('href')) openFromHash();
  });
  openFromHash();
})();
