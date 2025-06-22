// Vue 應用程序主要邏輯 - 響應式設計優化版本
const { createApp } = Vue;

createApp({
    data() {
        return {
            // 當前顯示的區塊
            currentSection: 'home',
            
            // 手機選單狀態
            mobileMenuOpen: false,
            
            // 響應式狀態
            isMobileView: false,
            isTabletView: false,
            windowWidth: window.innerWidth,
            
            // 作品分享數據
            projects: [
                {
                    id: 1,
                    title: '小明問答遊戲',
                    description: '一個基於 Web 技術的互動問答遊戲，包含多媒體元素與響應式設計，讓使用者在遊戲中學習。',
                    image: 'assets/xiaoming/imgs/mvp.png',
                    tags: ['JavaScript', 'HTML5', 'CSS3', '遊戲開發'],
                    link: 'xiaoming/index.html'
                },
                {
                    id: 2,
                    title: 'Hell Rider 競速遊戲',
                    description: '使用原生 JavaScript 開發的 2D 競速遊戲，具有物理引擎和碰撞偵測系統。',
                    image: 'hellrider/pagebg1.png',
                    tags: ['Canvas', 'JavaScript', '遊戲引擎', '物理模擬'],
                    link: 'hellrider/index.html'
                },
                {
                    id: 3,
                    title: 'Sox 射擊遊戲',
                    description: '以 Web 技術打造的射擊遊戲，包含音效系統和動畫效果，展現前端技術在遊戲開發的可能性。',
                    image: 'sox/favicon.svg',
                    tags: ['Vue.js', 'Web Audio API', '動畫', '遊戲設計'],
                    link: 'sox/index.html'
                }
            ],
            
            // 技術文章數據
            articles: [
                {
                    id: 1,
                    title: '前端遊戲開發實戰：從零到一打造 Web 遊戲',
                    excerpt: '探討如何使用純 JavaScript 和 Canvas API 開發遊戲，包含碰撞偵測、物理引擎和音效系統的實作心得。',
                    date: '2024-03-15',
                    category: '前端開發',
                    link: 'tech/web-game-development.html'
                },
                {
                    id: 2,
                    title: 'Vue.js 3 Composition API 深度解析',
                    excerpt: '從實際專案角度分析 Vue 3 的 Composition API，如何讓程式碼更具可維護性和重用性。',
                    date: '2024-03-10',
                    category: 'Vue.js',
                    link: 'tech/vue3-composition-api.html'
                },
                {
                    id: 3,
                    title: 'CSS Grid 與 Flexbox：何時使用哪一個？',
                    excerpt: '詳細比較 CSS Grid 和 Flexbox 的使用場景，透過實際案例說明如何選擇合適的布局方案。',
                    date: '2024-03-05',
                    category: 'CSS',
                    link: 'tech/css-grid-vs-flexbox.html'
                },
                {
                    id: 4,
                    title: 'Web 效能優化：從載入時間到使用者體驗',
                    excerpt: '分享實際專案中的效能優化經驗，包含圖片優化、程式碼分割和快取策略。',
                    date: '2024-02-28',
                    category: '效能優化',
                    link: 'tech/web-performance-optimization.html'
                },
                {
                    id: 5,
                    title: '響應式設計的進階技巧：超越 Bootstrap',
                    excerpt: '探討現代響應式設計的最佳實踐，如何創造更好的跨裝置使用體驗。',
                    date: '2024-02-20',
                    category: '響應式設計',
                    link: 'tech/advanced-responsive-design.html'
                }
            ]
        }
    },
    
    computed: {
        // 計算最新文章（響應式）
        latestArticles() {
            return this.articles
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, this.isMobileView ? 3 : 5);
        },
        
        // 計算精選作品（響應式）
        featuredProjects() {
            return this.isMobileView ? this.projects.slice(0, 2) : this.projects;
        },
        
        // 計算當前裝置類型
        deviceType() {
            if (this.windowWidth <= 768) return 'mobile';
            if (this.windowWidth <= 1024) return 'tablet';
            return 'desktop';
        }
    },
    
    watch: {
        // 監聽區塊變化，更新頁面標題
        currentSection(newSection) {
            const titles = {
                home: 'The Lonesome Era | 一個屬於創作者與思考者的技術角落',
                projects: '作品分享 | The Lonesome Era',
                articles: '技術文章 | The Lonesome Era',
                observations: '科技觀察 | The Lonesome Era',
                about: '關於我們 | The Lonesome Era'
            };
            document.title = titles[newSection] || titles.home;
        },
        
        // 監聽視窗寬度變化
        windowWidth(newWidth) {
            this.updateDeviceState(newWidth);
            
            // 如果從手機版切換到桌機版，自動關閉手機選單
            if (newWidth > 768 && this.mobileMenuOpen) {
                this.mobileMenuOpen = false;
            }
        }
    },
    
    methods: {
        // 更新裝置狀態
        updateDeviceState(width) {
            this.isMobileView = width <= 768;
            this.isTabletView = width > 768 && width <= 1024;
        },
        
        // 切換手機選單（加強版）
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            
            // 防止背景滾動
            if (this.mobileMenuOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        },
        
        // 關閉手機選單
        closeMobileMenu() {
            this.mobileMenuOpen = false;
            document.body.style.overflow = '';
        },
        
        // 切換顯示區塊（加強版）
        changeSection(section) {
            this.currentSection = section;
            this.closeMobileMenu(); // 選擇後關閉手機選單
            
            // 平滑滾動到頂部
            this.scrollToTop();
            
            // 更新 URL hash
            this.updateUrlHash(section);
            
            // 觸發頁面分析（如果有 GA）
            this.trackPageView(section);
        },
        
        // 更新 URL hash
        updateUrlHash(section) {
            if (history.pushState) {
                history.pushState(null, null, `#${section}`);
            } else {
                window.location.hash = section;
            }
        },
        
        // 頁面分析追蹤
        trackPageView(section) {
            // 如果有 Google Analytics 或其他分析工具
            if (typeof gtag !== 'undefined') {
                gtag('config', 'GA_MEASUREMENT_ID', {
                    page_title: document.title,
                    page_location: window.location.href
                });
            }
        },
        
        // 格式化日期
        formatDate(dateString) {
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            return new Date(dateString).toLocaleDateString('zh-TW', options);
        },
        
        // 處理卡片點擊事件（加強版）
        handleCardClick(link, event) {
            if (link && link !== '#') {
                // 防止事件冒泡
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                // 根據裝置類型決定開啟方式
                if (this.isMobileView) {
                    window.location.href = link;
                } else {
                    window.open(link, '_blank', 'noopener,noreferrer');
                }
            }
        },
        
        // 滾動到下一個區塊
        scrollToNextSection() {
            const sections = ['home', 'projects', 'articles', 'observations', 'about'];
            const currentIndex = sections.indexOf(this.currentSection);
            const nextIndex = (currentIndex + 1) % sections.length;
            this.changeSection(sections[nextIndex]);
        },
        
        // 處理滾動事件（節流版本）
        handleScroll: null, // 將在 mounted 中初始化
        
        // 實際的滾動處理邏輯
        _handleScroll() {
            const header = document.querySelector('.header');
            const scrollY = window.scrollY;
            
            if (scrollY > 100) {
                header.style.background = 'rgba(26, 26, 46, 0.98)';
                header.style.backdropFilter = 'blur(20px)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(26, 26, 46, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow = 'none';
            }
        },
        
        // 處理視窗大小變化事件（防抖版本）
        handleResize: null, // 將在 mounted 中初始化
        
        // 實際的視窗大小處理邏輯
        _handleResize() {
            this.windowWidth = window.innerWidth;
        },
        
        // 處理 URL hash 變化
        handleHashChange() {
            const hash = window.location.hash.slice(1);
            const validSections = ['home', 'projects', 'articles', 'observations', 'about'];
            
            if (validSections.includes(hash)) {
                this.currentSection = hash;
            } else if (!hash) {
                this.currentSection = 'home';
            }
        },
        
        // 添加滾動動畫（加強版）
        addScrollAnimations() {
            // 檢查是否支援 Intersection Observer
            if (!('IntersectionObserver' in window)) {
                return; // 舊瀏覽器跳過動畫
            }
            
            const observerOptions = {
                threshold: this.isMobileView ? 0.05 : 0.1,
                rootMargin: this.isMobileView ? '0px 0px -30px 0px' : '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        entry.target.classList.add('animated');
                    }
                });
            }, observerOptions);
            
            // 監聽所有需要動畫的元素
            const animatedElements = document.querySelectorAll(
                '.content-card, .article-card, .belief-card, .observation-card'
            );
            
            animatedElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
                observer.observe(el);
            });
        },
        
        // 平滑滾動到指定區塊
        scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        },
        
        // 滾動到頂部（加強版）
        scrollToTop() {
            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // 舊瀏覽器的平滑滾動 polyfill
                const scrollStep = -window.scrollY / (500 / 15);
                const scrollInterval = setInterval(() => {
                    if (window.scrollY !== 0) {
                        window.scrollBy(0, scrollStep);
                    } else {
                        clearInterval(scrollInterval);
                    }
                }, 15);
            }
        },
        
        // 處理觸控事件（手機版專用）
        handleTouchStart(event) {
            this.touchStartY = event.touches[0].clientY;
        },
        
        handleTouchEnd(event) {
            if (!this.touchStartY) return;
            
            const touchEndY = event.changedTouches[0].clientY;
            const diff = this.touchStartY - touchEndY;
            
            // 向上滑動切換到下一個區塊
            if (diff > 50 && this.isMobileView) {
                this.scrollToNextSection();
            }
            
            this.touchStartY = null;
        },
        
        // 鍵盤導航支援
        handleKeydown(event) {
            // ESC 鍵關閉手機選單
            if (event.key === 'Escape' && this.mobileMenuOpen) {
                this.closeMobileMenu();
            }
            
            // 方向鍵導航
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                this.scrollToNextSection();
            }
            
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                const sections = ['home', 'projects', 'articles', 'observations', 'about'];
                const currentIndex = sections.indexOf(this.currentSection);
                const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
                this.changeSection(sections[prevIndex]);
            }
        },
        
        // 工具函數：防抖
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // 工具函數：節流
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        },
        
        // 檢測是否為手機裝置
        isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // 預載入圖片
        preloadImages() {
            const imageUrls = [
                ...this.projects.map(p => p.image),
                'tle_logo.png',
                'assets/imgs/blog_icon.png'
            ];
            
            imageUrls.forEach(url => {
                const img = new Image();
                img.src = url;
            });
        },
        
        // 初始化響應式功能
        initResponsiveFeatures() {
            // 初始化裝置狀態
            this.updateDeviceState(window.innerWidth);
            
            // 初始化事件處理器
            this.handleScroll = this.throttle(this._handleScroll.bind(this), 16);
            this.handleResize = this.debounce(this._handleResize.bind(this), 250);
            
            // 添加事件監聽器
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleResize);
            window.addEventListener('hashchange', this.handleHashChange);
            window.addEventListener('keydown', this.handleKeydown);
            
            // 手機版觸控事件
            if (this.isMobile()) {
                document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
                document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
            }
            
            // 預載入圖片
            this.preloadImages();
            
            // 處理初始 hash
            this.handleHashChange();
        },
        
        // 清理事件監聽器
        cleanupEventListeners() {
            window.removeEventListener('scroll', this.handleScroll);
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('hashchange', this.handleHashChange);
            window.removeEventListener('keydown', this.handleKeydown);
            
            if (this.isMobile()) {
                document.removeEventListener('touchstart', this.handleTouchStart);
                document.removeEventListener('touchend', this.handleTouchEnd);
            }
        }
    },
    
    mounted() {
        // 初始化響應式功能
        this.initResponsiveFeatures();
        
        // 延遲添加滾動動畫，確保頁面完全載入
        this.$nextTick(() => {
            setTimeout(() => {
                this.addScrollAnimations();
            }, 100);
        });
        
        // 添加載入完成的 CSS 類
        document.body.classList.add('loaded');
    },
    
    beforeUnmount() {
        // 清理事件監聽器
        this.cleanupEventListeners();
        
        // 恢復 body 滾動
        document.body.style.overflow = '';
    }
}).mount('#app');

// 全域工具函數
const Utils = {
    // 防抖函數
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 節流函數
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },
    
    // 檢測是否為行動裝置
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    // 平滑滾動到頂部
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// 頁面載入完成後的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加載入動畫
    document.body.classList.add('loaded');
    
    // 性能優化：圖片懶載入
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // 添加鍵盤導航支援
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // ESC 鍵關閉手機選單
            const app = document.querySelector('#app').__vue__;
            if (app && app.mobileMenuOpen) {
                app.mobileMenuOpen = false;
            }
        }
    });
    
    // 平滑滾動處理
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// 視窗大小改變時的處理
window.addEventListener('resize', Utils.debounce(function() {
    // 關閉手機選單（如果視窗變大）
    if (!Utils.isMobile()) {
        const app = document.querySelector('#app').__vue__;
        if (app && app.mobileMenuOpen) {
            app.mobileMenuOpen = false;
        }
    }
}, 250)); 