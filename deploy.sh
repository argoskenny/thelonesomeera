#!/bin/bash
# ============================================================
# The Lonesome Era - 伺服器部署腳本
# 用法：在伺服器上的專案目錄執行 bash deploy.sh
# ============================================================

set -euo pipefail

APP_DIR="/var/www/thelonesomeera"
SITE_NAME="thelonesomeera"
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/$SITE_NAME"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/$SITE_NAME"
GIT_REMOTE="origin"
GIT_BRANCH="main"
FORCE_NGINX_CONFIG=false
SKIP_SYNC=false

for arg in "$@"; do
    case "$arg" in
        --force-nginx)
            FORCE_NGINX_CONFIG=true
            ;;
        --skip-sync)
            SKIP_SYNC=true
            ;;
    esac
done

echo "=========================================="
echo " The Lonesome Era - 部署開始"
echo "=========================================="

# ---- 1. 同步正式機程式碼 ----
sync_repo() {
    echo "[1/6] 同步 Git 工作目錄..."
    cd "$APP_DIR"

    if [ "$SKIP_SYNC" = true ]; then
        echo "  跳過 Git 同步（--skip-sync）"
        return
    fi

    git rebase --abort 2>/dev/null || true
    git merge --abort 2>/dev/null || true
    git cherry-pick --abort 2>/dev/null || true
    git am --abort 2>/dev/null || true

    echo "  取得最新程式碼：$GIT_REMOTE/$GIT_BRANCH"
    git fetch "$GIT_REMOTE"
    git reset --hard "$GIT_REMOTE/$GIT_BRANCH"
    git clean -fd

    if [ -d "$APP_DIR/showcase/cod2" ]; then
        if [ -d "$APP_DIR/showcase/cod2/.git" ] || [ -f "$APP_DIR/showcase/cod2/.git" ]; then
            echo "  清理 cod2 工作目錄..."
            git -C "$APP_DIR/showcase/cod2" rebase --abort 2>/dev/null || true
            git -C "$APP_DIR/showcase/cod2" merge --abort 2>/dev/null || true
            git -C "$APP_DIR/showcase/cod2" cherry-pick --abort 2>/dev/null || true
            git -C "$APP_DIR/showcase/cod2" am --abort 2>/dev/null || true
            git -C "$APP_DIR/showcase/cod2" restore --source=HEAD --staged --worktree .
            git -C "$APP_DIR/showcase/cod2" clean -fd
        fi
    fi
}

# ---- 2. 安裝系統依賴（首次部署才需要）----
install_dependencies() {
    echo "[2/6] 檢查系統依賴..."

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

# ---- 3. 安裝 npm 依賴 ----
install_npm() {
    echo "[3/6] 安裝 npm 依賴..."
    cd "$APP_DIR"
    # 建置階段需要 TypeScript 與各 showcase 的 Vite/Vitest 等 devDependencies。
    # 即使伺服器環境已設定 NODE_ENV=production，也不能省略它們。
    npm ci --include=dev

    if [ -f "$APP_DIR/showcase/androidtest/package-lock.json" ]; then
        echo "  安裝 androidtest 依賴..."
        npm --prefix showcase/androidtest ci --include=dev
    fi

    if [ -f "$APP_DIR/showcase/cod2/package-lock.json" ]; then
        echo "  安裝 cod2 依賴..."
        npm --prefix showcase/cod2 ci --include=dev
    fi

    if [ -f "$APP_DIR/showcase/room/package-lock.json" ]; then
        echo "  安裝 room 依賴..."
        npm --prefix showcase/room ci --include=dev
    fi

    if [ -f "$APP_DIR/showcase/pulsesync/package-lock.json" ]; then
        echo "  安裝 pulsesync 依賴..."
        npm --prefix showcase/pulsesync ci --include=dev
    fi

    if [ -f "$APP_DIR/showcase/colorful_kart/package-lock.json" ]; then
        echo "  安裝 colorful_kart 依賴..."
        npm --prefix showcase/colorful_kart ci --include=dev
    fi

    if [ -f "$APP_DIR/showcase/mini_fantasy/package-lock.json" ]; then
        echo "  安裝 mini_fantasy 依賴..."
        npm --prefix showcase/mini_fantasy ci --include=dev
    fi
}

# ---- 4. 建置 ----
build_app() {
    echo "[4/6] 建置應用..."
    cd "$APP_DIR"

    # 重建所有獨立靜態遊戲 / demo 輸出
    npm run build:standalone

    # Next.js 建置；build script 同步準備 standalone 的 public 與 static 資產。
    npm run build
}

# ---- 5. 設定 Nginx ----
setup_nginx() {
    echo "[5/6] 設定 Nginx..."

    # 讓 Nginx (www-data) 能讀取專案目錄
    sudo chown -R www-data:www-data "$APP_DIR/public"
    sudo chown -R www-data:www-data "$APP_DIR/.next/static"
    sudo chmod 755 "$APP_DIR"
    sudo chmod -R 755 "$APP_DIR/public"
    sudo chmod -R 755 "$APP_DIR/.next"

    if [ -f "$APP_DIR/nginx.conf" ]; then
        SHOULD_COPY=false
        HAS_EXISTING_SITE=false
        HAS_SSL_CONFIG=false

        if [ -f "$NGINX_SITE_AVAILABLE" ]; then
            HAS_EXISTING_SITE=true
        fi

        if [ "$HAS_EXISTING_SITE" = true ] && grep -q "managed by Certbot\\|ssl_certificate\\|listen 443" "$NGINX_SITE_AVAILABLE"; then
            HAS_SSL_CONFIG=true
        fi

        if [ "$HAS_EXISTING_SITE" = false ]; then
            SHOULD_COPY=true
            echo "  首次部署：建立 Nginx 站台設定"
        elif [ "$HAS_SSL_CONFIG" = true ]; then
            echo "  偵測到現有 SSL/Certbot 設定，跳過寫入 repo 內的 nginx.conf"
            echo "  如需調整正式機 Nginx，請先手動備份後再修改 /etc/nginx/sites-available/$SITE_NAME"
        elif [ "$FORCE_NGINX_CONFIG" = true ]; then
            SHOULD_COPY=true
            echo "  偵測到 --force-nginx：將覆蓋既有非 SSL Nginx 設定"
        else
            SHOULD_COPY=true
            echo "  更新既有非 SSL 站台設定"
        fi

        if [ "$SHOULD_COPY" = true ]; then
            if [ "$HAS_EXISTING_SITE" = true ]; then
                BACKUP_PATH="${NGINX_SITE_AVAILABLE}.bak.$(date +%Y%m%d%H%M%S)"
                echo "  備份現有 Nginx 設定到 $BACKUP_PATH"
                sudo cp "$NGINX_SITE_AVAILABLE" "$BACKUP_PATH"
            fi
            sudo cp "$APP_DIR/nginx.conf" "$NGINX_SITE_AVAILABLE"
        fi

        sudo ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
        sudo rm -f /etc/nginx/sites-enabled/default

        if sudo nginx -t 2>&1; then
            sudo systemctl reload nginx
            echo "  ✓ Nginx 已設定完成"
        else
            echo "  ⚠ Nginx 設定有誤，請檢查 $NGINX_SITE_AVAILABLE"
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
sync_repo
install_dependencies
install_npm
build_app
setup_nginx
start_app
