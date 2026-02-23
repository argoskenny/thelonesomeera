/*************************************************
 * 全域設定與狀態
 *************************************************/

// 遊戲設定（不建議修改，遊戲機制會依此設定）
const Config = {
    aspectRatio: 4 / 3,
    maxWidth: 1024,
    maxHeight: 768,
    playerHeight: 1.8,
    playerSpeed: 5,
    playerSprintSpeed: 10,
    bulletSpeed: 30,
    fireRate: 100, // 每次射擊間隔（毫秒）
    enemySpawnRate: 3000, // 敵人生成間隔（毫秒）
    enemySpawnDistance: { min: 10, max: 20 },
    enemyTypes: {
        cube: { speed: 1.5, health: 3, color: 0xff0000, damage: 10 },
        cylinder: { speed: 2.5, health: 2, color: 0x00ff00, damage: 15 },
        cone: { speed: 4, health: 1, color: 0x0000ff, damage: 20 }
    },
    playerRadius: 0.5, // 玩家碰撞半徑
    buildingCollisionMargin: 1.0, // 建築物碰撞邊距
    maxPlayerHP: 100, // 玩家最大血量
    damageInterval: 500 // 受傷間隔（毫秒）
};

// 遊戲狀態（遊戲過程中的資料紀錄）
const State = {
    playing: false,
    gameOver: false,
    paused: false,
    time: 0,
    kills: 0,
    lastShot: 0,
    enemies: [],
    bullets: [],
    lastEnemySpawn: 0,
    spawnMultiplier: 1,
    buildings: [],
    playerHP: Config.maxPlayerHP,
    lastDamageTime: 0,
    keys: { w: false, a: false, s: false, d: false, shift: false },
    mouseDown: false,
    audio: {} // AudioManager會填入
};


/*************************************************
 * AudioManager 模組
 * 管理所有音效：背景音樂、射擊與受傷音效
 *************************************************/
class AudioManager {
    constructor() {
        this.audio = {
            bgm: new Audio('assets/battle.mp3'),
            bulletSound: new Audio('assets/bullet.mp3'),
            damageSound: new Audio('assets/damage.mp3')
        };
        this.audio.bgm.loop = true;
        this.audio.bgm.volume = 0.5;
        this.audio.bulletSound.volume = 0.3;
        this.audio.damageSound.volume = 0.4;
        // 將音效物件存入全域狀態中
        State.audio = this.audio;
    }
    playBGM() {
        this.audio.bgm.currentTime = 0;
        this.audio.bgm.play();
    }
    pauseBGM() {
        this.audio.bgm.pause();
    }
    playBulletSound() {
        this.audio.bulletSound.currentTime = 0;
        this.audio.bulletSound.play();
    }
    playDamageSound() {
        this.audio.damageSound.currentTime = 0;
        this.audio.damageSound.play();
    }
}


/*************************************************
 * UIManager 模組
 * 負責管理遊戲介面：開始畫面、遊戲結束畫面、暫停畫面、計分板、HP條等
 *************************************************/
class UIManager {
    constructor() {
        // 取得遊戲頁面上的 DOM 元素
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.timerDisplay = document.getElementById('timer');
        this.killsDisplay = document.getElementById('kills');

        // 遊戲結束時顯示的元素
        this.finalTimeDisplay = document.getElementById('finalTime');
        this.finalKillsDisplay = document.getElementById('finalKills');

        // 建立暫停畫面
        this.pauseScreen = document.createElement('div');
        this.pauseScreen.id = 'pauseScreen';
        Object.assign(this.pauseScreen.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '10px',
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '24px',
            zIndex: '1000'
        });
        // 暫停標題
        const pauseTitle = document.createElement('div');
        pauseTitle.textContent = '遊戲暫停';
        pauseTitle.style.marginBottom = '20px';
        this.pauseScreen.appendChild(pauseTitle);
        // 繼續遊戲按鈕
        this.resumeButton = document.createElement('button');
        this.resumeButton.textContent = '繼續遊戲';
        Object.assign(this.resumeButton.style, {
            fontSize: '20px',
            padding: '10px 20px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            border: 'none',
            color: 'white',
            borderRadius: '5px'
        });
        this.pauseScreen.appendChild(this.resumeButton);
        document.body.appendChild(this.pauseScreen);
    }
    // 更新計分、時間與HP條顯示
    updateUI() {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `Time: ${Math.floor(State.time)}s`;
        }
        if (this.killsDisplay) {
            this.killsDisplay.textContent = `Kills: ${State.kills}`;
        }
        this.updateHPBar();
    }
    // 建立與更新HP條（如不存在則建立）
    updateHPBar() {
        let hpBar = document.getElementById('hpBar');
        let hpFill = document.getElementById('hpFill');
        let hpText = document.getElementById('hpText');
        if (!hpBar || !hpFill) {
            hpBar = document.createElement('div');
            hpBar.id = 'hpBar';
            const killsRect = this.killsDisplay.getBoundingClientRect();
            Object.assign(hpBar.style, {
                position: 'absolute',
                left: `${killsRect.left}px`,
                top: `${killsRect.bottom + 10}px`,
                width: '200px',
                height: '20px',
                backgroundColor: '#ff0000',
                border: '2px solid #ffffff',
                zIndex: '1000'
            });
            hpFill = document.createElement('div');
            hpFill.id = 'hpFill';
            Object.assign(hpFill.style, {
                width: '100%',
                height: '100%',
                backgroundColor: '#00ff00',
                transition: 'width 0.2s ease-out'
            });
            hpText = document.createElement('div');
            hpText.id = 'hpText';
            Object.assign(hpText.style, {
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                color: '#ffffff',
                lineHeight: '20px',
                textShadow: '1px 1px 2px #000000'
            });
            hpText.textContent = `HP: ${State.playerHP}/${Config.maxPlayerHP}`;
            hpBar.appendChild(hpFill);
            hpBar.appendChild(hpText);
            document.body.appendChild(hpBar);
        } else {
            const hpPercentage = (State.playerHP / Config.maxPlayerHP) * 100;
            hpFill.style.width = `${hpPercentage}%`;
            const killsRect = this.killsDisplay.getBoundingClientRect();
            hpBar.style.left = `${killsRect.left}px`;
            hpBar.style.top = `${killsRect.bottom + 10}px`;
            hpText.textContent = `HP: ${State.playerHP}/${Config.maxPlayerHP}`;
        }
    }
    // 顯示遊戲結束畫面
    showGameOver(time, kills) {
        if (this.finalTimeDisplay) {
            this.finalTimeDisplay.textContent = `生存時間: ${time}秒`;
        }
        if (this.finalKillsDisplay) {
            this.finalKillsDisplay.textContent = `擊殺數: ${kills}`;
        }
        Object.assign(this.gameOverScreen.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '24px'
        });
    }
    // 顯示暫停畫面
    showPause() {
        this.pauseScreen.style.display = 'flex';
    }
    // 隱藏暫停畫面
    hidePause() {
        this.pauseScreen.style.display = 'none';
    }
}


/*************************************************
 * CityManager 模組
 * 管理城市與建築物：生成建築物、隨機顏色、碰撞檢測等
 *************************************************/
class CityManager {
    constructor(scene) {
        this.scene = scene;
        this.cityGroup = new THREE.Group();
        this.scene.add(this.cityGroup);
    }
    // 建立整座城市（包含多棟建築物）
    createCity() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            const width = Math.random() * 10 + 2;
            const height = Math.random() * 15 + 5;
            const depth = Math.random() * 10 + 2;
            this.createBuilding(x, 0, z, width, height, depth);
        }
    }
    // 建立單一建築物並加入城市群組，同時儲存建築物資訊供碰撞檢查使用
    createBuilding(x, y, z, width, height, depth) {
        // 避免建築物生成於玩家附近
        if (Math.sqrt(x * x + z * z) < 10) return;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshLambertMaterial({
            color: this.getRandomNeonColor(),
            emissive: this.getRandomNeonColor(),
            emissiveIntensity: 0.2
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, y + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.cityGroup.add(building);
        // 將建築物資訊存入全域狀態中（用於碰撞檢查）
        State.buildings.push({
            mesh: building,
            width: width,
            height: height,
            depth: depth,
            position: new THREE.Vector3(x, y + height / 2, z)
        });
        // 隨機添加點光源
        if (Math.random() > 0.7) {
            const lightColor = this.getRandomNeonColor();
            const light = new THREE.PointLight(lightColor, 1, 5);
            light.position.set(0, height / 2, 0);
            building.add(light);
        }
    }
    // 隨機回傳一個霓虹色
    getRandomNeonColor() {
        const neonColors = [0xff0055, 0xff6600, 0xaaff00, 0x00ffaa, 0x0088ff, 0x8800ff];
        return neonColors[Math.floor(Math.random() * neonColors.length)];
    }
    // 判斷某個點是否位於任一建築物內
    isPointInBuilding(point) {
        for (const building of State.buildings) {
            const halfWidth = building.width / 2;
            const halfDepth = building.depth / 2;
            if (
                point.x >= building.position.x - halfWidth &&
                point.x <= building.position.x + halfWidth &&
                point.z >= building.position.z - halfDepth &&
                point.z <= building.position.z + halfDepth
            ) {
                return true;
            }
        }
        return false;
    }
    // 檢查移動後的位置是否會與建築物碰撞，並回傳調整後的位置（滑動效果）
    checkCollision(position, radius) {
        let finalPosition = position.clone();
        for (const building of State.buildings) {
            const halfWidth = building.width / 2 + Config.buildingCollisionMargin;
            const halfDepth = building.depth / 2 + Config.buildingCollisionMargin;
            const dx = finalPosition.x - building.position.x;
            const dz = finalPosition.z - building.position.z;
            if (Math.abs(dx) < halfWidth + radius && Math.abs(dz) < halfDepth + radius) {
                const overlapX = halfWidth + radius - Math.abs(dx);
                const overlapZ = halfDepth + radius - Math.abs(dz);
                if (overlapX < overlapZ) {
                    finalPosition.x += dx > 0 ? overlapX : -overlapX;
                } else {
                    finalPosition.z += dz > 0 ? overlapZ : -overlapZ;
                }
            }
        }
        return finalPosition;
    }
}


/*************************************************
 * EnemyManager 模組
 * 負責敵人的生成、移動、玩家碰撞與血量處理
 *************************************************/
class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.lastSpawnTime = 0;
    }
    spawnEnemies() {
        const now = Date.now();
        if (now - State.lastEnemySpawn < Config.enemySpawnRate / State.spawnMultiplier) return;
        State.lastEnemySpawn = now;
        if (State.time > 30) {
            State.spawnMultiplier = 1 + Math.floor(State.time / 30) * 0.5;
        }
        const spawnCount = Math.min(Math.floor(State.spawnMultiplier), 5);
        for (let i = 0; i < spawnCount; i++) {
            let spawnPosition;
            let attempts = 0;
            const maxAttempts = 10;
            do {
                const angle = Math.random() * Math.PI * 2;
                const distance = Config.enemySpawnDistance.min +
                    Math.random() * (Config.enemySpawnDistance.max - Config.enemySpawnDistance.min);
                const x = game.camera.position.x + Math.sin(angle) * distance;
                const z = game.camera.position.z + Math.cos(angle) * distance;
                spawnPosition = new THREE.Vector3(x, 0, z);
                attempts++;
            } while (game.cityManager.isPointInBuilding(spawnPosition) && attempts < maxAttempts);
            if (attempts >= maxAttempts) continue;
            const enemyTypes = Object.keys(Config.enemyTypes);
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const enemyConfig = Config.enemyTypes[enemyType];
            let geometry;
            switch (enemyType) {
                case 'cube':
                    geometry = new THREE.BoxGeometry(1, 1, 1);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(0.5, 1.5, 16);
                    break;
            }
            const material = new THREE.MeshLambertMaterial({ color: enemyConfig.color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(spawnPosition);
            mesh.position.y = enemyType === 'cylinder' || enemyType === 'cone' ? 0.75 : 0.5;
            mesh.castShadow = true;
            this.scene.add(mesh);
            // 初始化時新增新屬性：attracted、launched 與 velocity
            State.enemies.push({
                mesh: mesh,
                type: enemyType,
                health: enemyConfig.health,
                speed: enemyConfig.speed,
                attracted: false,         // 是否被吸引
                launched: false,          // 是否已發射
                velocity: new THREE.Vector3() // 發射時的速度向量
            });
        }
    }
    // ── EnemyManager 更新敵人行為的修改部分 ──
    updateEnemies(delta, camera, audioManager, cityManager, gameInstance) {
        // 更新每一個 enemy 的狀態
        for (let i = State.enemies.length - 1; i >= 0; i--) {
            const enemy = State.enemies[i];

            // 處理被吸引但尚未發射的 enemy
            if (enemy.attracted && !enemy.launched) {
                const offset = new THREE.Vector3();
                camera.getWorldDirection(offset);
                offset.multiplyScalar(2); // 靠近玩家前方 2 單位
                enemy.mesh.position.copy(camera.position.clone().add(offset));
                continue;
            } else if (enemy.launched) {
                // 處理發射狀態的 enemy

                // 加入重力效果（向下加速度）
                const gravity = 20; // 可根據需求調整
                enemy.velocity.y -= gravity * delta;

                // 計算預期新位置
                let newPosition = enemy.mesh.position.clone().addScaledVector(enemy.velocity, delta);

                // 檢查地面碰撞（假設地板在 y=0，enemy 高度約 1，所以最低 y 為 0.5）
                const enemyHalfHeight = 0.5;
                if (newPosition.y < enemyHalfHeight) {
                    newPosition.y = enemyHalfHeight;
                    enemy.velocity.y = 0;
                }

                // 檢查與建築物的水平碰撞（以 enemy 半徑約 0.5，並加上建築物邊界裕量）
                for (const building of State.buildings) {
                    const halfWidth = building.width / 2 + 0.5;
                    const halfDepth = building.depth / 2 + 0.5;
                    if (
                        newPosition.x >= building.position.x - halfWidth &&
                        newPosition.x <= building.position.x + halfWidth &&
                        newPosition.z >= building.position.z - halfDepth &&
                        newPosition.z <= building.position.z + halfDepth
                    ) {
                        // 遇到建築物，取消水平位移並將水平速度歸零
                        newPosition.x = enemy.mesh.position.x;
                        newPosition.z = enemy.mesh.position.z;
                        enemy.velocity.x = 0;
                        enemy.velocity.z = 0;
                    }
                }

                // 如果水平與垂直速度皆近似為 0，開始計時
                if (Math.abs(enemy.velocity.x) < 0.01 && Math.abs(enemy.velocity.z) < 0.01 && enemy.velocity.y === 0) {
                    if (!enemy.stoppedTime) {
                        enemy.stoppedTime = Date.now();
                    } else if (Date.now() - enemy.stoppedTime > 1000) {
                        // 靜止 1 秒後從場景移除
                        gameInstance.scene.remove(enemy.mesh);
                        State.enemies.splice(i, 1);
                        continue;
                    }
                } else {
                    enemy.stoppedTime = null;
                }

                // 更新 enemy 位置
                enemy.mesh.position.copy(newPosition);
                continue;
            }

            // 正常 enemy 行為（未吸引、未發射）
            const direction = new THREE.Vector3().subVectors(camera.position, enemy.mesh.position).normalize();
            const enemySpeed = enemy.speed * delta;
            let newPosition = enemy.mesh.position.clone();
            newPosition.x += direction.x * enemySpeed;
            newPosition.z += direction.z * enemySpeed;
            newPosition = cityManager.checkCollision(newPosition, 0.5);
            enemy.mesh.position.copy(newPosition);
            enemy.mesh.lookAt(camera.position);

            // 與玩家碰撞（只處理未被吸引的 enemy）
            const collisionDistance = Config.playerRadius + 1.0;
            if (enemy.mesh.position.distanceTo(camera.position) < collisionDistance && !enemy.attracted) {
                gameInstance.scene.remove(enemy.mesh);
                State.enemies.splice(i, 1);
                State.playerHP -= 10;
                State.lastDamageTime = Date.now();
                audioManager.playDamageSound();
                gameInstance.uiManager.updateUI();
                if (State.playerHP <= 0) {
                    State.playerHP = 0;
                    gameInstance.uiManager.updateUI();
                    gameInstance.gameOver();
                    return;
                }
            }
        }

        // ── 檢查發射中 enemy 與其他 enemy 之間的碰撞 ──
        // 當發射中的 enemy 與任一其它 enemy 的距離小於 collisionThreshold 時，兩者皆消失
        let indicesToRemove = new Set();
        const collisionThreshold = 1; // 可依需求調整碰撞距離
        for (let i = 0; i < State.enemies.length; i++) {
            const enemyA = State.enemies[i];
            if (!enemyA.launched) continue; // 只針對發射中的 enemy 檢查
            for (let j = 0; j < State.enemies.length; j++) {
                if (i === j) continue;
                const enemyB = State.enemies[j];
                if (enemyA.mesh.position.distanceTo(enemyB.mesh.position) < collisionThreshold) {
                    indicesToRemove.add(i);
                    indicesToRemove.add(j);
                }
            }
        }
        // 依照從大到小的順序移除，以免索引錯亂
        const sortedIndices = Array.from(indicesToRemove).sort((a, b) => b - a);
        for (let index of sortedIndices) {
            const enemy = State.enemies[index];
            gameInstance.scene.remove(enemy.mesh);
            State.enemies.splice(index, 1);
        }
    }
}


/*************************************************
 * BulletManager 模組
 * 負責子彈的生成、移動、與敵人的碰撞檢測
 *************************************************/
class BulletManager {
    constructor(scene) {
        this.scene = scene;
    }
    // 生成子彈（須考慮射擊速率限制）
    shoot(camera, audioManager) {
        const now = Date.now();
        if (now - State.lastShot < Config.fireRate) return;
        State.lastShot = now;
        audioManager.playBulletSound();
        const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(camera.position);
        bullet.userData.direction = new THREE.Vector3(0, 0, -1);
        bullet.userData.direction.unproject(camera);
        bullet.userData.direction.sub(camera.position).normalize();
        this.scene.add(bullet);
        State.bullets.push(bullet);
    }
    // 更新所有子彈的位置，並檢查與敵人的碰撞與射程
    updateBullets(delta, camera) {
        for (let i = State.bullets.length - 1; i >= 0; i--) {
            const bullet = State.bullets[i];
            const bulletSpeed = Config.bulletSpeed * delta;
            bullet.position.x += bullet.userData.direction.x * bulletSpeed;
            bullet.position.y += bullet.userData.direction.y * bulletSpeed;
            bullet.position.z += bullet.userData.direction.z * bulletSpeed;
            let bulletRemoved = false;
            for (let j = State.enemies.length - 1; j >= 0; j--) {
                const enemy = State.enemies[j];
                const distance = bullet.position.distanceTo(enemy.mesh.position);
                if (distance < 1) {
                    enemy.health -= 1;
                    if (enemy.health <= 0) {
                        this.scene.remove(enemy.mesh);
                        State.enemies.splice(j, 1);
                        State.kills++;
                    }
                    this.scene.remove(bullet);
                    State.bullets.splice(i, 1);
                    bulletRemoved = true;
                    break;
                }
            }
            if (bulletRemoved) continue;
            if (bullet.position.distanceTo(camera.position) > 100) {
                this.scene.remove(bullet);
                State.bullets.splice(i, 1);
            }
        }
    }
    // 清除所有子彈（例如重置遊戲時使用）
    clearBullets() {
        State.bullets.forEach(bullet => this.scene.remove(bullet));
        State.bullets = [];
    }
}


/*************************************************
 * Controls 模組
 * 封裝滑鼠指針鎖定控制，優先使用 THREE.PointerLockControls，如不存在則使用備用方案
 *************************************************/
class Controls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        if (typeof THREE.PointerLockControls !== 'undefined') {
            this.controls = new THREE.PointerLockControls(camera, domElement);
        } else {
            this.controls = new FallbackControls(camera, domElement);
        }
    }
    lock() {
        if (this.controls.lock) this.controls.lock();
    }
    unlock() {
        if (this.controls.unlock) this.controls.unlock();
    }
    connect() {
        if (this.controls.connect) this.controls.connect();
    }
    moveForward(distance) {
        if (this.controls.moveForward) this.controls.moveForward(distance);
    }
    moveRight(distance) {
        if (this.controls.moveRight) this.controls.moveRight(distance);
    }
    getDirection() {
        if (this.controls.getDirection) return this.controls.getDirection();
        return new THREE.Vector3(0, 0, -1);
    }
}

// 備用的指針鎖定控制（當 THREE.PointerLockControls 不存在時使用）
class FallbackControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.isLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        this.sensitivity = 0.002;
        this.connect();
    }
    connect() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('pointerlockchange', this.onPointerlockChange.bind(this));
    }
    lock() {
        this.domElement.requestPointerLock();
    }
    unlock() {
        document.exitPointerLock();
    }
    onMouseMove(event) {
        if (!this.isLocked) return;
        const movementX = event.movementX || event.mozMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || 0;
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * this.sensitivity;
        this.euler.x -= movementY * this.sensitivity;
        this.euler.x = Math.max(Math.PI / 2 - this.maxPolarAngle, Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
    }
    onPointerlockChange() {
        this.isLocked = document.pointerLockElement === this.domElement || document.mozPointerLockElement === this.domElement;
        if (this.isLocked) {
            State.playing = true;
        } else if (State.playing) {
            State.playing = false;
        }
    }
    moveForward(distance) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.y = 0;
        direction.normalize();
        this.camera.position.addScaledVector(direction, distance);
    }
    moveRight(distance) {
        const direction = new THREE.Vector3(1, 0, 0);
        direction.applyQuaternion(this.camera.quaternion);
        direction.y = 0;
        direction.normalize();
        this.camera.position.addScaledVector(direction, distance);
    }
    getDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
}


/*************************************************
 * InputHandler 模組
 * 處理鍵盤、滑鼠與指針鎖定的事件，並觸發相應的遊戲動作
 *************************************************/
class InputHandler {
    constructor(canvas, controls, uiManager) {
        this.canvas = canvas;
        this.controls = controls;
        this.uiManager = uiManager;
        this.addEventListeners();
    }
    addEventListeners() {
        // 鍵盤事件
        document.addEventListener('keydown', e => this.handleKeyDown(e));
        document.addEventListener('keyup', e => this.handleKeyUp(e));
        // 滑鼠事件
        document.addEventListener('mousedown', e => this.handleMouseDown(e));
        document.addEventListener('mouseup', e => this.handleMouseUp(e));
        // 禁止右鍵開啟預設選單
        document.addEventListener('contextmenu', e => e.preventDefault());
        // 指針鎖定變更
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
    }
    handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'w': State.keys.w = true; break;
            case 'a': State.keys.a = true; break;
            case 's': State.keys.s = true; break;
            case 'd': State.keys.d = true; break;
            case 'shift': State.keys.shift = true; break;
            case 'escape':
                if (State.playing && !State.gameOver) {
                    // 切換暫停狀態
                    if (State.paused) {
                        State.paused = false;
                        this.uiManager.hidePause();
                        this.controls.lock();
                    } else {
                        State.paused = true;
                        this.uiManager.showPause();
                        this.controls.unlock();
                        // 暫停背景音樂
                        State.audio.bgm.pause();
                    }
                }
                break;
        }
    }
    handleKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w': State.keys.w = false; break;
            case 'a': State.keys.a = false; break;
            case 's': State.keys.s = false; break;
            case 'd': State.keys.d = false; break;
            case 'shift': State.keys.shift = false; break;
        }
    }
    handleMouseDown(e) {
        if (e.button === 0) { // 左鍵射擊
            State.mouseDown = true;
        } else if (e.button === 2) { // 右鍵吸引/發射
            // 呼叫遊戲新增的吸引/發射處理方法
            if (window.game) {
                window.game.handleAttractAndLaunch();
            }
        }
    }
    handleMouseUp(e) {
        if (e.button === 0) {
            State.mouseDown = false;
        }
    }
    handlePointerLockChange() {
        const isLocked = document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas;
        if (isLocked) {
            if (!State.gameOver) {
                State.playing = true;
                State.paused = false;
                this.uiManager.hidePause();
            }
        } else {
            if (State.playing && !State.gameOver) {
                State.paused = true;
                this.uiManager.showPause();
            }
        }
    }
}


/*************************************************
 * 主遊戲類別 Game
 * 整合各模組，初始化 Three.js 場景、控制器、事件、並進入動畫循環
 *************************************************/
class Game {
    constructor() {
        // 取得 canvas 與建立場景、相機與渲染器
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000033, 0.015);
        this.camera = new THREE.PerspectiveCamera(75, Config.aspectRatio, 0.1, 1000);
        this.camera.position.set(0, Config.playerHeight, 0);
        this.camera.rotation.order = 'YXZ';
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(Config.maxWidth, Config.maxHeight);
        this.renderer.setClearColor(0x000033);

        // 初始化各模組
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager();
        this.controls = new Controls(this.camera, this.canvas);
        this.controls.connect();
        this.inputHandler = new InputHandler(this.canvas, this.controls, this.uiManager);
        this.cityManager = new CityManager(this.scene);
        this.cityManager.createCity();
        this.enemyManager = new EnemyManager(this.scene);
        this.bulletManager = new BulletManager(this.scene);

        // 新增屬性：記錄當前被吸引的敵人（一次僅能有一個）
        this.attractedEnemy = null;

        // 初始化光源與地板
        this.setupLights();
        this.createFloor();

        // 初始化動畫循環
        this.lastFrameTime = Date.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    // 建立場景光源（環境光、方向光、與彩色點光源）
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 10, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        const colors = [0xff00ff, 0x00ffff, 0xffff00];
        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 1, 15);
            light.position.set(
                Math.sin(i * Math.PI * 2 / 3) * 15,
                2 + Math.random() * 3,
                Math.cos(i * Math.PI * 2 / 3) * 15
            );
            this.scene.add(light);
        });
    }

    // 新增方法：處理右鍵吸引/發射功能
    handleAttractAndLaunch() {
        // 若已有敵人被吸引中，則發射該敵人
        if (this.attractedEnemy) {
            const launchSpeed = 50; // 可根據需求調整發射速度
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            // 設定發射狀態與發射速度
            this.attractedEnemy.launched = true;
            this.attractedEnemy.attracted = false;
            this.attractedEnemy.velocity.copy(direction).multiplyScalar(launchSpeed);
            // 清除記錄，等待下一次吸引
            this.attractedEnemy = null;
        } else {
            // 若沒有被吸引的敵人，找出距離最近的一個敵人（距離必須在 100 單位內）
            let nearestEnemy = null;
            let minDistance = Infinity;
            const playerPos = this.camera.position;
            for (let enemy of State.enemies) {
                if (!enemy.attracted && !enemy.launched) {
                    const distance = enemy.mesh.position.distanceTo(playerPos);
                    if (distance < 100 && distance < minDistance) {
                        nearestEnemy = enemy;
                        minDistance = distance;
                    }
                }
            }
            if (nearestEnemy) {
                nearestEnemy.attracted = true;
                this.attractedEnemy = nearestEnemy;
            }
        }
    }

    // 建立地板與網格輔助線
    createFloor() {
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.2
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
    }
    // 開始遊戲：重置狀態、隱藏開始畫面、播放音樂、鎖定指針
    startGame() {
        this.uiManager.startScreen.style.display = 'none';
        this.clearEnemiesAndBullets();
        State.playing = false;
        State.gameOver = false;
        State.time = 0;
        State.kills = 0;
        State.spawnMultiplier = 1;
        State.enemies = [];
        State.bullets = [];
        State.playerHP = Config.maxPlayerHP;
        State.lastDamageTime = 0;
        this.audioManager.playBGM();
        this.uiManager.updateUI();
        this.controls.lock();
    }
    // 重啟遊戲：隱藏遊戲結束畫面並重新開始
    restartGame() {
        this.uiManager.gameOverScreen.style.display = 'none';
        this.startGame();
    }
    // 遊戲結束：停止遊戲、暫停音樂、顯示結束畫面、解除指針鎖定
    gameOver() {
        State.playing = false;
        State.gameOver = true;
        this.audioManager.pauseBGM();
        this.uiManager.showGameOver(Math.floor(State.time), State.kills);
        this.controls.unlock();
    }
    // 清除場景中的所有敵人與子彈
    clearEnemiesAndBullets() {
        State.bullets.forEach(bullet => this.scene.remove(bullet));
        State.enemies.forEach(enemy => this.scene.remove(enemy.mesh));
        State.bullets = [];
        State.enemies = [];
    }
    // 更新玩家移動（依鍵盤方向與衝刺狀態）
    updatePlayerMovement(delta) {
        if (!State.playing) return;
        const speed = State.keys.shift ? Config.playerSprintSpeed : Config.playerSpeed;
        const actualSpeed = speed * delta;
        const newPosition = this.camera.position.clone();
        let moved = false;
        // 前後移動
        if (State.keys.w || State.keys.s) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();
            const moveAmount = State.keys.w ? actualSpeed : -actualSpeed;
            newPosition.addScaledVector(forward, moveAmount);
            moved = true;
        }
        // 左右移動
        if (State.keys.a || State.keys.d) {
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();
            const moveAmount = State.keys.d ? actualSpeed : -actualSpeed;
            newPosition.addScaledVector(right, moveAmount);
            moved = true;
        }
        if (moved) {
            const adjustedPosition = this.cityManager.checkCollision(newPosition, Config.playerRadius);
            this.camera.position.copy(adjustedPosition);
        }
    }
    // 主動畫循環：更新時間、生成敵人、更新玩家移動、子彈與敵人狀態、UI更新並渲染場景
    animate() {
        const now = Date.now();
        const delta = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        if (State.playing && !State.paused) {
            State.time += delta;
            this.enemyManager.spawnEnemies();
            this.updatePlayerMovement(delta);
            if (State.mouseDown) {
                this.bulletManager.shoot(this.camera, this.audioManager);
            }
            this.bulletManager.updateBullets(delta, this.camera);
            this.enemyManager.updateEnemies(delta, this.camera, this.audioManager, this.cityManager, this);
        }
        this.uiManager.updateUI();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}


/*************************************************
 * 啟動遊戲
 * 當網頁載入完成後，建立 Game 實例並綁定按鈕事件
 *************************************************/
window.addEventListener('load', () => {
    window.game = new Game(); // 全域化 game 方便其他模組呼叫
    // 綁定開始按鈕事件
    game.uiManager.startButton.addEventListener('click', () => {
        game.startGame();
    });
    // 綁定重新開始按鈕事件
    game.uiManager.restartButton.addEventListener('click', () => {
        game.restartGame();
    });
    // 綁定暫停畫面中繼續按鈕事件
    game.uiManager.resumeButton.addEventListener('click', () => {
        if (State.paused) {
            State.paused = false;
            game.controls.lock();
            game.audioManager.playBGM();
            game.uiManager.hidePause();
        }
    });
});