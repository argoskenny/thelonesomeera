export type Demo = {
  title: string;
  description: string;
  image: string;
  href: string;
  tags: string[];
  imagePosition?: string;
  external?: boolean;
};

export const demos: Demo[] = [
  {
    title: "逛夜市",
    description:
      "走進復古台灣夜市，在攤販、建築與環境音之間自由漫遊。",
    image: "/images/demos/taiwan-night-market-street.png",
    href: "/showcase/taiwan_night_market/",
    tags: ["Three.js", "TypeScript", "FPS Walk"],
  },
  {
    title: "Mini Fantasy",
    description:
      "像素風小冒險遊戲，探索、對話、收集與戰鬥，一段輕鬆的奇幻旅程。",
    image: "/showcase/mini_fantasy/preview.png",
    href: "/showcase/mini_fantasy/",
    tags: ["Three.js", "TypeScript", "3D RPG"],
  },
  {
    title: "Colorful Kart",
    description:
      "四名車手同場競速，漂移、道具與即時排名都裝進繽紛的空中賽道。",
    image: "/showcase/colorful_kart/assets/sky-islands.png",
    href: "/showcase/colorful_kart/",
    tags: ["Three.js", "Racing", "Mobile"],
  },
  {
    title: "Sigil Keep",
    description:
      "在月光石窟裡推動方塊、破解符印，用有限步數走出五個謎題房間。",
    image: "/showcase/bpd/assets/moonlit-vault-background.webp",
    href: "/showcase/bpd/",
    tags: ["JavaScript", "Puzzle", "Touch"],
  },
  {
    title: "AI Hub",
    description:
      "把同一個題目交給不同模型，並排觀看它們在介面、敘事與互動上的各種解法。",
    image: "/images/ai-hub-card.png",
    href: "/demo/ai-hub",
    tags: ["AI", "Model Lab", "32 Experiments"],
    external: false,
  },
  {
    title: "Mythic Match",
    description:
      "魔法生物主題的記憶配對遊戲，翻牌、連擊、計時，適合一段短短的休息。",
    image: "/showcase/mma/assets/magical-creatures.png",
    href: "/showcase/mma/",
    tags: ["JavaScript", "Memory", "Responsive"],
  },
  {
    title: "Sox FPS",
    description:
      "在瀏覽器裡完成移動、瞄準、射擊與聲音回饋的第一人稱生存實驗。",
    image: "/showcase/cod2/intro_cover.png",
    href: "/showcase/sox/index.html",
    tags: ["WebGL", "FPS", "Web Audio"],
  },
  {
    title: "Hell Rider",
    description:
      "復古公路上的 2D 競速小品，閃避車流，在音樂裡維持速度。",
    image: "/showcase/hellrider/pagebg1.png",
    href: "/showcase/hellrider/index.html",
    tags: ["Canvas", "Arcade", "JavaScript"],
    imagePosition: "center 32%",
  },
  {
    title: "Selfie Cat",
    description:
      "讓貓咪追著螢幕玩具、自己按下快門，把玩耍的瞬間變成照片。",
    image: "/app_preview.png",
    href: "/selfiecat.html",
    tags: ["iOS", "Camera", "Pet Tech"],
    imagePosition: "center top",
  },
  {
    title: "小明問答遊戲",
    description:
      "把熟悉的網路迷因做成輕鬆問答，搭配聲音、動畫與排行榜。",
    image: "/showcase/xiaoming/assets/imgs/mvp.png",
    href: "/showcase/xiaoming/index.html",
    tags: ["HTML", "Quiz", "Audio"],
  },
];

export const featuredDemos = demos.slice(0, 3);
