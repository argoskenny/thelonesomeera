// 等待 DOM 加載完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化遊戲
    new Game();
});

class Game {
    constructor() {
        // 初始化 PIXI 應用
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x333333
        });

        // 添加 canvas 到容器
        document.getElementById('game-container').appendChild(this.app.view);

        // 顯示加載中訊息
        const loadingText = new PIXI.Text('資源加載中...', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        loadingText.x = this.app.screen.width / 2 - 100;
        loadingText.y = this.app.screen.height / 2;
        this.app.stage.addChild(loadingText);

        // 遊戲狀態
        this.currentState = 'welcome'; // 'welcome', 'playing', 'gameOver'
        this.gameOver = false;
        this.score = 0;
        this.collisions = 0;
        this.maxCollisions = 3;
        this.distance = 0;

        // AI 生成設定
        this.baseSpawnInterval = 1000;     // 基礎生成間隔
        this.spawnInterval = this.baseSpawnInterval;  // 當前生成間隔
        this.lastSpawnUpdate = 0;          // 上次更新生成間隔的距離
        this.spawnIntervalDecreaseEnabled = false; // 生成間隔減少功能開關
        this.gameMode = 'normal'; // 'normal', 'hard', 'extreme'

        // 輸入處理
        this.keys = {
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        // 設置事件監聽
        this.setupEventListeners();

        // 加載資源
        this.loadResources().then(() => {
            // 移除加載中訊息
            this.app.stage.removeChild(loadingText);

            // 初始化遊戲
            this.initGame();
        }).catch(error => {
            console.error('資源加載錯誤:', error);
            loadingText.text = '資源加載失敗，請重新整理頁面';
            loadingText.style.fill = 0xff0000;
        });
    }

    async loadResources() {
        // 加載圖片資源
        const resources = [
            { name: 'road', url: 'assets/road_basic.png' },
            { name: 'bike', url: 'assets/bike/89-bike.png' },
            { name: 'bike2', url: 'assets/bike/89-bike2.png' },
            { name: 'car2', url: 'assets/car2.png' },
            { name: 'car3', url: 'assets/car3.png' },
            { name: 'taxi1', url: 'assets/taxi1.png' },
            { name: 'truck', url: 'assets/truck.png' },
            { name: 'bus', url: 'assets/bus.png' },
            { name: 'build1', url: 'assets/building/build1.png' },
            { name: 'build2', url: 'assets/building/build2.png' },
            { name: 'build3', url: 'assets/building/build3.png' },
            { name: 'build4', url: 'assets/building/build4.png' },
            { name: 'build5', url: 'assets/building/build5.png' },
            { name: 'build6', url: 'assets/building/build6.png' }
        ];

        // 創建紋理緩存
        this.textures = {};

        // 加載所有資源
        for (const resource of resources) {
            try {
                const texture = await PIXI.Texture.fromURL(resource.url);
                this.textures[resource.name] = texture;
            } catch (error) {
                console.error(`無法加載 ${resource.name}:`, error);

                // 創建一個替代紋理（紅色方塊）
                const graphics = new PIXI.Graphics();
                graphics.beginFill(0xff0000);
                graphics.drawRect(0, 0, 40, 80);
                graphics.endFill();

                const renderer = this.app.renderer;
                this.textures[resource.name] = renderer.generateTexture(graphics);
            }
        }

        // 設置音效 - 使用更保守的設置
        this.setupSounds();
    }

    setupSounds() {
        // 關閉 Howler 的全局設置，減少音頻池使用
        Howler.autoUnlock = true;
        Howler.autoSuspend = false;
        Howler.html5PoolSize = 10; // 增加音頻池大小

        // 使用更保守的方式創建音效
        this.sounds = {};

        // 背景音樂
        this.sounds.bgMusic = new Howl({
            src: ['sound/bgmusic.mp3'],
            loop: true,
            volume: 0.5,
            html5: true,
            preload: false // 延遲加載，直到需要時
        });

        // 引擎聲
        this.sounds.engine = new Howl({
            src: ['sound/engine.mp3'],
            loop: true,
            volume: 0.3,
            html5: true,
            preload: false
        });

        // 爆炸音效
        this.sounds.explode = new Howl({
            src: ['sound/explode.mp3'],
            volume: 0.8,
            html5: true,
            preload: false
        });
    }

    initGame() {
        // 創建容器
        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        this.welcomeContainer = new PIXI.Container();
        this.gameOverContainer = new PIXI.Container();
        this.buildingsContainer = new PIXI.Container();

        // 設置道路
        this.setupRoad();

        // 添加容器到舞台，確保正確的顯示順序
        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.buildingsContainer);
        this.app.stage.addChild(this.uiContainer);
        this.app.stage.addChild(this.welcomeContainer);
        this.app.stage.addChild(this.gameOverContainer);

        // 設置建築物
        this.setupBuildings();

        // 設置玩家
        this.setupPlayer();

        // 設置 AI 車輛
        this.setupAIVehicles();

        // 設置 UI
        this.setupUI();

        // 顯示歡迎畫面
        this.showWelcomeScreen();

        // 開始遊戲循環
        this.app.ticker.add(delta => this.gameLoop(delta));
    }

    setupRoad() {
        // 創建兩個道路精靈用於無縫滾動
        this.road1 = new PIXI.Sprite(this.textures.road);
        this.road2 = new PIXI.Sprite(this.textures.road);

        this.road1.width = this.app.screen.width;
        this.road1.height = this.app.screen.height;
        this.road2.width = this.app.screen.width;
        this.road2.height = this.app.screen.height;

        this.road2.y = -this.app.screen.height;

        this.gameContainer.addChild(this.road1);
        this.gameContainer.addChild(this.road2);
    }

    setupPlayer() {
        // 玩家屬性
        this.player = {
            sprite: new PIXI.Sprite(this.textures.bike),
            x: this.app.screen.width / 2,
            y: this.app.screen.height - 100,
            width: 40,
            height: 80,
            speed: 0,
            maxSpeed: 8,
            acceleration: 0.2,
            deceleration: 0.05,
            lateralSpeed: 5,
            rotation: 0,
            maxRotation: 20 * (Math.PI / 180),
            rotationSpeed: 2 * (Math.PI / 180),
            targetRotation: 0,
            animationFrame: 0,
            animationDelay: 10,
            currentAnimationDelay: 0
        };

        // 設置精靈屬性
        this.player.sprite.anchor.set(0.5);
        this.player.sprite.width = this.player.width;
        this.player.sprite.height = this.player.height;
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;

        this.gameContainer.addChild(this.player.sprite);
    }

    setupAIVehicles() {
        this.aiVehicles = [];
        this.aiImages = ['car2', 'car3', 'taxi1', 'truck', 'bus'];

        // AI 移動模式
        this.movementPatterns = [
            'straight',    // 直線向下
            'snake',       // S型移動
            'leftDrift',   // 全程向左
            'rightDrift',  // 全程向右
            'crossLeft'    // 從右向左橫穿
        ];

        this.spawnInterval = 1000;  // 降低生成間隔（增加20%數量）
    }

    setupUI() {
        // 分數文字
        this.scoreText = new PIXI.Text('Distance: 0m', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff
        });
        this.scoreText.x = 20;
        this.scoreText.y = 60;

        // 生命文字
        this.livesText = new PIXI.Text('Lives: 3', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff
        });
        this.livesText.x = 20;
        this.livesText.y = 30;

        // 遊戲模式文字
        this.modeText = new PIXI.Text('Mode: Normal', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff
        });
        this.modeText.x = 20;
        this.modeText.y = 90;

        // 控制說明
        this.controlsText = new PIXI.Text('Controls: ↑ to accelerate, ← → to move left/right', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff
        });
        this.controlsText.x = 20;
        this.controlsText.y = this.app.screen.height - 30;

        this.uiContainer.addChild(this.scoreText);
        this.uiContainer.addChild(this.livesText);
        this.uiContainer.addChild(this.modeText);
        this.uiContainer.addChild(this.controlsText);
    }

    setupEventListeners() {
        // 鍵盤事件
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });

        // 按鈕點擊事件
        this.app.view.addEventListener('click', (e) => {
            const rect = this.app.view.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.currentState === 'welcome') {
                if (x >= 300 && x <= 500) {
                    if (y >= 350 && y <= 400) {
                        this.startGame('normal');
                    } else if (y >= 400 && y <= 450) {
                        this.startGame('hard');
                    } else if (y >= 450 && y <= 500) {
                        this.startGame('extreme');
                    }
                }
            } else if (this.currentState === 'gameOver') {
                if (x >= 300 && x <= 500 && y >= 400 && y <= 450) {
                    this.returnToTitle();
                }
            }
        });
    }

    createButton(text, x, y, width, height) {
        const button = new PIXI.Container();

        // 按鈕背景
        const background = new PIXI.Graphics();
        switch (text) {
            case '普通模式':
                background.beginFill(0x4CAF50);
                break;
            case '困難模式':
                background.beginFill(0xFFD966);
                break;
            case '極限模式':
                background.beginFill(0xE06666);
                break;
            default:
                background.beginFill(0x4CAF50);
                break;
        }
        // background.lineStyle(2, 0x45a049);
        background.drawRect(0, 0, width, height);
        background.endFill();

        // 按鈕文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        buttonText.anchor.set(0.5);
        buttonText.x = width / 2;
        buttonText.y = height / 2;

        button.addChild(background);
        button.addChild(buttonText);
        button.x = x;
        button.y = y;

        button.eventMode = 'static';
        button.cursor = 'pointer';

        return button;
    }

    showWelcomeScreen() {
        // 顯示歡迎畫面，隱藏其他容器
        this.gameContainer.visible = true;  // 保持背景可見
        this.uiContainer.visible = false;
        this.welcomeContainer.visible = true;
        this.gameOverContainer.visible = false;

        // 清除之前的內容
        this.welcomeContainer.removeChildren();

        // 半透明背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();

        // 標題
        const title = new PIXI.Text('HELL RIDER', {
            fontFamily: 'Arial',
            fontSize: 72,
            fontWeight: 'bold',
            fill: 0xff3333
        });
        title.anchor.set(0.5);
        title.x = this.app.screen.width / 2;
        title.y = 200;

        // 難度按鈕
        const normalButton = this.createButton('普通模式', 300, 350, 200, 50);
        const hardButton = this.createButton('困難模式', 300, 420, 200, 50);
        const extremeButton = this.createButton('極限模式', 300, 490, 200, 50);

        this.welcomeContainer.addChild(overlay);
        this.welcomeContainer.addChild(title);
        this.welcomeContainer.addChild(normalButton);
        this.welcomeContainer.addChild(hardButton);
        this.welcomeContainer.addChild(extremeButton);
    }

    showGameOverScreen() {
        // 顯示遊戲結束畫面
        this.gameOverContainer.visible = true;

        // 清除之前的內容
        this.gameOverContainer.removeChildren();

        // 半透明背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();

        // 遊戲結束文字
        const gameOverText = new PIXI.Text('GAME OVER', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffffff
        });
        gameOverText.anchor.set(0.5);
        gameOverText.x = this.app.screen.width / 2;
        gameOverText.y = this.app.screen.height / 2 - 50;

        // 最終分數
        const scoreText = new PIXI.Text(`Final Score: ${this.score}m`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        scoreText.anchor.set(0.5);
        scoreText.x = this.app.screen.width / 2;
        scoreText.y = this.app.screen.height / 2;

        // 返回按鈕
        const button = this.createButton('回到標題', 300, 400, 200, 50);

        this.gameOverContainer.addChild(overlay);
        this.gameOverContainer.addChild(gameOverText);
        this.gameOverContainer.addChild(scoreText);
        this.gameOverContainer.addChild(button);
    }

    startGame(mode) {
        this.currentState = 'playing';
        this.gameOver = false;
        this.score = 0;
        this.collisions = 0;
        this.distance = 0;
        this.lastSpawnUpdate = 0;
        this.gameMode = mode;

        // 根據遊戲模式設置
        switch (mode) {
            case 'normal':
                this.baseSpawnInterval = 1000;
                this.spawnInterval = this.baseSpawnInterval;
                this.spawnIntervalDecreaseEnabled = false;
                this.modeText.text = 'Mode: Normal';
                break;
            case 'hard':
                this.baseSpawnInterval = 1000;
                this.spawnInterval = this.baseSpawnInterval;
                this.spawnIntervalDecreaseEnabled = true;
                this.modeText.text = 'Mode: Hard';
                break;
            case 'extreme':
                this.baseSpawnInterval = 400;
                this.spawnInterval = this.baseSpawnInterval;
                this.spawnIntervalDecreaseEnabled = true;
                this.modeText.text = 'Mode: Extreme';
                break;
        }

        // 清除 AI 車輛
        this.aiVehicles.forEach(vehicle => {
            if (vehicle.sprite) {
                this.gameContainer.removeChild(vehicle.sprite);
            }
        });
        this.aiVehicles = [];

        // 清除建築物
        this.buildings.forEach(building => {
            if (building.sprite) {
                this.buildingsContainer.removeChild(building.sprite);
            }
        });
        this.buildings = [];

        // 重新生成建築物
        this.generateInitialBuildings();

        // 顯示遊戲容器和 UI
        this.gameContainer.visible = true;
        this.buildingsContainer.visible = true;
        this.uiContainer.visible = true;
        this.welcomeContainer.visible = false;
        this.gameOverContainer.visible = false;

        // 預加載音效，然後播放
        this.sounds.bgMusic.load();
        this.sounds.engine.load();

        // 使用 setTimeout 確保音效加載有時間完成
        setTimeout(() => {
            this.sounds.bgMusic.play();
            this.sounds.engine.play();
        }, 100);

        // 開始生成 AI 車輛
        this.spawnAIVehicle();
    }

    returnToTitle() {
        this.currentState = 'welcome';
        this.gameOver = false;

        // 停止音效
        this.sounds.bgMusic.stop();
        this.sounds.engine.stop();

        // 隱藏建築物
        this.buildingsContainer.visible = false;

        this.showWelcomeScreen();
    }

    spawnAIVehicle() {
        if (this.currentState !== 'playing') return;

        // 隨機選擇移動模式
        const pattern = this.movementPatterns[Math.floor(Math.random() * this.movementPatterns.length)];

        // 根據移動模式設定初始位置和參數
        let initialX, initialRotation, driftSpeed;

        switch (pattern) {
            case 'straight':
                initialX = 100 + Math.random() * (this.app.screen.width - 200);
                initialRotation = Math.PI;  // 180度
                driftSpeed = 0;
                break;
            case 'snake':
                initialX = 100 + Math.random() * (this.app.screen.width - 200);
                initialRotation = Math.PI;
                driftSpeed = 0;  // 會在移動中計算
                break;
            case 'leftDrift':
                initialX = this.app.screen.width - 100;
                initialRotation = Math.PI;
                driftSpeed = -2;
                break;
            case 'rightDrift':
                initialX = 100;
                initialRotation = Math.PI;
                driftSpeed = 2;
                break;
            case 'crossLeft':
                initialX = this.app.screen.width + 50;
                initialRotation = Math.PI * 1.5;  // 270度，向左
                driftSpeed = -3;
                break;
        }

        // 創建 AI 車輛精靈
        const randomImageKey = this.aiImages[Math.floor(Math.random() * this.aiImages.length)];
        const vehicleSprite = new PIXI.Sprite(this.textures[randomImageKey]);
        vehicleSprite.anchor.set(0.5);
        vehicleSprite.width = 40;
        vehicleSprite.height = 80;
        vehicleSprite.x = initialX;
        vehicleSprite.y = -100;
        vehicleSprite.rotation = initialRotation;

        // AI 車輛屬性
        const vehicle = {
            sprite: vehicleSprite,
            x: initialX,
            y: -100,
            width: 40,
            height: 80,
            speed: (1.6 + Math.random() * 2.4) * 0.8,  // 速度降低20%
            rotation: initialRotation,
            maxRotation: 20 * (Math.PI / 180),
            rotationSpeed: 1 * (Math.PI / 180),
            pattern: pattern,
            driftSpeed: driftSpeed,
            movementPhase: Math.random() * Math.PI * 2,
            movementSpeed: 0.02 + Math.random() * 0.02,
            movementAmplitude: 2 + Math.random() * 1
        };

        this.gameContainer.addChild(vehicleSprite);
        this.aiVehicles.push(vehicle);

        // 使用當前的 spawnInterval 設定下一個生成時間
        const nextSpawnTime = this.spawnInterval + Math.random() * 500;
        setTimeout(() => this.spawnAIVehicle(), nextSpawnTime);
    }

    updatePlayer(delta) {
        // 更新速度
        if (this.keys.ArrowUp) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);

            // 更新動畫
            this.player.currentAnimationDelay++;
            if (this.player.currentAnimationDelay >= this.player.animationDelay) {
                this.player.animationFrame = 1 - this.player.animationFrame;
                this.player.currentAnimationDelay = 0;

                // 切換精靈圖片
                this.gameContainer.removeChild(this.player.sprite);
                this.player.sprite = new PIXI.Sprite(
                    this.textures[this.player.animationFrame === 0 ? 'bike' : 'bike2']
                );
                this.player.sprite.anchor.set(0.5);
                this.player.sprite.width = this.player.width;
                this.player.sprite.height = this.player.height;
                this.gameContainer.addChild(this.player.sprite);
            }
        } else {
            this.player.speed = Math.max(0, this.player.speed - this.player.deceleration);
            this.player.animationFrame = 0;
            this.player.currentAnimationDelay = 0;
        }

        // 更新旋轉
        if (this.keys.ArrowLeft) {
            this.player.targetRotation = -this.player.maxRotation;
        } else if (this.keys.ArrowRight) {
            this.player.targetRotation = this.player.maxRotation;
        } else {
            this.player.targetRotation = 0;
        }

        // 平滑旋轉
        if (this.player.rotation < this.player.targetRotation) {
            this.player.rotation = Math.min(
                this.player.rotation + this.player.rotationSpeed,
                this.player.targetRotation
            );
        } else if (this.player.rotation > this.player.targetRotation) {
            this.player.rotation = Math.max(
                this.player.rotation - this.player.rotationSpeed,
                this.player.targetRotation
            );
        }

        // 更新位置
        if (this.keys.ArrowLeft) {
            this.player.x = Math.max(50, this.player.x - this.player.lateralSpeed);
        }
        if (this.keys.ArrowRight) {
            this.player.x = Math.min(this.app.screen.width - 50, this.player.x + this.player.lateralSpeed);
        }

        // 檢查邊界碰撞
        if (this.player.x < 50 || this.player.x > this.app.screen.width - 50) {
            this.handleCollision();
            this.player.x = Math.max(50, Math.min(this.app.screen.width - 50, this.player.x));
            this.player.speed *= 0.5;  // 撞到邊界時減速
        }

        // 更新精靈
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
        this.player.sprite.rotation = this.player.rotation;
    }

    updateRoad(delta) {
        // 根據玩家速度更新道路滾動
        const roadSpeed = this.player.speed;
        this.road1.y += roadSpeed;
        this.road2.y += roadSpeed;

        // 無縫滾動
        if (this.road1.y >= this.app.screen.height) {
            this.road1.y = this.road2.y - this.app.screen.height;
            // 當第一條道路重置時，生成新的建築物
            this.generateBuildingsForScreen(this.road1.y - this.app.screen.height);
        }
        if (this.road2.y >= this.app.screen.height) {
            this.road2.y = this.road1.y - this.app.screen.height;
            // 當第二條道路重置時，生成新的建築物
            this.generateBuildingsForScreen(this.road2.y - this.app.screen.height);
        }
    }

    updateBuildings(delta) {
        // 更新建築物位置
        const playerSpeed = this.player.speed;
        let removeCount = 0;

        // 移動所有建築物
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i - removeCount];
            if (!building) continue;

            building.y += playerSpeed;
            building.sprite.y = building.y;

            // 檢查與玩家的碰撞
            if (this.checkCollision(this.player, building)) {
                this.handleBuildingCollision(building);
            }

            // 移除超出畫面的建築物
            if (building.y > this.app.screen.height + 100) {
                this.buildingsContainer.removeChild(building.sprite);
                this.buildings.splice(i - removeCount, 1);
                removeCount++;
            }
        }
    }

    updateAIVehicles(delta) {
        this.aiVehicles.forEach((vehicle, index) => {
            let lateralMovement = 0;
            const baseRotation = vehicle.pattern === 'crossLeft' ? Math.PI * 1.5 : Math.PI;

            // 根據移動模式更新位置
            switch (vehicle.pattern) {
                case 'straight':
                    // 保持直線移動，不需要額外處理
                    break;
                case 'snake':
                    vehicle.movementPhase += vehicle.movementSpeed;
                    lateralMovement = Math.sin(vehicle.movementPhase) * vehicle.movementAmplitude;
                    vehicle.x += lateralMovement;
                    // 根據移動方向設定旋轉
                    if (lateralMovement > 0) {
                        vehicle.rotation = baseRotation - Math.min(Math.abs(lateralMovement) * 0.5, vehicle.maxRotation);
                    } else if (lateralMovement < 0) {
                        vehicle.rotation = baseRotation + Math.min(Math.abs(lateralMovement) * 0.5, vehicle.maxRotation);
                    }
                    break;
                case 'leftDrift':
                case 'rightDrift':
                case 'crossLeft':
                    vehicle.x += vehicle.driftSpeed;
                    // 保持固定旋轉角度
                    vehicle.rotation = baseRotation + (vehicle.driftSpeed > 0 ? -1 : 1) * vehicle.maxRotation;
                    break;
            }

            // 更新垂直位置
            const relativeSpeed = vehicle.speed + this.player.speed;
            if (vehicle.pattern !== 'crossLeft') {
                vehicle.y += relativeSpeed;
            } else {
                vehicle.y += relativeSpeed * 0.5; // 橫向移動時垂直速度減半
            }

            // 確保車輛不會完全離開畫面（除了 crossLeft 模式）
            if (vehicle.pattern !== 'crossLeft') {
                vehicle.x = Math.max(50, Math.min(this.app.screen.width - 50, vehicle.x));
            }

            // 更新精靈
            vehicle.sprite.x = vehicle.x;
            vehicle.sprite.y = vehicle.y;
            vehicle.sprite.rotation = vehicle.rotation;

            // 檢查碰撞
            if (this.checkCollision(this.player, vehicle)) {
                this.handleCollision();
                this.gameContainer.removeChild(vehicle.sprite);
                this.aiVehicles.splice(index, 1);
            }

            // 移除超出畫面的車輛
            if (vehicle.y > this.app.screen.height + 100 ||
                (vehicle.pattern === 'crossLeft' && vehicle.x < -100)) {
                this.gameContainer.removeChild(vehicle.sprite);
                this.aiVehicles.splice(index, 1);
            }
        });
    }

    updateScore() {
        // 更新分數和距離
        if (this.player.speed > 0) {
            this.distance += this.player.speed;
            this.score = Math.floor(this.distance / 100);
            this.scoreText.text = `Distance: ${this.score}m`;

            // 檢查是否需要更新生成間隔
            if (this.spawnIntervalDecreaseEnabled) {
                const currentHundreds = Math.floor(this.distance / 100);
                const lastHundreds = Math.floor(this.lastSpawnUpdate / 100);

                if (currentHundreds > lastHundreds) {
                    // 每100距離減少100ms生成間隔
                    const decreaseAmount = (currentHundreds - lastHundreds) * 100;
                    this.spawnInterval = Math.max(200, this.baseSpawnInterval - decreaseAmount); // 最小間隔400ms
                    this.lastSpawnUpdate = this.distance;
                }
            }
        }
        this.livesText.text = `Lives: ${this.maxCollisions - this.collisions}`;
    }

    checkCollision(rect1, rect2) {
        // 碰撞檢測（考慮精靈的錨點）
        const r1 = {
            x: rect1.x - rect1.width / 2,
            y: rect1.y - rect1.height / 2,
            width: rect1.width,
            height: rect1.height
        };
        const r2 = {
            x: rect2.x - rect2.width / 2,
            y: rect2.y - rect2.height / 2,
            width: rect2.width,
            height: rect2.height
        };

        return r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y;
    }

    handleCollision() {
        this.collisions++;
        this.player.speed *= 0.5;

        // 預加載爆炸音效，然後播放
        this.sounds.explode.load();
        setTimeout(() => {
            this.sounds.explode.play();
        }, 50);

        if (this.collisions >= this.maxCollisions) {
            this.gameOver = true;
            this.currentState = 'gameOver';

            // 停止背景音樂和引擎聲
            this.sounds.bgMusic.stop();
            this.sounds.engine.stop();

            this.showGameOverScreen();
        }
    }

    setupBuildings() {
        // 建築物圖片名稱
        this.buildingImages = ['build1', 'build2', 'build3', 'build4', 'build5', 'build6'];

        // 建築物陣列
        this.buildings = [];

        // 建築物區域設定
        this.buildingZones = {
            left: {
                start: 0,
                width: 80
            },
            right: {
                start: 720,
                width: 80
            }
        };

        // 初始生成建築物
        this.generateInitialBuildings();
    }

    generateInitialBuildings() {
        // 生成初始建築物，覆蓋整個畫面
        this.generateBuildingsForScreen(-this.app.screen.height);
        this.generateBuildingsForScreen(0);
    }

    generateBuildingsForScreen(startY) {
        // 決定這個畫面要生成幾個建築物
        const buildingCount = 6 + Math.floor(Math.random() * 3); // 8-12個建築物
        const buildings = [];

        // 先生成所有建築物的基本資訊
        for (let i = 0; i < buildingCount; i++) {
            const buildingImage = this.buildingImages[Math.floor(Math.random() * this.buildingImages.length)];
            const texture = this.textures[buildingImage];

            // 使用圖片原始大小
            const buildingWidth = texture.width;
            const buildingHeight = texture.height;

            buildings.push({
                width: buildingWidth,
                height: buildingHeight,
                image: buildingImage,
                isPlaced: false
            });
        }

        // 嘗試放置建築物
        const maxAttempts = 100; // 防止無限循環
        let attempts = 0;

        // 為左右兩側分別放置建築物
        ['left', 'right'].forEach(side => {
            const zone = this.buildingZones[side];
            let placedCount = 0;

            while (placedCount < buildingCount / 2 && attempts < maxAttempts) {
                attempts++;

                // 隨機選擇一個未放置的建築物
                const unplacedBuilding = buildings.find(b => !b.isPlaced);
                if (!unplacedBuilding) break;

                // 隨機選擇Y座標
                const y = startY + Math.random() * this.app.screen.height;

                // 根據區域調整X座標
                let x;
                if (side === 'left') {
                    x = zone.start + (zone.width - unplacedBuilding.width) / 2;
                } else {
                    x = zone.start + (zone.width - unplacedBuilding.width) / 2;
                }

                // 檢查是否與已存在的建築物重疊
                let canPlace = true;
                for (const existing of this.buildings) {
                    if (this.checkBuildingOverlap(
                        { x, y, width: unplacedBuilding.width, height: unplacedBuilding.height },
                        existing
                    )) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    this.createBuilding(
                        unplacedBuilding.image,
                        x + unplacedBuilding.width / 2,
                        y,
                        unplacedBuilding.width,
                        unplacedBuilding.height
                    );
                    unplacedBuilding.isPlaced = true;
                    placedCount++;
                }
            }
        });
    }

    checkBuildingOverlap(building1, building2) {
        // 考慮到精靈的錨點，需要調整碰撞檢測的座標
        const b1 = {
            x: building1.x - building1.width / 2,
            y: building1.y - building1.height / 2,
            width: building1.width,
            height: building1.height
        };

        const b2 = {
            x: building2.x - building2.width / 2,
            y: building2.y - building2.height / 2,
            width: building2.width,
            height: building2.height
        };

        return b1.x < b2.x + b2.width &&
            b1.x + b1.width > b2.x &&
            b1.y < b2.y + b2.height &&
            b1.y + b1.height > b2.y;
    }

    createBuilding(imageName, x, y, width, height) {
        const building = {
            sprite: new PIXI.Sprite(this.textures[imageName]),
            x: x,
            y: y,
            width: width,
            height: height
        };

        building.sprite.anchor.set(0.5);
        building.sprite.width = width;
        building.sprite.height = height;
        building.sprite.x = x;
        building.sprite.y = y;

        // 視覺變化
        building.sprite.alpha = 0.8 + Math.random() * 0.2;
        if (Math.random() > 0.5) {
            building.sprite.scale.x *= -1;
        }

        this.buildingsContainer.addChild(building.sprite);
        this.buildings.push(building);

        return building;
    }

    handleBuildingCollision(building) {
        // 減少生命值
        this.collisions++;

        // 更新UI
        this.livesText.text = `Lives: ${this.maxCollisions - this.collisions}`;

        // 播放碰撞音效
        this.sounds.explode.load();
        setTimeout(() => {
            this.sounds.explode.play();
        }, 50);

        // 反彈效果 - 強化效果
        if (this.player.x < building.x) {
            // 玩家在建築物左側，向左反彈
            this.player.x = Math.max(50, this.player.x - 30);
            // 增加旋轉效果
            this.player.targetRotation = -this.player.maxRotation;
        } else {
            // 玩家在建築物右側，向右反彈
            this.player.x = Math.min(this.app.screen.width - 50, this.player.x + 30);
            // 增加旋轉效果
            this.player.targetRotation = this.player.maxRotation;
        }

        // 明顯的減速效果
        this.player.speed *= 0.6;

        // 視覺反饋 - 建築物閃爍
        const originalAlpha = building.sprite.alpha;
        building.sprite.alpha = 1;
        building.sprite.tint = 0xFF0000; // 變紅

        // 1秒後恢復正常
        setTimeout(() => {
            building.sprite.alpha = originalAlpha;
            building.sprite.tint = 0xFFFFFF;
        }, 200);

        // 檢查遊戲結束
        if (this.collisions >= this.maxCollisions) {
            this.gameOver = true;
            this.currentState = 'gameOver';

            // 停止背景音樂和引擎聲
            this.sounds.bgMusic.stop();
            this.sounds.engine.stop();

            this.showGameOverScreen();
        }
    }

    toggleSpawnIntervalDecrease() {
        if (this.currentState === 'playing') {
            this.spawnIntervalDecreaseEnabled = !this.spawnIntervalDecreaseEnabled;
            if (this.spawnIntervalText) {
                this.spawnIntervalText.text = `Spawn Interval Decrease: ${this.spawnIntervalDecreaseEnabled ? 'ON' : 'OFF'}`;
            }
            // 重置生成間隔
            if (!this.spawnIntervalDecreaseEnabled) {
                this.spawnInterval = this.baseSpawnInterval;
            }
        }
    }

    gameLoop(delta) {
        if (this.currentState === 'playing') {
            this.updatePlayer(delta);
            this.updateRoad(delta);
            this.updateBuildings(delta);
            this.updateAIVehicles(delta);
            this.updateScore();
        }
    }
} 