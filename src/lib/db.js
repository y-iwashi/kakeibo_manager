// 冒頭でdotenvを読み込む
require('dotenv').config();
const { Pool } = require('pg');

// 環境変数（process.env.XXX）から値を読み取る
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;