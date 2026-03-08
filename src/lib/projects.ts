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
    image: "/assets/xiaoming/imgs/mvp.png",
    link: "/xiaoming/index.html",
    tags: ["JavaScript", "HTML5", "CSS3", "遊戲開發"],
  },
  {
    title: "Hell Rider 競速遊戲",
    description:
      "使用原生 JavaScript 開發的 2D 競速遊戲，具有物理引擎和碰撞偵測系統。",
    image: "/hellrider/pagebg1.png",
    link: "/hellrider/index.html",
    tags: ["Canvas", "JavaScript", "遊戲引擎", "物理模擬"],
  },
  {
    title: "Sox 射擊遊戲",
    description:
      "以 Web 技術打造的射擊遊戲，包含音效系統和動畫效果，展現前端技術在遊戲開發的可能性。",
    image: "/sox/favicon.svg",
    link: "/sox/index.html",
    tags: ["Vue.js", "Web Audio API", "動畫", "遊戲設計"],
  },
];
