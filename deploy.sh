#!/bin/bash
# ============================================================
# The Lonesome Era - 伺服器部署腳本
# 用法：在伺服器上的專案目錄執行 bash deploy.sh
# ============================================================

set -e

APP_DIR="/var/www/thelonesomeera"
DB_FILE="$APP_DIR/prisma/production.db"

echo "=========================================="
echo " The Lonesome Era - 部署開始"
echo "=========================================="

# ---- 1. 安裝系統依賴（首次部署才需要）----
install_dependencies() {
    echo "[1/6] 檢查系統依賴..."

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

# ---- 2. 安裝 npm 依賴 ----
install_npm() {
    echo "[2/6] 安裝 npm 依賴..."
    cd "$APP_DIR"
    npm ci
}

# ---- 3. 設定環境變數 ----
setup_env() {
    echo "[3/6] 檢查環境變數..."

    if [ ! -f "$APP_DIR/.env.local" ]; then
        echo "  建立 .env.local..."
        cat > "$APP_DIR/.env.local" << ENVEOF
ADMIN_PASSWORD=changeme
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL="file:$DB_FILE"
ENVEOF
        echo "  ⚠  請編輯 $APP_DIR/.env.local 修改 ADMIN_PASSWORD！"
    fi

    # 確保 DATABASE_URL 使用絕對路徑
    if grep -q 'file:\./dev\.db' "$APP_DIR/.env.local"; then
        echo "  修正 DATABASE_URL 為生產路徑..."
        sed -i "s|file:./dev.db|file:$DB_FILE|g" "$APP_DIR/.env.local"
    fi
}

# ---- 4. 資料庫初始化 & 建置 ----
build_app() {
    echo "[4/6] 資料庫初始化 & 建置應用..."
    cd "$APP_DIR"

    # 載入環境變數供後續指令使用
    export $(grep -v '^#' .env.local | xargs)

    # 產生 Prisma Client
    npx prisma generate

    # 推送 Schema 到 SQLite（建立/更新資料表）
    npx prisma db push

    # 匯入種子資料（僅首次或明確指定 --seed 時）
    if [ ! -f "$DB_FILE" ] || [ "$1" = "--seed" ]; then
        echo "  匯入種子資料..."
        npx tsx prisma/seed.ts
    fi

    # 確認資料庫存在
    if [ ! -f "$DB_FILE" ]; then
        echo "  ❌ 資料庫檔案不存在: $DB_FILE"
        exit 1
    fi
    echo "  ✓ 資料庫: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

    # Next.js 建置（所有 DB 頁面已設為 force-dynamic，不會在建置時查詢 DB）
    npm run build

    # standalone 模式：複製必要檔案
    if [ -d ".next/standalone" ]; then
        echo "  複製 public/ 與 static/ 至 standalone..."
        cp -r public .next/standalone/public
        cp -r .next/static .next/standalone/.next/static

        # 建立 prisma 目錄的 symlink，讓 standalone 能找到資料庫
        mkdir -p .next/standalone/prisma
        ln -sf "$DB_FILE" .next/standalone/prisma/production.db
    fi
}

# ---- 5. 設定 Nginx ----
setup_nginx() {
    echo "[5/6] 設定 Nginx..."

    # 讓 Nginx (www-data) 能讀取專案目錄
    sudo chown -R www-data:www-data "$APP_DIR/public"
    sudo chown -R www-data:www-data "$APP_DIR/.next/static"
    sudo chmod -R 755 "$APP_DIR"
    sudo chmod -R 755 "$APP_DIR/public"
    sudo chmod -R 755 "$APP_DIR/.next"

    if [ -f "$APP_DIR/nginx.conf" ]; then
        sudo cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/thelonesomeera
        sudo ln -sf /etc/nginx/sites-available/thelonesomeera /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default

        if sudo nginx -t 2>&1; then
            sudo systemctl reload nginx
            echo "  ✓ Nginx 已設定完成"
        else
            echo "  ⚠ Nginx 設定有誤，請檢查 nginx.conf"
        fi
    fi
}

# ---- 6. 啟動 / 重啟 PM2 ----
start_app() {
    echo "[6/6] 啟動應用..."
    cd "$APP_DIR"

    # 停止舊的程序
    pm2 delete thelonesomeera 2>/dev/null || true

    # 啟動
    pm2 start ecosystem.config.js

    # 儲存 PM2 設定（開機自啟）
    pm2 save
    pm2 startup 2>/dev/null || true

    echo ""
    echo "=========================================="
    echo " ✓ 部署完成"
    echo "=========================================="
    echo ""
    echo " 應用狀態："
    pm2 status
    echo ""
    echo " 常用指令："
    echo "   pm2 logs            # 查看即時日誌"
    echo "   pm2 restart all     # 重啟應用"
    echo ""
}

# ---- 執行 ----
install_dependencies
install_npm
setup_env
build_app "$1"
setup_nginx
start_app
