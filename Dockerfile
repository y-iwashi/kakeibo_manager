# ベースとなる軽量なNode.js環境
FROM node:18-slim

# コンテナ内の作業ディレクトリを /app に設定
WORKDIR /app

# 先に依存関係の定義だけコピーしてインストール（ビルド高速化のため）
COPY package*.json ./
RUN npm install --production

# アプリのソースコードをすべてコピー
COPY . .

# アプリが待ち受けるポート番号
EXPOSE 3000

# アプリを起動
CMD ["node", "server.js"]