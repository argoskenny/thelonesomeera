<template>
  <div class="container">
    <div class="card">
      <h1 class="title">Android WebView 參數接收器</h1>

      <div class="info-section">
        <h2>Android 裝置資訊</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">裝置類型：</span>
            <span class="value">{{ androidInfo.agent || "載入中..." }}</span>
          </div>

          <div class="info-item">
            <span class="label">語言代碼：</span>
            <span class="value">{{ androidInfo.language || "載入中..." }}</span>
          </div>

          <div class="info-item">
            <span class="label">國家代碼：</span>
            <span class="value">{{ androidInfo.country || "載入中..." }}</span>
          </div>

          <div class="info-item">
            <span class="label">時區：</span>
            <span class="value">{{ androidInfo.timezone || "載入中..." }}</span>
          </div>
        </div>
      </div>

      <div class="status-section">
        <div class="status-item">
          <span class="status-label">Android Bridge 狀態：</span>
          <span :class="['status-value', bridgeStatus ? 'success' : 'error']">
            {{ bridgeStatus ? "已連接" : "未連接" }}
          </span>
        </div>
      </div>

      <button @click="refreshData" class="refresh-btn">重新整理資料</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  name: "App",
  setup() {
    // 響應式資料
    const androidInfo = ref({
      agent: "",
      language: "",
      country: "",
      timezone: "",
    });

    const bridgeStatus = ref(false);

    // 檢查 Android Bridge 是否可用
    const checkAndroidBridge = () => {
      return typeof window.AndroidBridge !== "undefined";
    };

    // 從 Android Bridge 獲取資料
    const getAndroidData = () => {
      if (checkAndroidBridge()) {
        try {
          androidInfo.value = {
            agent: window.AndroidBridge.getAndroidAgent(),
            language: window.AndroidBridge.getLanguageCode(),
            country: window.AndroidBridge.getCountryCode(),
            timezone: window.AndroidBridge.getTimeZone(),
          };
          bridgeStatus.value = true;
        } catch (error) {
          console.error("無法從 Android Bridge 獲取資料:", error);
          bridgeStatus.value = false;
        }
      } else {
        bridgeStatus.value = false;
        console.log("Android Bridge 未可用");
      }
    };

    // 重新整理資料
    const refreshData = () => {
      getAndroidData();
    };

    // 元件掛載時執行
    onMounted(() => {
      // 延遲檢查，確保 WebView 已完全載入
      setTimeout(() => {
        getAndroidData();
      }, 1000);

      // 定期檢查 Android Bridge 狀態
      setInterval(() => {
        if (!bridgeStatus.value) {
          getAndroidData();
        }
      }, 3000);
    });

    return {
      androidInfo,
      bridgeStatus,
      refreshData,
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.title {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 32px;
}

.info-section {
  margin-bottom: 32px;
}

.info-section h2 {
  color: #555;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
  color: #333;
  word-break: break-all;
}

.status-section {
  margin-bottom: 24px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-value {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.status-value.success {
  background: #d4edda;
  color: #155724;
}

.status-value.error {
  background: #f8d7da;
  color: #721c24;
}

.refresh-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #0056b3;
}

.refresh-btn:active {
  transform: translateY(1px);
}

/* 手機版適配 */
@media (max-width: 480px) {
  .card {
    padding: 20px;
    margin: 10px;
  }

  .title {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
