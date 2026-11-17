/* 1行ずつ解説（ステッパー）
   <div class="sx" data-task="k1"></div> を見つけて、TASKS / FN / CODE / EXTRA（各回のデータファイル）から画面を作る。
   「次へ」で1ステップ進み、光っている行の説明・関数・画像の変化・変数の中身を表示する。 */
(function(){
  'use strict';
  if(typeof TASKS === 'undefined') return;

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  /* 色分け：文字列・キーワード・関数呼び出し・数 */
  function hl(text){
    var re = /("[^"]*")|\b(import|as|for|in|if|else|def|return|and)\b|\b(cv2\.\w+|np\.\w+|print|round|find_box)(?=\()|\b(\d+(?:\.\d+)?)\b/g;
    var out = '', last = 0, m;
    while((m = re.exec(text)) !== null){
      out += esc(text.slice(last, m.index));
      var cls = m[1] ? 't-str' : m[2] ? 't-kw' : m[3] ? 't-call' : 't-num';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }
  /* 注目箇所（focus）をマーカーで囲んでから色分けする */
  function hlFocus(line, focus){
    if(!focus || !focus.length) return hl(line);
    var best = -1, which = null;
    focus.forEach(function(f){ var i = line.indexOf(f); if(i >= 0 && (best < 0 || i < best)){ best = i; which = f; } });
    if(best < 0) return hl(line);
    return hl(line.slice(0, best)) + '<span class="sx-focus">' + hl(which) + '</span>' + hlFocus(line.slice(best + which.length), focus);
  }
  /* 説明文の中の大事な言葉にマーカーを引く */
  function markSay(say, mk){
    var html = esc(say);
    (mk || []).forEach(function(p){ var e = esc(p); html = html.replace(e, '<mark class="mark">' + e + '</mark>'); });
    return html;
  }

  function copyText(text, btn){
    var done = function(){ var o = btn.textContent; btn.textContent = 'コピーしました'; setTimeout(function(){ btn.textContent = o; }, 1400); };
    var fallback = function(){
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); done(); }catch(e){ btn.textContent = 'コピーできませんでした'; }
      document.body.removeChild(ta);
    };
    try{ navigator.clipboard.writeText(text).then(done, fallback); }catch(e){ fallback(); }
  }
  function promptFor(code, q){
    return 'Python と OpenCV を勉強中の高専生です。次のプログラムについて質問します。\n\n```python\n' + code + '\n```\n\n質問：' + q + '\n\n専門用語には短い説明を付けて、初心者にも分かるように答えてください。';
  }
  function qBox(question, full){
    var d = el('div', 'sx-q'), p = el('p', null, question), b = el('button', 'sx-copy', 'コピー');
    b.type = 'button'; b.addEventListener('click', function(){ copyText(full, b); });
    d.appendChild(p); d.appendChild(b); return d;
  }

  /* 画像の上に矢印とラベルを描く（座標は 480×360） */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs){ var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function(k){ e.setAttribute(k, attrs[k]); }); return e; }
  function drawNotes(holder, notes, uid){
    var svg = sv('svg', { 'class': 'sx-notes', viewBox: '0 0 480 360', 'aria-hidden': 'true' });
    var defs = sv('defs'), mk = sv('marker', { id: 'ah-' + uid, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
    mk.appendChild(sv('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'sx-ah' })); defs.appendChild(mk); svg.appendChild(defs);
    holder.appendChild(svg);
    notes.forEach(function(n, i){
      var g = sv('g', { 'class': 'sx-note', style: 'animation-delay:' + (0.25 + i * 0.3) + 's' });
      var text = sv('text', { x: n.t[0], y: n.t[1], 'text-anchor': 'middle', 'dominant-baseline': 'central', 'class': 'sx-nt' });
      text.textContent = n.s; g.appendChild(text); svg.appendChild(g);
      var bb; try{ bb = text.getBBox(); }catch(e){ bb = null; }
      if(!bb || !bb.width){ bb = { x: n.t[0] - n.s.length * 7.5, y: n.t[1] - 10, width: n.s.length * 15, height: 20 }; }
      var pad = 6, rx = bb.x - pad, ry = bb.y - 3, rw = bb.width + pad * 2, rh = bb.height + 6;
      /* はみ出したら内側に寄せる */
      var dx = 0; if(rx < 2) dx = 2 - rx; if(rx + rw > 478) dx = 478 - (rx + rw);
      if(dx){ text.setAttribute('x', n.t[0] + dx); rx += dx; }
      var rect = sv('rect', { x: rx, y: ry, width: rw, height: rh, rx: 3, 'class': 'sx-nb' });
      g.insertBefore(rect, text);
      /* ラベルの枠のふちから、矢印の先へ線を引く */
      var cx = rx + rw / 2, cy = ry + rh / 2, tx = n.a[0], ty = n.a[1];
      var ddx = tx - cx, ddy = ty - cy, sx, sy;
      if(Math.abs(ddx) * rh > Math.abs(ddy) * rw){ sx = cx + (ddx > 0 ? rw / 2 : -rw / 2); sy = cy + ddy * (rw / 2) / Math.abs(ddx || 1); }
      else{ sy = cy + (ddy > 0 ? rh / 2 : -rh / 2); sx = cx + ddx * (rh / 2) / Math.abs(ddy || 1); }
      g.insertBefore(sv('line', { x1: sx, y1: sy, x2: tx, y2: ty, 'class': 'sx-al2' }), rect);
      g.insertBefore(sv('line', { x1: sx, y1: sy, x2: tx, y2: ty, 'class': 'sx-al', 'marker-end': 'url(#ah-' + uid + ')' }), rect);
    });
  }

  var uidSeq = 0;
  function build(root, t){
    var ex = (typeof EXTRA !== 'undefined' && EXTRA[t.id]) || { flow: [], steps: {} };
    var lines = CODE[t.id].replace(/\n+$/, '').split('\n');
    var step = 0, timer = null, uid = t.id + '-' + (uidSeq++);

    root.innerHTML = '';
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-label', t.title + '：1行ずつ解説');

    /* 1画面に収める枠：流れ／（コード ｜ 画像・説明）／操作 */
    var stage = el('div', 'sx-stage'); root.appendChild(stage);

    /* 処理の流れ */
    var flow = el('ol', 'sx-flow');
    ex.flow.forEach(function(name){ flow.appendChild(el('li', null, name)); });
    stage.appendChild(flow);

    /* コード ｜ 画像・説明（右側は中だけスクロール） */
    var top = el('div', 'sx-top'), side = el('div', 'sx-side');
    var codebox = el('div', 'sx-codebox');
    var bar = el('div', 'sx-codebar');
    bar.appendChild(el('span', 'sx-fname', t.file));
    var nowL = el('span', 'sx-now'); bar.appendChild(nowL);
    var cpy = el('button', null, '全部コピー'); cpy.type = 'button';
    cpy.addEventListener('click', function(){ copyText(CODE[t.id], cpy); }); bar.appendChild(cpy);
    var code = el('div', 'sx-code'); code.setAttribute('tabindex', '0'); code.setAttribute('aria-label', 'プログラム ' + t.file);
    lines.forEach(function(line, k){
      var d = el('div', 'sx-ln'); d.dataset.n = k + 1;
      d.appendChild(el('span', 'sx-no', k + 1)); d.appendChild(el('span', 'sx-tx'));
      code.appendChild(d);
    });
    codebox.appendChild(bar); codebox.appendChild(code);
    var viewbox = el('div', 'sx-viewbox');
    var view = el('div', 'sx-view'), cap = el('p', 'sx-cap');
    viewbox.appendChild(el('span', 'sx-label', '画像はこうなる')); viewbox.appendChild(view); viewbox.appendChild(cap);
    top.appendChild(codebox); side.appendChild(viewbox); top.appendChild(side); stage.appendChild(top);

    /* この行がしていること */
    var sayBox = el('div', 'sx-saybox');
    var sayL = el('span', 'sx-sayl'), say = el('p', 'sx-say'); say.setAttribute('aria-live', 'polite');
    sayBox.appendChild(sayL); sayBox.appendChild(say); side.appendChild(sayBox);

    /* 関数 */
    var fnBox = el('div', 'sx-fnbox');
    fnBox.appendChild(el('span', 'sx-label', 'この行で使っている関数・書き方'));
    var fns = el('div', 'sx-fns'); fnBox.appendChild(fns); side.appendChild(fnBox);

    /* 変数と表示 */
    var st = el('div', 'sx-state');
    var vb = el('div'); vb.appendChild(el('span', 'sx-label', '変数の中身')); var vars = el('dl', 'sx-vars'); vb.appendChild(vars);
    var cb = el('div'); cb.appendChild(el('span', 'sx-label', '画面に出る表示')); var con = el('pre', 'sx-console'); cb.appendChild(con);
    st.appendChild(vb); st.appendChild(cb); side.appendChild(st);

    /* 深掘りの質問 */
    var ask = el('details', 'sx-ask'); ask.appendChild(el('summary', null, 'この行を深掘りする質問'));
    var askBody = el('div', 'sx-askbody'); ask.appendChild(askBody); side.appendChild(ask);

    /* 操作 */
    var ctrl = el('div', 'sx-ctrl'); ctrl.setAttribute('role', 'group'); ctrl.setAttribute('aria-label', '進める・戻す');
    function btn(label, cls){ var b = el('button', 'sx-btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; ctrl.appendChild(b); return b; }
    var bFirst = btn('最初へ'), bPrev = btn('戻る'), bNext = btn('次へ', 'primary'), bAuto = btn('自動で進める');
    bAuto.setAttribute('aria-pressed', 'false');
    var seek = el('input'); seek.type = 'range'; seek.min = 0; seek.max = t.steps.length - 1; seek.value = 0; seek.id = 'seek-' + t.id; seek.setAttribute('aria-label', 'ステップの位置'); ctrl.appendChild(seek);
    var count = el('span', 'sx-count'); ctrl.appendChild(count);
    stage.appendChild(ctrl);

    /* 課題全体：本物の画像での結果と、深掘りプロンプト */
    var real = el('div', 'box tip'); real.appendChild(el('strong', null, 'スライドの画像で動かした結果')); real.appendChild(document.createTextNode(t.real)); root.appendChild(real);
    var deep = el('details', 'sx-ask'); deep.appendChild(el('summary', null, 'この課題全体を深掘りするプロンプト'));
    var deepBody = el('div', 'sx-askbody');
    deepBody.appendChild(el('p', 'sx-hint', '「コピー」を押すと、プログラム全文つきの質問文がコピーされます。Claude などに貼り付けて聞いてください。'));
    t.deep.forEach(function(q){ deepBody.appendChild(qBox(q, promptFor(CODE[t.id].replace(/\n+$/, ''), q))); });
    deep.appendChild(deepBody); root.appendChild(deep);

    function render(){
      var s = t.steps[step], x = ex.steps[step] || {};
      /* 流れ */
      [].forEach.call(flow.children, function(li, i){ li.className = i < x.stage ? 'past' : (i === x.stage ? 'now' : ''); });
      /* コード */
      var done = {};
      for(var i = 0; i < step; i++){ for(var n = t.steps[i].lines[0]; n <= t.steps[i].lines[1]; n++){ done[n] = true; } }
      var first = null;
      [].forEach.call(code.children, function(d){
        var n = +d.dataset.n, act = n >= s.lines[0] && n <= s.lines[1];
        d.className = 'sx-ln' + (act ? ' active' : (done[n] ? '' : ' future'));
        d.lastChild.innerHTML = (act ? hlFocus(lines[n - 1], x.focus) : hl(lines[n - 1])) || ' ';
        if(act && !first){ first = d; }
      });
      if(first){ code.scrollTop = Math.max(0, first.offsetTop - code.clientHeight * 0.3); }
      var lab = s.lines[0] === s.lines[1] ? s.lines[0] + ' 行目' : s.lines[0] + '〜' + s.lines[1] + ' 行目';
      nowL.textContent = lab; sayL.textContent = lab;
      say.innerHTML = markSay(s.say, x.mk);
      /* 画像 */
      view.innerHTML = '';
      if(s.img){
        var w = el('div', 'sx-imgs' + (s.img2 ? ' two' : ''));
        [s.img, s.img2].forEach(function(src){ if(!src) return; var im = el('img'); im.src = src; im.alt = s.cap; im.width = 480; im.height = 360; w.appendChild(im); });
        view.appendChild(w);
        if(x.notes && !s.img2){ drawNotes(w, x.notes, uid + '-' + step); }
      }else{
        view.appendChild(el('div', 'sx-empty', 'この行では画像は変わりません'));
      }
      cap.textContent = s.cap;
      /* 関数 */
      fns.innerHTML = ''; fnBox.hidden = !s.fn.length;
      s.fn.forEach(function(name){
        var d = FN[name]; if(!d) return;
        var e = el('div', 'sx-fn');
        e.innerHTML = '<div class="sx-fnname">' + esc(name) + '<span class="sx-chip">' + esc(d.kind) + '</span></div><dl><dt>何をする</dt><dd>' + esc(d.what) + '</dd><dt>渡すもの</dt><dd>' + esc(d.args) + '</dd><dt>返るもの</dt><dd>' + esc(d.ret) + '</dd></dl>';
        fns.appendChild(e);
      });
      /* 変数と表示（ここまでの積み重ね） */
      var vals = {}, order = [], out = '';
      for(var j = 0; j <= step; j++){
        var sj = t.steps[j];
        if(sj.set){ Object.keys(sj.set).forEach(function(k){ if(!(k in vals)){ order.push(k); } vals[k] = sj.set[k]; }); }
        if(sj.out){ out = sj.out; }
      }
      vars.innerHTML = '';
      if(!order.length){ vars.appendChild(el('dt', null, '—')); vars.appendChild(el('dd', null, 'まだ変数はありません')); }
      order.forEach(function(k){
        var isNew = s.set && (k in s.set), dt = el('dt', isNew ? 'new' : null, k), dd = el('dd', isNew ? 'new' : null, vals[k]);
        vars.appendChild(dt); vars.appendChild(dd);
      });
      con.textContent = out || '（まだ何も表示されていません）'; con.className = 'sx-console' + (out ? '' : ' none');
      /* 質問 */
      askBody.innerHTML = ''; ask.hidden = !s.ask.length; ask.open = false;
      if(s.ask.length){
        askBody.appendChild(el('p', 'sx-hint', '「コピー」を押すと、この行のコードつきの質問文がコピーされます。'));
        var snip = lines.slice(s.lines[0] - 1, s.lines[1]).join('\n');
        s.ask.forEach(function(q){ askBody.appendChild(qBox(q, promptFor(snip, q))); });
      }
      side.scrollTop = 0; top.scrollTop = 0;
      seek.value = step; count.textContent = (step + 1) + ' / ' + t.steps.length;
      bPrev.disabled = step === 0; bFirst.disabled = step === 0; bNext.disabled = step === t.steps.length - 1;
    }
    function go(n){ step = Math.max(0, Math.min(t.steps.length - 1, n)); render(); }
    /* 枠が画面からはみ出していたら、枠の上端まで動かして全体を見せる */
    function fit(){
      var r = stage.getBoundingClientRect(), off = parseFloat(getComputedStyle(stage).getPropertyValue('--sx-off')) || 0;
      if(r.top < off - 4 || r.bottom > window.innerHeight + 4){ stage.scrollIntoView({ block: 'start' }); }
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } bAuto.setAttribute('aria-pressed', 'false'); bAuto.textContent = '自動で進める'; }
    function start(){
      if(step >= t.steps.length - 1){ step = -1; }
      bAuto.setAttribute('aria-pressed', 'true'); bAuto.textContent = '止める';
      go(step + 1);
      timer = setInterval(function(){ if(step >= t.steps.length - 1){ stop(); } else { go(step + 1); } }, 5000);
    }
    bNext.addEventListener('click', function(){ stop(); go(step + 1); fit(); });
    bPrev.addEventListener('click', function(){ stop(); go(step - 1); fit(); });
    bFirst.addEventListener('click', function(){ stop(); go(0); fit(); });
    bAuto.addEventListener('click', function(){ if(timer){ stop(); } else { start(); fit(); } });
    seek.addEventListener('input', function(){ stop(); go(+seek.value); });
    root.addEventListener('keydown', function(e){
      if(e.target === seek) return;
      if(e.key === 'ArrowRight'){ stop(); go(step + 1); fit(); e.preventDefault(); }
      if(e.key === 'ArrowLeft'){ stop(); go(step - 1); fit(); e.preventDefault(); }
    });
    render();
  }

  [].forEach.call(document.querySelectorAll('.sx[data-task]'), function(root){
    var t = null; TASKS.forEach(function(x){ if(x.id === root.dataset.task){ t = x; } });
    if(t){ build(root, t); }
  });
})();
