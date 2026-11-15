/* ==========================================================================
   APLIKASI BUKU DIGITAL: SURAH YASIN & TAHLIL SINGKAT
   ========================================================================== */

   /* ==========================================================================
   APLIKASI BUKU DIGITAL: SURAH YASIN & TAHLIL SINGKAT
   ========================================================================== */

const STORAGE_KEY_DATA = 'yasin_tahlil_book_data_v3'; 
const STORAGE_KEY_AUTH = 'yasin_tahlil_auth_creds_v1';
const STORAGE_KEY_SESSION = 'yasin_tahlil_session_logged_in_v1';
const STORAGE_KEY_PAGE = 'yasin_tahlil_current_page_idx_v1';

const safeStore = {
  _mem: {},
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return this._mem[key] || null;
    }
  },
  set(key, val) {
    this._mem[key] = val;
    try {
      window.localStorage.setItem(key, val);
    } catch (e) {}
  },
  remove(key) {
    delete this._mem[key];
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

function buildInitialBookData() {
  return {
    meta: {
      title: 'SURAH YASIN & TAHLIL SINGKAT',
      subtitle: 'Mengalirkan Doa, Menyambung Cinta',
      author: 'PENYUSUN / KELUARGA',
      publisher: 'Cetakan Digital • Panduan Tahlil & Doa',
      preface: 'Buku panduan digital ini disusun untuk memudahkan bacaan dan panduan doa. Seluruh isi bacaan dapat diatur dan disesuaikan melalui menu Pengaturan.',
      itemsPerPage: 3
    },
    sections: []
  };
}

let bookData = loadBookData();
let authCreds = loadAuthCreds();
let generatedPages = [];
let currentSpreadIndex = loadSavedPageIndex();
let isMobileView = window.innerWidth <= 768;

function loadBookData() {
  try {
    const raw = safeStore.get(STORAGE_KEY_DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          meta: Object.assign({
            title: 'SURAH YASIN & TAHLIL SINGKAT',
            subtitle: 'Mengalirkan Doa, Menyambung Cinta',
            author: 'PENYUSUN / KELUARGA',
            publisher: 'Cetakan Digital',
            preface: '',
            itemsPerPage: 3
          }, parsed.meta || {}),
          sections: Array.isArray(parsed.sections) ? parsed.sections : []
        };
      }
    }
  } catch (e) {}
  const initial = buildInitialBookData();
  safeStore.set(STORAGE_KEY_DATA, JSON.stringify(initial));
  return initial;
}

function saveBookData(data = bookData) {
  bookData = data;
  safeStore.set(STORAGE_KEY_DATA, JSON.stringify(bookData));
  showToast('Perubahan buku tersimpan!');
}

function loadAuthCreds() {
  try {
    const raw = safeStore.get(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaultCreds = { username: 'admin', password: 'admin' };
  safeStore.set(STORAGE_KEY_AUTH, JSON.stringify(defaultCreds));
  return defaultCreds;
}

function loadSavedPageIndex() {
  try {
    const saved = safeStore.get(STORAGE_KEY_PAGE);
    if (saved !== null) {
      return parseInt(saved, 10) || 0;
    }
  } catch (e) {}
  return 0;
}

function saveCurrentPageIndex() {
  safeStore.set(STORAGE_KEY_PAGE, String(currentSpreadIndex));
}

window.handleLogin = function (e) {
  if (e && e.preventDefault) e.preventDefault();

  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;

  if (u === authCreds.username && p === authCreds.password) {
    safeStore.set(STORAGE_KEY_SESSION, 'true');
    document.getElementById('login-error').classList.add('hidden');
    showMainApp();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
  return false;
};

window.handleSettingsPin = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const pinInput = document.getElementById('settings-pin-input').value;
  const targetPin = 'Kernaden02';

  if (pinInput === targetPin) {
    document.getElementById('settings-pin-error').classList.add('hidden');
    document.getElementById('settings-pin-modal').classList.add('hidden');
    openSettingsModal();
  } else {
    document.getElementById('settings-pin-error').classList.remove('hidden');
    document.getElementById('settings-pin-input').focus();
  }
  return false;
};

function initApp() {
  if (window.location.search === '?') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  updateTitleDisplays();
  bindEvents();

  if (safeStore.get(STORAGE_KEY_SESSION) === 'true') {
    showMainApp();
  } else {
    showLoginScreen();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function showLoginScreen() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('app-view').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  paginateBook();
  renderBookSpread();
}

function paginateBook() {
  generatedPages = [];
  generatedPages.push({ type: 'cover' });
  generatedPages.push({ type: 'preface', pageLabel: 'ii' });

  let pageNumber = 1;
  const perPage = parseInt(bookData.meta.itemsPerPage, 10) || 3;

  if (Array.isArray(bookData.sections)) {
    bookData.sections.forEach((sec) => {
      const items = sec.items || [];
      if (items.length === 0) {
        generatedPages.push({
          type: 'content',
          pageLabel: String(pageNumber++),
          sectionId: sec.id,
          sectionTitle: sec.title,
          items: []
        });
      } else {
        for (let i = 0; i < items.length; i += perPage) {
          const chunk = items.slice(i, i + perPage);
          generatedPages.push({
            type: 'content',
            pageLabel: String(pageNumber++),
            sectionId: sec.id,
            sectionTitle: i === 0 ? sec.title : null,
            items: chunk
          });
        }
      }
    });
  }

  if (currentSpreadIndex >= generatedPages.length) {
    currentSpreadIndex = generatedPages.length - 1;
  }
}

function renderBookSpread() {
  const spreadEl = document.getElementById('book-spread');
  const statusEl = document.getElementById('page-status-text');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  isMobileView = window.innerWidth <= 768;
  spreadEl.innerHTML = '';

  if (currentSpreadIndex < 0) currentSpreadIndex = 0;
  if (currentSpreadIndex >= generatedPages.length) {
    currentSpreadIndex = generatedPages.length - 1;
  }

  saveCurrentPageIndex();

  if (isMobileView || currentSpreadIndex === 0) {
    spreadEl.className = 'book-spread single-mode';
    const pageObj = generatedPages[currentSpreadIndex];
    spreadEl.appendChild(createPageElement(pageObj, 'single'));

    statusEl.textContent =
      currentSpreadIndex === 0
        ? 'Sampul Depan (Klik buku untuk membuka)'
        : `Halaman ${pageObj.pageLabel} dari ${generatedPages.length - 2}`;

    btnPrev.disabled = currentSpreadIndex === 0;
    btnNext.disabled = currentSpreadIndex >= generatedPages.length - 1;
  } else {
    spreadEl.className = 'book-spread double-mode';
    const leftIdx = currentSpreadIndex % 2 === 1 ? currentSpreadIndex : currentSpreadIndex - 1;
    const rightIdx = leftIdx + 1;

    const leftPage = generatedPages[leftIdx];
    const rightPage = generatedPages[rightIdx];

    if (leftPage) spreadEl.appendChild(createPageElement(leftPage, 'left-page'));
    if (rightPage) spreadEl.appendChild(createPageElement(rightPage, 'right-page'));

    const leftLabel = leftPage ? leftPage.pageLabel : '';
    const rightLabel = rightPage ? ` - ${rightPage.pageLabel}` : '';
    statusEl.textContent = `Halaman ${leftLabel}${rightLabel}`;

    btnPrev.disabled = leftIdx <= 0;
    btnNext.disabled = rightIdx >= generatedPages.length - 1;
  }
}

function createPageElement(pageObj, sideClass) {
  const pageDiv = document.createElement('article');
  pageDiv.className = `book-page ${sideClass}`;

  if (pageObj.type === 'cover') {
    pageDiv.classList.add('cover-page');
    pageDiv.innerHTML = `
      <div class="cover-top-ribbon">
        <span class="cover-ribbon-logo"></span>
      </div>
      <div class="cover-medallion-wrap">
        <div class="cover-starburst"></div>
        <div class="cover-calligraphy">يس</div>
      </div>
      <h1 class="cover-main-title">${escapeHtml(bookData.meta.title)}</h1>
      <div class="cover-subtitle-pill">${escapeHtml(bookData.meta.subtitle)}</div>
      <div class="cover-mosque-bg"></div>
      <div class="cover-author">${escapeHtml(bookData.meta.author)}</div>
      <div class="cover-tap-hint">Klik untuk membuka halaman pertama →</div>
    `;
    pageDiv.addEventListener('click', () => goNextPage());
    return pageDiv;
  }

  if (pageObj.type === 'preface') {
    pageDiv.innerHTML = `
      <div class="ornament-header"></div>
      <div class="page-inner-content">
        <div class="preface-box">
          <h4>${escapeHtml(bookData.meta.title)}</h4>
          <p>${escapeHtml(bookData.meta.preface)}</p>
          <div class="meta-details">
            <strong>Penyusun:</strong> ${escapeHtml(bookData.meta.author)}<br/>
            <span>${escapeHtml(bookData.meta.publisher)}</span>
          </div>
        </div>
      </div>
      <div class="ornament-footer">
        <span class="page-number-badge">${pageObj.pageLabel}</span>
      </div>
    `;
    return pageDiv;
  }

  const bannerHtml = pageObj.sectionTitle
    ? `<div class="section-banner">${escapeHtml(pageObj.sectionTitle)}</div>`
    : '';

  const versesHtml = pageObj.items && pageObj.items.length > 0
    ? pageObj.items
        .map(
          (item) => `
          <div class="verse-block">
            <div class="verse-arabic">
              ${escapeHtml(item.arabic)}
              <span class="ayah-end-ornament">${item.number}</span>
            </div>
            <div class="verse-latin">${escapeHtml(item.latin)}</div>
            <hr class="verse-divider" />
            <div class="verse-translation">${escapeHtml(item.translation)}</div>
          </div>
        `
        )
        .join('')
    : `<div style="text-align: center; color: #888; padding: 40px 20px; font-style: italic;">Belum ada isi bacaan pada bagian ini.<br>Silakan tambah via Pengaturan atau Import file JSON.</div>`;

  pageDiv.innerHTML = `
    <div class="ornament-header"></div>
    <div class="page-inner-content">
      ${bannerHtml}
      ${versesHtml}
    </div>
    <div class="ornament-footer">
      <span class="page-number-badge">${pageObj.pageLabel}</span>
    </div>
  `;

  return pageDiv;
}

function goNextPage() {
  if (isMobileView) {
    if (currentSpreadIndex < generatedPages.length - 1) {
      currentSpreadIndex++;
      renderBookSpread();
    }
  } else {
    if (currentSpreadIndex === 0) {
      currentSpreadIndex = 1;
      renderBookSpread();
    } else if (currentSpreadIndex + 2 < generatedPages.length) {
      currentSpreadIndex += 2;
      renderBookSpread();
    }
  }
}

function goPrevPage() {
  if (isMobileView) {
    if (currentSpreadIndex > 0) {
      currentSpreadIndex--;
      renderBookSpread();
    }
  } else {
    if (currentSpreadIndex <= 1) {
      currentSpreadIndex = 0;
      renderBookSpread();
    } else {
      currentSpreadIndex -= 2;
      renderBookSpread();
    }
  }
}

function openSettingsModal() {
  document.getElementById('meta-title').value = bookData.meta.title;
  document.getElementById('meta-subtitle').value = bookData.meta.subtitle;
  document.getElementById('meta-author').value = bookData.meta.author;
  document.getElementById('meta-publisher').value = bookData.meta.publisher;
  document.getElementById('meta-preface').value = bookData.meta.preface;
  document.getElementById('meta-items-per-page').value = String(bookData.meta.itemsPerPage || 3);

  document.getElementById('admin-new-user').value = authCreds.username;
  document.getElementById('admin-new-pass').value = '';
  document.getElementById('admin-confirm-pass').value = '';

  const selectEl = document.getElementById('section-select');
  selectEl.innerHTML = (bookData.sections || [])
    .map((sec) => `<option value="${sec.id}">${escapeHtml(sec.title)} (${(sec.items || []).length} nomor)</option>`)
    .join('');

  renderSectionItemsEditor();
  document.getElementById('settings-modal').classList.remove('hidden');
}

function renderSectionItemsEditor() {
  const secId = document.getElementById('section-select').value;
  const section = (bookData.sections || []).find((s) => s.id === secId);
  const listEl = document.getElementById('items-editor-list');

  if (!section) {
    listEl.innerHTML = `<div style="text-align:center; color:#777; padding:20px;">Belum ada bab/bagian aktif. Silakan tambahkan bab melalui tombol "+ Tambah Bab" di atas.</div>`;
    return;
  }

  if (!section.items || section.items.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; color:#777; padding:20px;">Belum ada item bacaan di bab ini. Silakan klik tombol "Tambah Nomor Bacaan" di atas.</div>`;
    return;
  }

  listEl.innerHTML = section.items
    .map(
      (item, idx) => `
      <div class="editor-card">
        <div class="editor-card-num">${item.number}</div>
        <div class="editor-card-body">
          <div class="editor-card-arabic">${escapeHtml(item.arabic)}</div>
          <div class="editor-card-latin">${escapeHtml(item.latin)}</div>
          <div class="editor-card-trans">${escapeHtml(item.translation)}</div>
        </div>
        <div class="editor-card-actions">
          <button type="button" class="btn-outline btn-sm-dark" onclick="openItemFormModal(${idx})">Edit</button>
          <button type="button" class="btn-danger-outline btn-sm-dark" onclick="deleteSectionItem(${idx})">Hapus</button>
        </div>
      </div>
    `
    )
    .join('');
}

window.openItemFormModal = function (itemIndex = null) {
  const secId = document.getElementById('section-select').value;
  const section = (bookData.sections || []).find((s) => s.id === secId);
  if (!section) {
    alert('Pilih atau buat bab terlebih dahulu!');
    return;
  }

  const modal = document.getElementById('item-form-modal');
  const titleEl = document.getElementById('item-modal-title');
  const idxInput = document.getElementById('edit-item-index');
  const numInput = document.getElementById('edit-item-number');
  const arabInput = document.getElementById('edit-item-arabic');
  const latinInput = document.getElementById('edit-item-latin');
  const transInput = document.getElementById('edit-item-translation');

  if (itemIndex !== null && section.items[itemIndex]) {
    const item = section.items[itemIndex];
    titleEl.textContent = `Edit Nomor ${item.number} - ${section.title}`;
    idxInput.value = itemIndex;
    numInput.value = item.number;
    arabInput.value = item.arabic;
    latinInput.value = item.latin;
    transInput.value = item.translation;
  } else {
    const nextNum = section.items && section.items.length > 0 ? Math.max(...section.items.map((i) => i.number)) + 1 : 1;
    titleEl.textContent = `Tambah Nomor Baru - ${section.title}`;
    idxInput.value = '';
    numInput.value = nextNum;
    arabInput.value = '';
    latinInput.value = '';
    transInput.value = '';
  }

  modal.classList.remove('hidden');
};

window.deleteSectionItem = function (itemIndex) {
  const secId = document.getElementById('section-select').value;
  const section = (bookData.sections || []).find((s) => s.id === secId);
  if (!section) return;

  if (confirm(`Yakin ingin menghapus nomor ${section.items[itemIndex].number}?`)) {
    section.items.splice(itemIndex, 1);
    saveBookData();
    renderSectionItemsEditor();
    paginateBook();
    renderBookSpread();
  }
};

function openTocModal() {
  const tocList = document.getElementById('toc-list');
  if (!tocList) return;

  let html = `
    <div class="toc-item" onclick="jumpToPage(0)">
      <div>
        <div class="toc-item-title">Sampul Depan</div>
        <div class="toc-item-meta">${escapeHtml(bookData.meta.title)}</div>
      </div>
      <span class="toc-badge">Cover</span>
    </div>
    <div class="toc-item" onclick="jumpToPage(1)">
      <div>
        <div class="toc-item-title">Kata Pengantar</div>
        <div class="toc-item-meta">Halaman ii</div>
      </div>
      <span class="toc-badge">ii</span>
    </div>
  `;

  if (Array.isArray(bookData.sections) && bookData.sections.length > 0) {
    bookData.sections.forEach((sec) => {
      const pageIdx = generatedPages.findIndex(p => p.sectionId === sec.id);
      const pageObj = pageIdx !== -1 ? generatedPages[pageIdx] : null;
      const pageLabel = pageObj ? pageObj.pageLabel : '-';

      html += `
        <div class="toc-item" onclick="jumpToPage(${pageIdx !== -1 ? pageIdx : 0})">
          <div>
            <div class="toc-item-title">${escapeHtml(sec.title)}</div>
            <div class="toc-item-meta">${(sec.items || []).length} Nomor Bacaan</div>
          </div>
          <span class="toc-badge">Hal ${pageLabel}</span>
        </div>
      `;
    });
  }

  tocList.innerHTML = html;
  const tocModal = document.getElementById('toc-modal');
  if (tocModal) tocModal.classList.remove('hidden');
}

window.jumpToPage = function (pageIdx) {
  if (!isMobileView && pageIdx > 0) {
    currentSpreadIndex = pageIdx % 2 === 0 ? pageIdx - 1 : pageIdx;
  } else {
    currentSpreadIndex = pageIdx;
  }
  
  renderBookSpread();
  const tocModal = document.getElementById('toc-modal');
  if (tocModal) tocModal.classList.add('hidden');
};

function bindEvents() {
  document.getElementById('btn-logout').addEventListener('click', () => {
    safeStore.remove(STORAGE_KEY_SESSION);
    safeStore.remove(STORAGE_KEY_PAGE);
    showLoginScreen();
  });

  document.getElementById('btn-next').addEventListener('click', goNextPage);
  document.getElementById('btn-prev').addEventListener('click', goPrevPage);
  document.getElementById('btn-first-page').addEventListener('click', () => {
    currentSpreadIndex = 0;
    renderBookSpread();
  });

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('settings-modal').classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') goNextPage();
    if (e.key === 'ArrowLeft') goPrevPage();
  });

  window.addEventListener('resize', () => {
    if (safeStore.get(STORAGE_KEY_SESSION) === 'true') {
      renderBookSpread();
    }
  });

  const btnToc = document.getElementById('btn-toc');
  if (btnToc) {
    btnToc.addEventListener('click', (e) => {
      e.preventDefault();
      openTocModal();
    });
  }

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      const pinInput = document.getElementById('settings-pin-input');
      pinInput.value = '';
      pinInput.setAttribute('type', 'password');
      
      const togglePinBtn = document.getElementById('toggle-pin-visibility');
      if (togglePinBtn) {
        togglePinBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }

      document.getElementById('settings-pin-error').classList.add('hidden');
      document.getElementById('settings-pin-modal').classList.remove('hidden');
      setTimeout(() => pinInput.focus(), 100);
    });
  }

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      document.getElementById(targetId).classList.add('hidden');
    });
  });

  document.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.remove('hidden');
    });
  });

  document.getElementById('section-select').addEventListener('change', renderSectionItemsEditor);
  document.getElementById('btn-add-item').addEventListener('click', () => openItemFormModal(null));

  document.getElementById('btn-edit-section-title').addEventListener('click', () => {
    const secId = document.getElementById('section-select').value;
    const section = (bookData.sections || []).find((s) => s.id === secId);
    if (!section) return;

    const newTitle = prompt('Masukkan judul bagian/bab baru:', section.title);
    if (newTitle && newTitle.trim()) {
      section.title = newTitle.trim();
      saveBookData();
      openSettingsModal();
      document.getElementById('section-select').value = secId;
      renderSectionItemsEditor();
      paginateBook();
      renderBookSpread();
    }
  });

  document.getElementById('item-editor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const secId = document.getElementById('section-select').value;
    const section = (bookData.sections || []).find((s) => s.id === secId);
    if (!section) return;

    const idxVal = document.getElementById('edit-item-index').value;
    const updatedItem = {
      number: parseInt(document.getElementById('edit-item-number').value, 10),
      arabic: document.getElementById('edit-item-arabic').value.trim(),
      latin: document.getElementById('edit-item-latin').value.trim(),
      translation: document.getElementById('edit-item-translation').value.trim()
    };

    if (!section.items) section.items = [];

    if (idxVal !== '') {
      section.items[parseInt(idxVal, 10)] = updatedItem;
    } else {
      section.items.push(updatedItem);
    }

    section.items.sort((a, b) => a.number - b.number);
    saveBookData();
    document.getElementById('item-form-modal').classList.add('hidden');
    renderSectionItemsEditor();
    paginateBook();
    renderBookSpread();
  });

  document.getElementById('book-meta-form').addEventListener('submit', (e) => {
    e.preventDefault();
    bookData.meta.title = document.getElementById('meta-title').value.trim();
    bookData.meta.subtitle = document.getElementById('meta-subtitle').value.trim();
    bookData.meta.author = document.getElementById('meta-author').value.trim();
    bookData.meta.publisher = document.getElementById('meta-publisher').value.trim();
    bookData.meta.preface = document.getElementById('meta-preface').value.trim();
    bookData.meta.itemsPerPage = parseInt(document.getElementById('meta-items-per-page').value, 10);

    saveBookData();
    updateTitleDisplays();
    paginateBook();
    renderBookSpread();
  });

  document.getElementById('admin-cred-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = document.getElementById('admin-new-user').value.trim();
    const newPass = document.getElementById('admin-new-pass').value;
    const confirmPass = document.getElementById('admin-confirm-pass').value;

    if (!newUser || !newPass) {
      alert('Username dan password tidak boleh kosong!');
      return;
    }
    if (newPass !== confirmPass) {
      alert('Konfirmasi password tidak cocok!');
      return;
    }

    authCreds = { username: newUser, password: newPass };
    safeStore.set(STORAGE_KEY_AUTH, JSON.stringify(authCreds));
    showToast('Username & password admin berhasil diperbarui!');
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'data-buku-yasin-tahlil.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  });

  document.getElementById('input-import-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let rawContent = event.target.result;
        rawContent = rawContent.replace(/^\uFEFF/, '').trim();

        const imported = JSON.parse(rawContent);
        
        if (imported && typeof imported === 'object') {
          const sanitizedSections = [];
          if (Array.isArray(imported.sections)) {
            imported.sections.forEach((sec, secIdx) => {
              const cleanItems = [];
              if (Array.isArray(sec.items)) {
                sec.items.forEach((item, itemIdx) => {
                  cleanItems.push({
                    number: item.number !== undefined ? Number(item.number) : (itemIdx + 1),
                    arabic: item.arabic ? String(item.arabic) : '',
                    latin: item.latin ? String(item.latin) : '',
                    translation: item.translation ? String(item.translation) : ''
                  });
                });
              }
              sanitizedSections.push({
                id: sec.id ? String(sec.id) : ('sec_' + secIdx + '_' + Date.now()),
                title: sec.title ? String(sec.title) : ('Bagian ' + (secIdx + 1)),
                items: cleanItems
              });
            });
          }

          const newBookData = {
            meta: {
              title: imported.meta && imported.meta.title ? String(imported.meta.title) : 'SURAH YASIN & TAHLIL SINGKAT',
              subtitle: imported.meta && imported.meta.subtitle ? String(imported.meta.subtitle) : 'Mengalirkan Doa, Menyambung Cinta',
              author: imported.meta && imported.meta.author ? String(imported.meta.author) : 'PENYUSUN / KELUARGA',
              publisher: imported.meta && imported.meta.publisher ? String(imported.meta.publisher) : 'Cetakan Digital',
              preface: imported.meta && imported.meta.preface ? String(imported.meta.preface) : '',
              itemsPerPage: imported.meta && imported.meta.itemsPerPage ? Number(imported.meta.itemsPerPage) : 3
            },
            sections: sanitizedSections
          };

          saveBookData(newBookData);
          updateTitleDisplays();
          currentSpreadIndex = 0;
          paginateBook();
          renderBookSpread();
          openSettingsModal();
          showToast('Data buku berhasil di-import & disinkronkan!');
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        console.error('Import JSON Error:', err);
        alert('Gagal membaca file JSON.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-default').addEventListener('click', () => {
    if (confirm('Kembalikan semua isi buku ke pengaturan awal (kosong)?')) {
      const fresh = buildInitialBookData();
      saveBookData(fresh);
      updateTitleDisplays();
      currentSpreadIndex = 0;
      paginateBook();
      renderBookSpread();
      openSettingsModal();
    }
  });

  const btnAddSec = document.getElementById('btn-add-section');
  if (btnAddSec) {
    btnAddSec.addEventListener('click', () => {
      const titleInput = prompt('Masukkan nama Judul Bagian / Bab baru:');
      if (titleInput && titleInput.trim()) {
        const newId = 'sec_' + Date.now();
        if (!bookData.sections) bookData.sections = [];
        bookData.sections.push({
          id: newId,
          title: titleInput.trim(),
          items: []
        });
        saveBookData();
        openSettingsModal();
        document.getElementById('section-select').value = newId;
        renderSectionItemsEditor();
        paginateBook();
        renderBookSpread();
        showToast('Bab baru berhasil ditambahkan!');
      }
    });
  }

  const btnDelSec = document.getElementById('btn-delete-section');
  if (btnDelSec) {
    btnDelSec.addEventListener('click', () => {
      const selectEl = document.getElementById('section-select');
      const secId = selectEl.value;
      const section = (bookData.sections || []).find(s => s.id === secId);
      if (!section) return;

      if (confirm(`Yakin ingin menghapus seluruh bab "${section.title}" beserta isinya?`)) {
        bookData.sections = bookData.sections.filter(s => s.id !== secId);
        saveBookData();
        openSettingsModal();
        paginateBook();
        renderBookSpread();
        showToast('Bab berhasil dihapus!');
      }
    });
  }
}

const togglePinBtn = document.getElementById('toggle-pin-visibility');
const pinInputEl = document.getElementById('settings-pin-input');

if (togglePinBtn && pinInputEl) {
  togglePinBtn.addEventListener('click', () => {
    const type = pinInputEl.getAttribute('type') === 'password' ? 'text' : 'password';
    pinInputEl.setAttribute('type', type);
    
    if (type === 'text') {
      togglePinBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      `;
    } else {
      togglePinBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      `;
    }
  });
}

function updateTitleDisplays() {
  document.getElementById('login-book-title').textContent = bookData.meta.title;
  document.getElementById('nav-book-title').textContent = bookData.meta.title;
  document.title = `${bookData.meta.title} - Buku Digital`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
