// Renders data.json into an adaptive table and wires up export/clear buttons.

const elMetaSource = document.getElementById('meta-source');
const elMetaRows = document.getElementById('meta-rows');
const elMetaTime = document.getElementById('meta-time');
const elEmpty = document.getElementById('empty-state');
const elTableWrap = document.getElementById('table-wrap');
const elThead = document.querySelector('#data-table thead');
const elTbody = document.querySelector('#data-table tbody');
const btnXlsx = document.getElementById('btn-xlsx');
const btnCsv = document.getElementById('btn-csv');
const btnClear = document.getElementById('btn-clear');

let currentData = { source: '', scraped_at: '', rows: [] };

async function loadData() {
  try {
    // Cache-bust so Vercel redeploys always show fresh JSON
    const res = await fetch('data.json?t=' + Date.now());
    if (!res.ok) throw new Error('no data.json');
    currentData = await res.json();
  } catch (e) {
    currentData = { source: '', scraped_at: '', rows: [] };
  }
  render();
}

function render() {
  const rows = Array.isArray(currentData.rows) ? currentData.rows : [];
  elMetaSource.textContent = currentData.source || 'No scrape loaded';
  elMetaSource.title = currentData.source || '';
  elMetaRows.textContent = rows.length + (rows.length === 1 ? ' row' : ' rows');
  elMetaTime.textContent = currentData.scraped_at
    ? formatTime(currentData.scraped_at)
    : '—';

  const hasRows = rows.length > 0;
  elEmpty.hidden = hasRows;
  elTableWrap.hidden = !hasRows;
  btnXlsx.disabled = !hasRows;
  btnCsv.disabled = !hasRows;
  btnClear.disabled = !hasRows;

  if (!hasRows) {
    elThead.innerHTML = '';
    elTbody.innerHTML = '';
    return;
  }

  // Collect the union of all keys across rows so the table stays consistent
  // even when rows have slightly different shapes.
  const keys = [];
  const seen = new Set();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }

  elThead.innerHTML =
    '<tr>' + keys.map(k => '<th>' + escapeHtml(k) + '</th>').join('') + '</tr>';

  elTbody.innerHTML = rows
    .map(row => {
      return (
        '<tr>' +
        keys
          .map(k => {
            const v = row[k];
            return '<td>' + formatCell(v) + '</td>';
          })
          .join('') +
        '</tr>'
      );
    })
    .join('');
}

function formatCell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Auto-linkify URLs
  if (/^https?:\/\//i.test(s)) {
    return '<a href="' + escapeAttr(s) + '" target="_blank" rel="noopener">' + escapeHtml(s) + '</a>';
  }
  return escapeHtml(s);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

// --- Exports ---

btnXlsx.addEventListener('click', () => {
  const rows = currentData.rows || [];
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scrape');
  XLSX.writeFile(wb, buildFilename('xlsx'));
});

btnCsv.addEventListener('click', () => {
  const rows = currentData.rows || [];
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildFilename('csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

btnClear.addEventListener('click', () => {
  // Local-only clear — next deploy of data.json will reset this anyway.
  currentData = { source: '', scraped_at: '', rows: [] };
  render();
});

function buildFilename(ext) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return 'scrape_' + stamp + '.' + ext;
}

loadData();
