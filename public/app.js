let allData = []; // サーバーから取得した全データ
let sortConfig = { key: null, direction: 'asc' }; // ソートの状態管理

/*************************************************************************************
 * テーブルの描画
 ************************************************************************************/
function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        const date = row.date ? new Date(row.date).toLocaleDateString('ja-JP') : '';
        const amount = Number(row.amount).toLocaleString();
        const closedStatus = row.is_closed ? '✅' : 'ー';

        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${date}</td>
            <td>${row.shop || ''}</td>
            <td style="text-align: right;">¥${amount}</td>
            <td>${row.category || ''}</td>
            <td>${row.member || ''}</td>
            <td style="text-align: center;">${closedStatus}</td>
            <td>${row.memo || ''}</td>
            <td>${row.source_file || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

/*************************************************************************************
 * データの絞り込みとソートの実行
 ************************************************************************************/
function filterAndSortData() {
    // 検索値の取得
    const filters = {
        idMin: document.getElementById('search-id-min').value,
        idMax: document.getElementById('search-id-max').value,
        dFrom: document.getElementById('search-date-from').value,
        dTo: document.getElementById('search-date-to').value,
        aMin: document.getElementById('search-amount-min').value,
        aMax: document.getElementById('search-amount-max').value,
        shop: document.getElementById('search-shop').value.toLowerCase(),
        category: document.getElementById('search-category').value.toLowerCase(),
        member: document.getElementById('search-member').value.toLowerCase(),
        source: document.getElementById('search-source-file').value.toLowerCase(),
        memo: document.getElementById('search-memo').value.toLowerCase(),
        isClosed: document.getElementById('search-is-not-closed').checked
    };

    // 1. 絞り込み
    let filtered = allData.filter(row => {
        const id = Number(row.id);
        const d = row.date ? new Date(row.date) : null;
        const amt = Number(row.amount);

        return (
            (!filters.idMin || id >= Number(filters.idMin)) &&
            (!filters.idMax || id <= Number(filters.idMax)) &&
            (!filters.dFrom || (d && d >= new Date(filters.dFrom))) &&
            (!filters.dTo || (d && d <= new Date(filters.dTo))) &&
            (!filters.aMin || amt >= Number(filters.aMin)) &&
            (!filters.aMax || amt <= Number(filters.aMax)) &&
            (row.shop || '').toLowerCase().includes(filters.shop) &&
            (row.category || '').toLowerCase().includes(filters.category) &&
            (row.member || '').toLowerCase().includes(filters.member) &&
            (row.source_file || '').toLowerCase().includes(filters.source) &&
            (row.memo || '').toLowerCase().includes(filters.memo) &&
            (!filters.isClosed || row.is_closed === false)
        );
    });

    // 2. ソート
    if (sortConfig.key) {
        filtered.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (!isNaN(valA) && !isNaN(valB)) { valA = Number(valA); valB = Number(valB); }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderTable(filtered); // テーブル描画

    updateFooterStats(filtered); // フッター更新を追加
}

/*************************************************************************************
 * ソート状態の変更
 ************************************************************************************/
function handleSort(key) {
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }

    // ヘッダークラスの更新
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.key === key) th.classList.add(`sort-${sortConfig.direction}`);
    });

    filterAndSortData();
}

/****************************************************************************************
 * フッターの統計情報を更新
 ***************************************************************************************/
function updateFooterStats(data) {
    const countEl = document.getElementById('stat-count');
    const sumEl = document.getElementById('stat-sum');

    const totalCount = data.length;
    const totalAmount = data.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    countEl.textContent = totalCount.toLocaleString();
    sumEl.textContent = `¥${totalAmount.toLocaleString()}`;
}

/*************************************************************************************
 * カラムリサイズとソートイベントの初期化
 ************************************************************************************/
function initTableFeatures() {
    document.querySelectorAll('th').forEach(th => {
        // ソートイベント（文字エリアのみ）
        const wrapper = th.querySelector('.sort-wrapper');
        if (wrapper) wrapper.addEventListener('click', () => handleSort(th.dataset.key));

        // リサイズハンドルの作成
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // ソートのクリックを防ぐ
            const startX = e.pageX;
            const startWidth = th.offsetWidth;
            const onMouseMove = (e) => { th.style.width = `${startWidth + (e.pageX - startX)}px`; };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}

// 起動時処理
window.addEventListener('DOMContentLoaded', () => {
    initTableFeatures();

    // 検索条件の変更を監視
    const filterIds = ['search-id-min', 'search-id-max', 'search-date-from', 'search-date-to', 'search-amount-min', 'search-amount-max', 'search-shop', 'search-category', 'search-member', 'search-source-file', 'search-memo', 'search-is-not-closed'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', filterAndSortData);
    });

    // 取得ボタン
    document.getElementById('load-btn').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/rows');
            allData = await res.json();
            filterAndSortData();
        } catch (err) { alert('取得失敗'); }
    });
});