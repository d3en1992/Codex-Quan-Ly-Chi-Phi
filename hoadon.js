// hoadon.js â€” Hoa Don / Tien Ung / Danh Muc / Import Excel
// Load order: 3

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  ENTRY TABLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function initTable(n=10) {
  document.getElementById('entry-tbody').innerHTML='';
  for(let i=0;i<n;i++) addRow();
  calcSummary();
}

function addRows(n) { for(let i=0;i<n;i++) addRow(); }

function addRow(d={}) {
  const tbody = document.getElementById('entry-tbody');
  const num = tbody.children.length + 1;
  const ctDef = d.congtrinh || '';

  const tr = document.createElement('tr');

  const loaiOpts = `<option value="">-- Chá»n --</option>` + cats.loaiChiPhi.map(v=>`<option value="${x(v)}" ${v===(d.loai||'')?'selected':''}>${x(v)}</option>`).join('');
  const ctOpts = `<option value="">-- Chá»n --</option>` + cats.congTrinh.filter(v => _ctInActiveYear(v) || v === ctDef).map(v=>`<option value="${x(v)}" ${v===ctDef?'selected':''}>${x(v)}</option>`).join('');
  const dlNguoi = 'dlN' + num + Date.now();
  const dlNcc   = 'dlC' + num + Date.now();

  const slVal = d.sl||'';
  const thTien = slVal && d.tien ? numFmt((d.sl||1)*(d.tien||0)) : (d.tien?numFmt(d.tien):'');

  tr.innerHTML = `
    <td class="row-num">${num}</td>
    <td><select class="cell-input" data-f="loai">${loaiOpts}</select></td>
    <td><select class="cell-input" data-f="ct">${ctOpts}</select></td>
    <td><input class="cell-input right tien-input" data-f="tien" data-raw="${d.tien||''}" placeholder="0" value="${d.tien?numFmt(d.tien):''}" inputmode="decimal"></td>
    <td style="padding:0"><input type="number" class="cell-input" data-f="sl" min="0" step="0.01"
      value="${x(slVal)}" placeholder="1"
      style="text-align:center;width:100%;border:none;background:transparent;padding:7px 6px;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;-moz-appearance:textfield"
      inputmode="decimal"></td>
    <td style="padding:0;text-align:right">
      <span data-f="thtien" style="display:block;padding:7px 8px;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:13px;color:var(--green)">${thTien}</span>
    </td>
    <td><input class="cell-input" data-f="nd" value="${x(d.nd||'')}" placeholder="Ná»™i dung..."></td>
    <td>
      <input class="cell-input" data-f="nguoi" list="${dlNguoi}" value="${x(d.nguoi||'')}" placeholder="Nháº­p hoáº·c chá»n...">
      <datalist id="${dlNguoi}">${cats.nguoiTH.map(v=>`<option value="${x(v)}">`).join('')}</datalist>
    </td>
    <td>
      <input class="cell-input" data-f="ncc" list="${dlNcc}" value="${x(d.ncc||'')}" placeholder="Nháº­p hoáº·c chá»n...">
      <datalist id="${dlNcc}">${cats.nhaCungCap.map(v=>`<option value="${x(v)}">`).join('')}</datalist>
    </td>
    <td><button class="del-btn" onclick="delRow(this)">âœ•</button></td>
  `;

  function updateThTien() {
    const tienRaw = parseInt(tr.querySelector('[data-f="tien"]').dataset.raw||'0')||0;
    const slRaw   = parseFloat(tr.querySelector('[data-f="sl"]').value)||1;
    const th = tienRaw * slRaw;
    const thEl = tr.querySelector('[data-f="thtien"]');
    if(thEl) thEl.textContent = th ? numFmt(th) : '';
    tr.querySelector('[data-f="thtien"]').dataset.raw = th;
  }

  // Thousand-separator logic for tien input
  const tienInput = tr.querySelector('[data-f="tien"]');
  tienInput.addEventListener('input', function() {
    const raw = this.value.replace(/[.,]/g,'');
    this.dataset.raw = raw;
    if(raw) this.value = numFmt(parseInt(raw,10)||0);
    updateThTien(); calcSummary();
  });
  tienInput.addEventListener('focus', function() { this.value = this.dataset.raw || ''; });
  tienInput.addEventListener('blur', function() {
    const raw = parseInt(this.dataset.raw||'0',10)||0;
    this.value = raw ? numFmt(raw) : '';
  });
  tr.querySelector('[data-f="sl"]').addEventListener('input', function() {
    updateThTien(); calcSummary();
  });

  tr.querySelectorAll('input,select').forEach(el => {
    if(el.dataset.f!=='tien' && el.dataset.f!=='sl') {
      el.addEventListener('input', calcSummary);
      el.addEventListener('change', calcSummary);
    }
  });

  tbody.appendChild(tr);
  // Trigger initial thTien
  const tRaw = parseInt(tienInput.dataset.raw||'0')||0;
  const sRaw = parseFloat(tr.querySelector('[data-f="sl"]').value)||1;
  const th0 = tRaw*sRaw;
  const thEl0 = tr.querySelector('[data-f="thtien"]');
  if(thEl0){ thEl0.textContent = th0?numFmt(th0):''; thEl0.dataset.raw=th0; }
}

function delRow(btn) { btn.closest('tr').remove(); renumber(); calcSummary(); }

function renumber() {
  document.querySelectorAll('#entry-tbody tr').forEach((tr,i) => {
    tr.querySelector('.row-num').textContent = i+1;
  });
}

function calcSummary() {
  let cnt=0, total=0;
  document.querySelectorAll('#entry-tbody tr').forEach(tr => {
    const loai = tr.querySelector('[data-f="loai"]')?.value||'';
    const ct   = tr.querySelector('[data-f="ct"]')?.value||'';
    const tienRaw = parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0;
    const sl   = parseFloat(tr.querySelector('[data-f="sl"]')?.value)||1;
    const thTien = tienRaw * sl;
    if(loai||ct||tienRaw>0) { cnt++; total += thTien; }
  });
  document.getElementById('row-count').textContent = cnt;
  document.getElementById('entry-total').textContent = fmtM(total);
}

function clearTable() {
  if(!confirm('XÃ³a toÃ n bá»™ báº£ng nháº­p hiá»‡n táº¡i?')) return;
  initTable(5);
}

function saveAllRows(skipDupCheck) {
  const date = document.getElementById('entry-date').value;
  if(!date) { toast('Vui lÃ²ng chá»n ngÃ y!','error'); return; }

  // Thu tháº­p táº¥t cáº£ dÃ²ng há»£p lá»‡
  const rows = [];
  let errRow = 0;
  document.querySelectorAll('#entry-tbody tr').forEach(tr => {
    const loai = (tr.querySelector('[data-f="loai"]')?.value||'').trim();
    const ct   = (tr.querySelector('[data-f="ct"]')?.value||'').trim();
    const tien = parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0;
    if(!loai&&!ct&&!tien) return;
    if(!ct||!loai) { errRow++; tr.style.background='#fdecea'; return; }
    tr.style.background='';
    rows.push({
      tr,
      editId: tr.dataset.editId || null,
      payload: {
        ngay: date,
        congtrinh: ct, loai,
        nguoi: (tr.querySelector('[data-f="nguoi"]')?.value||'').trim(),
        ncc:   (tr.querySelector('[data-f="ncc"]')?.value||'').trim(),
        nd:    (tr.querySelector('[data-f="nd"]')?.value||'').trim(),
        tien,
        sl:    parseFloat(tr.querySelector('[data-f="sl"]')?.value)||1,
        get thanhtien() { return Math.round(this.tien * this.sl); }
      }
    });
  });

  if(errRow>0) { toast(`${errRow} dÃ²ng thiáº¿u CÃ´ng TrÃ¬nh hoáº·c Loáº¡i CP!`,'error'); return; }
  if(!rows.length) { toast('KhÃ´ng cÃ³ dÃ²ng há»£p lá»‡!','error'); return; }

  // Kiá»ƒm tra trÃ¹ng â€” chá»‰ cho dÃ²ng Má»šI (khÃ´ng pháº£i edit)
  if(!skipDupCheck) {
    const newRows = rows.filter(r => !r.editId);
    const dupRows = [];
    newRows.forEach(r => {
      // Chá»‰ so sÃ¡nh vá»›i HÄ nháº­p tay (khÃ´ng ccKey) trong cÃ¹ng ngÃ y+CT
      const candidates = invoices.filter(i =>
        !i.ccKey &&
        i.ngay === r.payload.ngay &&
        i.congtrinh === r.payload.congtrinh &&
        (i.thanhtien||i.tien||0) === Math.round(r.payload.tien * r.payload.sl)
      );
      if(!candidates.length) return;

      // Fuzzy match ná»™i dung â‰¥ 70%
      const nd = r.payload.nd.toLowerCase().trim();
      candidates.forEach(inv => {
        const sim = _strSimilarity(nd, (inv.nd||'').toLowerCase().trim());
        if(sim >= 0.7 || (nd === '' && (inv.nd||'') === '')) {
          dupRows.push({
            newRow: r,
            existing: inv,
            similarity: sim,
            isExact: sim >= 0.99
          });
        }
      });
    });

    if(dupRows.length > 0) {
      _showDupModal(dupRows, rows);
      return; // Dá»«ng láº¡i â€” chá» user quyáº¿t Ä‘á»‹nh
    }
  }

  // â”€â”€ Thá»±c sá»± lÆ°u â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  _doSaveRows(rows);
}

// â”€â”€ Fuzzy string similarity (Dice coefficient) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tráº£ vá» 0.0 â†’ 1.0. KhÃ´ng cáº§n thÆ° viá»‡n ngoÃ i.

// â”€â”€ Hiá»ƒn thá»‹ modal cáº£nh bÃ¡o trÃ¹ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _showDupModal(dupRows, allRows) {
  const overlay = document.getElementById('dup-modal-overlay');
  const body    = document.getElementById('dup-modal-body');
  const sub     = document.getElementById('dup-modal-subtitle');

  // LÆ°u allRows Ä‘á»ƒ forceSave dÃ¹ng láº¡i
  overlay._allRows = allRows;

  sub.textContent = `TÃ¬m tháº¥y ${dupRows.length} hÃ³a Ä‘Æ¡n cÃ³ thá»ƒ bá»‹ trÃ¹ng`;

  const numFmtLocal = n => n ? n.toLocaleString('vi-VN') + 'Ä‘' : '0Ä‘';
  body.innerHTML = dupRows.map(d => {
    const pct     = Math.round(d.similarity * 100);
    const badge   = d.isExact
      ? '<span class="dup-badge dup-badge-exact">TrÃ¹ng hoÃ n toÃ n</span>'
      : `<span class="dup-badge dup-badge-fuzzy">Giá»‘ng ${pct}%</span>`;
    const existTime = d.existing._ts
      ? new Date(d.existing._ts).toLocaleString('vi-VN')
      : d.existing.ngay || '';
    return `<div class="dup-item">
      <div style="font-size:11px;font-weight:700;color:#f57f17;margin-bottom:6px">
        HÄ Má»šI ${badge}
      </div>
      <div class="dup-item-row">
        <span class="dup-item-label">NgÃ y</span>
        <span class="dup-item-val">${d.newRow.payload.ngay}</span>
      </div>
      <div class="dup-item-row">
        <span class="dup-item-label">CÃ´ng trÃ¬nh</span>
        <span class="dup-item-val">${d.newRow.payload.congtrinh}</span>
      </div>
      <div class="dup-item-row">
        <span class="dup-item-label">Sá»‘ tiá»n</span>
        <span class="dup-item-val" style="color:var(--red);font-family:'IBM Plex Mono',monospace">
          ${numFmtLocal(Math.round(d.newRow.payload.tien * d.newRow.payload.sl))}
        </span>
      </div>
      <div class="dup-item-row">
        <span class="dup-item-label">Ná»™i dung</span>
        <span class="dup-item-val">${d.newRow.payload.nd||'(trá»‘ng)'}</span>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #ffe082;font-size:11px;color:#888">
        â†‘ TrÃ¹ng vá»›i HÄ Ä‘Ã£ lÆ°u lÃºc ${existTime}:
        <span style="color:#555;font-weight:600">${d.existing.nd||'(trá»‘ng)'}</span>
      </div>
    </div>`;
  }).join('');

  overlay.classList.add('open');
}

function closeDupModal() {
  document.getElementById('dup-modal-overlay').classList.remove('open');
}

function forceSaveAll() {
  closeDupModal();
  const overlay = document.getElementById('dup-modal-overlay');
  const allRows = overlay._allRows;
  if(allRows) _doSaveRows(allRows);
}

// â”€â”€ HÃ m lÆ°u thá»±c sá»± (dÃ¹ng chung cho cáº£ normal vÃ  force) â”€â”€â”€â”€â”€â”€
function _doSaveRows(rows) {
  let saved = 0, updated = 0;
  const now = Date.now();
  const incoming = [];
  rows.forEach(({tr, editId, payload}) => {
    const p = {
      ngay: payload.ngay, congtrinh: payload.congtrinh, loai: payload.loai,
      nguoi: payload.nguoi, ncc: payload.ncc, nd: payload.nd,
      tien: payload.tien,
      sl: payload.sl !== 1 ? payload.sl : undefined,
      thanhtien: Math.round(payload.tien * payload.sl)
    };
    if(editId) {
      const idx = invoices.findIndex(i => String(i.id) === String(editId));
      if(idx >= 0) {
        invoices[idx] = ensureMeta({...invoices[idx], ...p, updatedAt: now, _ts: now});
        updated++;
      }
    } else {
      const rec = ensureMeta({
        ...p,
        id: makeStableId(p, ['ngay', 'congtrinh', 'nd', 'tien']),
        createdAt: now,
        updatedAt: now,
        _ts: now
      });
      incoming.push(rec);
      saved++;
    }
    tr.style.background = '#f0fff4';
  });

  if(incoming.length){
    invoices = mergeUnique(invoices, incoming);
  }
  save('inv_v3', invoices);
  buildYearSelect(); updateTop();

  if(updated > 0 && saved === 0) toast(`âœ… ÄÃ£ cáº­p nháº­t ${updated} hÃ³a Ä‘Æ¡n!`, 'success');
  else if(saved > 0 && updated === 0) toast(`âœ… ÄÃ£ lÆ°u ${saved} hÃ³a Ä‘Æ¡n!`, 'success');
  else toast(`âœ… ÄÃ£ lÆ°u ${saved} má»›i, cáº­p nháº­t ${updated} hÃ³a Ä‘Æ¡n!`, 'success');

  // Tá»± Ä‘á»™ng refresh sub-tab "HÄ/CP nháº­p trong ngÃ y"
  renderTodayInvoices();
  // Tá»± Ä‘á»™ng refresh sub-tab "Táº¥t cáº£ CP/HÄ" (luÃ´n sync sau má»—i láº§n lÆ°u)
  buildFilters(); filterAndRender();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  ALL PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildFilters() {
  const yearInvs = invoices.filter(i=>inActiveYear(i.ngay));
  // Dropdown CT: lá»c má»m â€” CT cÃ³ báº¥t ká»³ phÃ¡t sinh (HÄ/CC/á»¨ng) trong nÄƒm
  const allCts = [...new Set(invoices.map(i=>i.congtrinh).filter(Boolean))].sort();
  const cts = allCts.filter(ct => _entityInYear(ct, 'ct'));
  const loais = [...new Set(yearInvs.map(i=>i.loai))].filter(Boolean).sort();
  const months = [...new Set(yearInvs.map(i=>i.ngay?.slice(0,7)))].filter(Boolean).sort().reverse();
  const ctSel=document.getElementById('f-ct'); const cv=ctSel.value;
  ctSel.innerHTML='<option value="">Táº¥t cáº£ cÃ´ng trÃ¬nh</option>'+cts.map(c=>`<option ${c===cv?'selected':''} value="${x(c)}">${x(c)}</option>`).join('');
  const lSel=document.getElementById('f-loai'); const lv=lSel.value;
  lSel.innerHTML='<option value="">Táº¥t cáº£ loáº¡i</option>'+loais.map(l=>`<option ${l===lv?'selected':''} value="${x(l)}">${x(l)}</option>`).join('');
  const mSel=document.getElementById('f-month'); const mv=mSel.value;
  mSel.innerHTML='<option value="">Táº¥t cáº£ thÃ¡ng</option>'+months.map(m=>`<option ${m===mv?'selected':''} value="${m}">${m}</option>`).join('');
}

function filterAndRender() {
  curPage=1;
  const q=document.getElementById('search').value.toLowerCase();
  const fCt=document.getElementById('f-ct').value;
  const fLoai=document.getElementById('f-loai').value;
  const fMonth=document.getElementById('f-month').value;
  filteredInvs = invoices.filter(inv => {
    if(!inActiveYear(inv.ngay)) return false;
    if(fCt && inv.congtrinh!==fCt) return false;
    if(fLoai && inv.loai!==fLoai) return false;
    if(fMonth && !inv.ngay.startsWith(fMonth)) return false;
    if(q) { const t=[inv.ngay,inv.congtrinh,inv.loai,inv.nguoi,inv.sohd,inv.nd].join(' ').toLowerCase(); if(!t.includes(q)) return false; }
    return true;
  });
  // Sort: HÄ má»›i sá»­a/thÃªm trÆ°á»›c (dÃ¹ng _ts timestamp), rá»“i theo ngÃ y giáº£m dáº§n
  filteredInvs.sort((a,b)=>{
    const ta = a._ts||0, tb2 = b._ts||0;
    if(ta!==tb2) return tb2-ta;
    if(b.ngay!==a.ngay) return (b.ngay||'').localeCompare(a.ngay||'');
    return 0;
  });
  renderTable();
}

function renderTable() {
  const tbody=document.getElementById('all-tbody');
  const start=(curPage-1)*PG;
  const paged=filteredInvs.slice(start,start+PG);
  const sumTT=filteredInvs.reduce((s,i)=>s+(i.thanhtien||i.tien||0),0);
  if(!paged.length) {
    tbody.innerHTML=`<tr class="empty-row"><td colspan="10">KhÃ´ng cÃ³ hÃ³a Ä‘Æ¡n nÃ o</td></tr>`;
    document.getElementById('pagination').innerHTML=''; return;
  }
  tbody.innerHTML = paged.map(inv=>{
    return `<tr>
    <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink2)">${inv.ngay}</td>
    <td style="font-weight:600;font-size:12px;max-width:220px">${x(inv.congtrinh)}</td>
    <td><span class="tag tag-gold">${x(inv.loai)}</span></td>
    <td class="hide-mobile" style="color:var(--ink2)">${x(inv.nguoi||'â€”')}</td>
    <td class="hide-mobile" style="color:var(--ink2)">${x(inv.ncc||'â€”')}</td>
    <td style="color:var(--ink2);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${x(inv.nd)}">${x(inv.nd||'â€”')}</td>
    <td class="amount-td" title="ÄÆ¡n giÃ¡: ${numFmt(inv.tien||0)}${inv.sl&&inv.sl!==1?' Ã— '+inv.sl:''}">${numFmt(inv.thanhtien||inv.tien||0)}</td>
    <td style="white-space:nowrap"><button class="btn btn-danger btn-sm" onclick="delInvoice('${inv.id}')">âœ•</button></td>
  </tr>`;}).join('');

  const tp=Math.ceil(filteredInvs.length/PG);
  let pag=`<span>${filteredInvs.length} hÃ³a Ä‘Æ¡n Â· Tá»•ng: <strong style="color:var(--gold);font-family:'IBM Plex Mono',monospace">${fmtS(sumTT)}</strong></span>`;
  if(tp>1) {
    pag+='<div class="page-btns">';
    for(let p=1;p<=Math.min(tp,10);p++) pag+=`<button class="page-btn ${p===curPage?'active':''}" onclick="goTo(${p})">${p}</button>`;
    if(tp>10) pag+=`<span style="padding:4px 6px;color:var(--ink3)">...${tp}</span>`;
    pag+='</div>';
  }
  document.getElementById('pagination').innerHTML=pag;
}

function goTo(p) { curPage=p; renderTable(); }

function delInvoice(id) {
  if(!confirm('XÃ³a hÃ³a Ä‘Æ¡n nÃ y? (CÃ³ thá»ƒ khÃ´i phá»¥c tá»« ThÃ¹ng RÃ¡c)')) return;
  const inv=invoices.find(i=>String(i.id)===String(id));
  if(inv) trashAdd({...inv});
  invoices=invoices.filter(i=>String(i.id)!==String(id));
  save('inv_v3',invoices); updateTop(); buildFilters(); filterAndRender(); renderTrash();
  toast('ÄÃ£ xÃ³a (cÃ³ thá»ƒ khÃ´i phá»¥c trong ThÃ¹ng RÃ¡c)');
}
function editCCInvoice(id) {
  const inv=invoices.find(i=>String(i.id)===String(id));
  if(!inv||!inv.ccKey) return;
  const parts=inv.ccKey.split('|');
  const fromDate=parts[1], ct=parts[2];

  // 1. Chuyá»ƒn tab â€” dÃ¹ng goPage chuáº©n
  const navBtn=document.querySelector('.nav-btn[data-page="chamcong"]');
  goPage(navBtn,'chamcong');
  window.scrollTo({top:0,behavior:'smooth'});

  // 2. Set tuáº§n Ä‘Ãºng (snap vá» CN cá»§a tuáº§n Ä‘Ã³)
  const sunISO=snapToSunday(fromDate);
  const satISO=ccSaturdayISO(sunISO);
  document.getElementById('cc-from').value=sunISO;
  document.getElementById('cc-to').value=satISO;
  document.getElementById('cc-week-label').textContent='Tuáº§n: '+weekLabel(sunISO);
  // TÃ­nh láº¡i offset
  const thisSun=ccSundayISO(0);
  const [ty,tm,td]=thisSun.split('-').map(Number);
  const [fy,fm,fd]=sunISO.split('-').map(Number);
  ccOffset=Math.round((new Date(fy,fm-1,fd)-new Date(ty,tm-1,td))/(7*86400000));

  // 3. Set cÃ´ng trÃ¬nh vÃ  load báº£ng (sau khi goPage Ä‘Ã£ populate select)
  setTimeout(()=>{
    const ctSel=document.getElementById('cc-ct-sel');
    if(ctSel){
      if(![...ctSel.options].find(o=>o.value===ct)){
        const o=document.createElement('option');o.value=ct;o.textContent=ct;ctSel.appendChild(o);
      }
      ctSel.value=ct;
    }
    loadCCWeekForm();
    toast('âœï¸ Äang xem tuáº§n '+viShort(sunISO)+' â€” '+ct,'success');
  },50);
}
function editManualInvoice(id) {
  const inv=invoices.find(i=>String(i.id)===String(id));
  if(!inv) return;
  // Chuyá»ƒn sang tab Nháº­p HÄ
  const navBtn=document.querySelector('.nav-btn[data-page="nhap"]');
  goPage(navBtn,'nhap');
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{
    // Set ngÃ y vÃ  clear báº£ng, táº¡o 1 hÃ ng vá»›i dá»¯ liá»‡u HÄ cÅ©
    document.getElementById('entry-date').value=inv.ngay||today();
    document.getElementById('entry-tbody').innerHTML='';
    addRow({loai:inv.loai,congtrinh:inv.congtrinh,sl:inv.sl||undefined,nguoi:inv.nguoi||'',ncc:inv.ncc||'',nd:inv.nd||'',tien:inv.tien||0});
    // ÄÃ¡nh dáº¥u edit mode â€” saveAllRows sáº½ UPDATE thay vÃ¬ thÃªm má»›i
    const row=document.querySelector('#entry-tbody tr');
    if(row) row.dataset.editId=String(inv.id);
    calcSummary();
    toast('âœï¸ Chá»‰nh sá»­a rá»“i nháº¥n ðŸ’¾ Cáº­p Nháº­t','success');
  },100);
}
function showEditInvoiceModal(inv) {
  let ov=document.getElementById('edit-inv-overlay');
  if(!ov){ov=document.createElement('div');ov.id='edit-inv-overlay';ov.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';ov.onclick=function(e){if(e.target===this)this.remove();};document.body.appendChild(ov);}
  const ctOpts=cats.congTrinh.filter(v=>_ctInActiveYear(v)||v===inv.congtrinh).map(v=>`<option value="${x(v)}" ${v===inv.congtrinh?'selected':''}>${x(v)}</option>`).join('');
  const loaiOpts=cats.loaiChiPhi.map(v=>`<option value="${x(v)}" ${v===inv.loai?'selected':''}>${x(v)}</option>`).join('');
  ov.innerHTML=`<div style="background:#fff;border-radius:14px;padding:24px;width:min(480px,96vw);box-shadow:0 8px 32px rgba(0,0,0,.2);font-family:'IBM Plex Sans',sans-serif" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700">âœï¸ Sá»­a HÃ³a ÄÆ¡n</h3>
      <button onclick="document.getElementById('edit-inv-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888">âœ•</button>
    </div>
    <div style="display:grid;gap:10px">
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">NgÃ y</label><input id="ei-ngay" type="date" value="${inv.ngay}" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"></div>
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">Loáº¡i Chi PhÃ­</label><select id="ei-loai" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"><option value="">-- Chá»n --</option>${loaiOpts}</select></div>
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">CÃ´ng TrÃ¬nh</label><select id="ei-ct" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"><option value="">-- Chá»n --</option>${ctOpts}</select></div>
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">NgÆ°á»i TH</label><input id="ei-nguoi" type="text" value="${x(inv.nguoi||'')}" list="ei-dl" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"><datalist id="ei-dl">${cats.nguoiTH.map(v=>`<option value="${x(v)}">`).join('')}</datalist></div>
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">Ná»™i Dung</label><input id="ei-nd" type="text" value="${x(inv.nd||'')}" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"></div>
      <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:3px">Sá»‘ Tiá»n (Ä‘)</label><input id="ei-tien" type="number" value="${inv.tien||0}" inputmode="decimal" style="width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:7px;font-family:inherit;font-size:13px;outline:none"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="document.getElementById('edit-inv-overlay').remove()" style="flex:1;padding:10px;border-radius:8px;border:1.5px solid #ddd;background:#fff;font-family:inherit;font-size:13px;cursor:pointer">Há»§y</button>
      <button onclick="saveEditInvoice('${inv.id}')" style="flex:2;padding:10px;border-radius:8px;border:none;background:#1a1814;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer">ðŸ’¾ Cáº­p Nháº­t</button>
    </div>
  </div>`;
  ov.style.display='flex';
}
function saveEditInvoice(id) {
  const idx=invoices.findIndex(i=>String(i.id)===String(id));
  if(idx<0) return;
  const tien=parseInt(document.getElementById('ei-tien').value)||0;
  invoices[idx]={...invoices[idx],ngay:document.getElementById('ei-ngay').value,loai:document.getElementById('ei-loai').value,congtrinh:document.getElementById('ei-ct').value,nguoi:document.getElementById('ei-nguoi').value.trim(),nd:document.getElementById('ei-nd').value.trim(),tien,thanhtien:tien,_ts:Date.now()};
  save('inv_v3',invoices);
  document.getElementById('edit-inv-overlay').remove();
  buildFilters(); filterAndRender(); updateTop();
  toast('âœ… ÄÃ£ cáº­p nháº­t hÃ³a Ä‘Æ¡n!','success');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CT PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderCtPage() {
  const grid=document.getElementById('ct-grid');
  const map={};
  invoices.forEach(inv=>{
    if(!inActiveYear(inv.ngay)) return;
    if(!map[inv.congtrinh]) map[inv.congtrinh]={total:0,count:0,byLoai:{}};
    map[inv.congtrinh].total+=(inv.thanhtien||inv.tien||0); map[inv.congtrinh].count++;
    map[inv.congtrinh].byLoai[inv.loai]=(map[inv.congtrinh].byLoai[inv.loai]||0)+(inv.thanhtien||inv.tien||0);
  });
  const sortBy=(document.getElementById('ct-sort')?.value)||'value';
  const entries=Object.entries(map).sort((a,b)=>
    sortBy==='name' ? a[0].localeCompare(b[0],'vi') : b[1].total-a[1].total
  );
  if(!entries.length){grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--ink3);font-size:14px">ChÆ°a cÃ³ dá»¯ liá»‡u</div>`;return;}
  grid.innerHTML=entries.map(([ct,d])=>{
    const rows=Object.entries(d.byLoai).sort((a,b)=>b[1]-a[1]);
    return `<div class="ct-card" onclick="showCtModal(${JSON.stringify(ct)})">
      <div class="ct-card-head">
        <div><div class="ct-card-name">${x(ct)}</div><div class="ct-card-count">${d.count} hÃ³a Ä‘Æ¡n</div></div>
        <div class="ct-card-total">${fmtS(d.total)}</div>
      </div>
      <div class="ct-card-body">
        ${rows.slice(0,6).map(([l,v])=>`<div class="ct-loai-row"><span class="ct-loai-name">${x(l)}</span><span class="ct-loai-val">${fmtS(v)}</span></div>`).join('')}
        ${rows.length>6?`<div style="font-size:11px;color:var(--ink3);text-align:right;padding-top:6px">+${rows.length-6} loáº¡i khÃ¡c...</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function showCtModal(ctName) {
  const invs=invoices.filter(i=>i.congtrinh===ctName && inActiveYear(i.ngay));
  document.getElementById('modal-title').textContent='ðŸ—ï¸ '+ctName;
  const byLoai={};
  invs.forEach(inv=>{ if(!byLoai[inv.loai])byLoai[inv.loai]=[]; byLoai[inv.loai].push(inv); });
  const total=invs.reduce((s,i)=>s+(i.thanhtien||i.tien||0),0);
  let html=`<div style="display:flex;gap:12px;margin-bottom:18px">
    <div style="flex:1;background:var(--bg);border-radius:8px;padding:12px"><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Tá»•ng HÄ</div><div style="font-size:22px;font-weight:700">${invs.length}</div></div>
    <div style="flex:2;background:var(--green-bg);border-radius:8px;padding:12px"><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Tá»•ng Chi PhÃ­</div><div style="font-size:20px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:var(--green)">${fmtM(total)}</div></div>
  </div>`;
  Object.entries(byLoai).forEach(([loai,invList])=>{
    const lt=invList.reduce((s,i)=>s+(i.thanhtien||i.tien||0),0);
    html+=`<div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;background:var(--gold-bg);border-radius:6px;margin-bottom:6px">
        <span class="tag tag-gold">${x(loai)}</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-weight:700;color:var(--gold)">${fmtM(lt)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>${['NgÃ y','NgÆ°á»i TH','Ná»™i Dung','ThÃ nh Tiá»n'].map((h,i)=>`<th style="padding:5px 8px;background:#f3f1ec;font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;text-align:${i===3?'right':'left'}">${h}</th>`).join('')}</tr></thead>
        <tbody>${invList.map(i=>`<tr style="border-bottom:1px solid var(--line)">
          <td style="padding:6px 8px;font-family:'IBM Plex Mono',monospace;color:var(--ink2)">${i.ngay}</td>
          <td style="padding:6px 8px;color:var(--ink2)">${x(i.nguoi||'â€”')}</td>
          <td style="padding:6px 8px;color:var(--ink2)">${x(i.nd||'â€”')}</td>
          <td style="padding:6px 8px;text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;color:var(--green)">${numFmt(i.thanhtien||i.tien||0)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  });
  document.getElementById('modal-body').innerHTML=html;
  document.getElementById('ct-modal').classList.add('open');
}
function closeModal(){ document.getElementById('ct-modal').classList.remove('open'); }
document.getElementById('ct-modal').addEventListener('click',e=>{ if(e.target===e.currentTarget)closeModal(); });

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SETTINGS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderSettings() {
  const grid=document.getElementById('dm-grid');
  grid.innerHTML='';
  CATS.forEach(cfg=>{
    const fullList = cats[cfg.id];
    // Lá»c cÃ´ng trÃ¬nh theo nÄƒm, giá»¯ idx gá»‘c Ä‘á»ƒ edit/xÃ³a Ä‘Ãºng
    const withIdx = fullList.map((item, idx) => ({item, idx}));
    const filtered = (cfg.id === 'congTrinh' && activeYear !== 0)
      ? withIdx.filter(({item}) => _ctInActiveYear(item))
      : withIdx;
    const countLabel = (cfg.id === 'congTrinh' && activeYear !== 0)
      ? `${filtered.length} / ${fullList.length}`
      : `${fullList.length}`;
    const card=document.createElement('div');
    card.className='settings-card';
    card.innerHTML=`
      <div class="settings-card-head">
        <div class="settings-card-title">${cfg.title} <span style="font-size:11px;font-weight:400;color:var(--ink3)">(${countLabel})</span></div>
      </div>
      <div class="settings-list" id="sl-${cfg.id}">
        ${filtered.map(({item,idx})=>
          cfg.id==='congNhan'  ? renderCNItem(item,idx) :
          cfg.id==='congTrinh' ? renderCTItem(item,idx) :
          renderItem(cfg.id,item,idx)
        ).join('')}
      </div>
      <div class="settings-add">
        <input type="text" id="sa-${cfg.id}" placeholder="ThÃªm má»›i..." onkeydown="if(event.key==='Enter')addItem('${cfg.id}')">
        <button class="btn btn-gold btn-sm" onclick="addItem('${cfg.id}')">+ ThÃªm</button>
      </div>`;
    grid.appendChild(card);
  });
  // Render panel sao lÆ°u
  renderBackupList();
}

// â”€â”€ Render item CÃ´ng TrÃ¬nh vá»›i badge nÄƒm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCTItem(item, idx) {
  const inUse = isItemInUse('congTrinh', item);
  const yr = cats.congTrinhYears && cats.congTrinhYears[item];
  const yrBadge = yr
    ? `<span style="font-size:10px;color:#1565c0;padding:1px 5px;background:rgba(21,101,192,0.1);border-radius:3px;margin-right:2px;flex-shrink:0">${yr}</span>`
    : '';
  return `<div class="settings-item" id="si-congTrinh-${idx}" style="${inUse?'background:rgba(26,122,69,0.04)':''}">
    <span class="s-name" id="sn-congTrinh-${idx}" ondblclick="startEdit('congTrinh',${idx})">${x(item)}</span>
    ${yrBadge}
    ${inUse?`<span title="Äang Ä‘Æ°á»£c sá»­ dá»¥ng" style="font-size:10px;color:#1a7a45;padding:2px 5px;background:rgba(26,122,69,0.1);border-radius:3px;margin-right:2px;flex-shrink:0">âœ“ Ä‘ang dÃ¹ng</span>`:''}
    <input class="s-edit-input" id="se-congTrinh-${idx}" value="${x(item)}"
      onblur="finishEdit('congTrinh',${idx})"
      onkeydown="if(event.key==='Enter')finishEdit('congTrinh',${idx});if(event.key==='Escape')cancelEdit('congTrinh',${idx})">
    <button class="btn btn-outline btn-sm btn-icon" onclick="startEdit('congTrinh',${idx})" title="Sá»­a tÃªn">âœï¸</button>
    <button class="btn ${inUse?'btn-outline':'btn-danger'} btn-sm btn-icon" onclick="delItem('congTrinh',${idx})"
      title="${inUse?'Äang Ä‘Æ°á»£c sá»­ dá»¥ng â€” khÃ´ng thá»ƒ xÃ³a':'XÃ³a'}" ${inUse?'style="opacity:0.4;cursor:not-allowed"':''}>âœ•</button>
  </div>`;
}

function renderItem(catId,item,idx) {
  const inUse = isItemInUse(catId, item);
  return `<div class="settings-item" id="si-${catId}-${idx}" style="${inUse?'background:rgba(26,122,69,0.04)':''}">
    <span class="s-name" id="sn-${catId}-${idx}" ondblclick="startEdit('${catId}',${idx})">${x(item)}</span>
    ${inUse?`<span title="Äang Ä‘Æ°á»£c sá»­ dá»¥ng" style="font-size:10px;color:#1a7a45;padding:2px 5px;background:rgba(26,122,69,0.1);border-radius:3px;margin-right:2px">âœ“ Ä‘ang dÃ¹ng</span>`:''}
    <input class="s-edit-input" id="se-${catId}-${idx}" value="${x(item)}"
      onblur="finishEdit('${catId}',${idx})"
      onkeydown="if(event.key==='Enter')finishEdit('${catId}',${idx});if(event.key==='Escape')cancelEdit('${catId}',${idx})">
    <button class="btn btn-outline btn-sm btn-icon" onclick="startEdit('${catId}',${idx})" title="Sá»­a tÃªn">âœï¸</button>
    <button class="btn ${inUse?'btn-outline':'btn-danger'} btn-sm btn-icon" onclick="delItem('${catId}',${idx})"
      title="${inUse?'Äang Ä‘Æ°á»£c sá»­ dá»¥ng â€” khÃ´ng thá»ƒ xÃ³a':'XÃ³a'}" ${inUse?'style="opacity:0.4;cursor:not-allowed"':''}>âœ•</button>
  </div>`;
}

// â”€â”€ Render item CÃ´ng NhÃ¢n vá»›i cá»™t T/P â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCNItem(name, idx) {
  const role = cnRoles[name] || '';
  const inUse = ccData.some(w => w.workers && w.workers.some(wk => wk.name === name));
  return `<div class="settings-item" id="si-congNhan-${idx}" style="${inUse?'background:rgba(26,122,69,0.04)':''}">
    <span class="s-name" id="sn-congNhan-${idx}" ondblclick="startEdit('congNhan',${idx})">${x(name)}</span>
    ${inUse?`<span title="Äang Ä‘Æ°á»£c sá»­ dá»¥ng" style="font-size:10px;color:#1a7a45;padding:2px 5px;background:rgba(26,122,69,0.1);border-radius:3px;margin-right:2px">âœ“ Ä‘ang dÃ¹ng</span>`:''}
    <input class="s-edit-input" id="se-congNhan-${idx}" value="${x(name)}"
      onblur="finishEdit('congNhan',${idx})"
      onkeydown="if(event.key==='Enter')finishEdit('congNhan',${idx});if(event.key==='Escape')cancelEdit('congNhan',${idx})">
    <select onchange="updateCNRole(${idx},this.value)"
      style="margin:0 4px;padding:2px 6px;border:1px solid var(--line2);border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;min-width:44px"
      title="Vai trÃ² (C=CÃ¡i, T=Thá»£, P=Phá»¥)">
      <option value="" ${!role?'selected':''}>â€”</option>
      <option value="C" ${role==='C'?'selected':''}>C</option>
      <option value="T" ${role==='T'?'selected':''}>T</option>
      <option value="P" ${role==='P'?'selected':''}>P</option>
    </select>
    <button class="btn btn-outline btn-sm btn-icon" onclick="startEdit('congNhan',${idx})" title="Sá»­a tÃªn">âœï¸</button>
    <button class="btn ${inUse?'btn-outline':'btn-danger'} btn-sm btn-icon" onclick="delItem('congNhan',${idx})"
      title="${inUse?'Äang Ä‘Æ°á»£c sá»­ dá»¥ng â€” khÃ´ng thá»ƒ xÃ³a':'XÃ³a'}" ${inUse?'style="opacity:0.4;cursor:not-allowed"':''}>âœ•</button>
  </div>`;
}

// â”€â”€ Cáº­p nháº­t vai trÃ² CN tá»« Danh má»¥c â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateCNRole(idx, role) {
  const name = cats.congNhan[idx];
  if (!name) return;
  cnRoles[name] = role;
  save('cat_cn_roles', cnRoles);
  syncCNRoles(name, role);
  toast(`âœ… ÄÃ£ cáº­p nháº­t vai trÃ² "${name}" â†’ ${role||'â€”'}`, 'success');
}

// â”€â”€ Äá»“ng bá»™ vai trÃ² vÃ o ccData (nÄƒm hiá»‡n táº¡i + nÄƒm trÆ°á»›c) â”€â”€â”€â”€â”€â”€â”€â”€
function syncCNRoles(name, role) {
  const curYear = activeYear || new Date().getFullYear();
  const prevYear = curYear - 1;
  let changed = false;
  ccData.forEach(week => {
    const yr = parseInt((week.fromDate || '').slice(0, 4));
    if (yr !== curYear && yr !== prevYear) return;
    (week.workers || []).forEach(wk => {
      if (wk.name === name) { wk.role = role; changed = true; }
    });
  });
  if (changed) save('cc_v2', ccData);
}

function startEdit(catId,idx) {
  document.getElementById(`sn-${catId}-${idx}`).classList.add('off');
  const e=document.getElementById(`se-${catId}-${idx}`); e.classList.add('on'); e.focus(); e.select();
}
function cancelEdit(catId,idx) {
  document.getElementById(`se-${catId}-${idx}`).classList.remove('on');
  document.getElementById(`sn-${catId}-${idx}`).classList.remove('off');
}
function finishEdit(catId,idx) {
  const inp=document.getElementById(`se-${catId}-${idx}`);
  const newVal=inp.value.trim();
  if(!newVal){cancelEdit(catId,idx);return;}
  const old=cats[catId][idx];
  cats[catId][idx]=newVal;
  // update invoices
  const cfg=CATS.find(c=>c.id===catId);
  if(cfg&&cfg.refField) {
    invoices.forEach(inv=>{ if(inv[cfg.refField]===old) inv[cfg.refField]=newVal; });
    // also update ung records tp field when nguoiTH or nhaCungCap renamed
    if(catId==='nguoiTH'||catId==='nhaCungCap') ungRecords.forEach(r=>{ if(r.tp===old) r.tp=newVal; });
    if(catId==='congTrinh') ungRecords.forEach(r=>{ if(r.congtrinh===old) r.congtrinh=newVal; });
  }
  // I.1: Cáº­p nháº­t ccData + tbData khi Ä‘á»•i tÃªn CT (giá»›i háº¡n 2 nÄƒm)
  if (catId === 'congTrinh') {
    const curYear = activeYear || new Date().getFullYear();
    const prevYear = curYear - 1;
    let ccCh = false, tbCh = false;
    ccData.forEach(w => {
      const yr = parseInt((w.fromDate || '').slice(0, 4));
      if ((yr === curYear || yr === prevYear) && w.ct === old) { w.ct = newVal; ccCh = true; }
    });
    tbData.forEach(r => {
      const yr = parseInt((r.ngay || '').slice(0, 4));
      if ((yr === curYear || yr === prevYear) && r.ct === old) { r.ct = newVal; tbCh = true; }
    });
    if (ccCh) save('cc_v2', ccData);
    if (tbCh) { save('tb_v1', tbData); tbPopulateSels && tbPopulateSels(); tbRenderList && tbRenderList(); }
    // Cáº­p nháº­t key trong congTrinhYears náº¿u cÃ³
    if (cats.congTrinhYears && cats.congTrinhYears[old] !== undefined) {
      cats.congTrinhYears[newVal] = cats.congTrinhYears[old];
      delete cats.congTrinhYears[old];
    }
  }
  saveCats(catId); save('inv_v3',invoices); save('ung_v1',ungRecords);
  renderSettings(); updateTop();
  // Cáº­p nháº­t láº¡i tab Tá»•ng CP náº¿u Ä‘ang Ä‘á»•i tÃªn cÃ´ng trÃ¬nh
  if (catId === 'congTrinh') { renderCtPage(); buildFilters(); filterAndRender(); }
  toast('âœ… ÄÃ£ cáº­p nháº­t "'+newVal+'"','success');
}
function addItem(catId) {
  const inp=document.getElementById(`sa-${catId}`);
  const val=inp.value.trim();
  if(!val) return;
  if(cats[catId].includes(val)){toast('Má»¥c nÃ y Ä‘Ã£ tá»“n táº¡i!','error');return;}
  cats[catId].push(val);
  // GÃ¡n nÄƒm cho cÃ´ng trÃ¬nh má»›i (Ä‘á»ƒ lá»c theo nÄƒm)
  if (catId === 'congTrinh') {
    cats.congTrinhYears[val] = activeYear || new Date().getFullYear();
  }
  saveCats(catId); inp.value='';
  renderSettings(); rebuildEntrySelects(); rebuildUngSelects();
  if (catId === 'congTrinh') {
    try { populateCCCtSel(); } catch(e) {}
    try { tbPopulateSels(); } catch(e) {}
  }
  toast(`âœ… ÄÃ£ thÃªm "${val}"`,'success');
}
function isItemInUse(catId, item) {
  const cfg = CATS.find(c=>c.id===catId);
  if(!cfg || !cfg.refField) {
    // congNhan â€” kiá»ƒm tra trong ccData
    if(catId==='congNhan') return ccData.some(w=>w.workers&&w.workers.some(wk=>wk.name===item));
    return false;
  }
  // Kiá»ƒm tra trong invoices
  if(invoices.some(i=>(i[cfg.refField]||'')=== item)) return true;
  // Kiá»ƒm tra trong ungRecords (tp field)
  if(catId==='thauPhu'||catId==='nhaCungCap') {
    if(ungRecords.some(r=>(r.tp||'')=== item)) return true;
  }
  // Kiá»ƒm tra congTrinh trong cc + ung + thietbi
  if(catId==='congTrinh') {
    if(ungRecords.some(r=>(r.congtrinh||'')=== item)) return true;
    if(ccData.some(w=>(w.ct||'')=== item)) return true;
    if(tbData.some(r=>(r.ct||'')=== item)) return true;
  }
  return false;
}

function delItem(catId,idx) {
  const item=cats[catId][idx];
  if(isItemInUse(catId, item)) {
    toast(`âš ï¸ CÃ´ng trÃ¬nh Ä‘Ã£ cÃ³ dá»¯ liá»‡u, khÃ´ng thá»ƒ xÃ³a.`, 'error');
    return;
  }
  if(!confirm(`XÃ³a "${item}" khá»i danh má»¥c?`)) return;
  cats[catId].splice(idx,1);
  // XÃ³a year entry náº¿u cÃ³
  if (catId === 'congTrinh' && cats.congTrinhYears) {
    delete cats.congTrinhYears[item];
  }
  saveCats(catId);
  renderSettings(); rebuildEntrySelects(); rebuildUngSelects();
  if (catId === 'congTrinh') {
    try { populateCCCtSel(); } catch(e) {}
    try { tbPopulateSels(); } catch(e) {}
  }
  toast(`ÄÃ£ xÃ³a "${item}"`);
}

function rebuildEntrySelects() {
  document.querySelectorAll('#entry-tbody [data-f="ct"]').forEach(sel=>{
    if(sel.tagName==='SELECT'){
      const cur=sel.value;
      sel.innerHTML=`<option value="">-- Chá»n --</option>`+cats.congTrinh.filter(v=>_ctInActiveYear(v)||v===cur).map(v=>`<option value="${x(v)}" ${v===cur?'selected':''}>${x(v)}</option>`).join('');
    }
  });
  document.querySelectorAll('#entry-tbody [data-f="loai"]').forEach(sel=>{
    if(sel.tagName==='SELECT'){
      const cur=sel.value;
      sel.innerHTML=`<option value="">-- Chá»n --</option>`+cats.loaiChiPhi.map(v=>`<option value="${x(v)}" ${v===cur?'selected':''}>${x(v)}</option>`).join('');
    }
  });
  // rebuild datalists for nguoi and ncc
  document.querySelectorAll('#entry-tbody [data-f="nguoi"]').forEach(inp=>{
    const dl=document.getElementById(inp.getAttribute('list'));
    if(dl) dl.innerHTML=cats.nguoiTH.map(v=>`<option value="${x(v)}">`).join('');
  });
  document.querySelectorAll('#entry-tbody [data-f="ncc"]').forEach(inp=>{
    const dl=document.getElementById(inp.getAttribute('list'));
    if(dl) dl.innerHTML=cats.nhaCungCap.map(v=>`<option value="${x(v)}">`).join('');
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TIá»€N á»¨NG - ENTRY TABLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let ungRecords = load('ung_v1', []);
let filteredUng = [];
let ungPage = 1;

function initUngTable(n=4) {
  document.getElementById('ung-tbody').innerHTML='';
  for(let i=0;i<n;i++) addUngRow();
  calcUngSummary();
}

function initUngTableIfEmpty() {
  if(document.getElementById('ung-tbody').children.length===0) initUngTable(4);
}

function addUngRows(n) { for(let i=0;i<n;i++) addUngRow(); }

function addUngRow(d={}) {
  const tbody = document.getElementById('ung-tbody');
  const num = tbody.children.length + 1;
  const dlTp  = 'dlTP'  + num + Date.now();
  const ctOpts = `<option value="">-- Chá»n --</option>` + cats.congTrinh.filter(v => _ctInActiveYear(v) || v===(d.congtrinh||'')).map(v=>`<option value="${x(v)}" ${v===(d.congtrinh||'')?'selected':''}>${x(v)}</option>`).join('');

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="row-num">${num}</td>
    <td>
      <input class="cell-input" data-f="tp" list="${dlTp}" value="${x(d.tp||'')}" placeholder="Nháº­p hoáº·c chá»n...">
      <datalist id="${dlTp}">${[...cats.thauPhu,...cats.nhaCungCap].map(v=>`<option value="${x(v)}">`).join('')}</datalist>
    </td>
    <td><select class="cell-input" data-f="ct">${ctOpts}</select></td>
    <td><input class="cell-input right tien-input" data-f="tien" data-raw="${d.tien||''}" placeholder="0" value="${d.tien?numFmt(d.tien):''}" inputmode="decimal"></td>
    <td><input class="cell-input" data-f="nd" value="${x(d.nd||'')}" placeholder="Ná»™i dung..."></td>
    <td><button class="del-btn" onclick="delUngRow(this)">âœ•</button></td>
  `;

  const tienInput = tr.querySelector('[data-f="tien"]');
  tienInput.addEventListener('input', function() {
    const raw = this.value.replace(/[.,]/g,'');
    this.dataset.raw = raw;
    if(raw) this.value = numFmt(parseInt(raw,10)||0);
    calcUngSummary();
  });
  tienInput.addEventListener('focus', function() { this.value = this.dataset.raw || ''; });
  tienInput.addEventListener('blur',  function() {
    const raw = parseInt(this.dataset.raw||'0',10)||0;
    this.value = raw ? numFmt(raw) : '';
  });

  tr.querySelectorAll('input,select').forEach(el => {
    if(el.dataset.f!=='tien') { el.addEventListener('input', calcUngSummary); el.addEventListener('change', calcUngSummary); }
  });
  tbody.appendChild(tr);
}

function delUngRow(btn) { btn.closest('tr').remove(); renumberUng(); calcUngSummary(); }

function renumberUng() {
  document.querySelectorAll('#ung-tbody tr').forEach((tr,i) => { tr.querySelector('.row-num').textContent = i+1; });
}

function calcUngSummary() {
  let cnt=0, total=0;
  document.querySelectorAll('#ung-tbody tr').forEach(tr => {
    const tp = tr.querySelector('[data-f="tp"]')?.value||'';
    const tien = parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0;
    if(tp||tien>0) { cnt++; total+=tien; }
  });
  document.getElementById('ung-row-count').textContent=cnt;
  document.getElementById('ung-entry-total').textContent=fmtM(total);
}

function clearUngTable() {
  if(!confirm('XÃ³a toÃ n bá»™ báº£ng nháº­p tiá»n á»©ng?')) return;
  initUngTable(4);
}

function saveAllUngRows() {
  const date = document.getElementById('ung-date').value;
  if(!date) { toast('Vui lÃ²ng chá»n ngÃ y!','error'); return; }
  let saved=0, errRow=0;
  const now = Date.now();
  const incoming = [];
  document.querySelectorAll('#ung-tbody tr').forEach(tr => {
    const tp = (tr.querySelector('[data-f="tp"]')?.value||'').trim();
    const tien = parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0;
    if(!tp&&!tien) return;
    if(!tp) { errRow++; tr.style.background='#fdecea'; return; }
    tr.style.background='';
    const ct = (tr.querySelector('[data-f="ct"]')?.value||'').trim();
    incoming.push(ensureMeta({
      id: makeStableId({ ngay: date, ct, tp, tien }, ['ngay', 'ct', 'tp', 'tien']),
      ngay:date,
      tp,
      congtrinh:ct,
      tien,
      nd:(tr.querySelector('[data-f="nd"]')?.value||'').trim(),
      createdAt: now,
      updatedAt: now,
      _ts: now
    }));
    saved++;
  });
  if(errRow>0) { toast(`${errRow} dÃ²ng thiáº¿u Tháº§u Phá»¥/NCC (Ä‘Ã¡nh dáº¥u Ä‘á»)!`,'error'); return; }
  if(saved===0) { toast('KhÃ´ng cÃ³ dÃ²ng há»£p lá»‡!','error'); return; }
  ungRecords = mergeUnique(ungRecords, incoming);
  save('ung_v1', ungRecords);
  toast(`âœ… ÄÃ£ lÆ°u ${saved} tiá»n á»©ng!`,'success');
  initUngTable(4);
  document.getElementById('ung-date').value = today();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TIá»€N á»¨NG - ALL PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildUngFilters() {
  const tps    = [...new Set(ungRecords.map(i=>i.tp))].filter(Boolean).sort();
  const cts    = [...new Set(ungRecords.map(i=>i.congtrinh))].filter(Boolean).sort();
  const months = [...new Set(ungRecords.map(i=>i.ngay.slice(0,7)))].filter(Boolean).sort().reverse();

  const tpSel=document.getElementById('uf-tp'); const tv=tpSel.value;
  tpSel.innerHTML='<option value="">Táº¥t cáº£ TP/NCC</option>'+tps.map(v=>`<option ${v===tv?'selected':''} value="${x(v)}">${x(v)}</option>`).join('');
  const ctSel=document.getElementById('uf-ct'); const cv=ctSel.value;
  ctSel.innerHTML='<option value="">Táº¥t cáº£ cÃ´ng trÃ¬nh</option>'+cts.map(v=>`<option ${v===cv?'selected':''} value="${x(v)}">${x(v)}</option>`).join('');
  const mSel=document.getElementById('uf-month'); const mv=mSel.value;
  mSel.innerHTML='<option value="">Táº¥t cáº£ thÃ¡ng</option>'+months.map(m=>`<option ${m===mv?'selected':''} value="${m}">${m}</option>`).join('');
}

function filterAndRenderUng() {
  ungPage=1;
  const q=document.getElementById('ung-search').value.toLowerCase();
  const fTp=document.getElementById('uf-tp').value;
  const fCt=document.getElementById('uf-ct').value;
  const fMonth=document.getElementById('uf-month').value;
  filteredUng = ungRecords.filter(r => {
    if(!inActiveYear(r.ngay)) return false;
    if(fTp && r.tp!==fTp) return false;
    if(fCt && r.congtrinh!==fCt) return false;
    if(fMonth && !r.ngay.startsWith(fMonth)) return false;
    if(q) { const t=[r.ngay,r.tp,r.congtrinh,r.nd].join(' ').toLowerCase(); if(!t.includes(q)) return false; }
    return true;
  });
  renderUngTable();
}

function renderUngTable() {
  const tbody=document.getElementById('ung-all-tbody');
  const start=(ungPage-1)*PG;
  const paged=filteredUng.slice(start,start+PG);
  const sumTien=filteredUng.reduce((s,r)=>s+r.tien,0);

  if(!paged.length) {
    tbody.innerHTML=`<tr class="empty-row"><td colspan="7">KhÃ´ng cÃ³ dá»¯ liá»‡u tiá»n á»©ng nÃ o</td></tr>`;
    document.getElementById('ung-pagination').innerHTML=''; return;
  }
  tbody.innerHTML = paged.map(r=>`<tr>
    <td style="text-align:center;padding:4px">
      <input type="checkbox" class="ung-row-chk" data-id="${r.id}"
        style="width:15px;height:15px;cursor:pointer">
    </td>
    <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink2)">${r.ngay}</td>
    <td style="font-weight:600;font-size:12px">${x(r.tp)}</td>
    <td style="color:var(--ink2)">${x(r.congtrinh||'â€”')}</td>
    <td style="color:var(--ink2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${x(r.nd)}">${x(r.nd||'â€”')}</td>
    <td class="amount-td" style="color:var(--blue)">${numFmt(r.tien||0)}</td>
    <td><button class="btn btn-danger btn-sm" onclick="delUngRecord('${r.id}')">âœ•</button></td>
  </tr>`).join('');

  const tp2=Math.ceil(filteredUng.length/PG);
  let pag=`<span>${filteredUng.length} báº£n ghi Â· Tá»•ng tiá»n á»©ng: <strong style="color:var(--blue);font-family:'IBM Plex Mono',monospace">${fmtS(sumTien)}</strong></span>`;
  if(tp2>1) {
    pag+='<div class="page-btns">';
    for(let p=1;p<=Math.min(tp2,10);p++) pag+=`<button class="page-btn ${p===ungPage?'active':''}" onclick="goUngTo(${p})">${p}</button>`;
    pag+='</div>';
  }
  document.getElementById('ung-pagination').innerHTML=pag;
}

function goUngTo(p) { ungPage=p; renderUngTable(); }

function delUngRecord(id) {
  if(!confirm('XÃ³a báº£n ghi tiá»n á»©ng nÃ y?')) return;
  ungRecords=ungRecords.filter(r=>String(r.id)!==String(id));
  save('ung_v1',ungRecords); buildUngFilters(); filterAndRenderUng();
  toast('ÄÃ£ xÃ³a báº£n ghi');
}

function rebuildUngSelects() {
  document.querySelectorAll('#ung-tbody [data-f="ct"]').forEach(sel=>{
    if(sel.tagName==='SELECT'){
      const cur=sel.value;
      sel.innerHTML=`<option value="">-- Chá»n --</option>`+cats.congTrinh.filter(v=>_ctInActiveYear(v)||v===cur).map(v=>`<option value="${x(v)}" ${v===cur?'selected':''}>${x(v)}</option>`).join('');
    }
  });
  document.querySelectorAll('#ung-tbody [data-f="tp"]').forEach(inp=>{
    const dl=document.getElementById(inp.getAttribute('list'));
    if(dl) dl.innerHTML=[...cats.nguoiTH,...cats.nhaCungCap].map(v=>`<option value="${x(v)}">`).join('');
  });
}

function exportUngEntryCSV() {
  const rows=[['Tháº§u Phá»¥ / NhÃ  CC','CÃ´ng TrÃ¬nh','Sá»‘ Tiá»n á»¨ng','Ná»™i Dung']];
  document.querySelectorAll('#ung-tbody tr').forEach(tr=>{
    const tp=tr.querySelector('[data-f="tp"]')?.value||'';
    if(!tp) return;
    rows.push([tp,tr.querySelector('[data-f="ct"]')?.value||'',parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0,tr.querySelector('[data-f="nd"]')?.value||'']);
  });
  dlCSV(rows,'nhap_tien_ung_'+today()+'.csv');
}

function exportUngAllCSV() {
  const src=filteredUng.length>0?filteredUng:ungRecords;
  const rows=[['NgÃ y','Tháº§u Phá»¥ / NhÃ  CC','CÃ´ng TrÃ¬nh','Ná»™i Dung','Sá»‘ Tiá»n á»¨ng']];
  src.forEach(r=>rows.push([r.ngay,r.tp,r.congtrinh||'',r.nd||'',r.tien]));
  dlCSV(rows,'tien_ung_'+today()+'.csv');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  EXPORT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function exportEntryCSV() {
  const rows=[['Loáº¡i Chi PhÃ­','CÃ´ng TrÃ¬nh','NgÆ°á»i TH','NhÃ  Cung Cáº¥p','Ná»™i Dung','Sá»‘ Tiá»n']];
  document.querySelectorAll('#entry-tbody tr').forEach(tr=>{
    const loai=tr.querySelector('[data-f="loai"]')?.value||'';
    const ct=tr.querySelector('[data-f="ct"]')?.value||'';
    if(!loai&&!ct) return;
    const tien=parseInt(tr.querySelector('[data-f="tien"]')?.dataset.raw||'0',10)||0;
    rows.push([loai,ct,tr.querySelector('[data-f="nguoi"]')?.value||'',tr.querySelector('[data-f="ncc"]')?.value||'',tr.querySelector('[data-f="nd"]')?.value||'',tien]);
  });
  dlCSV(rows,'nhap_'+today()+'.csv');
}
function exportAllCSV() {
  const src=filteredInvs.length>0?filteredInvs:invoices;
  const rows=[['NgÃ y','CÃ´ng TrÃ¬nh','Loáº¡i Chi PhÃ­','NgÆ°á»i TH','NhÃ  Cung Cáº¥p','Ná»™i Dung','Sá»‘ Tiá»n']];
  src.forEach(i=>rows.push([i.ngay,i.congtrinh,i.loai,i.nguoi,i.ncc||'',i.nd,i.tien||i.thanhtien||0]));
  dlCSV(rows,'hoa_don_'+today()+'.csv');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  THÃ™NG RÃC (HÃ³a ÄÆ¡n ÄÃ£ XÃ³a)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let trash = load('trash_v1', []);

function trashAdd(inv) {
  inv._deletedAt = new Date().toISOString();
  trash.unshift(inv);
  // Giá»¯ tá»‘i Ä‘a 200 HÄ trong thÃ¹ng rÃ¡c
  if(trash.length>200) trash=trash.slice(0,200);
  localStorage.setItem('trash_v1', JSON.stringify(trash));
}

function trashRestore(id) {
  const idx=trash.findIndex(i=>String(i.id)===String(id));
  if(idx<0) return;
  const inv={...trash[idx]};
  delete inv._deletedAt;
  invoices.unshift(inv);
  trash.splice(idx,1);
  inv._ts = Date.now(); // Ä‘Ã¡nh dáº¥u vá»«a khÃ´i phá»¥c
  save('inv_v3',invoices);
  localStorage.setItem('trash_v1',JSON.stringify(trash));
  updateTop(); buildFilters(); filterAndRender(); renderTrash();
  toast('âœ… ÄÃ£ khÃ´i phá»¥c hÃ³a Ä‘Æ¡n!','success');
}

function trashDeletePermanent(id) {
  trash=trash.filter(i=>String(i.id)!==String(id));
  localStorage.setItem('trash_v1',JSON.stringify(trash));
  renderTrash();
  toast('ÄÃ£ xÃ³a vÄ©nh viá»…n','success');
}

function trashClearAll() {
  if(!trash.length) return;
  if(!confirm(`XÃ³a vÄ©nh viá»…n ${trash.length} hÃ³a Ä‘Æ¡n trong thÃ¹ng rÃ¡c?\nKhÃ´ng thá»ƒ khÃ´i phá»¥c!`)) return;
  trash=[];
  localStorage.setItem('trash_v1',JSON.stringify(trash));
  renderTrash();
  toast('ÄÃ£ xÃ³a toÃ n bá»™ thÃ¹ng rÃ¡c','success');
}

function renderTrash() {
  const wrap=document.getElementById('trash-wrap');
  const empty=document.getElementById('trash-empty');
  const tbody=document.getElementById('trash-tbody');
  if(!wrap||!tbody||!empty) return;
  if(!trash.length) {
    wrap.style.display='none'; empty.style.display='';
    return;
  }
  wrap.style.display=''; empty.style.display='none';
  tbody.innerHTML=trash.slice(0,100).map(inv=>`<tr>
    <td style="font-size:11px;color:var(--ink2);white-space:nowrap;font-family:'IBM Plex Mono',monospace">${inv.ngay||''}</td>
    <td style="font-size:12px;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(inv.congtrinh||'â€”')}</td>
    <td><span class="tag tag-gold">${x(inv.loai||'â€”')}</span></td>
    <td style="color:var(--ink2);font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(inv.nd||'â€”')}</td>
    <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;color:var(--green)">${numFmt(inv.tien||0)}</td>
    <td style="white-space:nowrap;display:flex;gap:4px;padding:5px 4px">
      <button class="btn btn-outline btn-sm" onclick="trashRestore('${inv.id}')" title="KhÃ´i phá»¥c">â†© KhÃ´i phá»¥c</button>
      <button class="btn btn-danger btn-sm" onclick="trashDeletePermanent('${inv.id}')" title="XÃ³a vÄ©nh viá»…n">âœ•</button>
    </td>
  </tr>`).join('');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Báº¢NG HÃ“A ÄÆ N ÄÃƒ NHáº¬P TRONG NGÃ€Y
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderTodayInvoices() {
  const date = document.getElementById('entry-date')?.value || today();
  const dateEl = document.getElementById('today-inv-date');
  if(dateEl) dateEl.textContent = 'â€” ' + date;

  const tbody = document.getElementById('today-inv-tbody');
  const footer = document.getElementById('today-inv-footer');
  if(!tbody) return;

  // Lá»c HÄ theo ngÃ y Ä‘Ã£ chá»n (khÃ´ng phÃ¢n biá»‡t nÄƒm)
  const todayInvs = invoices.filter(i => i.ngay === date && !i.ccKey);
  if(!todayInvs.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">ChÆ°a cÃ³ hÃ³a Ä‘Æ¡n nÃ o vÃ o ngÃ y ${date}</td></tr>`;
    if(footer) footer.innerHTML = '';
    return;
  }

  const mono = "font-family:'IBM Plex Mono',monospace";
  tbody.innerHTML = todayInvs.map(inv => {
    const sl = inv.sl||1;
    const th = inv.thanhtien || (inv.tien*(sl));
    return `<tr>
      <td><span class="tag tag-gold">${x(inv.loai||'â€”')}</span></td>
      <td style="font-size:12px;font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(inv.congtrinh||'â€”')}</td>
      <td style="text-align:right;${mono};font-size:12px;color:var(--ink2)">${inv.tien?numFmt(inv.tien):'â€”'}</td>
      <td style="text-align:center;${mono};font-size:12px;color:var(--blue)">${sl!==1?sl:''}</td>
      <td style="text-align:right;${mono};font-weight:700;color:var(--green)">${numFmt(th)}</td>
      <td style="color:var(--ink2);font-size:11px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(inv.nd||'â€”')}</td>
      <td style="color:var(--ink2);font-size:11px">${x(inv.nguoi||'â€”')}</td>
      <td style="white-space:nowrap;display:flex;gap:3px;padding:5px 4px">
        <button class="btn btn-outline btn-sm" onclick="editTodayInv('${inv.id}')" title="Sá»­a">âœï¸</button>
        <button class="btn btn-danger btn-sm" onclick="delInvoice('${inv.id}');renderTodayInvoices()">âœ•</button>
      </td>
    </tr>`;
  }).join('');

  const total = todayInvs.reduce((s,i)=>s+(i.thanhtien||i.tien||0),0);
  if(footer) footer.innerHTML = `<span>${todayInvs.length} hÃ³a Ä‘Æ¡n</span><span>Tá»•ng: <strong style="color:var(--gold);${mono}">${fmtS(total)}</strong></span>`;
}

function editTodayInv(id) {
  const inv = invoices.find(i=>String(i.id)===String(id));
  if(!inv) return;
  document.getElementById('entry-date').value = inv.ngay || today();
  document.getElementById('entry-tbody').innerHTML = '';
  addRow({loai:inv.loai, congtrinh:inv.congtrinh, sl:inv.sl||undefined,
           nguoi:inv.nguoi||'', ncc:inv.ncc||'', nd:inv.nd||'', tien:inv.tien||0});
  const row = document.querySelector('#entry-tbody tr');
  if(row) row.dataset.editId = String(inv.id);
  calcSummary();
  window.scrollTo({top:0, behavior:'smooth'});
  toast('âœï¸ Chá»‰nh sá»­a rá»“i nháº¥n ðŸ’¾ LÆ°u / Cáº­p Nháº­t', 'success');
}

// IMPORT EXCEL â†’ FIREBASE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openImportModal() {
  document.getElementById('import-file-input').click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if(!file) return;
  e.target.value = '';
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const wb = XLSX.read(ev.target.result, {type:'array'});
      _processImportWorkbook(wb, file.name);
    } catch(err) {
      toast('âŒ KhÃ´ng Ä‘á»c Ä‘Æ°á»£c file Excel: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function _processImportWorkbook(wb, filename) {
  const result = { inv:[], ung:[], cc:[], tb:[], cats:{} };
  let log = [];

  // Helper: parse ngÃ y YYYY-MM-DD hoáº·c Excel serial
  function parseDate(v) {
    if(!v) return '';
    if(typeof v === 'number') {
      // Excel date serial
      const d = new Date(Math.round((v - 25569)*86400*1000));
      return d.toISOString().slice(0,10);
    }
    const s = String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // dd/mm/yyyy
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return '';
  }
  function num(v) { return parseFloat(String(v||'').replace(/[^0-9.\-]/g,''))||0; }
  function str(v) { return v ? String(v).trim() : ''; }
  function sheetToRows(ws) {
    return XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  }

  // â”€â”€ Sheet 1: HoaDon / ChiPhi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s1name = wb.SheetNames.find(n=>n.includes('HoaDon')||n.includes('1_'));
  if(s1name) {
    const rows = sheetToRows(wb.Sheets[s1name]);
    let dataStart = -1;
    for(let i=0;i<rows.length;i++) {
      const r = rows[i];
      if(r[0] && /^\d{4}-\d{2}-\d{2}$/.test(String(r[0]).trim()) ||
         (r[0] && String(r[0]).match(/^\d{4}[\-\/]\d/))) {
        dataStart = i; break;
      }
      // CÅ©ng check dáº¡ng ngÃ y serial Excel
      if(typeof r[0]==='number' && r[0]>40000 && r[0]<60000) {
        dataStart = i; break;
      }
    }
    if(dataStart >= 0) {
      for(let i=dataStart; i<rows.length; i++) {
        const r = rows[i];
        const ngay = parseDate(r[0]);
        const ct   = str(r[1]);
        const loai = str(r[2]);
        const tien = num(r[4]);
        if(!ngay || !ct || !loai || !tien) continue;
        const row = {
          ngay, congtrinh:ct, loai, nd:str(r[3]),
          tien, sl: num(r[5])||undefined,
          thanhtien: tien * (num(r[5])||1),
          nguoi:str(r[6]), ncc:str(r[7]), sohd:str(r[8]),
          createdAt: Date.now(), updatedAt: Date.now(), _ts: Date.now()
        };
        row.id = makeStableId(row, ['ngay', 'congtrinh', 'nd', 'tien']);
        result.inv.push(row);
      }
      log.push(`âœ… HÃ³a ÄÆ¡n: ${result.inv.length} hÃ ng`);
    }
  }

  // â”€â”€ Sheet 2: TienUng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s2name = wb.SheetNames.find(n=>n.includes('TienUng')||n.includes('2_'));
  if(s2name) {
    const rows = sheetToRows(wb.Sheets[s2name]);
    let dataStart = -1;
    for(let i=0;i<rows.length;i++) {
      const r = rows[i];
      if(parseDate(r[0])) { dataStart=i; break; }
    }
    if(dataStart >= 0) {
      for(let i=dataStart; i<rows.length; i++) {
        const r = rows[i];
        const ngay = parseDate(r[0]);
        const ct   = str(r[1]);
        const tp   = str(r[2]);
        const tien = num(r[3]);
        if(!ngay || !ct || !tp || !tien) continue;
        const row = { ngay, congtrinh:ct, tp, tien, nd:str(r[4]), createdAt:Date.now(), updatedAt:Date.now(), _ts:Date.now() };
        row.id = makeStableId({ ngay, ct, tp, tien }, ['ngay', 'ct', 'tp', 'tien']);
        result.ung.push(row);
      }
      log.push(`âœ… Tiá»n á»¨ng: ${result.ung.length} hÃ ng`);
    }
  }

  // â”€â”€ Sheet 3: ChamCong â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s3name = wb.SheetNames.find(n=>n.includes('ChamCong')||n.includes('3_'));
  if(s3name) {
    const rows = sheetToRows(wb.Sheets[s3name]);
    let dataStart = -1;
    for(let i=0;i<rows.length;i++) {
      const r = rows[i];
      if(parseDate(r[0])) { dataStart=i; break; }
    }
    // Group theo fromDate + ct
    const weekMap = {};
    if(dataStart >= 0) {
      for(let i=dataStart; i<rows.length; i++) {
        const r = rows[i];
        const fromDate = parseDate(r[0]);
        const ct = str(r[1]);
        const name = str(r[2]);
        const luong = num(r[3]);
        if(!fromDate || !ct || !name) continue;
        const key = fromDate+'|'+ct;
        if(!weekMap[key]) {
          // TÃ­nh toDate = fromDate + 6 ngÃ y (Thá»© 7)
          let toDate = '';
          try {
            const [y,m,d] = fromDate.split('-').map(Number);
            const sat = new Date(y, m-1, d+6);
            toDate = sat.getFullYear() + '-' +
              String(sat.getMonth()+1).padStart(2,'0') + '-' +
              String(sat.getDate()).padStart(2,'0');
          } catch(e) { toDate = fromDate; }
          weekMap[key] = {
            id: makeStableId({ fromDate, ct }, ['fromDate', 'ct']),
            fromDate, toDate, ct, workers:[],
            createdAt:Date.now(), updatedAt:Date.now()
          };
        }
        const d = [num(r[6]),num(r[7]),num(r[8]),num(r[9]),num(r[10]),num(r[11]),num(r[12])];
        weekMap[key].workers.push({ name, luong, phucap:num(r[4]), hdmuale:num(r[5]), d, nd:str(r[13]) });
      }
    }
    result.cc = Object.values(weekMap);
    if(result.cc.length) log.push(`âœ… Cháº¥m CÃ´ng: ${result.cc.length} tuáº§n, ${result.cc.reduce((s,w)=>s+w.workers.length,0)} CN`);
  }

  // â”€â”€ Sheet 4: ThietBi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s4name = wb.SheetNames.find(n=>n.includes('ThietBi')||n.includes('4_'));
  if(s4name) {
    const rows = sheetToRows(wb.Sheets[s4name]);
    let dataStart = -1;
    for(let i=0;i<rows.length;i++) {
      const r = rows[i];
      if(str(r[0]) && str(r[1]) && !['CÃ”NG TRÃŒNH','CONGTRINH'].includes(str(r[0]).toUpperCase())) {
        dataStart=i; break;
      }
    }
    if(dataStart >= 0) {
      for(let i=dataStart; i<rows.length; i++) {
        const r = rows[i];
        const ct = str(r[0]); const ten = str(r[1]);
        if(!ct || !ten) continue;
        const row = { ct, ten,
          soluong: num(r[2])||1, tinhtrang: str(r[3])||'Äang hoáº¡t Ä‘á»™ng',
          nguoi:str(r[4]), ngay:parseDate(r[5])||'', ghichu:str(r[6]), createdAt:Date.now(), updatedAt:Date.now() };
        row.id = makeStableId(row, ['ngay', 'ct', 'ten']);
        result.tb.push(row);
      }
      log.push(`âœ… Thiáº¿t Bá»‹: ${result.tb.length} hÃ ng`);
    }
  }

  // â”€â”€ Sheet 5: DanhMuc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s5name = wb.SheetNames.find(n=>n.includes('DanhMuc')||n.includes('5_'));
  if(s5name) {
    const rows = sheetToRows(wb.Sheets[s5name]);
    const newCats = { ct:[], loai:[], ncc:[], nguoi:[] };
    for(let i=2; i<rows.length; i++) {
      const r = rows[i];
      if(str(r[0])) newCats.ct.push(str(r[0]));
      if(str(r[1])) newCats.loai.push(str(r[1]));
      if(str(r[2])) newCats.ncc.push(str(r[2]));
      if(str(r[3])) newCats.nguoi.push(str(r[3]));
    }
    result.cats = newCats;
    log.push(`âœ… Danh Má»¥c: ${newCats.ct.length} CT, ${newCats.loai.length} Loáº¡i, ${newCats.ncc.length} NCC`);
  }

  const total = result.inv.length + result.ung.length + result.cc.length + result.tb.length;
  if(total === 0 && Object.keys(result.cats).length === 0) {
    toast('âš ï¸ KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u há»£p lá»‡ trong file!', 'error'); return;
  }

  _showImportPreview(result, log, filename);
}

function _showImportPreview(result, log, filename) {
  let ov = document.getElementById('import-modal-overlay');
  if(!ov) {
    ov = document.createElement('div');
    ov.id = 'import-modal-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center';
    ov.onclick = function(e) { if(e.target===this) ov.style.display='none'; };
    document.body.appendChild(ov);
  }

  // Äáº¿m theo nÄƒm
  const years = new Set();
  result.inv.forEach(i=>{ if(i.ngay) years.add(i.ngay.slice(0,4)); });
  result.ung.forEach(i=>{ if(i.ngay) years.add(i.ngay.slice(0,4)); });
  result.cc.forEach(i=>{ if(i.fromDate) years.add(i.fromDate.slice(0,4)); });

  ov.innerHTML = `<div onclick="event.stopPropagation()" style="max-width:480px;width:95vw;background:#fff;border-radius:16px;padding:24px;font-family:'IBM Plex Sans',sans-serif;box-shadow:0 12px 48px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:800;margin:0">ðŸ“¥ Xem TrÆ°á»›c Import</h3>
      <button onclick="document.getElementById('import-modal-overlay').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#888">âœ•</button>
    </div>
    <div style="background:#f0f4ff;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#333">
      <strong>ðŸ“„ File:</strong> ${filename}<br>
      <strong>ðŸ“… NÄƒm dá»¯ liá»‡u:</strong> ${[...years].sort().join(', ')||'â€”'}
    </div>
    <div style="margin-bottom:14px">
      ${log.map(l=>`<div style="padding:5px 10px;margin-bottom:4px;background:#f0fff4;border-left:3px solid #1a7a45;border-radius:4px;font-size:12px">${l}</div>`).join('')}
    </div>
    <div style="background:#fff3cd;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#856404">
      âš ï¸ Dá»¯ liá»‡u má»›i sáº½ Ä‘Æ°á»£c <strong>gá»™p</strong> vÃ o dá»¯ liá»‡u hiá»‡n cÃ³ (khÃ´ng xoÃ¡ dá»¯ liá»‡u cÅ©).
      ${fbReady() ? '<br>Sau khi nháº­p sáº½ tá»± Ä‘á»™ng lÆ°u lÃªn Firebase.' : '<br>ChÆ°a káº¿t ná»‘i Firebase â€” chá»‰ lÆ°u local.'}
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('import-modal-overlay').style.display='none'" style="flex:1;padding:11px;border-radius:8px;border:1.5px solid #ccc;background:#fff;font-family:inherit;font-size:13px;cursor:pointer">Huá»·</button>
      <button onclick="_confirmImport()" style="flex:2;padding:11px;border-radius:8px;border:none;background:#1a1814;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer">âœ… XÃ¡c Nháº­n Import</button>
    </div>
  </div>`;
  ov.style.display = 'flex';
  ov._importResult = result;
}

function _confirmImport() {
  const ov = document.getElementById('import-modal-overlay');
  const result = ov._importResult;
  if(!result) return;
  ov.style.display = 'none';

  // Merge vÃ o localStorage (dedupe theo id + updatedAt)
  if(result.inv.length) {
    const now = Date.now();
    const incoming = result.inv.map(r => ensureMeta({
      ...r,
      id: makeStableId(r, ['ngay', 'congtrinh', 'nd', 'tien']),
      createdAt: r.createdAt || now,
      updatedAt: r.updatedAt || now
    }));
    invoices = mergeUnique(load('inv_v3',[]), incoming);
    save('inv_v3', invoices);
  }
  if(result.ung.length) {
    const now = Date.now();
    const incoming = result.ung.map(r => ensureMeta({
      ...r,
      id: makeStableId({ ngay: r.ngay, ct: r.congtrinh, tp: r.tp, tien: r.tien }, ['ngay', 'ct', 'tp', 'tien']),
      createdAt: r.createdAt || now,
      updatedAt: r.updatedAt || now
    }));
    ungRecords = mergeUnique(load('ung_v1',[]), incoming);
    save('ung_v1', ungRecords);
  }
  if(result.cc.length) {
    const existing = load('cc_v2',[]);
    const incoming = result.cc.map(r => ensureMeta({
      ...r,
      id: r.id || makeStableId({ fromDate: r.fromDate, ct: r.ct }, ['fromDate', 'ct']),
      createdAt: r.createdAt || Date.now(),
      updatedAt: r.updatedAt || Date.now()
    }));
    ccData = mergeUnique(existing, incoming);
    save('cc_v2', ccData);
  }
  if(result.tb.length) {
    const now = Date.now();
    const incoming = result.tb.map(r => ensureMeta({
      ...r,
      id: makeStableId(r, ['ngay', 'ct', 'ten']),
      createdAt: r.createdAt || now,
      updatedAt: r.updatedAt || now
    }));
    tbData = mergeUnique(load('tb_v1',[]), incoming);
    save('tb_v1', tbData);
  }

  // Merge danh má»¥c
  const c = result.cats;
  if(c.ct && c.ct.length)    { const cur=load('cat_ct',DEFAULTS.congTrinh); const merged=[...new Set([...cur,...c.ct])]; localStorage.setItem('cat_ct',JSON.stringify(merged)); cats.congTrinh=merged; }
  if(c.loai && c.loai.length) { const cur=load('cat_loai',DEFAULTS.loaiChiPhi); const merged=[...new Set([...cur,...c.loai])]; localStorage.setItem('cat_loai',JSON.stringify(merged)); cats.loaiChiPhi=merged; }
  if(c.ncc && c.ncc.length)   { const cur=load('cat_ncc',DEFAULTS.nhaCungCap); const merged=[...new Set([...cur,...c.ncc])]; localStorage.setItem('cat_ncc',JSON.stringify(merged)); cats.nhaCungCap=merged; }
  if(c.nguoi && c.nguoi.length){ const cur=load('cat_nguoi',DEFAULTS.nguoiTH); const merged=[...new Set([...cur,...c.nguoi])]; localStorage.setItem('cat_nguoi',JSON.stringify(merged)); cats.nguoiTH=merged; }

  // â”€â”€ Xá»­ lÃ½ Cháº¥m CÃ´ng import: sinh HÄ nhÃ¢n cÃ´ng Ä‘Ãºng nhÆ° saveCCWeek â”€â”€
  let builtMsg = '';
  if(result.cc.length) {
    let totalWeeks = 0, totalHdml = 0;

    result.cc.forEach(week => {
      const { fromDate, ct, workers } = week;
      if(!fromDate || !ct || !workers || !workers.length) return;

      // TÃ­nh toDate (T7 = fromDate + 6 ngÃ y) náº¿u trá»‘ng
      let toDate = week.toDate;
      if(!toDate) {
        try {
          const [y,m,d] = fromDate.split('-').map(Number);
          const sat = new Date(y, m-1, d+6);
          toDate = sat.getFullYear() + '-' +
            String(sat.getMonth()+1).padStart(2,'0') + '-' +
            String(sat.getDate()).padStart(2,'0');
        } catch(e) { toDate = fromDate; }
      }

      const weekPrefix = 'cc|' + fromDate + '|' + ct + '|';

      // XÃ³a HÄ cÅ© cá»§a tuáº§n nÃ y náº¿u Ä‘Ã£ tá»“n táº¡i (trÃ¡nh duplicate khi import láº¡i)
      invoices = invoices.filter(i => !i.ccKey || !i.ccKey.startsWith(weekPrefix));

      // HÄ Mua Láº» â€” má»—i worker cÃ³ hdmuale > 0
      workers.forEach(wk => {
        if(!wk.hdmuale || wk.hdmuale <= 0) return;
        const key = weekPrefix + wk.name + '|hdml';
        const ts = Date.now();
        invoices.unshift(ensureMeta({
          id: makeStableId({ ccKey: key }, ['ccKey']),
          ccKey: key,
          ngay: toDate, congtrinh: ct, loai: 'HÃ³a ÄÆ¡n Láº»',
          nguoi: wk.name, ncc: '',
          nd: wk.nd || ('HÄ mua láº» â€“ ' + wk.name + ' (' + viShort(fromDate) + 'â€“' + viShort(toDate) + ')'),
          tien: wk.hdmuale, thanhtien: wk.hdmuale,
          createdAt: ts, updatedAt: ts, _ts: ts
        }));
        totalHdml++;
      });

      // HÄ NhÃ¢n CÃ´ng â€” 1 HÄ tá»•ng má»—i tuáº§n+CT
      const totalLuong = workers.reduce((s, wk) => {
        const tc = (wk.d || []).reduce((a, v) => a + (v || 0), 0);
        return s + tc * (wk.luong || 0) + (wk.phucap || 0);
      }, 0);

      if(totalLuong > 0) {
        const ncKey = weekPrefix + 'nhanCong';
        const firstWorker = (workers.find(w => w.name) || {name:''}).name;
        const ts = Date.now();
        invoices.unshift(ensureMeta({
          id: makeStableId({ ccKey: ncKey }, ['ccKey']),
          ccKey: ncKey,
          ngay: toDate, congtrinh: ct, loai: 'NhÃ¢n CÃ´ng',
          nguoi: firstWorker, ncc: '',
          nd: 'LÆ°Æ¡ng tuáº§n ' + viShort(fromDate) + 'â€“' + viShort(toDate),
          tien: totalLuong, thanhtien: totalLuong,
          createdAt: ts, updatedAt: ts, _ts: ts
        }));
        totalWeeks++;
      }

      // Cáº­p nháº­t danh má»¥c cÃ´ng trÃ¬nh + cÃ´ng nhÃ¢n
      if(!cats.congTrinh.includes(ct)) { cats.congTrinh.push(ct); cats.congTrinh.sort(); }
      workers.forEach(wk => {
        if(wk.name && !cats.nguoiTH.includes(wk.name)) cats.nguoiTH.push(wk.name);
        if(wk.name && !cats.congNhan.includes(wk.name)) cats.congNhan.push(wk.name);
      });
    });

    // LÆ°u láº¡i invoices Ä‘Ã£ Ä‘Æ°á»£c bá»• sung HÄ nhÃ¢n cÃ´ng
    save('inv_v3', invoices);
    // LÆ°u danh má»¥c Ä‘Ã£ cáº­p nháº­t
    localStorage.setItem('cat_ct',   JSON.stringify(cats.congTrinh));
    localStorage.setItem('cat_nguoi', JSON.stringify(cats.nguoiTH.sort()));
    localStorage.setItem('cat_cn',   JSON.stringify(cats.congNhan.sort()));

    builtMsg = ' | ' + totalWeeks + ' HÄ lÆ°Æ¡ng' + (totalHdml ? ' + ' + totalHdml + ' HÄ láº»' : '');
  }

  buildYearSelect();
  rebuildEntrySelects(); rebuildUngSelects();
  buildFilters(); filterAndRender(); renderTrash();
  renderCCHistory(); renderCCTLT();
  buildUngFilters(); filterAndRenderUng();
  renderCtPage(); renderSettings(); updateTop();

  toast('âœ… Import thÃ nh cÃ´ng!' + builtMsg, 'success');

  // Push lÃªn Firebase táº¥t cáº£ cÃ¡c nÄƒm cÃ³ trong data
  if(fbReady()) {
    showSyncBanner('â˜ï¸ Äang lÆ°u lÃªn Firebase...');
    const years = new Set();
    result.inv.forEach(i=>{ if(i.ngay) years.add(parseInt(i.ngay.slice(0,4))); });
    result.ung.forEach(i=>{ if(i.ngay) years.add(parseInt(i.ngay.slice(0,4))); });
    result.cc.forEach(i=>{ if(i.fromDate) years.add(parseInt(i.fromDate.slice(0,4))); });
    if(!years.size) years.add(activeYear||new Date().getFullYear());

    let pending = years.size;
    years.forEach(yr => {
      const payload = fbYearPayload(yr);
      fsSet(fbDocYear(yr), payload).then(()=>{
        pending--;
        if(pending===0) {
          fsSet(fbDocCats(), fbCatsPayload()).then(()=>{
            showSyncBanner('âœ… ÄÃ£ lÆ°u lÃªn Firebase!', 3000);
          });
        }
      }).catch(()=>{ pending--; });
    });
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// XUáº¤T Dá»® LIá»†U RA EXCEL (Export)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openExportModal() {
  let ov = document.getElementById('export-modal-overlay');
  if(!ov) {
    ov = document.createElement('div');
    ov.id = 'export-modal-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center';
    ov.onclick = function(e){ if(e.target===this) ov.style.display='none'; };
    document.body.appendChild(ov);
  }

  // Äáº¿m dá»¯ liá»‡u theo nÄƒm
  const yearStats = {};
  const allItems = [
    ...invoices.filter(i=>i.ngay&&!i.ccKey),
    ...invoices.filter(i=>i.ccKey)  // HÄ nhÃ¢n cÃ´ng auto
  ];
  invoices.forEach(i=>{
    const y = i.ngay?i.ngay.slice(0,4):'?';
    if(!yearStats[y]) yearStats[y]={inv:0,ung:0,cc:0};
    yearStats[y].inv++;
  });
  ungRecords.forEach(u=>{
    const y = u.ngay?u.ngay.slice(0,4):'?';
    if(!yearStats[y]) yearStats[y]={inv:0,ung:0,cc:0};
    yearStats[y].ung++;
  });
  ccData.forEach(w=>{
    const y = w.fromDate?w.fromDate.slice(0,4):'?';
    if(!yearStats[y]) yearStats[y]={inv:0,ung:0,cc:0};
    yearStats[y].cc++;
  });

  const sortedYears = Object.keys(yearStats).filter(y=>y!=='?').sort((a,b)=>b-a);
  const curYr = activeYear===0 ? 'tat_ca' : String(activeYear);

  ov.innerHTML = `<div onclick="event.stopPropagation()" style="max-width:440px;width:95vw;background:#fff;border-radius:16px;padding:24px;font-family:'IBM Plex Sans',sans-serif;box-shadow:0 12px 48px rgba(0,0,0,.2);max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:800;margin:0">ðŸ“¤ Xuáº¥t Dá»¯ Liá»‡u Ra Excel</h3>
      <button onclick="document.getElementById('export-modal-overlay').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#888">âœ•</button>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:12px;font-weight:700;color:#444;display:block;margin-bottom:6px">Chá»n nÄƒm xuáº¥t:</label>
      <select id="export-year-sel" style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;color:#1a1814;outline:none">
        <option value="0">ðŸ“… Táº¥t cáº£ nÄƒm</option>
        ${sortedYears.map(y=>`<option value="${y}" ${y===curYr?'selected':''}>${y} â€” ${yearStats[y].inv} HÄ, ${yearStats[y].ung} tiá»n á»©ng, ${yearStats[y].cc} tuáº§n CC</option>`).join('')}
      </select>
    </div>
    <div style="background:#f0f4ff;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#333">
      <strong>File sáº½ bao gá»“m:</strong><br>
      Sheet 1_HoaDon, 2_TienUng, 3_ChamCong, 4_ThietBi, 5_DanhMuc
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('export-modal-overlay').style.display='none'" style="flex:1;padding:11px;border-radius:8px;border:1.5px solid #ccc;background:#fff;font-family:inherit;font-size:13px;cursor:pointer">Huá»·</button>
      <button onclick="_doExport()" style="flex:2;padding:11px;border-radius:8px;border:none;background:#1a7a45;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer">ðŸ“¥ Táº£i File Excel</button>
    </div>
  </div>`;
  ov.style.display = 'flex';
}

function _doExport() {
  const sel = document.getElementById('export-year-sel');
  const yr = sel ? parseInt(sel.value)||0 : 0;
  document.getElementById('export-modal-overlay').style.display = 'none';

  // Filter theo nÄƒm
  const filterY = (dateStr) => yr===0 || (dateStr&&dateStr.startsWith(String(yr)));
  const expInv = invoices.filter(i=>filterY(i.ngay)&&!i.ccKey);
  const expUng = ungRecords.filter(u=>filterY(u.ngay));
  const expCC  = ccData.filter(w=>filterY(w.fromDate));
  const expTb  = tbData.filter(t=>filterY(t.ngay)||yr===0);

  // Build workbook báº±ng SheetJS
  const wb = XLSX.utils.book_new();

  // Sheet 1: HoaDon
  const inv_data = [['NGÃ€Y','CÃ”NG TRÃŒNH','LOáº I CHI PHÃ','Ná»˜I DUNG','ÄÆ N GIÃ','Sá» LÆ¯á»¢NG','THÃ€NH TIá»€N','NGÆ¯á»œI TH','NHÃ€ CC','Sá» HÄ']];
  expInv.forEach(i=>inv_data.push([i.ngay||'',i.congtrinh||'',i.loai||'',i.nd||'',i.tien||0,i.sl||1,i.thanhtien||i.tien||0,i.nguoi||'',i.ncc||'',i.sohd||'']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(inv_data), '1_HoaDon');

  // Sheet 2: TienUng
  const ung_data = [['NGÃ€Y','CÃ”NG TRÃŒNH','THáº¦U PHá»¤ / NHÃ€ CC','Sá» TIá»€N á»¨NG','Ná»˜I DUNG']];
  expUng.forEach(u=>ung_data.push([u.ngay||'',u.congtrinh||'',u.tp||'',u.tien||0,u.nd||'']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ung_data), '2_TienUng');

  // Sheet 3: ChamCong (flatten)
  const cc_data = [['NGÃ€Y Äáº¦U TUáº¦N','CÃ”NG TRÃŒNH','TÃŠN CÃ”NG NHÃ‚N','LÆ¯Æ NG/NGÃ€Y','PHá»¤ Cáº¤P','HÄ MUA Láºº','CN','T2','T3','T4','T5','T6','T7','GHI CHÃš']];
  expCC.forEach(w=>{
    (w.workers||[]).forEach(wk=>{
      const d = wk.d||[0,0,0,0,0,0,0];
      cc_data.push([w.fromDate||'',w.ct||'',wk.name||'',wk.luong||0,wk.phucap||0,wk.hdmuale||0,d[0]||0,d[1]||0,d[2]||0,d[3]||0,d[4]||0,d[5]||0,d[6]||0,wk.nd||'']);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cc_data), '3_ChamCong');

  // Sheet 4: ThietBi
  const tb_data = [['CÃ”NG TRÃŒNH','TÃŠN THIáº¾T Bá»Š','Sá» LÆ¯á»¢NG','TÃŒNH TRáº NG','NGÆ¯á»œI PHá»¤ TRÃCH','NGÃ€Y','GHI CHÃš']];
  expTb.forEach(t=>tb_data.push([t.ct||'',t.ten||'',t.soluong||1,t.tinhtrang||'',t.nguoi||'',t.ngay||'',t.ghichu||'']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tb_data), '4_ThietBi');

  // Sheet 5: DanhMuc
  const dm_data = [['CÃ”NG TRÃŒNH','NGÆ¯á»œI THá»°C HIá»†N','NHÃ€ CC / THáº¦U PHá»¤','LOáº I CHI PHÃ']];
  const maxDm = Math.max(cats.congTrinh.length,cats.nguoiTH.length,cats.nhaCungCap.length,cats.loaiChiPhi.length);
  for(let i=0;i<maxDm;i++) dm_data.push([cats.congTrinh[i]||'',cats.nguoiTH[i]||'',cats.nhaCungCap[i]||'',cats.loaiChiPhi[i]||'']);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dm_data), '5_DanhMuc');

  const fname = yr===0 ? 'export_tat_ca_nam.xlsx' : `export_${yr}.xlsx`;
  XLSX.writeFile(wb, fname);
  toast(`âœ… ÄÃ£ xuáº¥t ${expInv.length} HÄ, ${expUng.length} tiá»n á»©ng, ${expCC.reduce((s,w)=>s+w.workers.length,0)} CN`, 'success');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// XÃ“A Dá»® LIá»†U THEO NÄ‚M / THEO LOáº I
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openDeleteModal() {
  let ov = document.getElementById('delete-modal-overlay');
  if(!ov) {
    ov = document.createElement('div');
    ov.id = 'delete-modal-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center';
    ov.onclick = function(e){ if(e.target===this) ov.style.display='none'; };
    document.body.appendChild(ov);
  }
  _renderDeleteModal();
}

function _renderDeleteModal() {
  const ov = document.getElementById('delete-modal-overlay');
  if(!ov) return;

  // Thá»‘ng kÃª theo nÄƒm
  const yearStats = {};
  const addStat = (y, type) => {
    if(!y) return;
    if(!yearStats[y]) yearStats[y] = {inv:0, invAuto:0, ung:0, cc:0, tb:0};
    yearStats[y][type]++;
  };
  invoices.forEach(i=>{ const y=i.ngay?i.ngay.slice(0,4):'?'; addStat(y, i.ccKey?'invAuto':'inv'); });
  ungRecords.forEach(u=>addStat(u.ngay?u.ngay.slice(0,4):'?','ung'));
  ccData.forEach(w=>addStat(w.fromDate?w.fromDate.slice(0,4):'?','cc'));
  tbData.forEach(t=>addStat(t.ngay?t.ngay.slice(0,4):'?','tb'));

  const sortedYears = Object.keys(yearStats).filter(y=>y!=='?').sort((a,b)=>b-a);

  ov.innerHTML = `<div onclick="event.stopPropagation()" style="max-width:480px;width:95vw;background:#fff;border-radius:16px;padding:24px;font-family:'IBM Plex Sans',sans-serif;box-shadow:0 12px 48px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <h3 style="font-size:16px;font-weight:800;margin:0;color:#c0392b">ðŸ—‘ï¸ XÃ³a Dá»¯ Liá»‡u</h3>
      <button onclick="document.getElementById('delete-modal-overlay').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#888">âœ•</button>
    </div>
    <p style="font-size:12px;color:#888;margin:0 0 16px">Chá»n nÄƒm vÃ  loáº¡i dá»¯ liá»‡u cáº§n xÃ³a. Thao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c trá»« khi báº¡n cÃ³ backup.</p>

    <div style="margin-bottom:14px">
      <label style="font-size:12px;font-weight:700;color:#444;display:block;margin-bottom:6px">Chá»n nÄƒm:</label>
      <select id="del-year-sel" onchange="_renderDeleteCheckboxes()" style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;color:#1a1814;outline:none">
        <option value="0">ðŸ“… Táº¥t cáº£ nÄƒm (xÃ³a toÃ n bá»™)</option>
        ${sortedYears.map(y=>{
          const s=yearStats[y];
          return `<option value="${y}">${y} â€” ${s.inv} HÄ tay + ${s.invAuto} HÄ auto + ${s.ung} tiá»n á»©ng + ${s.cc} tuáº§n CC</option>`;
        }).join('')}
      </select>
    </div>

    <div id="del-checkboxes" style="background:#fef9f9;border:1.5px solid #f5c6cb;border-radius:8px;padding:12px;margin-bottom:14px">
      <!-- rendered by _renderDeleteCheckboxes -->
    </div>

    <div style="background:#fff3cd;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#856404">
      âš ï¸ Sau khi xÃ³a local sáº½ tá»± Ä‘á»™ng <strong>xÃ³a luÃ´n trÃªn Firebase</strong> (náº¿u Ä‘Ã£ káº¿t ná»‘i).
      HÃ£y Export backup trÆ°á»›c náº¿u cáº§n.
    </div>

    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('delete-modal-overlay').style.display='none'" style="flex:1;padding:11px;border-radius:8px;border:1.5px solid #ccc;background:#fff;font-family:inherit;font-size:13px;cursor:pointer">Huá»·</button>
      <button onclick="openExportModal();document.getElementById('delete-modal-overlay').style.display='none'" style="flex:1;padding:11px;border-radius:8px;border:none;background:#1a7a45;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">ðŸ“¤ Export TrÆ°á»›c</button>
      <button onclick="_confirmDelete()" style="flex:1;padding:11px;border-radius:8px;border:none;background:#c0392b;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer">ðŸ—‘ï¸ XÃ³a</button>
    </div>
  </div>`;

  _renderDeleteCheckboxes();
  ov.style.display = 'flex';
}

function _renderDeleteCheckboxes() {
  const box = document.getElementById('del-checkboxes');
  if(!box) return;
  const yr = parseInt(document.getElementById('del-year-sel')?.value)||0;

  const filterY = (dateStr) => yr===0 || (dateStr&&dateStr.startsWith(String(yr)));
  const cntInv  = invoices.filter(i=>filterY(i.ngay)&&!i.ccKey).length;
  const cntAuto = invoices.filter(i=>filterY(i.ngay)&&i.ccKey).length;
  const cntUng  = ungRecords.filter(u=>filterY(u.ngay)).length;
  const cntCC   = ccData.filter(w=>filterY(w.fromDate)).length;
  const cntTb   = tbData.filter(t=>filterY(t.ngay)||yr===0).length;

  const row = (id, label, cnt, color='#333') => cnt>0
    ? `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;border-bottom:1px solid #f0e0e0">
        <input type="checkbox" id="${id}" checked style="width:16px;height:16px;accent-color:#c0392b;cursor:pointer">
        <span style="font-size:12px;color:${color};flex:1">${label}</span>
        <span style="font-size:11px;font-weight:700;color:#c0392b;background:#fde8e8;padding:2px 8px;border-radius:10px">${cnt} má»¥c</span>
       </label>`
    : `<div style="padding:5px 0;font-size:12px;color:#bbb;border-bottom:1px solid #f5f5f5">${label}: <em>khÃ´ng cÃ³ dá»¯ liá»‡u</em></div>`;

  box.innerHTML = `
    ${row('del-inv',   'ðŸ“‹ HÃ³a ÄÆ¡n (nháº­p tay)', cntInv)}
    ${row('del-auto',  'ðŸ¤– HÃ³a ÄÆ¡n NhÃ¢n CÃ´ng (tá»± Ä‘á»™ng tá»« CC)', cntAuto, '#666')}
    ${row('del-ung',   'ðŸ’° Tiá»n á»¨ng', cntUng)}
    ${row('del-cc',    'ðŸ‘· Cháº¥m CÃ´ng (tuáº§n)', cntCC)}
    ${row('del-tb',    'ðŸ”§ Thiáº¿t Bá»‹', cntTb)}
  `;
}

function _confirmDelete() {
  const yr = parseInt(document.getElementById('del-year-sel')?.value)||0;
  const delInv  = document.getElementById('del-inv')?.checked;
  const delAuto = document.getElementById('del-auto')?.checked;
  const delUng  = document.getElementById('del-ung')?.checked;
  const delCC   = document.getElementById('del-cc')?.checked;
  const delTb   = document.getElementById('del-tb')?.checked;

  if(!delInv && !delAuto && !delUng && !delCC && !delTb) {
    toast('âš ï¸ ChÆ°a chá»n loáº¡i dá»¯ liá»‡u nÃ o!', 'error'); return;
  }

  const yrLabel = yr===0 ? 'Táº¤T Cáº¢ NÄ‚M' : String(yr);
  if(!confirm('XÃ¡c nháº­n XÃ“A dá»¯ liá»‡u nÄƒm ' + yrLabel + '?\nThao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c!')) return;

  document.getElementById('delete-modal-overlay').style.display = 'none';

  const filterY = (dateStr) => yr===0 || (dateStr&&dateStr.startsWith(String(yr)));
  let msg = [];

  if(delInv || delAuto) {
    const before = invoices.length;
    invoices = invoices.filter(i => {
      if(!filterY(i.ngay)) return true;
      if(delInv && !i.ccKey) return false;
      if(delAuto && i.ccKey) return false;
      return true;
    });
    save('inv_v3', invoices);
    msg.push(`${before-invoices.length} HÄ`);
  }
  if(delUng) {
    const before = ungRecords.length;
    ungRecords = ungRecords.filter(u=>!filterY(u.ngay));
    save('ung_v1', ungRecords);
    msg.push(`${before-ungRecords.length} tiá»n á»©ng`);
  }
  if(delCC) {
    const before = ccData.length;
    ccData = ccData.filter(w=>!filterY(w.fromDate));
    save('cc_v2', ccData);
    // Rebuild HÄ auto sau khi xÃ³a CC
    rebuildInvoicesFromCC();
    invoices = load('inv_v3', []);
    msg.push(`${before-ccData.length} tuáº§n CC`);
  }
  if(delTb) {
    const before = tbData.length;
    tbData = tbData.filter(t=>yr===0 ? false : !filterY(t.ngay));
    save('tb_v1', tbData);
    msg.push(`${before-tbData.length} thiáº¿t bá»‹`);
  }

  // XÃ³a trÃªn Firebase
  if(fbReady()) {
    if(yr===0) {
      // XÃ³a toÃ n bá»™ â€” push data trá»‘ng lÃªn táº¥t cáº£ nÄƒm
      showSyncBanner('â˜ï¸ Äang xÃ³a trÃªn Firebase...');
      const years = new Set();
      [...invoices,...ungRecords,...ccData].forEach(i=>{
        const d=i.ngay||i.fromDate||''; if(d) years.add(parseInt(d.slice(0,4)));
      });
      if(!years.size) years.add(new Date().getFullYear());
      let pending=years.size;
      years.forEach(y=>{ fsSet(fbDocYear(y), fbYearPayload(y)).finally(()=>{ pending--; if(!pending) hideSyncBanner(); }); });
    } else {
      showSyncBanner('â˜ï¸ Äang cáº­p nháº­t Firebase...');
      fsSet(fbDocYear(yr), fbYearPayload(yr)).then(()=>hideSyncBanner()).catch(()=>hideSyncBanner());
    }
    fsSet(fbDocCats(), fbCatsPayload()).catch(()=>{});
  }

  buildYearSelect();
  rebuildEntrySelects(); rebuildUngSelects();
  buildFilters(); filterAndRender(); renderTrash();
  renderCCHistory(); renderCCTLT();
  buildUngFilters(); filterAndRenderUng();
  renderCtPage(); updateTop();

  toast(`ðŸ—‘ï¸ ÄÃ£ xÃ³a: ${msg.join(', ')}`, 'success');
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


