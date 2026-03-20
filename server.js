const express = require('express');
const pool = require('./src/lib/db');
const app = express();
const path = require('path');

// 1. publicフォルダ内のファイルをそのままブラウザに公開する設定
app.use(express.static('public'));

// 2. ブラウザから呼ばれる「API」のルート
app.get('/api/rows', async (req, res) => {
  try {
    // テーブル名に合わせて変更
    const result = await pool.query('select t1.id, t1.date, t1.shop, t1.amount, t3.name as member, t2.Name as category, t1.memo, t1.source_file, t1.is_closed from transactions_transaction t1 inner join transactions_category t2 on t1.category_id = t2.id inner join members_member t3 on t1.member_id = t3.id order by t1.id');

    // console.log(result.rows);

    // result.rows (配列部分) だけを返すとフロントで扱いやすい
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. サーバー起動
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});