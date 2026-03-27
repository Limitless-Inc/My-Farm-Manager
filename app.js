(function () {
  'use strict';

  /* ── Global Auth State ───────────────────────── */
  let currentUser = null;

  /* ── Helpers ─────────────────────────────────── */
  function qs(id) { return document.getElementById(id); }
  function escapeHTML(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function readFile(file, cb) {
    const fr = new FileReader();
    fr.onload = () => cb(fr.result);
    fr.readAsDataURL(file);
  }
  function store(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  async function load(key) { return await dbLoad(key); }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function toast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
  function confirmDel() { return confirm('Delete this item? This cannot be undone.'); }

  /* ── Auth UI Management ──────────────────────── */
  function updateAuthUI() {
    console.log('updateAuthUI called, currentUser:', currentUser);
    const authButtons = document.querySelectorAll('.auth-required');
    const publicOnly = document.querySelectorAll('.public-only');
    const userInfo = qs('userInfo');

    if (currentUser) {
      // User is logged in
      console.log('User is logged in:', currentUser.email);
      authButtons.forEach(btn => btn.style.display = 'block');
      publicOnly.forEach(el => el.style.display = 'none');
      if (userInfo) {
        userInfo.innerHTML = `
          <span>Welcome, ${escapeHTML(currentUser.user_metadata?.name || currentUser.email)}!</span>
          <button id="logoutBtn" class="btn btn-outline">Logout</button>
        `;
        qs('logoutBtn').addEventListener('click', handleLogout);
      }
    } else {
      // User is not logged in
      console.log('User is not logged in');
      authButtons.forEach(btn => btn.style.display = 'none');
      publicOnly.forEach(el => el.style.display = 'block');
      if (userInfo) {
        userInfo.innerHTML = `
          <a href="login.html" class="btn btn-outline">Login</a>
          <a href="signup.html" class="btn">Sign Up</a>
        `;
      }
      // Also attach listeners to any login/signup buttons in public-only sections
      document.querySelectorAll('.public-only a[href="login.html"]').forEach(link => {
        // Links work automatically, no need for event listeners
      });
      document.querySelectorAll('.public-only a[href="signup.html"]').forEach(link => {
        // Links work automatically, no need for event listeners
      });
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      currentUser = null;
      updateAuthUI();
      toast('Logged out successfully', 'info');
      // Refresh current page to show public view
      location.reload();
    } catch (err) {
      console.error(err);
      toast('Error logging out', 'error');
    }
  }

  /* badge colour by category */
  const BADGE = {
    crop: 'green', harvest: 'green', income: 'green',
    expense: 'red', livestock: 'amber', general: 'grey',
    irrigation: 'blue', 'plastic-farming': 'purple', organic: 'green',
    technology: 'blue', storage: 'amber', other: 'grey',
    tips: 'green', disease: 'red', government: 'blue',
    'weather-alert': 'amber', 'market-price': 'purple',
    crops: 'green', vegetables: 'green', fruits: 'amber',
    dairy: 'blue', seeds: 'green', equipment: 'grey'
  };
  function badge(cat) {
    const colour = BADGE[cat] || 'grey';
    return `<span class="badge badge-${colour}">${escapeHTML(cat)}</span>`;
  }

  /* ── Mobile nav toggle ───────────────────────── */
  function initNav() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
  }

  /* ── Post toggle (show / hide forms) ─────────── */
  function initPostToggle() {
    document.querySelectorAll('.post-toggle-btn').forEach(btn => {
      btn.dataset.defaultText = btn.textContent;
      btn.addEventListener('click', () => {
        const target = qs(btn.dataset.target);
        if (!target) return;
        const isNowHidden = target.classList.toggle('hidden');
        btn.textContent = isNowHidden ? btn.dataset.defaultText : '✕ Close';
        if (!isNowHidden) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    document.querySelectorAll('.post-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = qs(btn.dataset.target);
        if (!target) return;
        target.classList.add('hidden');
        const toggleBtn = document.querySelector(`.post-toggle-btn[data-target="${btn.dataset.target}"]`);
        if (toggleBtn) toggleBtn.textContent = toggleBtn.dataset.defaultText;
      });
    });
  }

  /* ── Global search ───────────────────────────── */
  async function initSearch() {
    const input = qs('globalSearch');
    const box = qs('searchResults');
    if (!input || !box) return;

    const SOURCES = [
      { key: 'mf_records',     page: 'records.html',    tf: 'title',     df: 'notes' },
      { key: 'mf_innovations', page: 'innovation.html', tf: 'invTitle',  df: 'invDesc' },
      { key: 'mf_news',        page: 'news.html',       tf: 'newsTitle', df: 'newsBody' },
      { key: 'mf_products',    page: 'market.html',     tf: 'prodName',  df: 'prodDesc' }
    ];

    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = input.value.trim().toLowerCase();
        if (!q) { box.style.display = 'none'; return; }
        const hits = [];
        for (const src of SOURCES) {
          (await load(src.key)).forEach(it => {
            const t = (it[src.tf] || '').toLowerCase();
            const d = (it[src.df] || '').toLowerCase();
            if (t.includes(q) || d.includes(q))
              hits.push({ label: it[src.tf] || 'Untitled', page: src.page });
          });
        }
        box.innerHTML = hits.length
          ? hits.slice(0, 10).map(h => `<a href="${h.page}">${escapeHTML(h.label)}</a>`).join('')
          : '<div class="empty">No results</div>';
        box.style.display = 'block';
      }, 150);
    });
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
  }

  /* ── Home page ───────────────────────────────── */
  async function initHome() {
    if (document.body.id !== 'home') return;

    /* stats */
    const counts = {
      statRecords:     (await load('mf_records')).length,
      statProducts:    (await load('mf_products')).length,
      statNews:        (await load('mf_news')).length,
      statInnovations: (await load('mf_innovations')).length
    };
    const labels = { statRecords: 'Records', statProducts: 'Products', statNews: 'News', statInnovations: 'Innovations' };
    Object.keys(counts).forEach(id => {
      const el = qs(id);
      if (el) el.textContent = `${counts[id]} ${labels[id]}`;
    });

    /* tip of the day */
    const tips = [
      '💧 Water your crops early morning to reduce evaporation.',
      '🌱 Rotate crops each season to maintain soil health.',
      '🐛 Check plants weekly for early signs of pests or disease.',
      '📦 Store harvested grain in a cool, dry place to prevent mould.',
      '🌧️ Collect rainwater during wet season for dry-season irrigation.',
      '🪱 Add compost to improve soil fertility naturally.',
      '🌿 Intercrop maize with beans to fix nitrogen in the soil.',
      '📋 Keep records of every expense — small costs add up fast.'
    ];
    const tip = qs('tipBar');
    if (tip) tip.textContent = tips[new Date().getDay() % tips.length];

    /* recent feed */
    const feed = qs('recentFeed');
    if (!feed) return;
    const all = [
      ...(await load('mf_records')).map(i => ({ icon: '📋', text: i.title, page: 'records.html', ts: i.created })),
      ...(await load('mf_innovations')).map(i => ({ icon: '💡', text: i.invTitle, page: 'innovation.html', ts: i.created })),
      ...(await load('mf_news')).map(i => ({ icon: '📰', text: i.newsTitle, page: 'news.html', ts: i.created })),
      ...(await load('mf_products')).map(i => ({ icon: '🛒', text: i.prodName, page: 'market.html', ts: i.created }))
    ].filter(i => i.text).sort((a, b) => b.ts - a.ts).slice(0, 8);

    if (!all.length) {
      feed.innerHTML = '<li class="feed-item"><span class="feed-icon">🌱</span><div>No activity yet — start by adding a record!</div></li>';
      return;
    }
    feed.innerHTML = all.map(i => `
      <li class="feed-item">
        <span class="feed-icon">${i.icon}</span>
        <div>
          <a href="${i.page}">${escapeHTML(i.text)}</a>
          <div class="feed-meta">${timeAgo(i.ts)}</div>
        </div>
      </li>`).join('');
  }

  /* ── Records ─────────────────────────────────── */
  async function initRecords() {
    const form = qs('recordForm');
    if (!form) return;
    const KEY = 'mf_records';
    let activeFilter = 'all';

    async function summary() {
      const strip = qs('recordSummary');
      if (!strip) return;
      const items = await load(KEY);
      const income  = items.filter(r => r.category === 'income').reduce((s, r) => s + (+r.amount || 0), 0);
      const expense = items.filter(r => r.category === 'expense').reduce((s, r) => s + (+r.amount || 0), 0);
      strip.innerHTML = `
        <div class="summary-pill">Total <strong>${items.length}</strong></div>
        <div class="summary-pill">Income <strong>UGX ${income.toLocaleString()}</strong></div>
        <div class="summary-pill">Expenses <strong>UGX ${expense.toLocaleString()}</strong></div>
        <div class="summary-pill">Balance <strong>UGX ${(income - expense).toLocaleString()}</strong></div>`;
    }

    async function render() {
      await summary();
      const list = qs('recordsList');
      if (!list) return;
      let items = await load(KEY);
      if (activeFilter !== 'all') items = items.filter(r => r.category === activeFilter);
      if (!items.length) {
        list.innerHTML = '<li class="empty-state">No records yet. Add one above.</li>';
        return;
      }
      list.innerHTML = items.map((it, idx) => `
        <li>
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span class="card-title">${escapeHTML(it.title)}</span>
            ${badge(it.category || 'general')}
          </div>
          ${it.when ? `<div class="card-meta">📅 ${new Date(it.when).toLocaleDateString('en-UG', { dateStyle: 'medium' })}</div>` : ''}
          ${it.amount ? `<div class="card-meta">💰 UGX ${(+it.amount).toLocaleString()}</div>` : ''}
          ${it.notes ? `<div class="card-body">${escapeHTML(it.notes)}</div>` : ''}
          <div class="card-meta">${timeAgo(it.created)}</div>
          <div class="card-actions">
            <button class="btn-sm btn-del" data-id="${it.id}">Delete</button>
          </div>
        </li>`).join('');

      list.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async e => {
        if (!confirmDel()) return;
        const id = e.target.dataset.id;
        try {
          await dbDelete(KEY, id);
          await render();
          toast('Record deleted', 'info');
        } catch (err) {
          console.error(err);
          toast('Failed to delete record.', 'error');
        }
      }));
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const title = qs('recTitle').value.trim();
      if (!title) { toast('Please add a title', 'error'); return; }
      const item = {
        title,
        category: qs('recCategory').value,
        amount: qs('recAmount').value,
        when: qs('recWhen').value,
        notes: qs('recNotes').value.trim(),
        created: Date.now()
      };
      try {
        await dbInsert(KEY, item);
        form.reset();
        await render();
        toast('Record saved!');
      } catch (err) {
        console.error(err);
        toast('Failed to save record. Check database setup.', 'error');
      }
    });

    document.querySelectorAll('#recFilters .chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        document.querySelectorAll('#recFilters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        await render();
      });
    });

    await render();
  }

  /* ── Alarms ──────────────────────────────────── */
  function initAlarms() {
    const form = qs('alarmForm');
    if (!form) return;
    const KEY = 'mf_alarms';

    /* request notification permission once */
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    /* beep using Web Audio API */
    function beep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      } catch (_) {}
    }

    function fireAlarm(alarm, idx) {
      beep();
      /* browser notification */
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Farm Reminder', {
          body: alarm.label + (alarm.note ? ' — ' + alarm.note : ''),
          icon: ''
        });
      }
      /* mark as fired so it only rings once */
      const items = load(KEY);
      if (items[idx]) { items[idx].fired = true; store(KEY, items); }
      renderAlarms();
      toast('⏰ Reminder: ' + alarm.label, 'warning');
    }

    function countdown(ts) {
      const diff = ts - Date.now();
      if (diff <= 0) return null;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 48) return Math.floor(h / 24) + 'd left';
      if (h > 0)  return h + 'h ' + m + 'm left';
      return m + 'm left';
    }

    function renderAlarms() {
      const list = qs('alarmList');
      if (!list) return;
      const items = load(KEY);
      if (!items.length) {
        list.innerHTML = '<li class="empty-state">No reminders yet. Add one above.</li>';
        return;
      }
      list.innerHTML = items.map((it, idx) => {
        const due = new Date(it.when);
        const isPast = Date.now() >= due.getTime();
        const cd = countdown(due.getTime());
        let countEl;
        if (it.dismissed) {
          countEl = '<span class="alarm-countdown done">✔ Done</span>';
        } else if (isPast) {
          countEl = '<span class="alarm-countdown overdue">⏰ Overdue</span>';
        } else {
          countEl = `<span class="alarm-countdown">${cd}</span>`;
        }
        return `<li class="${!it.dismissed && isPast && !it.fired ? 'alarm-ringing' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span class="card-title">${escapeHTML(it.label)}</span>
            ${countEl}
          </div>
          <div class="card-meta">📅 ${due.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          ${it.note ? `<div class="card-body">${escapeHTML(it.note)}</div>` : ''}
          <div class="card-meta">${timeAgo(it.created)}</div>
          <div class="card-actions">
            ${!it.dismissed ? `<button class="btn-sm btn-dismiss" data-idx="${idx}">Dismiss</button>` : ''}
            <button class="btn-sm btn-del" data-idx="${idx}">Delete</button>
          </div>
        </li>`;
      }).join('');

      list.querySelectorAll('.btn-dismiss').forEach(b => b.addEventListener('click', e => {
        const items = load(KEY);
        items[+e.target.dataset.idx].dismissed = true;
        store(KEY, items);
        renderAlarms();
        toast('Reminder dismissed', 'info');
      }));
      list.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', e => {
        if (!confirmDel()) return;
        const items = load(KEY);
        items.splice(+e.target.dataset.idx, 1);
        store(KEY, items);
        renderAlarms();
        toast('Reminder deleted', 'info');
      }));
    }

    /* poll every 30 seconds */
    function checkAlarms() {
      const items = load(KEY);
      items.forEach((it, idx) => {
        if (it.dismissed || it.fired) return;
        if (Date.now() >= new Date(it.when).getTime()) {
          fireAlarm(it, idx);
        }
      });
    }
    checkAlarms();
    setInterval(checkAlarms, 30000);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const label = qs('alarmLabel').value.trim();
      const when  = qs('alarmWhen').value;
      if (!label || !when) { toast('Please fill in label and time', 'error'); return; }
      if (new Date(when).getTime() <= Date.now()) { toast('Pick a future date/time', 'error'); return; }
      const items = load(KEY);
      items.unshift({ label, when, note: qs('alarmNote').value.trim(), created: Date.now() });
      store(KEY, items);
      form.reset();
      renderAlarms();
      toast('Reminder set! ⏰');
    });

    renderAlarms();
    /* refresh countdowns every minute */
    setInterval(renderAlarms, 60000);
  }

  /* ── Generic image-post pages ────────────────── */
  async function initPosts(opts) {
    const { formId, listId, previewId, vidPreviewId, storageKey, fields, pageId, renderItem } = opts;
    const form = qs(formId);
    if (!form) return;
    const list = qs(listId);
    const preview = qs(previewId);
    const vidPreview = vidPreviewId ? qs(vidPreviewId) : null;
    let activeFilter = 'all';

    async function render() {
      if (!list) return;
      let items = await load(storageKey);
      if (activeFilter !== 'all') items = items.filter(it =>
        (it.invCategory || it.newsCategory || it.prodCategory) === activeFilter
      );
      if (!items.length) {
        list.innerHTML = '<li class="empty-state">No posts yet. Be the first!</li>';
        return;
      }
      list.innerHTML = items.map(it => renderItem(it)).join('');
      await attachActions(list, storageKey, render);
    }

    /* photo preview */
    const photoInput = form.querySelector('input[type=file][accept*="image"]');
    if (photoInput && preview) {
      photoInput.addEventListener('change', () => {
        const f = photoInput.files[0];
        if (!f) { preview.innerHTML = ''; delete preview.dataset.src; return; }
        readFile(f, src => { preview.innerHTML = `<img src="${src}" alt="preview">`; preview.dataset.src = src; });
      });
    }

    /* video preview */
    const videoInput = form.querySelector('input[type=file][accept*="video"]');
    if (videoInput && vidPreview) {
      videoInput.addEventListener('change', () => {
        const f = videoInput.files[0];
        if (!f) { vidPreview.innerHTML = ''; delete vidPreview.dataset.src; return; }
        if (f.size > 10 * 1024 * 1024) {
          toast('Video too large to save (max 10 MB)', 'warning');
          videoInput.value = '';
          return;
        }
        readFile(f, src => {
          vidPreview.innerHTML = `<video controls><source src="${src}"></video>`;
          vidPreview.dataset.src = src;
        });
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = { created: Date.now() };
      fields.forEach(f => { const el = qs(f); if (el) data[f] = el.value.trim(); });
      /* validate first required field */
      if (!data[fields[0]]) { toast('Please fill in the required field', 'error'); return; }
      data.image = preview && preview.dataset.src ? preview.dataset.src : null;
      data.video = vidPreview && vidPreview.dataset.src ? vidPreview.dataset.src : null;
      data.likes = 0;
      try {
        await dbInsert(storageKey, data);
        form.reset();
        if (preview) { preview.innerHTML = ''; delete preview.dataset.src; }
        if (vidPreview) { vidPreview.innerHTML = ''; delete vidPreview.dataset.src; }
        /* auto-close form after posting */
        form.classList.add('hidden');
        const toggleBtn = document.querySelector(`.post-toggle-btn[data-target="${formId}"]`);
        if (toggleBtn) toggleBtn.textContent = toggleBtn.dataset.defaultText;
        await render();
        toast('Posted! ✅');
      } catch (err) {
        console.error(err);
        toast('Failed to post. Check database setup.', 'error');
      }
    });

    /* filter chips on this page */
    document.querySelectorAll(`#${pageId} .filter-row .chip`).forEach(chip => {
      chip.addEventListener('click', async () => {
        document.querySelectorAll(`#${pageId} .filter-row .chip`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        await render();
      });
    });

    await render();
  }

  async function attachActions(list, storageKey, render) {
    /* delete - only show for user's own posts */
    list.querySelectorAll('.btn-del').forEach(b => {
      const id = b.dataset.id;
      const userId = b.dataset.userId;
      if (currentUser && currentUser.id === userId) {
        b.style.display = 'inline-block';
        b.addEventListener('click', async e => {
          if (!confirmDel()) return;
          try {
            await dbDelete(storageKey, id);
            await render();
            toast('Deleted', 'info');
          } catch (err) {
            console.error(err);
            toast('Failed to delete.', 'error');
          }
        });
      } else {
        b.style.display = 'none';
      }
    });

    /* like - only for authenticated users */
    list.querySelectorAll('.btn-like').forEach(b => b.addEventListener('click', async e => {
      if (!currentUser) {
        toast('Please login to like posts', 'info');
        return;
      }
      const id = e.target.dataset.id;
      try {
        await dbLike(storageKey, id);
        // Update the like count in UI
        const currentLikes = parseInt(e.target.textContent.match(/\d+/) || '0');
        e.target.textContent = `👍 ${currentLikes + 1}`;
        e.target.disabled = true; // Prevent multiple likes
      } catch (err) {
        console.error(err);
        toast('Failed to like.', 'error');
      }
    }));

    /* sold toggle - only for user's own products */
    list.querySelectorAll('.btn-sold').forEach(b => {
      const userId = b.dataset.userId;
      if (currentUser && currentUser.id === userId) {
        b.style.display = 'inline-block';
        b.addEventListener('click', async e => {
          const id = b.dataset.id;
          try {
            const items = await load(storageKey);
            const item = items.find(it => it.id == id);
            if (item) {
              item.sold = !item.sold;
              await dbUpdate(storageKey, id, { sold: item.sold });
              await render();
            }
          } catch (err) {
            console.error(err);
            toast('Failed to update.', 'error');
          }
        });
      } else {
        b.style.display = 'none';
      }
    });

    /* read-more */
    list.querySelectorAll('.read-more-btn').forEach(b => b.addEventListener('click', e => {
      const body = e.target.previousElementSibling;
      if (!body) return;
      const collapsed = body.classList.toggle('collapsed');
      e.target.textContent = collapsed ? 'Read more' : 'Show less';
    }));
  }

  /* ── Innovation renderer ─────────────────────── */
  function renderInnovation(it) {
    const img = it.image ? `<img class="card-img" src="${it.image}" alt="">` : '';
    const vidBtn = it.video
      ? `<button class="btn-sm btn-play" data-video="${it.video}" data-title="${escapeHTML(it.invTitle || '')}">▶ Video</button>`
      : '';
    const authorInfo = it.author_name ? `<div class="card-meta">👤 ${escapeHTML(it.author_name)}</div>` : '';
    return `<li>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span class="card-title">${escapeHTML(it.invTitle || 'Untitled')}</span>
        ${badge(it.invCategory || 'other')}
      </div>
      ${img}
      <div class="card-body collapsed">${escapeHTML(it.invDesc || '')}</div>
      <button class="read-more-btn">Read more</button>
      ${authorInfo}
      <div class="card-meta">${timeAgo(it.created)}</div>
      <div class="card-actions">
        <button class="btn-sm btn-like" data-id="${it.id}">👍 ${it.likes || 0}</button>
        ${vidBtn}
        <button class="btn-sm btn-del" data-id="${it.id}" data-user-id="${it.user_id || ''}">Delete</button>
      </div>
    </li>`;
  }

  /* ── News renderer ───────────────────────────── */
  const NEWS_BADGE = { tips: 'green', disease: 'red', government: 'blue', 'weather-alert': 'amber', 'market-price': 'purple', general: 'grey' };
  function renderNews(it) {
    const img = it.image ? `<img class="card-img" src="${it.image}" alt="">` : '';
    const colour = NEWS_BADGE[it.newsCategory] || 'grey';
    const pinned = it.pinned ? '📌 ' : '';
    const vidBtn = it.video
      ? `<button class="btn-sm btn-play" data-video="${it.video}" data-title="${escapeHTML(it.newsTitle || '')}">▶ Video</button>`
      : '';
    const authorInfo = it.author_name ? `<div class="card-meta">👤 ${escapeHTML(it.author_name)}</div>` : '';
    return `<li${it.pinned ? ' style="border-color:var(--amber);border-width:2px"' : ''}>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span class="card-title">${pinned}${escapeHTML(it.newsTitle || 'Untitled')}</span>
        <span class="badge badge-${colour}">${escapeHTML(it.newsCategory || 'general')}</span>
      </div>
      ${img}
      <div class="card-body collapsed">${escapeHTML(it.newsBody || '')}</div>
      <button class="read-more-btn">Read more</button>
      ${authorInfo}
      <div class="card-meta">${timeAgo(it.created)}</div>
      <div class="card-actions">
        <button class="btn-sm btn-like" data-id="${it.id}">👍 ${it.likes || 0}</button>
        ${vidBtn}
        <button class="btn-sm btn-del" data-id="${it.id}" data-user-id="${it.user_id || ''}">Delete</button>
      </div>
    </li>`;
  }

  /* ── Market renderer ─────────────────────────── */
  function renderProduct(it) {
    const img = it.image ? `<img class="card-img" src="${it.image}" alt="">` : '';
    const status = it.sold
      ? '<span class="sold-badge">SOLD</span>'
      : '<span class="available-badge">Available</span>';
    const authorInfo = it.author_name ? `<div class="card-meta">👤 ${escapeHTML(it.author_name)}</div>` : '';
    return `<li>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span class="card-title">${escapeHTML(it.prodName || 'Untitled')}</span>
        ${badge(it.prodCategory || 'crops')}
      </div>
      ${status}
      ${img}
      ${it.prodPrice ? `<div class="card-body"><strong>UGX ${(+it.prodPrice).toLocaleString()}</strong></div>` : ''}
      ${it.prodQty ? `<div class="card-meta">📦 ${escapeHTML(it.prodQty)}</div>` : ''}
      ${it.prodLocation ? `<div class="card-meta">📍 ${escapeHTML(it.prodLocation)}</div>` : ''}
      ${it.prodDesc ? `<div class="card-body">${escapeHTML(it.prodDesc)}</div>` : ''}
      ${authorInfo}
      <div class="card-meta">${timeAgo(it.created)}</div>
      <div class="card-actions">
        ${it.prodContact ? `<a class="btn-sm btn-call" href="tel:${escapeHTML(it.prodContact)}">📞 Call</a>` : ''}
        <button class="btn-sm btn-sold" data-id="${it.id}" data-user-id="${it.user_id || ''}">${it.sold ? 'Mark Available' : 'Mark Sold'}</button>
        <button class="btn-sm btn-del" data-id="${it.id}" data-user-id="${it.user_id || ''}">Delete</button>
      </div>
    </li>`;
  }

  /* ── Market search ───────────────────────────── */
  async function initMarketSearch() {
    const input = qs('marketSearch');
    const list = qs('productList');
    if (!list) return;

    async function displayProducts(searchQuery = '') {
      try {
        const items = await load('mf_products');
        const filtered = searchQuery
          ? items.filter(p => (p.prodName || '').toLowerCase().includes(searchQuery) || (p.prodLocation || '').toLowerCase().includes(searchQuery) || (p.prodCategory || '').toLowerCase().includes(searchQuery))
          : items;
        if (!filtered.length) { list.innerHTML = '<li class="empty-state">No products match your search.</li>'; return; }
        list.innerHTML = filtered.map(it => renderProduct(it)).join('');
        await attachActions(list, 'mf_products', () => initMarketSearch());
      } catch (err) {
        console.error(err);
        list.innerHTML = '<li class="empty-state">Error loading products.</li>';
      }
    }

    // Load products on page load
    await displayProducts();

    // Handle search input
    if (input) {
      input.addEventListener('input', async () => {
        const q = input.value.trim().toLowerCase();
        await displayProducts(q);
      });
    }
  }

  /* ── Video modal ─────────────────────────────── */
  function initVideoModal() {
    const modal = qs('videoModal');
    if (!modal) return;
    const vidEl  = qs('modalVideo');
    const titleEl = qs('modalTitle');

    function closeModal() {
      modal.classList.remove('open');
      if (vidEl) { vidEl.pause(); vidEl.removeAttribute('src'); vidEl.load(); }
    }

    const closeBtn = qs('modalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* delegate click on any [data-video] button */
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-video]');
      if (!btn || !btn.dataset.video) return;
      if (vidEl) { vidEl.src = btn.dataset.video; vidEl.play().catch(() => {}); }
      if (titleEl) titleEl.textContent = btn.dataset.title || '';
      modal.classList.add('open');
    });
  }

  /* ── Weather ─────────────────────────────────── */
  function initWeather() {
    const btn = qs('useLocation');
    const cur = qs('currentWeather');
    const forecastEl = qs('forecast');
    const adviceEl = qs('farmAdvice');
    const DEFAULT = { lat: 0.3476, lon: 32.5825 };

    async function fetchWeather(lat, lon) {
      if (cur) cur.innerHTML = '<div style="color:#fff;padding:10px">Loading…</div>';
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Africa%2FKampala&forecast_days=5`;
        const data = await fetch(url).then(r => r.json());
        const cw = data.current_weather;

        if (cur) cur.innerHTML = `
          <h3>Current Weather</h3>
          <div class="w-temp">${cw.temperature}°C</div>
          <div class="w-row">
            <span>💨 Wind: ${cw.windspeed} km/h</span>
            <span>🕐 ${cw.time}</span>
          </div>`;

        if (data.daily && forecastEl) {
          forecastEl.innerHTML = data.daily.time.map((date, i) => `
            <div class="forecast-card">
              <div class="fc-date">${new Date(date).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div class="fc-temp">↑${data.daily.temperature_2m_max[i]}° ↓${data.daily.temperature_2m_min[i]}°</div>
              <div class="fc-rain">🌧 ${data.daily.precipitation_sum[i]} mm</div>
            </div>`).join('');
        }

        if (adviceEl) {
          const rain = data.daily ? data.daily.precipitation_sum[0] : 0;
          const maxT = data.daily ? data.daily.temperature_2m_max[0] : cw.temperature;
          const tips = [];
          if (rain > 10) tips.push('Heavy rain expected — avoid spraying pesticides today.');
          else if (rain > 2) tips.push('Light rain expected — good day to transplant seedlings.');
          else tips.push('Dry conditions — water your crops in the morning.');
          if (maxT > 30) tips.push('High temperatures — mulch around plants to retain moisture.');
          if (maxT < 18) tips.push('Cool day — good for harvesting leafy vegetables.');
          tips.push('Check soil moisture before irrigating to avoid overwatering.');
          adviceEl.innerHTML = `<h4>🌾 Farming Advice for Today</h4><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
        }
      } catch {
        if (cur) cur.innerHTML = '<div style="color:#fff;padding:10px">⚠️ Could not load weather. Check your connection.</div>';
      }
    }

    if (btn) btn.addEventListener('click', () => {
      if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(
          p => fetchWeather(p.coords.latitude, p.coords.longitude),
          () => fetchWeather(DEFAULT.lat, DEFAULT.lon)
        );
      else fetchWeather(DEFAULT.lat, DEFAULT.lon);
    });

    fetchWeather(DEFAULT.lat, DEFAULT.lon);
  }

  /* ── Boot ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth state listener
    console.log('Setting up auth state listener');
    onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      currentUser = session?.user || null;
      updateAuthUI();
    });

    initNav();
    initPostToggle();
    await initSearch();
    await initHome();
    await initRecords();

    await initPosts({
      formId: 'innovationForm', listId: 'innovationList',
      previewId: 'invPreview', vidPreviewId: 'invVidPreview',
      storageKey: 'mf_innovations',
      fields: ['invTitle', 'invCategory', 'invDesc'],
      pageId: 'innovation', renderItem: renderInnovation
    });

    await initPosts({
      formId: 'newsForm', listId: 'newsList',
      previewId: 'newsPreview', vidPreviewId: 'newsVidPreview',
      storageKey: 'mf_news',
      fields: ['newsTitle', 'newsCategory', 'newsBody'],
      pageId: 'news', renderItem: renderNews
    });

    await initPosts({
      formId: 'productForm', listId: 'productList',
      previewId: 'prodPreview',
      storageKey: 'mf_products',
      fields: ['prodName', 'prodCategory', 'prodPrice', 'prodQty', 'prodLocation', 'prodContact', 'prodDesc'],
      pageId: 'market', renderItem: renderProduct
    });

    await initMarketSearch();
    initVideoModal();
    initWeather();
    initAlarms();
  });

})();
