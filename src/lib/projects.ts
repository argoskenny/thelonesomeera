export type ProjectItem = {
  title: string;
  description: string;
  image: string;
  link: string;
  tags: string[];
};

export const projects: ProjectItem[] = [
  {
    title: "Selfie Cat",
    description:
      "AI 驅動的貓咪自拍應用程式，讓您的貓咪與螢幕上的互動玩具遊戲時自動拍攝可愛照片，將遊戲時光變成珍貴回憶。",
    image: "/app_preview.png",
    link: "/selfiecat.html",
    tags: ["iOS App", "AI Photography", "Pet Tech", "Mobile Development"],
  },
  {
    title: "小明問答遊戲",
    description:
      "一個基於 Web 技術的互動問答遊戲，包含多媒體元素與響應式設計，讓使用者在遊戲中學習。",
    image: "/showcase/xiaoming/assets/imgs/mvp.png",
    link: "/showcase/xiaoming/index.html",
    tags: ["JavaScript", "HTML5", "CSS3", "遊戲開發"],
  },
  {
    title: "Hell Rider 競速遊戲",
    description:
      "使用原生 JavaScript 開發的 2D 競速遊戲，具有物理引擎和碰撞偵測系統。",
    image: "/showcase/hellrider/pagebg1.png",
    link: "/showcase/hellrider/index.html",
    tags: ["Canvas", "JavaScript", "遊戲引擎", "物理模擬"],
  },
  {
    title: "Sox 射擊遊戲",
    description:
      "以 Web 技術打造的射擊遊戲，包含音效系統和動畫效果，展現前端技術在遊戲開發的可能性。",
    image: "/showcase/sox/favicon.svg",
    link: "/showcase/sox/index.html",
    tags: ["Vue.js", "Web Audio API", "動畫", "遊戲設計"],
  },
  {
    title: "Mythic Match 魔法配對",
    description:
      "以魔法生物為主題的記憶配對遊戲，提供三種難度、連擊獎勵、計時與最佳成績紀錄。",
    image: "/showcase/mma/assets/observatory-bg.png",
    link: "/showcase/mma/",
    tags: ["JavaScript", "HTML5", "記憶遊戲", "響應式設計"],
  },
  {
    title: "迷你奇境 Mini Fantasy",
    description:
      "使用 Three.js 打造的可愛低多邊形 3D RPG，包含探索、對話、收集、戰鬥與完整任務流程。",
    image: "/showcase/mini_fantasy/preview.png",
    link: "/showcase/mini_fantasy/",
    tags: ["Three.js", "TypeScript", "3D RPG", "觸控操作"],
  },
  {
    title: "Colorful Kart",
    description:
      "四名車手同場競速的繽紛 3D 卡丁車遊戲，具備道具、加速帶、三圈賽事與即時排名。",
    image: "/showcase/colorful_kart/assets/sky-islands.png",
    link: "/showcase/colorful_kart/",
    tags: ["Three.js", "TypeScript", "競速遊戲", "行動裝置"],
  },
  {
    title: "Sigil Keep",
    description:
      "五個房間組成的俯視角推箱解謎遊戲，結合符印、鑰匙、陷阱、復原與觸控方向鍵。",
    image: "/showcase/bpd/assets/moonlit-vault-background.webp",
    link: "/showcase/bpd/",
    tags: ["JavaScript", "解謎遊戲", "鍵盤操作", "觸控操作"],
  },
];
