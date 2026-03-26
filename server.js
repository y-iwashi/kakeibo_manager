require('dotenv').config();
const express = require('express');
const pool = require('./src/lib/db');
const app = express();
const path = require('path');

// publicフォルダ内のファイルをそのままブラウザに公開する設定
app.use(express.static('public'));

// ブラウザから呼ばれる「API」のルート
app.get('/api/rows', async (req, res) => {
  try {
    // 日付、店舗、金額、メンバー名、カテゴリ名、メモ、元ファイル名、クローズフラグを取得するクエリ
    const result = await pool.query('SELECT t1.id, t1.date, t1.shop, t1.amount, t3.name AS member, t2.Name as category, t1.memo, t1.source_file, t1.is_closed FROM transactions_transaction t1 INNER JOIN transactions_category t2 ON t1.category_id = t2.id INNER JOIN members_member t3 ON t1.member_id = t3.id ORDER BY t1.id DESC;');

    // console.log(result.rows);

    // result.rows (配列部分) だけを返すとフロントで扱いやすい
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// メンバー一覧を取得するAPI
app.get('/api/members', async (req, res) => {
  try {
    // メンバーIDとメンバー名称を取得するクエリ
    const result = await pool.query('SELECT id, name FROM members_member ORDER BY id ASC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// カテゴリ一覧を取得するAPI
app.get('/api/categories', async (req, res) => {
  try {
    // カテゴリ名称を出現頻度順で取得するクエリ
    const result = await pool.query('SELECT t2.category_id, t3.name, t2.count FROM( SELECT t1.category_id, count(t1.category_id) AS count FROM transactions_transaction t1 GROUP BY category_id ) t2 LEFT JOIN transactions_category t3 ON t2.category_id = t3.id ORDER BY t2.count DESC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ファイル一覧を取得するAPI
app.get('/api/source_file', async (req, res) => {
  try {
    // 元ファイル名のリストを降順（新しい順）で取得するクエリ
    const result = await pool.query('SELECT DISTINCT source_file FROM transactions_transaction ORDER BY source_file DESC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ポート番号も環境変数から取得（なければ3000）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});