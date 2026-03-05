// chamcong.js â€” Cham Cong / Phieu Luong
// Load order: 4


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Sá»” CHáº¤M CÃ”NG v3
//  worker: { name, luong, d:[CN,T2,T3,T4,T5,T6,T7], phucap, hdmuale, nd }
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let ccData   = load('cc_v2', []);
let ccOffset = 0;

// Tá»± Ä‘á»™ng rebuild HÄ nhÃ¢n cÃ´ng náº¿u cÃ³ CC data mÃ  thiáº¿u HÄ (gá»i sau khi má»i data Ä‘Ã£ load)
function autoRebuildCCIfNeeded() {
  if (!ccData.length) return;

  // BÆ°á»›c 1: XÃ³a HÄ auto bá»‹ lá»—i ngay='' (do import cÅ© thiáº¿u toDate)
  const badInvs = invoices.filter(i => i.ccKey && !i.ngay);
  if (badInvs.length > 0) {
    invoices = invoices.filter(i => !(i.ccKey && !i.ngay));
    save('inv_v3', invoices);
    console.log('[autoRebuild] Cleared', badInvs.length, 'bad invs (ngay empty)');
  }

  // BÆ°á»›c 2: TÃ¬m cÃ¡c tuáº§n CC chÆ°a cÃ³ HÄ tÆ°Æ¡ng á»©ng trong invoices
  let totalFixed = 0;
  ccData.forEach(week => {
    const { fromDate, ct, workers } = week;
    if(!fromDate || !ct || !workers || !workers.length) return;
    const weekPrefix = 'cc|' + fromDate + '|' + ct + '|';
    const ncKey = weekPrefix + 'nhanCong';

    // Náº¿u tuáº§n nÃ y Ä‘Ã£ cÃ³ HÄ nhÃ¢n cÃ´ng â†’ bá» qua
    if(invoices.some(i => i.ccKey === ncKey)) return;

    // TÃ­nh toDate
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

    // Táº¡o HÄ mua láº» cÃ²n thiáº¿u
    workers.forEach(wk => {
      if(!wk.hdmuale || wk.hdmuale <= 0) return;
      const key = weekPrefix + wk.name + '|hdml';
      if(invoices.some(i => i.ccKey === key)) return;
      const ts = Date.now();
      invoices.unshift(ensureMeta({
        id: makeStableId({ ccKey: key }, ['ccKey']), ccKey: key,
        ngay: toDate, congtrinh: ct, loai: 'HÃ³a ÄÆ¡n Láº»',
        nguoi: wk.name, ncc: '',
        nd: wk.nd || ('HÄ mua láº» â€“ ' + wk.name + ' (' + viShort(fromDate) + 'â€“' + viShort(toDate) + ')'),
        tien: wk.hdmuale, thanhtien: wk.hdmuale,
        createdAt: ts, updatedAt: ts, _ts: ts
      }));
    });

    // Táº¡o HÄ nhÃ¢n cÃ´ng
    const totalLuong = workers.reduce((s, wk) => {
      const tc = (wk.d || []).reduce((a, v) => a + (v || 0), 0);
      return s + tc * (wk.luong || 0) + (wk.phucap || 0);
    }, 0);
    if(totalLuong > 0) {
      const firstWorker = (workers.find(w => w.name) || {name:''}).name;
      const ts = Date.now();
      invoices.unshift(ensureMeta({
        id: makeStableId({ ccKey: ncKey }, ['ccKey']), ccKey: ncKey,
        ngay: toDate, congtrinh: ct, loai: 'NhÃ¢n CÃ´ng',
        nguoi: firstWorker, ncc: '',
        nd: 'LÆ°Æ¡ng tuáº§n ' + viShort(fromDate) + 'â€“' + viShort(toDate),
        tien: totalLuong, thanhtien: totalLuong,
        createdAt: ts, updatedAt: ts, _ts: ts
      }));
      totalFixed++;
    }
  });

  if(totalFixed > 0 || badInvs.length > 0) {
    save('inv_v3', invoices);
    console.log('[autoRebuild] Fixed ' + totalFixed + ' missing weeks, cleared ' + badInvs.length + ' bad');
  }
}
let ccHistPage = 1, ccTltPage = 1;
const CC_PG_HIST = 30;
const CC_PG_TLT = 20;
const CC_DAY_LABELS   = ['CN','T2','T3','T4','T5','T6','T7'];
const CC_DATE_OFFSETS = [0,1,2,3,4,5,6]; // offset from Sunday (week starts Sunday)

// â”€â”€â”€ date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tuáº§n: CN (Sun) â†’ T7 (Sat). iso date string lÃ  YYYY-MM-DD.
// TrÃ¡nh timezone bug: dÃ¹ng local date parts, khÃ´ng dÃ¹ng toISOString cho date-only

function isoFromParts(y,m,d){ return y+'-'+(m<10?'0':'')+m+'-'+(d<10?'0':'')+d; }

// Tráº£ vá» iso string cá»§a CN (Sunday) cho tuáº§n cÃ¡ch tuáº§n hiá»‡n táº¡i offset tuáº§n
function ccSundayISO(offset=0){
  const now = new Date();
  const y=now.getFullYear(), mo=now.getMonth(), d=now.getDate();
  const jsDay=now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  // TÃ¬m Sunday cá»§a tuáº§n hiá»‡n táº¡i
  const sunD = new Date(y, mo, d - jsDay + offset*7);
  return isoFromParts(sunD.getFullYear(), sunD.getMonth()+1, sunD.getDate());
}

// Tráº£ vá» iso string cá»§a T7 (Saturday) = CN + 6
function ccSaturdayISO(sundayISO){
  const [y,m,d]=sundayISO.split('-').map(Number);
  const sat=new Date(y,m-1,d+6);
  return isoFromParts(sat.getFullYear(),sat.getMonth()+1,sat.getDate());
}

// Snap báº¥t ká»³ ngÃ y â†’ CN cá»§a tuáº§n chá»©a ngÃ y Ä‘Ã³
function snapToSunday(dateISO){
  const [y,m,d]=dateISO.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  const jsDay=dt.getDay(); // 0=Sun
  const sun=new Date(y,m-1,d-jsDay);
  return isoFromParts(sun.getFullYear(),sun.getMonth()+1,sun.getDate());
}

function viShort(ds){
  const [y,m,d]=ds.split('-').map(Number);
  return (d<10?'0':'')+d+'/'+(m<10?'0':'')+m;
}
function weekLabel(sundayISO){
  const satISO=ccSaturdayISO(sundayISO);
  const y=sundayISO.split('-')[0];
  return viShort(sundayISO)+'â€“'+viShort(satISO)+'/'+y;
}

// iso() váº«n giá»¯ Ä‘á»ƒ dÃ¹ng chá»— khÃ¡c náº¿u cáº§n
function iso(d){ return d.toISOString().split('T')[0]; }

// â”€â”€â”€ all worker names for autocomplete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ccAllNames(){
  const s=new Set();
  ccData.forEach(w=>w.workers.forEach(wk=>{ if(wk.name) s.add(wk.name); }));
  cats.nguoiTH.forEach(n=>s.add(n));
  return [...s].sort();
}

// build/update the shared datalist for name autocomplete
function rebuildCCNameList(){
  let dl=document.getElementById('cc-name-dl');
  if(!dl){ dl=document.createElement('datalist'); dl.id='cc-name-dl'; document.body.appendChild(dl); }
  dl.innerHTML=ccAllNames().map(n=>`<option value="${x(n)}">`).join('');
}

// â”€â”€â”€ init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function initCC(){
  ccOffset=0;
  ccGoToWeek(0);
  populateCCCtSel();
  rebuildCCNameList();
}

function ccGoToWeek(off){
  ccOffset=off;
  const sunISO=ccSundayISO(off);
  const satISO=ccSaturdayISO(sunISO);
  document.getElementById('cc-from').value=sunISO;
  document.getElementById('cc-to').value=satISO;
  document.getElementById('cc-week-label').textContent='Tuáº§n: '+weekLabel(sunISO);
  loadCCWeekForm();
}
function ccPrevWeek(){ ccGoToWeek(ccOffset-1); }
function ccNextWeek(){ ccGoToWeek(ccOffset+1); }

function onCCFromChange(){
  const raw=document.getElementById('cc-from').value; if(!raw) return;
  // Snap báº¥t ká»³ ngÃ y Ä‘Æ°á»£c chá»n vá» CN cá»§a tuáº§n Ä‘Ã³
  const sunISO=snapToSunday(raw);
  const satISO=ccSaturdayISO(sunISO);
  document.getElementById('cc-from').value=sunISO;
  document.getElementById('cc-to').value=satISO;
  document.getElementById('cc-week-label').textContent='Tuáº§n: '+weekLabel(sunISO);
  // TÃ­nh láº¡i offset so vá»›i tuáº§n hiá»‡n táº¡i
  const thisSun=ccSundayISO(0);
  const [ty,tm,td]=thisSun.split('-').map(Number);
  const [fy,fm,fd]=sunISO.split('-').map(Number);
  const diffMs=new Date(fy,fm-1,fd)-new Date(ty,tm-1,td);
  ccOffset=Math.round(diffMs/(7*86400000));
  loadCCWeekForm();
}

function loadCCWeekForm(){
  const f=document.getElementById('cc-from').value;
  const ct=document.getElementById('cc-ct-sel').value;
  // Try to find saved data for this week+ct
  const rec=ccData.find(w=>w.fromDate===f&&w.ct===ct);
  if(rec){
    buildCCTable(rec.workers);
  } else if(ct){
    // Auto-copy workers from most recent week of same CT (names+luong only, clear days/extra)
    const prev=ccData.filter(w=>w.ct===ct&&w.fromDate<f).sort((a,b)=>b.fromDate.localeCompare(a.fromDate))[0];
    if(prev){
      const stub=prev.workers.map(wk=>({name:wk.name,luong:wk.luong,d:[0,0,0,0,0,0,0],phucap:0,hdmuale:0,nd:''}));
      buildCCTable(stub);
    } else {
      buildCCTable([]);
    }
  } else {
    buildCCTable([]);
  }
}

// â”€â”€â”€ build table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildCCTable(workers){
  const fromStr=document.getElementById('cc-from').value;
  const thead=document.getElementById('cc-thead-row');
  const dates=CC_DATE_OFFSETS.map(off=>{
    if(!fromStr) return '';
    const d=new Date(fromStr+'T00:00:00'); d.setDate(d.getDate()+off);
    return d.getDate()+'/'+(d.getMonth()+1);
  });
  const BG='background:#eeece7;color:var(--ink)';
  thead.innerHTML=`
    <th class="col-num">#</th>
    <th class="cc-sticky-name col-name">TÃªn CÃ´ng NhÃ¢n</th>
    <th class="col-tp" style="text-align:center">T/P</th>
    ${CC_DAY_LABELS.map((l,i)=>`<th class="cc-day-header col-day">${l}<br><span style="font-size:9px;font-weight:400;color:var(--ink2)">${dates[i]}</span></th>`).join('')}
    <th class="col-tc" style="text-align:center;${BG}">TC</th>
    <th class="col-luong" style="text-align:right;${BG}">LÆ°Æ¡ng/NgÃ y</th>
    <th class="col-total-luong" style="text-align:right;${BG}">Tá»•ng LÆ°Æ¡ng</th>
    <th class="col-phucap" style="text-align:right;${BG}">Phá»¥ Cáº¥p</th>
    <th class="col-hdml" style="text-align:right;${BG}">HÄ Mua Láº»</th>
    <th class="col-nd" style="${BG}">Ná»™i Dung</th>
    <th class="col-total cc-sticky-total" style="text-align:right;background:#c8870a;color:#fff;font-weight:700">Tá»•ng Cá»™ng</th>
    <th class="col-del" style="${BG}"></th>
  `;
  const tbody=document.getElementById('cc-tbody');
  tbody.innerHTML='';
  const minRows=Math.max((workers||[]).length,8);
  for(let i=0;i<minRows;i++) addCCRow((workers||[])[i]||null);
  updateCCSumRow();
}

function addCCWorker(){
  const tbody=document.getElementById('cc-tbody');
  const sumRow=tbody.querySelector('.cc-sum-row');
  const nr=buildCCRow(null, tbody.querySelectorAll('tr:not(.cc-sum-row)').length+1);
  tbody.insertBefore(nr,sumRow||null);
  renumberCC(); updateCCSumRow();
  nr.querySelector('.cc-name-input')?.focus();
}

function addCCRow(w){
  const tbody=document.getElementById('cc-tbody');
  const num=tbody.querySelectorAll('tr:not(.cc-sum-row)').length+1;
  tbody.appendChild(buildCCRow(w,num));
}

function buildCCRow(w,num){
  const tr=document.createElement('tr');
  const ds=w?w.d:[0,0,0,0,0,0,0];
  const luong=w?(w.luong||0):0;
  const phucap=w?(w.phucap||0):0;
  const hdml=w?(w.hdmuale||0):0;
  const role=w?.role||(w?.name?cnRoles[w.name]||'':'');
  const isKnown=w?.name?cats.congNhan.some(n=>n.toLowerCase()===(w.name||'').toLowerCase()):false;

  tr.innerHTML=`
    <td class="row-num col-num">${num}</td>
    <td class="cc-sticky-name col-name" style="padding:0">
      <input class="cc-name-input" data-cc="name" list="cc-name-dl"
        value="${x(w?w.name||'':''||'')}" placeholder="TÃªn..."
        oninput="onCCNameInput(this)">
    </td>
    <td class="col-tp" style="padding:0">
      <select data-cc="tp" ${isKnown?'disabled':''} style="width:100%;border:none;background:transparent;padding:5px 4px;font-size:12px;font-weight:700;outline:none;color:var(--ink);${isKnown?'opacity:0.65;cursor:not-allowed':'cursor:pointer'}">
        <option value="">â€”</option>
        <option value="C" ${role==='C'?'selected':''}>C</option>
        <option value="T" ${role==='T'?'selected':''}>T</option>
        <option value="P" ${role==='P'?'selected':''}>P</option>
      </select>
    </td>
    ${ds.map((v,i)=>`<td class="col-day" style="padding:0"><input class="cc-day-input ${v===1?'has-val':v>0&&v<1?'half-val':''}"
      data-cc="d${i}" value="${v||''}" placeholder="Â·" autocomplete="off" inputmode="decimal"
      oninput="onCCDayKey(this)"></td>`).join('')}
    <td class="cc-tc-cell col-tc" data-cc="tc">0</td>
    <td class="col-luong" style="padding:0"><input class="cc-wage-input" data-cc="luong" data-raw="${luong||''}" inputmode="decimal"
      value="${luong?numFmt(luong):''}" placeholder="0" oninput="onCCWageKey(this)"></td>
    <td class="cc-total-cell col-total-luong" data-cc="total">â€”</td>
    <td class="col-phucap" style="padding:0"><input class="cc-wage-input" data-cc="phucap" data-raw="${phucap||''}" inputmode="decimal"
      value="${phucap?numFmt(phucap):''}" placeholder="0" oninput="onCCMoneyKey(this)"></td>
    <td class="col-hdml" style="padding:0"><input class="cc-wage-input" data-cc="hdml" data-raw="${hdml||''}" inputmode="decimal"
      value="${hdml?numFmt(hdml):''}" placeholder="0" oninput="onCCMoneyKey(this)"></td>
    <td class="col-nd" style="padding:0"><input class="cc-name-input" data-cc="nd"
      value="${x(w?w.nd||'':''||'')}" placeholder="Ná»™i dung..."
      style="font-size:11px" oninput="updateCCSumRow()"></td>
    <td class="cc-total-cell col-total cc-sticky-total" data-cc="tongcong" style="color:var(--gold);font-size:13px">â€”</td>
    <td class="col-del"><button class="del-btn" onclick="delCCRow(this)">âœ•</button></td>
  `;
  tr.querySelectorAll('[data-cc^="d"]').forEach(el=>el.addEventListener('input',()=>{ onCCDayKey(el); updateCCSumRow(); }));
  tr.querySelector('[data-cc="luong"]').addEventListener('input',function(){ onCCWageKey(this); updateCCSumRow(); });
  tr.querySelector('[data-cc="phucap"]').addEventListener('input',function(){ onCCMoneyKey(this); updateCCSumRow(); });
  tr.querySelector('[data-cc="hdml"]').addEventListener('input',function(){ onCCMoneyKey(this); updateCCSumRow(); });
  tr.querySelector('[data-cc="name"]').addEventListener('input',updateCCSumRow);
  tr.querySelector('[data-cc="nd"]').addEventListener('input',updateCCSumRow);
  calcCCRow(tr);
  return tr;
}

function onCCNameInput(inp){
  const name=inp.value.trim();
  if(!name){ inp.style.boxShadow=''; inp.title=''; return; }
  // Chá»‘ng trÃ¹ng tÃªn khÃ´ng phÃ¢n biá»‡t hoa thÆ°á»ng
  const nameLower=name.toLowerCase();
  let count=0;
  document.querySelectorAll('#cc-tbody [data-cc="name"]').forEach(el=>{ if(el.value.trim().toLowerCase()===nameLower) count++; });
  if(count>1){
    inp.style.boxShadow='inset 0 0 0 2px var(--red)';
    inp.title='âš ï¸ TÃªn trÃ¹ng! Vui lÃ²ng Ä‘á»•i tÃªn Ä‘á»ƒ phÃ¢n biá»‡t.';
    toast('âš ï¸ TÃªn "'+name+'" bá»‹ trÃ¹ng â€“ hÃ£y Ä‘á»•i tÃªn Ä‘á»ƒ trÃ¡nh nháº§m láº«n!','error');
  } else {
    inp.style.boxShadow='';
    inp.title='';
  }
  // Auto-fill T/P náº¿u thá»£ Ä‘Ã£ cÃ³ trong danh má»¥c
  const tr=inp.closest('tr');
  if(!tr) return;
  const tpSel=tr.querySelector('[data-cc="tp"]');
  if(!tpSel) return;
  const known=cats.congNhan.find(n=>n.toLowerCase()===nameLower);
  if(known){
    tpSel.value=cnRoles[known]||'';
    tpSel.disabled=true;
    tpSel.style.opacity='0.65';
    tpSel.style.cursor='not-allowed';
  } else {
    tpSel.disabled=false;
    tpSel.style.opacity='1';
    tpSel.style.cursor='pointer';
  }
}

function onCCDayKey(inp){
  const n=parseFloat(inp.value.replace(',','.'))||0;
  inp.classList.toggle('has-val',n===1);
  inp.classList.toggle('half-val',n>0&&n<1);
  calcCCRow(inp.closest('tr'));
}
function onCCWageKey(inp){
  const raw=inp.value.replace(/\./g,'').replace(/,/g,'');
  inp.dataset.raw=raw;
  if(raw) inp.value=numFmt(parseInt(raw)||0);
  calcCCRow(inp.closest('tr'));
}
function onCCMoneyKey(inp){
  const raw=inp.value.replace(/\./g,'').replace(/,/g,'');
  inp.dataset.raw=raw;
  if(raw) inp.value=numFmt(parseInt(raw)||0);
  calcCCRow(inp.closest('tr'));
}

function calcCCRow(tr){
  let tc=0;
  for(let i=0;i<7;i++) tc+=parseFloat(tr.querySelector(`[data-cc="d${i}"]`)?.value||0)||0;
  tr.querySelector('[data-cc="tc"]').textContent=tc||0;
  const luong=parseInt(tr.querySelector('[data-cc="luong"]')?.dataset?.raw||0)||0;
  const total=tc*luong;
  const phucap=parseInt(tr.querySelector('[data-cc="phucap"]')?.dataset?.raw||0)||0;
  const hdml  =parseInt(tr.querySelector('[data-cc="hdml"]')?.dataset?.raw||0)||0;
  const tongcong=total+phucap+hdml;
  const totCell=tr.querySelector('[data-cc="total"]');
  totCell.textContent=total>0?numFmt(total):'â€”';
  totCell.style.color=total>0?'var(--green)':'var(--ink3)';
  const tcCell=tr.querySelector('[data-cc="tongcong"]');
  tcCell.textContent=tongcong>0?numFmt(tongcong):'â€”';
  tcCell.style.color=tongcong>0?'var(--gold)':'var(--ink3)';
}

function delCCRow(btn){ btn.closest('tr').remove(); renumberCC(); updateCCSumRow(); }
function renumberCC(){
  document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row)').forEach((tr,i)=>tr.querySelector('.row-num').textContent=i+1);
}

function updateCCSumRow(){
  const rows=document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row)');
  const dayT=new Array(7).fill(0);
  let tc=0,totalLuong=0,totalPC=0,totalHD=0,totalTC=0;
  rows.forEach(tr=>{
    for(let i=0;i<7;i++) dayT[i]+=parseFloat(tr.querySelector(`[data-cc="d${i}"]`)?.value||0)||0;
    const t=parseFloat(tr.querySelector('[data-cc="tc"]')?.textContent||0)||0;
    tc+=t;
    const l=parseInt(tr.querySelector('[data-cc="luong"]')?.dataset?.raw||0)||0;
    const pc=parseInt(tr.querySelector('[data-cc="phucap"]')?.dataset?.raw||0)||0;
    const hd=parseInt(tr.querySelector('[data-cc="hdml"]')?.dataset?.raw||0)||0;
    totalLuong+=t*l; totalPC+=pc; totalHD+=hd;
    totalTC+=t*l+pc+hd;
  });
  let sumRow=document.querySelector('#cc-tbody .cc-sum-row');
  if(!sumRow){ sumRow=document.createElement('tr'); sumRow.className='cc-sum-row'; document.getElementById('cc-tbody').appendChild(sumRow); }
  const mono="font-family:'IBM Plex Mono',monospace;font-weight:700";
  sumRow.innerHTML=`
    <td class="row-num col-num" style="font-size:10px;font-weight:700;color:var(--ink2)">âˆ‘</td>
    <td class="cc-sticky-name col-name" style="padding:7px 10px;font-size:10px;font-weight:700;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px">Tá»”NG</td>
    <td class="col-tp"></td>
    ${dayT.map(v=>`<td class="col-day" style="text-align:center;${mono};font-size:12px;color:var(--ink2);padding:6px 4px">${v||''}</td>`).join('')}
    <td class="col-tc" style="text-align:center;${mono};font-size:14px;color:var(--gold);padding:6px 8px">${tc}</td>
    <td class="col-luong"></td>
    <td class="col-total-luong" style="text-align:right;${mono};font-size:13px;color:var(--green);padding:6px 8px;white-space:nowrap">${totalLuong>0?numFmt(totalLuong):'â€”'}</td>
    <td class="col-phucap" style="text-align:right;${mono};font-size:12px;color:var(--blue);padding:6px 8px;white-space:nowrap">${totalPC>0?numFmt(totalPC):'â€”'}</td>
    <td class="col-hdml" style="text-align:right;${mono};font-size:12px;color:var(--ink2);padding:6px 8px;white-space:nowrap">${totalHD>0?numFmt(totalHD):'â€”'}</td>
    <td class="col-nd"></td>
    <td class="col-total cc-sticky-total" style="text-align:right;${mono};font-size:14px;color:var(--gold);padding:6px 8px;white-space:nowrap;background:#fff8e8">${totalTC>0?numFmt(totalTC):'â€”'}</td>
    <td class="col-del"></td>
  `;
  document.getElementById('cc-sum-tc').textContent=tc;
  document.getElementById('cc-sum-luong').textContent=fmtM(totalLuong);
  document.getElementById('cc-sum-tongcong').textContent=fmtM(totalTC);
}

// â”€â”€â”€ save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helper: upsert an invoice by ccKey (create or update in-place)
function ccUpsertInvoice(ccKey, invData){
  const now = Date.now();
  const idx=invoices.findIndex(i=>i.ccKey===ccKey);
  if(idx>=0){
    invoices[idx] = ensureMeta({ ...invoices[idx], ...invData, updatedAt: now, _ts: now });
  } else {
    invoices.unshift(ensureMeta({
      id: makeStableId({ ccKey }, ['ccKey']),
      ccKey, ...invData,
      createdAt: now,
      updatedAt: now,
      _ts: now
    }));
  }
}
// Helper: remove invoices matching a ccKey prefix
function ccRemoveInvoicesByKeyPrefix(prefix){
  invoices=invoices.filter(i=>!i.ccKey||!i.ccKey.startsWith(prefix));
}

// â”€â”€ Tá»± Ä‘á»™ng táº¡o hÃ³a Ä‘Æ¡n + cáº­p nháº­t danh má»¥c tá»« toÃ n bá»™ ccData â”€â”€â”€â”€â”€â”€â”€
// Gá»i sau khi import/sync Ä‘á»ƒ khÃ´ng cáº§n lÆ°u tá»«ng tuáº§n thá»§ cÃ´ng
function rebuildInvoicesFromCC() {
  // XÃ³a toÃ n bá»™ hÃ³a Ä‘Æ¡n tá»± Ä‘á»™ng tá»« CC cÅ© (cÃ³ ccKey)
  invoices = invoices.filter(i => !i.ccKey);

  let totalWeeks = 0, totalHdml = 0;

  // â”€â”€ Tá»± Ä‘á»™ng thÃªm cÃ´ng trÃ¬nh má»›i vÃ o danh má»¥c â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const newCTs = [...new Set(ccData.map(w => w.ct).filter(Boolean))];
  let addedCTs = 0;
  newCTs.forEach(ct => {
    if (!cats.congTrinh.includes(ct)) {
      cats.congTrinh.push(ct);
      addedCTs++;
    }
  });
  if (addedCTs > 0) {
    cats.congTrinh.sort();
    localStorage.setItem('cat_ct', JSON.stringify(cats.congTrinh));
  }

  // â”€â”€ Tá»± Ä‘á»™ng thÃªm tÃªn cÃ´ng nhÃ¢n vÃ o danh má»¥c NgÆ°á»i TH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allWorkerNames = [...new Set(
    ccData.flatMap(w => (w.workers || []).map(wk => wk.name).filter(Boolean))
  )];
  let addedNames = 0;
  allWorkerNames.forEach(name => {
    if (!cats.nguoiTH.includes(name)) {
      cats.nguoiTH.push(name);
      addedNames++;
    }
  });
  if (addedNames > 0) {
    cats.nguoiTH.sort();
    localStorage.setItem('cat_nguoi', JSON.stringify(cats.nguoiTH));
  }

  // â”€â”€ Tá»± Ä‘á»™ng thÃªm tÃªn TP/NCC tá»« tiá»n á»©ng vÃ o danh má»¥c Tháº§u Phá»¥ â”€â”€â”€â”€
  const allTPs = [...new Set(ungRecords.map(r => r.tp).filter(Boolean))];
  let addedTPs = 0;
  allTPs.forEach(tp => {
    if (!cats.thauPhu.includes(tp)) {
      cats.thauPhu.push(tp);
      addedTPs++;
    }
  });
  if (addedTPs > 0) {
    cats.thauPhu.sort();
    localStorage.setItem('cat_tp', JSON.stringify(cats.thauPhu));
  }

  // â”€â”€ Tá»± Ä‘á»™ng thÃªm tÃªn cÃ´ng nhÃ¢n vÃ o danh má»¥c CÃ´ng NhÃ¢n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  allWorkerNames.forEach(name => {
    if (!cats.congNhan.includes(name)) {
      cats.congNhan.push(name);
    }
  });
  if (cats.congNhan.length > 0) {
    cats.congNhan.sort();
    localStorage.setItem('cat_cn', JSON.stringify(cats.congNhan));
  }

  // â”€â”€ Táº¡o hÃ³a Ä‘Æ¡n tá»« cháº¥m cÃ´ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ccData.forEach(week => {
    const { fromDate, ct, workers } = week;
    if (!fromDate || !ct || !workers || !workers.length) return;
    const weekPrefix = 'cc|' + fromDate + '|' + ct + '|';

    // TÃ­nh toDate tá»« fromDate náº¿u trá»‘ng (fromDate=CN, toDate=T7 = +6 ngÃ y)
    let toDate = week.toDate;
    if (!toDate) {
      try {
        const [y,m,d] = fromDate.split('-').map(Number);
        const sat = new Date(y, m-1, d+6);
        toDate = sat.getFullYear() + '-' +
          String(sat.getMonth()+1).padStart(2,'0') + '-' +
          String(sat.getDate()).padStart(2,'0');
      } catch(e) { toDate = fromDate; }
    }

    // HÄ Mua Láº» â€” 1 HÄ má»—i worker cÃ³ hdmuale > 0
    workers.forEach(wk => {
      if (!wk.hdmuale || wk.hdmuale <= 0) return;
      const key = weekPrefix + wk.name + '|hdml';
      ccUpsertInvoice(key, {
        ngay: toDate, congtrinh: ct, loai: 'HÃ³a ÄÆ¡n Láº»',
        nguoi: wk.name, ncc: '',
        nd: wk.nd || ('HÄ mua láº» â€“ ' + wk.name + ' (' + viShort(fromDate) + 'â€“' + viShort(toDate) + ')'),
        tien: wk.hdmuale, thanhtien: wk.hdmuale
      });
      totalHdml++;
    });

    // HÄ NhÃ¢n CÃ´ng â€” 1 HÄ má»—i tuáº§n+ct
    const totalLuong = workers.reduce((s, wk) => {
      const tc = (wk.d || []).reduce((a, v) => a + (v || 0), 0);
      return s + tc * (wk.luong || 0) + (wk.phucap || 0);
    }, 0);

    if (totalLuong > 0) {
      const ncKey = weekPrefix + 'nhanCong';
      const firstWorker = (workers.find(w => w.name) || { name: '' }).name;
      ccUpsertInvoice(ncKey, {
        ngay: toDate, congtrinh: ct, loai: 'NhÃ¢n CÃ´ng',
        nguoi: firstWorker, ncc: '',
        nd: 'LÆ°Æ¡ng tuáº§n ' + viShort(fromDate) + 'â€“' + viShort(toDate),
        tien: totalLuong, thanhtien: totalLuong
      });
      totalWeeks++;
    }
  });

  save('inv_v3', invoices);
  updateTop();
  return { weeks: totalWeeks, hdml: totalHdml, cts: addedCTs, names: addedNames };
}

function saveCCWeek(){
  const fromDate=document.getElementById('cc-from').value;
  const toDate  =document.getElementById('cc-to').value;
  const ct      =document.getElementById('cc-ct-sel').value;
  if(!fromDate){ toast('Chá»n ngÃ y báº¯t Ä‘áº§u tuáº§n!','error'); return; }
  if(!ct){ toast('Chá»n cÃ´ng trÃ¬nh!','error'); return; }

  // check duplicate names (khÃ´ng phÃ¢n biá»‡t hoa thÆ°á»ng)
  const names=[];
  let dupFound=false;
  document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row) [data-cc="name"]').forEach(el=>{
    const n=el.value.trim();
    const nL=n.toLowerCase();
    if(n&&names.includes(nL)){ dupFound=true; el.style.boxShadow='inset 0 0 0 2px var(--red)'; }
    else if(n) names.push(nL);
  });
  if(dupFound){ toast('âš ï¸ CÃ²n tÃªn trÃ¹ng nhau! Sá»­a trÆ°á»›c khi lÆ°u.','error'); return; }

  const workers=[];
  document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row)').forEach(tr=>{
    const name=tr.querySelector('[data-cc="name"]')?.value?.trim()||'';
    const luong=parseInt(tr.querySelector('[data-cc="luong"]')?.dataset?.raw||0)||0;
    const phucap=parseInt(tr.querySelector('[data-cc="phucap"]')?.dataset?.raw||0)||0;
    const hdmuale=parseInt(tr.querySelector('[data-cc="hdml"]')?.dataset?.raw||0)||0;
    const nd=(tr.querySelector('[data-cc="nd"]')?.value?.trim()||'');
    const role=tr.querySelector('[data-cc="tp"]')?.value||'';
    const d=[];
    for(let i=0;i<7;i++) d.push(parseFloat(tr.querySelector(`[data-cc="d${i}"]`)?.value||0)||0);
    if(name||d.some(v=>v>0)) workers.push({name,luong,d,phucap,hdmuale,nd,role});
  });
  if(!workers.length){ toast('ChÆ°a cÃ³ cÃ´ng nhÃ¢n nÃ o!','error'); return; }

  // Save CC data
  ccData=ccData.filter(w=>!(w.fromDate===fromDate&&w.ct===ct));
  ccData.unshift({
    id: makeStableId({ fromDate, ct }, ['fromDate', 'ct']),
    fromDate, toDate, ct, workers,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  save('cc_v2',ccData);

  // â”€â”€ Tá»± Ä‘á»™ng thÃªm tÃªn má»›i + vai trÃ² vÃ o danh má»¥c CÃ´ng NhÃ¢n â”€â”€â”€â”€â”€â”€â”€
  let cnUpdated=false;
  workers.forEach(wk=>{
    if(!wk.name) return;
    const known=cats.congNhan.find(n=>n.toLowerCase()===wk.name.toLowerCase());
    if(!known){ cats.congNhan.push(wk.name); cnUpdated=true; }
    if(wk.role && !cnRoles[wk.name]){ cnRoles[wk.name]=wk.role; cnUpdated=true; }
  });
  if(cnUpdated){ cats.congNhan.sort(); save('cat_cn',cats.congNhan); save('cat_cn_roles',cnRoles); }

  // â”€â”€ UPSERT HÄ Mua Láº» to invoices (one per worker with hdmuale > 0) â”€â”€
  // First, remove old hdml invoices for workers no longer having hdmuale
  const weekPrefix='cc|'+fromDate+'|'+ct+'|';
  // Remove hdml keys for workers not in current list or with 0 amount
  const activeHdmlKeys=new Set(workers.filter(w=>w.hdmuale>0).map(w=>weekPrefix+w.name+'|hdml'));
  invoices=invoices.filter(i=>{
    if(!i.ccKey||!i.ccKey.startsWith(weekPrefix)) return true;
    if(!i.ccKey.endsWith('|hdml')) return true;
    return activeHdmlKeys.has(i.ccKey);
  });
  let hdCount=0;
  workers.forEach(wk=>{
    if(!wk.hdmuale||wk.hdmuale<=0) return;
    const key=weekPrefix+wk.name+'|hdml';
    ccUpsertInvoice(key,{
      ngay:toDate, congtrinh:ct, loai:'HÃ³a ÄÆ¡n Láº»',
      nguoi:wk.name, ncc:'',
      nd:wk.nd||('HÄ mua láº» â€“ '+wk.name+' ('+viShort(fromDate)+'â€“'+viShort(toDate)+')'),
      tien:wk.hdmuale, thanhtien:wk.hdmuale
    });
    hdCount++;
  });

  // â”€â”€ UPSERT NhÃ¢n CÃ´ng invoice for the whole week â”€â”€
  // One invoice per week+ct, NgÆ°á»i TH = tÃªn cÃ´ng nhÃ¢n Ä‘áº§u tiÃªn
  const ncKey=weekPrefix+'nhanCong';
  const totalLuong=workers.reduce((s,wk)=>{ const tc=wk.d.reduce((a,v)=>a+v,0); return s+tc*wk.luong+(wk.phucap||0); },0);
  const firstWorker=(workers.find(w=>w.name)||{name:''}).name;
  const ndNhanCong='LÆ°Æ¡ng tuáº§n '+viShort(fromDate)+'â€“'+viShort(toDate);
  if(totalLuong>0){
    ccUpsertInvoice(ncKey,{
      ngay:toDate, congtrinh:ct, loai:'NhÃ¢n CÃ´ng',
      nguoi:firstWorker, ncc:'',
      nd:ndNhanCong,
      tien:totalLuong, thanhtien:totalLuong
    });
  } else {
    // if total = 0, remove the NC invoice
    invoices=invoices.filter(i=>i.ccKey!==ncKey);
  }

  save('inv_v3',invoices); updateTop();

  rebuildCCNameList();
  populateCCCtSel();
  // Chá»‰ cáº­p nháº­t dropdown filter, KHÃ”NG render toÃ n bá»™ báº£ng lá»‹ch sá»­
  document.getElementById('cc-hist-week').value = fromDate;
  document.getElementById('cc-tlt-week').value  = fromDate;
  buildCCHistFilters();
  const msg=`âœ… ÄÃ£ lÆ°u ${viShort(fromDate)}â€“${viShort(toDate)} [${ct}]`
    +(hdCount?` Â· ${hdCount} HÄ láº»`:'')
    +(totalLuong>0?' Â· NhÃ¢n cÃ´ng cáº­p nháº­t':'');
  toast(msg,'success');
}

function clearCCWeek(){
  if(!confirm('XÃ³a báº£ng nháº­p tuáº§n nÃ y?')) return;
  buildCCTable([]);
}
let ccClipboard=null;
function copyCCWeek(){
  const workers=[];
  document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row)').forEach(tr=>{
    const name=tr.querySelector('[data-cc="name"]')?.value?.trim()||'';
    const luong=parseInt(tr.querySelector('[data-cc="luong"]')?.dataset?.raw||0)||0;
    const phucap=parseInt(tr.querySelector('[data-cc="phucap"]')?.dataset?.raw||0)||0;
    const hdmuale=parseInt(tr.querySelector('[data-cc="hdml"]')?.dataset?.raw||0)||0;
    const nd=tr.querySelector('[data-cc="nd"]')?.value?.trim()||'';
    const d=[];
    for(let i=0;i<7;i++) d.push(parseFloat(tr.querySelector(`[data-cc="d${i}"]`)?.value||0)||0);
    if(name||luong>0||d.some(v=>v>0)) workers.push({name,luong,d,phucap,hdmuale,nd});
  });
  if(!workers.length){toast('Báº£ng trá»‘ng, chÆ°a cÃ³ gÃ¬ Ä‘á»ƒ copy!','error');return;}
  ccClipboard=workers;
  document.getElementById('cc-paste-btn').style.display='';
  const tc=workers.reduce((s,w)=>s+w.d.reduce((a,v)=>a+v,0),0);
  toast('ðŸ“‹ ÄÃ£ copy '+workers.length+' cÃ´ng nhÃ¢n ('+tc+' cÃ´ng) â€” nháº¥n DÃ¡n Ä‘á»ƒ Ã¡p dá»¥ng!','success');
}
function pasteCCWeek(){
  if(!ccClipboard||!ccClipboard.length){toast('ChÆ°a copy tuáº§n nÃ o!','error');return;}
  // DÃ¡n toÃ n bá»™: tÃªn, lÆ°Æ¡ng, ngÃ y cÃ´ng, phá»¥ cáº¥p, HÄ láº», ná»™i dung
  buildCCTable(ccClipboard.map(w=>({...w})));
  toast('ðŸ“Œ ÄÃ£ dÃ¡n '+ccClipboard.length+' cÃ´ng nhÃ¢n Ä‘áº§y Ä‘á»§ ngÃ y cÃ´ng!','success');
}

// â”€â”€â”€ CT selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function populateCCCtSel(){
  // Láº¥y táº¥t cáº£ CT tá»« danh má»¥c + ccData
  const allCts = [...new Set([...cats.congTrinh, ...ccData.map(w=>w.ct)].filter(Boolean))].sort();
  // Lá»c theo nÄƒm: Æ°u tiÃªn year field, fallback check dá»¯ liá»‡u phÃ¡t sinh
  const filtered = allCts.filter(ct => _ctInActiveYear(ct));
  const sel = document.getElementById('cc-ct-sel');
  const cur = sel.value;
  sel.innerHTML = '<option value="">-- Chá»n cÃ´ng trÃ¬nh --</option>' +
    filtered.map(v => `<option value="${x(v)}" ${v===cur?'selected':''}>${x(v)}</option>`).join('');
}

function onCCCtSelChange(){
  loadCCWeekForm();
}

// â”€â”€â”€ history (per week) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildCCHistFilters(){
  const yearCC=ccData.filter(w=>inActiveYear(w.fromDate));
  const allCts=[...new Set(yearCC.map(w=>w.ct).filter(Boolean))].sort();
  // weeks list â€” chá»‰ nÄƒm Ä‘ang chá»n
  const allWeeks=[...new Set(yearCC.map(w=>w.fromDate))].sort().reverse();

  const ctSel=document.getElementById('cc-hist-ct'); const cv=ctSel.value;
  ctSel.innerHTML='<option value="">Táº¥t cáº£ CT</option>'+allCts.map(c=>`<option ${c===cv?'selected':''} value="${x(c)}">${x(c)}</option>`).join('');

  const wkSel=document.getElementById('cc-hist-week'); const wv=wkSel.value;
  wkSel.innerHTML='<option value="">Táº¥t cáº£ tuáº§n</option>'+allWeeks.map(w=>`<option ${w===wv?'selected':''} value="${w}">${weekLabel(w)}</option>`).join('');

  // also update TLT week filter
  const tltSel=document.getElementById('cc-tlt-week'); const tv=tltSel.value;
  tltSel.innerHTML='<option value="">Táº¥t cáº£ tuáº§n</option>'+allWeeks.map(w=>`<option ${w===tv?'selected':''} value="${w}">${weekLabel(w)}</option>`).join('');

  // Cáº­p nháº­t dropdown CT cho TLT
  const tltCtSel=document.getElementById('cc-tlt-ct');
  if(tltCtSel){ const tcv=tltCtSel.value;
    tltCtSel.innerHTML='<option value="">Táº¥t cáº£ CT</option>'+allCts.map(ct=>`<option ${ct===tcv?'selected':''} value="${x(ct)}">${x(ct)}</option>`).join('');
  }
}

function renderCCHistory(){
  buildCCHistFilters();
  const fCt=document.getElementById('cc-hist-ct').value;
  const fWk=document.getElementById('cc-hist-week').value;
  const fQ=(document.getElementById('cc-hist-search')?.value||'').toLowerCase().trim();

  const map={};
  ccData.forEach(w=>{
    if(!inActiveYear(w.fromDate)) return;  // lá»c nÄƒm
    if(fCt&&w.ct!==fCt) return;
    if(fWk&&w.fromDate!==fWk) return;
    const gKey=w.fromDate+'|'+w.ct;
    if(!map[gKey]){
      map[gKey]={
        fromDate:w.fromDate,
        toDate:w.toDate,
        ct:w.ct,
        d:[0,0,0,0,0,0,0],
        tc:0, tl:0, pc:0, hd:0, tongcong:0,
        luongList:[],
        names:[],
        ndList:[]
      };
    }
    w.workers.forEach(wk=>{
      const tc=wk.d.reduce((s,v)=>s+v,0);
      const luong=Number(wk.luong)||0;
      const tl=tc*luong;
      const pc=wk.phucap||0;
      const hd=wk.hdmuale||0;
      wk.d.forEach((v,i)=>{ map[gKey].d[i]+=Number(v)||0; });
      map[gKey].tc+=tc;
      map[gKey].tl+=tl;
      map[gKey].pc+=pc;
      map[gKey].hd+=hd;
      if(luong>0) map[gKey].luongList.push(luong);
      if(wk.name) map[gKey].names.push(wk.name);
      if(wk.nd) map[gKey].ndList.push(wk.nd);
    });
    map[gKey].tongcong=map[gKey].tl+map[gKey].pc+map[gKey].hd;
  });
  let rows=Object.values(map).map(r=>{
    const avgLuong=r.luongList.length
      ? Math.round(r.luongList.reduce((s,v)=>s+v,0)/r.luongList.length)
      : 0;
    const nd=[...new Set(r.ndList.map(v=>(v||'').trim()).filter(Boolean))].join(' | ');
    const workers=[...new Set(r.names.map(v=>(v||'').trim()).filter(Boolean))];
    return {...r, avgLuong, nd, workers};
  });
  if(fQ){
    rows=rows.filter(r=>
      (r.ct||'').toLowerCase().includes(fQ) ||
      r.workers.some(n=>n.toLowerCase().includes(fQ))
    );
  }
  rows.sort((a,b)=>b.fromDate.localeCompare(a.fromDate)||a.ct.localeCompare(b.ct,'vi'));

  const tbody=document.getElementById('cc-hist-tbody');
  const totalTL=rows.reduce((s,r)=>s+r.tl,0);
  const totalTC2=rows.reduce((s,r)=>s+r.tongcong,0);

  if(!rows.length){
    tbody.innerHTML=`<tr class="empty-row"><td colspan="17">ChÆ°a cÃ³ dá»¯ liá»‡u cháº¥m cÃ´ng</td></tr>`;
    document.getElementById('cc-hist-pagination').innerHTML=''; return;
  }

  const start=(ccHistPage-1)*CC_PG_HIST;
  const paged=rows.slice(start,start+CC_PG_HIST);

  tbody.innerHTML=paged.map(r=>`<tr>
    <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink2);white-space:nowrap">${viShort(r.fromDate)}<br><span style="color:var(--ink3)">${viShort(r.toDate)}</span></td>
    <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(r.ct||'â€”')}</td>
    ${r.d.map(v=>`<td style="text-align:center;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:12px;${v===1?'color:var(--green)':v>0?'color:var(--blue)':'color:var(--line2)'}">${v||'Â·'}</td>`).join('')}
    <td style="text-align:center;font-family:'IBM Plex Mono',monospace;font-weight:700;color:var(--gold)">${r.tc}</td>
    <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink2)">${r.avgLuong?numFmt(r.avgLuong):'â€”'}</td>
    <td class="amount-td">${r.tl?numFmt(r.tl):'â€”'}</td>
    <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--blue)">${r.pc?numFmt(r.pc):'â€”'}</td>
    <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--ink2)">${r.hd?numFmt(r.hd):'â€”'}</td>
    <td style="color:var(--ink2);font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(r.nd||'â€”')}</td>
    <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:13px;color:var(--gold)">${r.tongcong?numFmt(r.tongcong):'â€”'}</td>
    <td>
      <button class="btn btn-outline btn-sm btn-icon" onclick="loadCCWeekFromHistory('${r.fromDate}','${x(r.ct)}')" title="Táº£i tuáº§n nÃ y">â†©</button>
      <button class="btn btn-danger btn-sm btn-icon" onclick="delCCWeekHistory('${r.fromDate}','${x(r.ct)}')" title="XÃ³a tuáº§n">âœ•</button>
    </td>
  </tr>`).join('');

  const tp=Math.ceil(rows.length/CC_PG_HIST);
  let pag=`<span>${rows.length} dÃ²ng Â· Tá»•ng lÆ°Æ¡ng: <strong style="color:var(--green);font-family:'IBM Plex Mono',monospace">${fmtS(totalTL)}</strong> Â· Tá»•ng cá»™ng: <strong style="color:var(--gold);font-family:'IBM Plex Mono',monospace">${fmtS(totalTC2)}</strong></span>`;
  if(tp>1){
    pag+='<div class="page-btns">';
    for(let p=1;p<=Math.min(tp,10);p++) pag+=`<button class="page-btn ${p===ccHistPage?'active':''}" onclick="ccHistGoTo(${p})">${p}</button>`;
    if(tp>10) pag+=`<span style="padding:4px 6px;color:var(--ink3)">...${tp}</span>`;
    pag+='</div>';
  }
  document.getElementById('cc-hist-pagination').innerHTML=pag;
  renderCCTLT();
}

function ccHistGoTo(p){ ccHistPage=p; renderCCHistory(); }

// â”€â”€â”€ Tá»•ng LÆ°Æ¡ng Tuáº§n (grouped by name per week) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCCTLT(){
  buildCCHistFilters();
  const fWk=document.getElementById('cc-tlt-week').value;
  const fCt2=document.getElementById('cc-tlt-ct')?.value||'';

  // Group by name only khi "táº¥t cáº£ tuáº§n", hoáº·c (tuáº§n+name) khi lá»c tuáº§n cá»¥ thá»ƒ
  const map={};
  ccData.forEach(w=>{
    if(!inActiveYear(w.fromDate)) return;
    if(fCt2&&w.ct!==fCt2) return;
    if(fWk&&w.fromDate!==fWk) return;
    w.workers.forEach(wk=>{
      const key = fWk ? w.fromDate+'|'+wk.name : wk.name;
      if(!map[key]) map[key]={fromDate:w.fromDate,toDate:w.toDate,name:wk.name,
        d:[0,0,0,0,0,0,0],tc:0,tl:0,pc:0,hdml:0,cts:[],luongList:[]};
      wk.d.forEach((v,i)=>{ map[key].d[i]+=v; });
      const tc=wk.d.reduce((s,v)=>s+v,0);
      map[key].tc+=tc;
      map[key].tl+=tc*(wk.luong||0);
      map[key].pc+=(wk.phucap||0);
      map[key].hdml+=(wk.hdmuale||0);
      if(!map[key].cts.includes(w.ct)) map[key].cts.push(w.ct);
      map[key].luongList.push(wk.luong||0);
      if(!fWk){ if(w.fromDate<map[key].fromDate) map[key].fromDate=w.fromDate;
                if(w.toDate>map[key].toDate) map[key].toDate=w.toDate; }
    });
  });

  const rows=Object.values(map).sort((a,b)=>
    fWk ? b.fromDate.localeCompare(a.fromDate)||a.name.localeCompare(b.name,'vi')
        : a.name.localeCompare(b.name,'vi'));

  const tbody=document.getElementById('cc-tlt-tbody');
  const tableWrap=document.getElementById('cc-tlt-table-wrap');
  const cardsEl=document.getElementById('cc-tlt-cards');
  const isMobile=window.innerWidth<768;

  if(!rows.length){
    if(isMobile){ tableWrap.style.display='none'; cardsEl.style.display='block'; cardsEl.innerHTML='<p style="text-align:center;color:var(--ink3);padding:20px">ChÆ°a cÃ³ dá»¯ liá»‡u</p>'; }
    else{ tableWrap.style.display=''; cardsEl.style.display='none'; tbody.innerHTML=`<tr class="empty-row"><td colspan="14">ChÆ°a cÃ³ dá»¯ liá»‡u</td></tr>`; }
    document.getElementById('cc-tlt-pagination').innerHTML=''; return;
  }

  const grandTCLuong=rows.reduce((s,r)=>s+r.tl+r.pc+r.hdml,0);
  const start=(ccTltPage-1)*CC_PG_TLT;
  const paged=rows.slice(start,start+CC_PG_TLT);
  const mono="font-family:'IBM Plex Mono',monospace";
  const DAY_LABELS=['CN','T2','T3','T4','T5','T6','T7'];

  if(isMobile){
    // â”€â”€ Mobile: card view â”€â”€
    tableWrap.style.display='none';
    cardsEl.style.display='block';
    cardsEl.innerHTML=paged.map(r=>{
      const tcLuong=r.tl+r.pc+r.hdml;
      const daysHtml=r.d.map((v,i)=>v>0?`<span class="tlt-day-badge${v>=1?' tlt-day-full':' tlt-day-half'}">${DAY_LABELS[i]}: ${v}</span>`:'').filter(Boolean).join('');
      const ctsHtml=r.cts.length?`<div class="tlt-card-cts">${r.cts.map(c=>x(c)).join(' Â· ')}</div>`:'';
      const periodHtml=fWk?`${viShort(r.fromDate)} â€“ ${viShort(r.toDate)}`:'Tá»•ng nhiá»u tuáº§n';
      return `<div class="tlt-card"
        data-name="${x(r.name)}" data-from="${r.fromDate}" data-to="${r.toDate}"
        data-tc="${r.tc}" data-tl="${r.tl}" data-pc="${r.pc}" data-hdml="${r.hdml}"
        data-cts="${r.cts.join('|')}">
        <div class="tlt-card-header">
          <label class="tlt-card-label">
            <input type="checkbox" class="cc-tlt-chk">
            <span class="tlt-card-name">${x(r.name||'â€”')}</span>
          </label>
          <span class="tlt-card-amount">${tcLuong?numFmt(tcLuong)+' Ä‘':'â€”'}</span>
        </div>
        <div class="tlt-card-meta">${periodHtml} &nbsp;Â·&nbsp; <strong>${r.tc}</strong> cÃ´ng</div>
        ${daysHtml?`<div class="tlt-card-days">${daysHtml}</div>`:''}
        ${ctsHtml}
      </div>`;
    }).join('');
  } else {
    // â”€â”€ Desktop: table view â”€â”€
    tableWrap.style.display='';
    cardsEl.style.display='none';
    tbody.innerHTML=paged.map(r=>{
      const tcLuong=r.tl+r.pc+r.hdml;
      const luongTB=r.tc>0?Math.round(r.tl/r.tc):0;
      return `<tr
        data-name="${x(r.name)}" data-from="${r.fromDate}" data-to="${r.toDate}"
        data-tc="${r.tc}" data-tl="${r.tl}" data-pc="${r.pc}" data-hdml="${r.hdml}"
        data-cts="${r.cts.join('|')}">
        <td style="text-align:center;padding:4px"><input type="checkbox" class="cc-tlt-chk" style="width:15px;height:15px;cursor:pointer"></td>
        <td style="${mono};font-size:10px;color:var(--ink2);white-space:nowrap">${fWk?viShort(r.fromDate):'Tá»•ng'}<br><span style="color:var(--ink3)">${fWk?viShort(r.toDate):r.tc+' cÃ´ng'}</span></td>
        <td style="font-weight:700;font-size:13px">${x(r.name||'â€”')}</td>
        ${r.d.map(v=>`<td style="text-align:center;${mono};font-weight:600;font-size:12px;${v===1?'color:var(--green)':v>0?'color:var(--blue)':'color:var(--line2)'}">${v||'Â·'}</td>`).join('')}
        <td style="text-align:center;${mono};font-weight:700;color:var(--gold)">${r.tc}</td>
        <td style="text-align:right;${mono};font-weight:700;font-size:13px;color:var(--green)">${tcLuong?numFmt(tcLuong):'â€”'}</td>
        <td style="text-align:right;${mono};font-size:12px;color:var(--ink2)">${luongTB?numFmt(luongTB):'â€”'}</td>
        <td style="font-size:11px;color:var(--ink2);max-width:200px">${r.cts.map(c=>x(c)).join('<br>')}</td>
      </tr>`;
    }).join('');
  }

  const tp=Math.ceil(rows.length/CC_PG_TLT);
  let pag=`<span>${rows.length} cÃ´ng nhÃ¢n Â· Tá»•ng TC LÆ°Æ¡ng: <strong style="color:var(--green);${mono}">${fmtS(grandTCLuong)}</strong></span>`;
  if(tp>1){
    pag+='<div class="page-btns">';
    for(let p=1;p<=Math.min(tp,10);p++) pag+=`<button class="page-btn ${p===ccTltPage?'active':''}" onclick="ccTltGoTo(${p})">${p}</button>`;
    pag+='</div>';
  }
  document.getElementById('cc-tlt-pagination').innerHTML=pag;
}

function exportCCTLTCSV(){
  const fWk=document.getElementById('cc-tlt-week').value;
  const fCt2=document.getElementById('cc-tlt-ct')?.value||'';
  const map={};
  ccData.forEach(w=>{
    if(!inActiveYear(w.fromDate)) return;
    if(fCt2&&w.ct!==fCt2) return;
    if(fWk&&w.fromDate!==fWk) return;
    w.workers.forEach(wk=>{
      const key=w.fromDate+'|'+wk.name;
      if(!map[key]) map[key]={fromDate:w.fromDate,toDate:w.toDate,name:wk.name,
        d:[0,0,0,0,0,0,0],tc:0,tl:0,pc:0,cts:[]};
      wk.d.forEach((v,i)=>{ map[key].d[i]+=v; });
      const tc=wk.d.reduce((s,v)=>s+v,0);
      map[key].tc+=tc; map[key].tl+=tc*(wk.luong||0);
      map[key].pc+=(wk.phucap||0); map[key].cts.push(w.ct);
    });
  });
  const rows=[['Tuáº§n','TÃªn CN','CN','T2','T3','T4','T5','T6','T7','TC','TC LÆ°Æ¡ng','LÆ°Æ¡ng TB/NgÃ y','CÃ´ng TrÃ¬nh']];
  Object.values(map).sort((a,b)=>b.fromDate.localeCompare(a.fromDate)||a.name.localeCompare(b.name)).forEach(r=>{
    const tcL=r.tl+r.pc;
    const ltb=r.tc>0?Math.round(tcL/r.tc):0;
    rows.push([viShort(r.fromDate)+'â€“'+viShort(r.toDate),r.name,...r.d,r.tc,tcL,ltb,r.cts.join(', ')]);
  });
  dlCSV(rows,'tong_luong_tuan_'+today()+'.csv');
}

function ccTltGoTo(p){ ccTltPage=p; renderCCTLT(); }

function loadCCWeekFromHistory(fromDate,ct){
  const thisSun=ccSundayISO(0);
  const [ty,tm,td]=thisSun.split('-').map(Number);
  const [fy,fm,fd]=fromDate.split('-').map(Number);
  const diffMs=new Date(fy,fm-1,fd)-new Date(ty,tm-1,td);
  ccOffset=Math.round(diffMs/(7*86400000));
  const satISO=ccSaturdayISO(fromDate);
  document.getElementById('cc-from').value=fromDate;
  document.getElementById('cc-to').value=satISO;
  document.getElementById('cc-week-label').textContent='Tuáº§n: '+weekLabel(fromDate);
  document.getElementById('cc-ct-sel').value=ct;
  const rec=ccData.find(w=>w.fromDate===fromDate&&w.ct===ct);
  buildCCTable(rec?rec.workers:[]);
  window.scrollTo({top:0,behavior:'smooth'});
  toast('ÄÃ£ táº£i tuáº§n '+viShort(fromDate)+' â€“ '+ct);
}

function delCCWorker(wid,name){
  if(!confirm(`XÃ³a "${name}" khá»i tuáº§n nÃ y?`)) return;
  const w=ccData.find(r=>r.id===wid);
  if(w){ w.workers=w.workers.filter(wk=>wk.name!==name); if(!w.workers.length) ccData=ccData.filter(r=>r.id!==wid); }
  save('cc_v2',ccData); renderCCHistory(); toast('ÄÃ£ xÃ³a');
}

function delCCWeekHistory(fromDate,ct){
  if(!confirm(`XÃ³a toÃ n bá»™ cháº¥m cÃ´ng tuáº§n ${viShort(fromDate)} cá»§a cÃ´ng trÃ¬nh "${ct}"?`)) return;
  const before=ccData.length;
  ccData=ccData.filter(r=>!(r.fromDate===fromDate&&r.ct===ct));
  if(ccData.length===before){ toast('KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u Ä‘á»ƒ xÃ³a','error'); return; }
  save('cc_v2',ccData);
  renderCCHistory();
  toast('ÄÃ£ xÃ³a tuáº§n cháº¥m cÃ´ng');
}

// â”€â”€â”€ export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function exportCCWeekCSV(){
  const f=document.getElementById('cc-from').value;
  const ct=document.getElementById('cc-ct-sel').value||'?';
  const rows=[['CT','Tá»«','Äáº¿n','TÃªn','CN','T2','T3','T4','T5','T6','T7','TC','LÆ°Æ¡ng/N','Tá»•ng LÆ°Æ¡ng','Phá»¥ Cáº¥p','HÄ Mua Láº»','Ná»™i Dung','Tá»•ng Cá»™ng']];
  document.querySelectorAll('#cc-tbody tr:not(.cc-sum-row)').forEach(tr=>{
    const name=tr.querySelector('[data-cc="name"]')?.value?.trim()||'';
    if(!name) return;
    const d=[]; for(let i=0;i<7;i++) d.push(parseFloat(tr.querySelector(`[data-cc="d${i}"]`)?.value||0)||0);
    const tc=d.reduce((s,v)=>s+v,0);
    const l=parseInt(tr.querySelector('[data-cc="luong"]')?.dataset?.raw||0)||0;
    const pc=parseInt(tr.querySelector('[data-cc="phucap"]')?.dataset?.raw||0)||0;
    const hd=parseInt(tr.querySelector('[data-cc="hdml"]')?.dataset?.raw||0)||0;
    const nd=tr.querySelector('[data-cc="nd"]')?.value?.trim()||'';
    rows.push([ct,f,document.getElementById('cc-to').value,name,...d,tc,l,tc*l,pc,hd,nd,tc*l+pc+hd]);
  });
  dlCSV(rows,'chamcong_'+f+'.csv');
}

function exportCCHistCSV(){
  // Xuáº¥t Ä‘Ãºng dá»¯ liá»‡u Ä‘ang lá»c trong báº£ng Lá»‹ch Sá»­ Cháº¥m CÃ´ng Tuáº§n
  const fCt=document.getElementById('cc-hist-ct').value;
  const fWk=document.getElementById('cc-hist-week').value;
  const fQ=(document.getElementById('cc-hist-search')?.value||'').toLowerCase().trim();
  const rows=[['CT','Tá»«','Äáº¿n','CN','T2','T3','T4','T5','T6','T7','TC','LÆ°Æ¡ng/NgÃ y TB','Tá»•ng LÆ°Æ¡ng','Phá»¥ Cáº¥p','HÄ Mua Láº»','Ná»™i Dung','Tá»•ng Cá»™ng']];
  const map={};
  ccData.forEach(w=>{
    if(fCt&&w.ct!==fCt) return;
    if(fWk&&w.fromDate!==fWk) return;
    const key=w.fromDate+'|'+w.ct;
    if(!map[key]) map[key]={
      fromDate:w.fromDate,toDate:w.toDate,ct:w.ct,
      d:[0,0,0,0,0,0,0],tc:0,tl:0,pc:0,hd:0,luongList:[],names:[],ndList:[]
    };
    w.workers.forEach(wk=>{
      const tc=wk.d.reduce((s,v)=>s+v,0);
      const luong=Number(wk.luong)||0;
      wk.d.forEach((v,i)=>{ map[key].d[i]+=Number(v)||0; });
      map[key].tc+=tc;
      map[key].tl+=tc*luong;
      map[key].pc+=(wk.phucap||0);
      map[key].hd+=(wk.hdmuale||0);
      if(luong>0) map[key].luongList.push(luong);
      if(wk.name) map[key].names.push(wk.name);
      if(wk.nd) map[key].ndList.push(wk.nd);
    });
  });
  Object.values(map)
    .map(r=>{
      const avgLuong=r.luongList.length?Math.round(r.luongList.reduce((s,v)=>s+v,0)/r.luongList.length):0;
      const workers=[...new Set(r.names.map(v=>(v||'').trim()).filter(Boolean))];
      const nd=[...new Set(r.ndList.map(v=>(v||'').trim()).filter(Boolean))].join(' | ');
      return {...r,avgLuong,workers,nd,tong:r.tl+r.pc+r.hd};
    })
    .filter(r=>!fQ||(r.ct||'').toLowerCase().includes(fQ)||r.workers.some(n=>n.toLowerCase().includes(fQ)))
    .sort((a,b)=>b.fromDate.localeCompare(a.fromDate)||a.ct.localeCompare(b.ct,'vi'))
    .forEach(r=>{
      rows.push([r.ct,viShort(r.fromDate)+'â€“'+viShort(r.toDate),r.toDate,...r.d,r.tc,r.avgLuong,r.tl,r.pc,r.hd,r.nd,r.tong]);
    });
  const label=fWk?viShort(fWk):'all';
  dlCSV(rows,'lich_su_cham_cong_'+label+'_'+today()+'.csv');
}

// [MODULE: PHIáº¾U LÆ¯Æ NG] â€” xuatPhieuLuong Â· html2canvas
// Ctrl+F â†’ "MODULE: PHIáº¾U LÆ¯Æ NG"
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // xÃ³a dáº¥u
    .replace(/Ä‘/g, 'd').replace(/Ä/g, 'D')
    .replace(/[^a-zA-Z0-9\s_]/g, '')    // xÃ³a kÃ½ tá»± Ä‘áº·c biá»‡t
    .trim()
    .replace(/\s+/g, '_');
}

function xuatPhieuLuong() {
  // 1. Thu tháº­p cÃ´ng nhÃ¢n Ä‘Æ°á»£c tick tá»« báº£ng Tá»•ng LÆ°Æ¡ng Tuáº§n
  //    Há»— trá»£ cáº£ table row (desktop) vÃ  card div (mobile)
  const rows = [];
  document.querySelectorAll('.cc-tlt-chk:checked').forEach(chk => {
    const container = chk.closest('[data-name]');
    if (!container) return;
    const name     = container.dataset.name || '(ChÆ°a Ä‘áº·t tÃªn)';
    const fromDate = container.dataset.from  || '';
    const toDate   = container.dataset.to    || '';
    const tc       = parseFloat(container.dataset.tc)   || 0;
    const tl       = parseInt(container.dataset.tl)     || 0; // tc * luong
    const pc       = parseInt(container.dataset.pc)     || 0; // phá»¥ cáº¥p
    const hdml     = parseInt(container.dataset.hdml)   || 0; // HÄ mua láº»
    const cts      = (container.dataset.cts || '').split('|').filter(Boolean);
    const tongCong = tl + pc + hdml;
    const luongTB  = tc > 0 ? Math.round(tl / tc) : 0;
    rows.push({ name, fromDate, toDate, tc, tl, pc, hdml, cts, tongCong, luongTB });
  });

  if (!rows.length) {
    toast('âš ï¸ Tick chá»n Ã­t nháº¥t 1 cÃ´ng nhÃ¢n trong báº£ng Tá»•ng LÆ°Æ¡ng Tuáº§n!', 'error');
    return;
  }

  // 2. Tá»•ng há»£p thÃ´ng tin chung
  const allFrom = rows.map(r => r.fromDate).filter(Boolean).sort();
  const allTo   = rows.map(r => r.toDate).filter(Boolean).sort();
  const fromDt  = allFrom[0] || '';
  const toDt    = allTo[allTo.length - 1] || '';
  const period  = fromDt && toDt ? _fmtDate(fromDt) + ' â€” ' + _fmtDate(toDt) : '(ChÆ°a rÃµ)';

  const allCts     = [...new Set(rows.flatMap(r => r.cts))];
  const ctLabel    = allCts.join(', ') || '(Nhiá»u cÃ´ng trÃ¬nh)';
  const today_     = new Date().toLocaleDateString('vi-VN');
  const tongThanhToan = rows.reduce((s, r) => s + r.tongCong, 0);

  // 3. Äá»• dá»¯ liá»‡u vÃ o template
  document.getElementById('pl-ct-name').textContent = ctLabel;
  document.getElementById('pl-ct-label').textContent = ctLabel;
  document.getElementById('pl-period').textContent   = period;
  document.getElementById('pl-date').textContent     = today_;

  document.getElementById('pl-tbody').innerHTML = rows.map(r => `
    <tr>
      <td>${x(r.name)}</td>
      <td>${r.tc}</td>
      <td>${r.luongTB ? numFmt(r.luongTB) + ' Ä‘' : 'â€”'}</td>
      <td>${r.pc ? numFmt(r.pc) + ' Ä‘' : 'â€”'}</td>
      <td style="color:#c0392b">${r.hdml ? numFmt(r.hdml) + ' Ä‘' : 'â€”'}</td>
      <td style="font-weight:700;color:#c8870a">${numFmt(r.tongCong)} Ä‘</td>
    </tr>`).join('');

  document.getElementById('pl-total-cell').textContent  = numFmt(tongThanhToan) + ' Ä‘';
  document.getElementById('pl-grand-total').textContent =
    'Tá»”NG TIá»€N THANH TOÃN: ' + numFmt(tongThanhToan) + ' Ä‘á»“ng';

  // 4. Hiá»‡n template táº¡m Ä‘á»ƒ chá»¥p
  const tpl = document.getElementById('phieu-luong-template');
  tpl.style.display = 'block';

  // 5. Chá»¥p báº±ng html2canvas
  const _now = new Date();
  const _dd = String(_now.getDate()).padStart(2, '0');
  const _mm = String(_now.getMonth() + 1).padStart(2, '0');
  const _yy = String(_now.getFullYear()).slice(-2);
  const _datePart = _dd + _mm + _yy;
  const _wParts = rows.map(r =>
    removeVietnameseTones(r.name) + '_' + r.tc + 'c'
  ).join('_');
  const _ctList = allCts.slice(0, 3).map(ct => removeVietnameseTones(ct).slice(0, 3));
  const _ctPart = _ctList.join('_') + (allCts.length > 3 ? '_etc' : '');
  const fileName = 'Phieuluong_' + _datePart + '_' + _wParts + (_ctPart ? '_' + _ctPart : '');
  toast('â³ Äang táº¡o phiáº¿u lÆ°Æ¡ng...', 'info');

  document.fonts.ready.then(() => {
    html2canvas(tpl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 760
    }).then(canvas => {
      tpl.style.display = 'none';
      const link = document.createElement('a');
      link.download = fileName + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('âœ… ÄÃ£ xuáº¥t phiáº¿u lÆ°Æ¡ng ' + rows.length + ' ngÆ°á»i!', 'success');
    }).catch(err => {
      tpl.style.display = 'none';
      console.error('html2canvas error:', err);
      toast('âŒ Lá»—i khi táº¡o áº£nh: ' + err.message, 'error');
    });
  });
}

// Helper: format ngÃ y YYYY-MM-DD â†’ DD/MM/YYYY
function exportUngToImage() {
  // 1. Láº¥y cÃ¡c dÃ²ng Ä‘Æ°á»£c tick (dá»±a vÃ o data-id khá»›p filteredUng)
  const checkedIds = new Set(
    [...document.querySelectorAll('.ung-row-chk:checked')].map(el => el.dataset.id)
  );
  if (!checkedIds.size) {
    toast('âš ï¸ Vui lÃ²ng tick chá»n Ã­t nháº¥t 1 khoáº£n á»©ng!', 'error');
    return;
  }
  const rows = filteredUng.filter(r => checkedIds.has(String(r.id)));
  if (!rows.length) {
    toast('âš ï¸ KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u â€” thá»­ lá»c láº¡i rá»“i tick chá»n!', 'error');
    return;
  }

  // 2. ThÃ´ng tin chung
  const ct       = rows[0]?.congtrinh || '(ChÆ°a rÃµ CT)';
  const tongTien = rows.reduce((s, r) => s + (r.tien || 0), 0);

  // 3. Äá»• dá»¯ liá»‡u vÃ o template
  document.getElementById('pul-ct-name').textContent  = ct;
  document.getElementById('pul-ct-label').textContent = ct;
  document.getElementById('pul-date').textContent     = new Date().toLocaleDateString('vi-VN');

  document.getElementById('pul-tbody').innerHTML = rows.map((r, i) => `
    <tr style="${i % 2 === 1 ? 'background:#f9f7f4' : ''}">
      <td style="padding:8px 10px;white-space:nowrap">${r.ngay}</td>
      <td style="padding:8px 10px;font-weight:600">${x(r.tp || 'â€”')}</td>
      <td style="padding:8px 10px;color:#555">${x(r.nd || 'â€”')}</td>
      <td style="padding:8px 10px;text-align:right;font-weight:700;color:#c8870a;white-space:nowrap">
        ${numFmt(r.tien || 0)} Ä‘
      </td>
    </tr>`).join('');

  document.getElementById('pul-total-cell').textContent   = numFmt(tongTien) + ' Ä‘';
  document.getElementById('pul-grand-total').textContent  =
    'Tá»”NG TIá»€N Táº M á»¨NG: ' + numFmt(tongTien) + ' Ä‘á»“ng';

  // 4. Táº¡o tÃªn file:  Phieuung_TenCT_TenTP1_500k_TenTP2_300k.png
  const safeCT = removeVietnameseTones(ct);
  const tpMap  = {};
  rows.forEach(r => {
    const key = r.tp || 'KhongRo';
    tpMap[key] = (tpMap[key] || 0) + (r.tien || 0);
  });
  const workerParts = Object.entries(tpMap)
    .map(([tp, tien]) => removeVietnameseTones(tp) + '_' + Math.round(tien / 1000) + 'k')
    .join('_');
  const fileName = 'Phieuung_' + safeCT + '_' + workerParts;

  // 5. Chá»¥p áº£nh
  const tpl = document.getElementById('phieu-ung-template');
  tpl.style.display = 'block';
  toast('â³ Äang táº¡o phiáº¿u táº¡m á»©ng...', 'info');

  document.fonts.ready.then(() => {
    html2canvas(tpl, {
      scale: 2, backgroundColor: '#ffffff',
      useCORS: true, logging: false, windowWidth: 760
    }).then(canvas => {
      tpl.style.display = 'none';
      const link = document.createElement('a');
      link.download = fileName + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('âœ… ÄÃ£ xuáº¥t phiáº¿u táº¡m á»©ng ' + rows.length + ' dÃ²ng!', 'success');
    }).catch(err => {
      tpl.style.display = 'none';
      toast('âŒ Lá»—i khi táº¡o áº£nh: ' + err.message, 'error');
    });
  });
}

function _fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}


