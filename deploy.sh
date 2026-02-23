#!/bin/bash
# ============================================================
# The Lonesome Era - 伺服器部署腳本
# 用法：在伺服器上執行 bash deploy.sh
# ============================================================

set -e

APP_DIR="/var/www/thelonesomeera"
REPO_URL="你的-git-repo-url"  # 替換為你的 Git repo URL

echo "=========================================="
echo " The Lonesome Era - 部署開始"
echo "=========================================="

# ---- 1. 安裝系統依賴（首次部署才需要）----
install_dependencies() {
    echo "[1/7] 檢查系統依賴..."

    if ! command -v node &> /dev/null; then
        echo "  安裝 Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    echo "  Node.js: $(node -v)"
    echo "  npm: $(npm -v)"

    if ! command -v pm2 &> /dev/null; then
        echo "  安裝 PM2..."
        sudo npm install -g pm2
    fi

    if ! command -v nginx &> /dev/null; then
        echo "  安裝 Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
    fi

    sudo mkdir -p /var/log/pm2
}

# ---- 2. 拉取程式碼 ----
pull_code() {
    echo "[2/7] 拉取程式碼..."

    if [ -d "$APP_DIR/.git" ]; then
        cd "$APP_DIR"
        git pull origin main
    else
        sudo mkdir -p "$APP_DIR"
        sudo chown "$USER:$USER" "$APP_DIR"
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
    fi
}

# ---- 3. 安裝 npm 依賴 ----
install_npm() {
    echo "[3/7] 安裝 npm 依賴..."
    cd "$APP_DIR"
    npm ci --production=false
}

# ---- 4. 設定環境變數 ----
setup_env() {
    echo "[4/7] 檢查環境變數..."

    if [ ! -f "$APP_DIR/.env.local" ]; then
        echo "  建立 .env.local（請手動編輯密碼與密鑰）"
        cat > "$APP_DIR/.env.local" << 'ENVEOF'
ADMIN_PASSWORD=請替換為你的管理密碼
JWT_SECRET=請替換為隨機密鑰字串
DATABASE_URL="file:./prisma/production.db"
ENVEOF
        echo "  ⚠  請編輯 $APP_DIR/.env.local 設定密碼與密鑰！"
    fi
}

# ---- 5. 建立資料庫 & 建置 ----
build_app() {
    echo "[5/7] 建置應用..."
    cd "$APP_DIR"

    # 產生 Prisma Client
    npx prisma generate

    # 推送 Schema 到 SQLite（建立/更新資料表）
    npx prisma db push

    # 匯入種子資料（首次或需要重置時）
    if [ ! -f "$APP_DIR/prisma/production.db" ] || [ "$1" = "--seed" ]; then
        echo "  匯入種子資料..."
        npm run db:seed
    fi

    # Next.js 建置
    npm run build

    # standalone 模式需要複製 public 和 static
    cp -r public .next/standalone/public
    cp -r .next/static .next/standalone/.next/static

    # 複製 prisma 資料庫到 standalone
    mkdir -p .next/standalone/prisma
    cp prisma/production.db .next/standalone/prisma/ 2>/dev/null || true
}

# ---- 6. 設定 Nginx ----
setup_nginx() {
    echo "[6/7] 設定 Nginx..."

    sudo cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/thelonesomeera
    sudo ln -sf /etc/nginx/sites-available/thelonesomeera /etc/nginx/sites-enabled/

    # 移除預設站台（如果存在）
    sudo rm -f /etc/nginx/sites-enabled/default

    # 測試設定
    sudo nginx -t

    # 重啟 Nginx
    sudo systemctl reload nginx
    echo "  Nginx 已設定完成"
}

# ---- 7. 啟動 / 重啟 PM2 ----
start_app() {
    echo "[7/7] 啟動應用..."
    cd "$APP_DIR"

    # 停止舊的程序（如果有）
    pm2 delete thelonesomeera 2>/dev/null || true

    # 啟動
    pm2 start ecosystem.config.js

    # 儲存 PM2 設定（開機自啟）
    pm2 save
    pm2 startup 2>/dev/null || true

    echo ""
    echo "=========================================="
    echo " 部署完成！"
    echo "=========================================="
    echo ""
    echo " Next.js:  http://127.0.0.1:3000"
    echo " Nginx:    http://your-domain.com"
    echo ""
    echo " 常用指令："
    echo "   pm2 status          # 查看程序狀態"
    echo "   pm2 logs            # 查看即時日誌"
    echo "   pm2 restart all     # 重啟應用"
    echo "   pm2 monit           # 監控面板"
    echo ""
}

# ---- 執行 ----
install_dependencies
pull_code
install_npm
setup_env
build_app "$1"
setup_nginx
start_app
