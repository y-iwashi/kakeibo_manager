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
        const closedStatus = row.is_closed ? '☑' : 'ー';

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

        // Virtual Selectからは選択された値の「配列」が返ってくる
        members: document.querySelector('#search-member').value, 
        categories: document.querySelector('#search-category').value,
        sourceFiles: document.querySelector('#search-source-file').value,

        memo: document.getElementById('search-memo').value.toLowerCase(),
        isClosed: document.getElementById('search-is-not-closed').checked
    };

    // 絞り込み
    let filtered = allData.filter(row => {
        const id = Number(row.id);
        const d = row.date ? new Date(row.date) : null;
        const amt = Number(row.amount);

        // 複数選択の判定：何も選ばれていない(配列空)ならパス。選ばれていれば含まれるかチェック。
        const matchMember = filters.members.length === 0 || filters.members.includes(row.member);
        const matchCategory = filters.categories.length === 0 || filters.categories.includes(row.category);
        const matchSourceFile = filters.sourceFiles.length === 0 || filters.sourceFiles.includes(row.source_file);

        return (
            (!filters.idMin || id >= Number(filters.idMin)) &&
            (!filters.idMax || id <= Number(filters.idMax)) &&
            (!filters.dFrom || (d && d >= new Date(filters.dFrom))) &&
            (!filters.dTo || (d && d <= new Date(filters.dTo))) &&
            (!filters.aMin || amt >= Number(filters.aMin)) &&
            (!filters.aMax || amt <= Number(filters.aMax)) &&
            (row.shop || '').toLowerCase().includes(filters.shop) &&

            matchMember &&
            matchCategory &&
            matchSourceFile &&

            (row.memo || '').toLowerCase().includes(filters.memo) &&
            (!filters.isClosed || row.is_closed === false)
        );
    });

    // ソート
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

/****************************************************************************************
 * アコーディオンの初期化とイベント設定
 ***************************************************************************************/
function initAccordion() {
    const details = document.querySelector('.search-accordion'); // 1つしかない前提で取得
    const summary = details.querySelector('summary');            // summary要素
    const content = details.querySelector('.search-content');    // アコーディオンの内容エリア
    const inner = details.querySelector('.search-inner');        // 内容エリアの内側（余白部分）

    // 初期状態のセット（閉じている場合）
    if (!details.open) {
        content.style.gridTemplateRows = '0fr';
        inner.style.overflow = 'hidden';
    }

    summary.addEventListener('click', (e) => {
        e.preventDefault();

        // すでに開いている場合は閉じる、閉じている場合は開く
        if (details.open) {
            // --- 閉じる時 ---
            inner.style.overflow = 'hidden'; // 閉じ始める瞬間に隠す
            content.style.gridTemplateRows = '0fr';
            
            setTimeout(() => {
                details.open = false;
            }, 500);

        } else {
            // --- 開く時 ---
            details.open = true;
            inner.style.overflow = 'hidden'; // アニメーション中は隠す
            
            requestAnimationFrame(() => {
                content.style.gridTemplateRows = '1fr';
            });

            // アニメーション完了後(0.5s後)に、プルダウンがはみ出せるようにする
            setTimeout(() => {
                if (details.open) {
                    inner.style.overflow = 'visible';
                }
            }, 500);
        }
    });
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

/*************************************************************************************
 * マスタデータ（メンバー・カテゴリ・ソースファイル）を読み込んでプルダウンを生成
 ************************************************************************************/
async function loadMasterData() {
    try {
        const [resMem, resCat, resSourceFile] = await Promise.all([
            fetch('/api/members'),
            fetch('/api/categories'),
            fetch('/api/source_file')
        ]);
        const members = await resMem.json();
        const categories = await resCat.json();
        const sourceFiles = await resSourceFile.json();

        // Virtual Selectの初期化
        VirtualSelect.init({
            ele: '#search-member',
            options: members.map(m => ({ label: m.name, value: m.name })),
            multiple: true,           // 複数選択を有効に
            placeholder: 'すべて',    // 未選択時の表示
            search: false,             // 検索窓を出す
            selectAllText: '全選択',  // 全選択ボタンのテキスト
            allOptionsSelectedText: 'すべて', 
        });

        VirtualSelect.init({
            ele: '#search-category',
            options: categories.map(c => ({ label: c.name, value: c.name })),
            multiple: true,           // 複数選択を有効に
            placeholder: 'すべて',    // 未選択時の表示
            search: false,             // 検索窓を出す
            selectAllText: '全選択',  // 全選択ボタンのテキスト
            allOptionsSelectedText: 'すべて',
        });

        VirtualSelect.init({
            ele: '#search-source-file',
            options: sourceFiles.map(f => ({ label: f.source_file, value: f.source_file })),
            multiple: true,           // 複数選択を有効に
            placeholder: 'すべて',    // 未選択時の表示
            search: false,             // 検索窓を出す
            selectAllText: '全選択',  // 全選択ボタンのテキスト
            allOptionsSelectedText: 'すべて',
        });
        
        // 変更時にフィルタを実行するようにイベント設定
        document.querySelector('#search-member').addEventListener('change', filterAndSortData);
        document.querySelector('#search-category').addEventListener('change', filterAndSortData);
        document.querySelector('#search-source-file').addEventListener('change', filterAndSortData);

    } catch (err) {
        console.error('マスタデータの取得に失敗:', err);
    }
}

/*************************************************************************************
 * データの初回読み込み処理
 ************************************************************************************/
async function loadInitialData() {
    try {
        const res = await fetch('/api/rows');
        allData = await res.json();
        filterAndSortData(); // 描画と統計更新
    } catch (err) {
        alert('初期データの取得に失敗しました');
    }
}

// 起動時処理
window.addEventListener('DOMContentLoaded', async () => {

    initTableFeatures(); // カラムリサイズとソートイベントの初期化

    initAccordion(); // アコーディオン初期化を追加

    // プルダウンの準備
    await loadMasterData();

    // 検索条件のイベント登録
    const filterIds = [
        'search-id-min', 'search-id-max', 'search-date-from', 'search-date-to', 
        'search-amount-min', 'search-amount-max', 'search-shop', 
        'search-category', 'search-member', 'search-source-file', 'search-memo', 
        'search-is-not-closed'
    ];

    // 各フィルタ要素にイベントリスナーを追加
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        // select要素も'change'または'input'イベントで検知可能
        const eventType = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(eventType, filterAndSortData);
    });

    // 初期表示データの取得
    await loadInitialData();

    // 取得ボタン（手動更新用）
    // document.getElementById('load-btn').addEventListener('click', loadInitialData);
});