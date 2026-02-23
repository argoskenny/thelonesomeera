// PM2 程序管理設定
module.exports = {
  apps: [
    {
      name: "thelonesomeera",
      script: ".next/standalone/server.js",
      cwd: "/var/www/thelonesomeera",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/pm2/thelonesomeera-error.log",
      out_file: "/var/log/pm2/thelonesomeera-out.log",
    },
  ],
};
