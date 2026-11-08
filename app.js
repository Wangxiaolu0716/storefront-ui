/* =========================================================
   Storefront UI — 交互逻辑（原生 JS，零依赖）
   重点演示四个容易踩坑的细节：
   1) 首屏骨架 → 内容 的过渡，避免布局跳动
   2) 输入法（IME）组合期间的过滤与布局稳定性
   3) 打字时关闭顶栏毛玻璃，解决光标卡顿
   4) 结果集签名比对，避免每次按键重建整段 DOM
   ========================================================= */
(function () {
  'use strict';

  const { apps, promo, chips, hotWords } = window.SF_DATA;

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const dom = {
    topbar: $('#topbar'),
    q: $('#q'),
    searchbar: $('#searchbar'),
    voiceBtn: $('#voiceBtn'),
    clearBtn: $('#clearBtn'),
    cancelBtn: $('#cancelBtn'),
    themeBtn: $('#themeBtn'),
    themeIcon: $('#themeIcon'),
    content: $('#content'),
    skeleton: $('#skeleton'),
    home: $('#home'),
    searchPane: $('#searchPane'),
    promoSlot: $('#promoSlot'),
    chips: $('#chips'),
    recList: $('#recList'),
    rankList: $('#rankList'),
    suggestSlot: $('#suggestSlot'),
    resultList: $('#resultList'),
    emptyHint: $('#emptyHint')
  };

  /* ---------------- 组件渲染 ---------------- */

  function appIcon(app, sizeCls) {
    const icon = el('div', 'appicon' + (sizeCls ? ' ' + sizeCls : ''), app.letter);
    icon.style.setProperty('--c1', app.c1);
    icon.style.setProperty('--c2', app.c2);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  /** 把文本按关键词切片，命中部分加高亮（用 DOM 拼，不拼 HTML 字符串） */
  function highlight(text, keyword) {
    if (!keyword) return document.createTextNode(text);
    const frag = document.createDocumentFragment();
    const lower = text.toLowerCase();
    const kw = keyword.toLowerCase();
    let from = 0;
    let hit = lower.indexOf(kw, from);
    while (hit !== -1) {
      if (hit > from) frag.appendChild(document.createTextNode(text.slice(from, hit)));
      frag.appendChild(el('span', 'hl', text.slice(hit, hit + kw.length)));
      from = hit + kw.length;
      hit = lower.indexOf(kw, from);
    }
    if (from < text.length) frag.appendChild(document.createTextNode(text.slice(from)));
    return frag;
  }

  /**
   * 一行应用。isRank=true 时左侧补序号。
   * @param {object} app
   * @param {{keyword?:string, rank?:number}} opts
   */
  function appRow(app, opts) {
    const { keyword = '', rank = 0 } = opts || {};
    const li = el('li', 'approw');

    if (rank) li.appendChild(el('span', 'rank-no', String(rank)));

    li.appendChild(appIcon(app));

    const meta = el('div', 'appmeta');
    const name = el('div', 'appname');
    name.appendChild(highlight(app.name, keyword));
    meta.appendChild(name);

    const sub = el('div', 'appsub');
    sub.appendChild(highlight(app.sub, keyword));
    meta.appendChild(sub);

    const tag = el('div', 'apptag');
    tag.appendChild(el('b', null, app.category));
    tag.appendChild(el('span', null, '·'));
    tag.appendChild(el('span', null, '★ ' + app.rating.toFixed(1)));
    tag.appendChild(el('span', null, '·'));
    tag.appendChild(el('span', null, app.sizeMB + ' MB'));
    meta.appendChild(tag);
    li.appendChild(meta);

    const btn = el('button', 'get-btn', '获取');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      if (btn.dataset.done === '1') return;
      btn.dataset.done = '1';
      btn.textContent = '已获取';
    });
    li.appendChild(btn);

    return li;
  }

  function renderPromo() {
    const btn = el('button', 'promo');
    btn.type = 'button';
    btn.style.setProperty('--p1', promo.c1);
    btn.style.setProperty('--p2', promo.c2);

    btn.appendChild(el('span', 'promo__tag', promo.tag));
    btn.appendChild(el('div', 'promo__title', promo.title));
    btn.appendChild(el('div', 'promo__desc', promo.desc));

    const foot = el('div', 'promo__foot');
    const covers = el('div', 'promo__covers');
    promo.covers.forEach((c) => {
      const s = el('span');
      s.style.background = c;
      covers.appendChild(s);
    });
    foot.appendChild(covers);
    foot.appendChild(el('span', 'promo__cta', promo.cta));
    btn.appendChild(foot);

    dom.promoSlot.replaceChildren(btn);
  }

  function renderChips() {
    const frag = document.createDocumentFragment();
    chips.forEach((name, i) => {
      const b = el('button', 'chip' + (i === 0 ? ' is-active' : ''), name);
      b.type = 'button';
      b.addEventListener('click', () => {
        dom.chips.querySelectorAll('.chip').forEach((n) => n.classList.remove('is-active'));
        b.classList.add('is-active');
      });
      frag.appendChild(b);
    });
    dom.chips.replaceChildren(frag);
  }

  /** @param {HTMLElement} listEl */
  function fillList(listEl, items, opts) {
    const frag = document.createDocumentFragment();
    items.forEach((app, i) => frag.appendChild(appRow(app, { rank: opts && opts.rank ? i + 1 : 0 })));
    listEl.replaceChildren(frag);
  }

  /* ---------------- 首页数据装载（模拟请求） ---------------- */

  function loadHome() {
    // 真实项目里这里是 fetch(...).then(...)
    setTimeout(() => {
      renderPromo();
      renderChips();
      fillList(dom.recList, apps.filter((a) => a.rank <= 6));
      fillList(dom.rankList, apps.slice().sort((a, b) => b.rating - a.rating).slice(0, 8), { rank: true });

      dom.skeleton.hidden = true;
      dom.home.hidden = false;
    }, 620);
  }

  /* ---------------- 搜索 ---------------- */

  const state = {
    mode: 'home',      // home | search
    keyword: '',
    composing: false,  // 输入法是否正在组合
    lastSignature: ''
  };

  function filterApps(keyword) {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.sub.toLowerCase().includes(kw) ||
        a.category.toLowerCase().includes(kw)
    );
  }

  function renderSuggest() {
    if (!state.keyword.trim()) {
      const wrap = document.createDocumentFragment();
      wrap.appendChild(el('div', 'suggest-title', '热门搜索'));
      const list = el('div', 'suggest-list');
      hotWords.forEach((w) => {
        const b = el('button', 'suggest-item', w);
        b.type = 'button';
        b.addEventListener('click', () => {
          dom.q.value = w;
          onQueryChanged(w);
        });
        list.appendChild(b);
      });
      wrap.appendChild(list);
      dom.suggestSlot.replaceChildren(wrap);
      dom.resultList.replaceChildren();
      dom.emptyHint.hidden = true;
      state.lastSignature = 'hot';
      return;
    }

    dom.suggestSlot.replaceChildren();
    const items = filterApps(state.keyword);
    // 结果签名一致就不重建 DOM：这是「每次按键整页闪一下」的根治办法
    const signature = state.keyword.trim() + '|' + items.map((a) => a.id).join(',');
    if (signature === state.lastSignature) return;
    state.lastSignature = signature;

    const frag = document.createDocumentFragment();
    items.forEach((app) => frag.appendChild(appRow(app, { keyword: state.keyword.trim() })));
    dom.resultList.replaceChildren(frag);
    dom.emptyHint.hidden = items.length > 0;
  }

  /* 输入处理：组合期间不查询，组合结束统一提交一次 */
  let debounceTimer = 0;

  function onQueryChanged(raw) {
    const value = raw == null ? dom.q.value : raw;
    state.keyword = value;

    // 有内容才隐藏语音按钮、显示清空按钮 —— 只切 hidden，不重建节点
    const hasText = value.length > 0;
    dom.voiceBtn.hidden = hasText;
    dom.clearBtn.hidden = !hasText;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(renderSuggest, state.composing ? 260 : 160);
  }

  function enterSearchMode() {
    if (state.mode === 'search') return;
    state.mode = 'search';
    dom.home.hidden = true;
    dom.searchPane.hidden = false;
    dom.cancelBtn.hidden = false;
    dom.topbar.classList.add('is-searching', 'is-editing');
    renderSuggest();
  }

  function exitSearchMode() {
    if (state.mode === 'home') return;
    state.mode = 'home';
    state.keyword = '';
    state.lastSignature = '';
    dom.q.value = '';
    dom.q.blur();
    dom.searchPane.hidden = true;
    dom.home.hidden = false;
    dom.cancelBtn.hidden = true;
    dom.voiceBtn.hidden = false;
    dom.clearBtn.hidden = true;
    dom.topbar.classList.remove('is-searching', 'is-editing');
  }

  /* ---------------- 事件绑定 ---------------- */

  dom.q.addEventListener('focus', enterSearchMode);

  dom.q.addEventListener('compositionstart', () => {
    state.composing = true;
  });

  // 关键：组合结束时先更新文本，再在下一帧统一渲染。
  // 直接把过滤结果同步写回 DOM 会在 IME 提交的同一帧里触发重排，
  // 表现为「文字进框的瞬间整条搜索框往下掉一下」。
  dom.q.addEventListener('compositionend', () => {
    state.composing = false;
    const value = dom.q.value;
    requestAnimationFrame(() => onQueryChanged(value));
  });

  dom.q.addEventListener('input', (e) => {
    // 组合中的 input 事件（拼音逐字上屏）不触发过滤
    if (state.composing || e.isComposing) return;
    onQueryChanged(dom.q.value);
  });

  dom.q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      exitSearchMode();
    }
  });

  dom.voiceBtn.addEventListener('click', () => {
    // 演示位：真实项目在这里唤起语音识别
    dom.voiceBtn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'ease-out' }
    );
  });

  dom.clearBtn.addEventListener('click', () => {
    dom.q.value = '';
    state.lastSignature = '';
    onQueryChanged('');
    dom.q.focus();
  });

  dom.cancelBtn.addEventListener('click', exitSearchMode);

  /* 主题：跟随系统 → 手动切换 → 本地记住 */
  const storedTheme = localStorage.getItem('sf-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    document.documentElement.dataset.theme = storedTheme;
  }
  const syncThemeIcon = () => {
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    dom.themeIcon.textContent = dark ? '☀' : '☾';
  };
  syncThemeIcon();

  dom.themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    localStorage.setItem('sf-theme', dark ? 'light' : 'dark');
    syncThemeIcon();
  });

  /* 滚动到顶部后给顶栏补一条分隔线：交给 IntersectionObserver，不监听 scroll */
  const sentinel = el('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
  dom.content.prepend(sentinel);
  new IntersectionObserver(
    ([entry]) => dom.topbar.classList.toggle('is-stuck', !entry.isIntersecting),
    { threshold: 0 }
  ).observe(sentinel);

  /* 启动 */
  loadHome();
})();
