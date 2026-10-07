        // ==========================================
        // ГЕНЕРАЦИЯ СТАТИЧЕСКИХ QR-КОДОВ (локально, без внешнего сервиса)
        // try/catch: если библиотека не загрузилась, остальной скрипт должен жить
        // ==========================================
        try {
            document.querySelectorAll('.qr-slot').forEach(el => new QRCode(el, { text: el.dataset.qr, width: 100, height: 100, correctLevel: QRCode.CorrectLevel.M }));
        } catch (e) {
            console.warn('QR-библиотека недоступна, статические QR пропущены:', e);
        }

        // ==========================================
        // ЛОГИКА СМЕНЫ ЦВЕТА ЛОГОТИПА ПРИ СКРОЛЛЕ
        // ==========================================
        const topNavLogo = document.getElementById('main-logo');
        const darkSections = document.querySelectorAll('.black-section');

        function checkLogoColor() {
            if (!topNavLogo) return;
            let isDark = false;
            
            const logoRect = topNavLogo.getBoundingClientRect();
            const logoCenter = logoRect.top + (logoRect.height / 2);

            darkSections.forEach(sec => {
                const rect = sec.getBoundingClientRect();
                if (logoCenter >= rect.top && logoCenter <= rect.bottom) {
                    isDark = true;
                }
            });

            if (isDark) {
                topNavLogo.src = 'assets/img/logo-text-white.svg?v=3';
            } else {
                topNavLogo.src = 'assets/img/logo-text.svg?v=3';
            }
        }

        // Троттлинг через requestAnimationFrame: не чаще одного раза на кадр отрисовки
        let logoFramePending = false;
        function checkLogoColorThrottled() {
            if (logoFramePending) return;
            logoFramePending = true;
            requestAnimationFrame(() => {
                logoFramePending = false;
                checkLogoColor();
            });
        }
        window.addEventListener('scroll', checkLogoColorThrottled);
        window.addEventListener('resize', checkLogoColorThrottled);
        checkLogoColor();


        let currentLang = localStorage.getItem('site_lang') || 'ru';
        const langToggleBtn = document.getElementById('lang-toggle-btn');
        const toastNotification = document.getElementById('toast-notification');
        let toastTimeout;

        function showToast(message) {
            toastNotification.textContent = message;
            toastNotification.classList.add('show');
            
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toastNotification.classList.remove('show');
            }, 3000);
        }

        function setLanguage(lang, isUserAction = false) {
            currentLang = lang;
            localStorage.setItem('site_lang', lang);

            // Перевод обычных текстовых элементов
            document.querySelectorAll('.lang').forEach(el => {
                const key = el.getAttribute('data-lang-key');
                if (translations[lang][key]) {
                    el.innerHTML = translations[lang][key];
                }
            });

            // Перевод плейсхолдеров в инпутах
            document.querySelectorAll('.lang-placeholder').forEach(el => {
                const key = el.getAttribute('data-lang-placeholder');
                if (translations[lang][key]) {
                    el.setAttribute('placeholder', translations[lang][key]);
                }
            });

            // Показываем уведомление, если это был клик пользователя
            // Длина текстов могла измениться — пересчитываем высоту открытых FAQ
            updateOpenFaqHeights();

            if (isUserAction) {
                const msg = lang === 'ru' ? 'Язык изменен на Русский' : 'Language switched to English';
                showToast(msg);
            }
        }

        langToggleBtn.addEventListener('click', () => {
            setLanguage(currentLang === 'ru' ? 'en' : 'ru', true);
        });

        // Установка языка при загрузке страницы (без уведомления)
        setLanguage(currentLang, false);


        // ==========================================
        // ЛОГИКА ОТКРЫТИЯ МЕНЮ НА ТАЧ-УСТРОЙСТВАХ
        // ==========================================
        const hamburgerBtn = document.querySelector('.menu-container .hamburger-btn');
        const dropdownMenu = document.querySelector('.menu-container .dropdown-menu');

        function closeDropdownMenu() {
            dropdownMenu.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }

        hamburgerBtn.addEventListener('click', () => {
            const isOpen = dropdownMenu.classList.toggle('open');
            hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Закрытие по клику на пункт меню
        dropdownMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeDropdownMenu);
        });

        // Закрытие по клику вне меню
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-container')) closeDropdownMenu();
        });

        // Закрытие по клавише Escape: меню, QR-модалка и полноэкранный режим
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            closeDropdownMenu();
            qrOverlay.classList.remove('show');
            if (app3dContainer.classList.contains('fullscreen-mode')) closeModalBtn.click();
        });


        // ==========================================
        // ЛОГИКА 3D-ВИДЖЕТА И ПОЛНОЭКРАННОГО РЕЖИМА
        // ==========================================
        const app3dContainer = document.getElementById('app-3d-container');
        const expandBtn = document.getElementById('expand-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');

        expandBtn.addEventListener('click', () => {
            app3dContainer.classList.add('fullscreen-mode');
            expandBtn.style.display = 'none'; 
            closeModalBtn.style.display = 'flex'; 
            document.body.style.overflow = 'hidden'; 
        });

        closeModalBtn.addEventListener('click', () => {
            app3dContainer.classList.remove('fullscreen-mode');
            expandBtn.style.display = 'flex'; 
            closeModalBtn.style.display = 'none'; 
            document.body.style.overflow = ''; 
        });

        const viewer = document.getElementById('viewer');
        const themeBtn = document.getElementById('theme-btn');
        const themeBtnText = document.getElementById('theme-btn-text');
        const iconMoon = document.getElementById('icon-moon');
        const iconSun = document.getElementById('icon-sun');
        const variantsContainer = document.getElementById('variants-container');
        
        const rulerBtn = document.getElementById('ruler-btn');
        const svgCanvas = document.getElementById('lines-svg');
        const rulerElements = document.getElementById('ruler-elements');
        const lineX = document.getElementById('line-x');
        const lineY = document.getElementById('line-y');
        const lineZ = document.getElementById('line-z');
        
        const arBtnShow = document.getElementById('ar-btn-show');
        const qrOverlay = document.getElementById('qr-overlay');
        const qrCloseBtn = document.getElementById('qr-close-btn');
        const dynamicQrBox = document.getElementById('dynamic-qr-box');

        let isRulerActive = false;
        let animationFrameId; 

        themeBtn.addEventListener('click', () => {
            themeBtn.classList.toggle('active');
            const isDark = themeBtn.classList.contains('active');
            app3dContainer.style.backgroundColor = isDark ? '#333333' : '#f9f9f9';
            
            // Динамический перевод текста кнопки темы
            themeBtnText.setAttribute('data-lang-key', isDark ? 'theme_light' : 'theme_dark');
            themeBtnText.innerHTML = translations[currentLang][isDark ? 'theme_light' : 'theme_dark'];
            
            if (isDark) {
                iconMoon.style.display = 'none';
                iconSun.style.display = 'block';
            } else {
                iconMoon.style.display = 'block';
                iconSun.style.display = 'none';
            }
        });

        arBtnShow.addEventListener('click', () => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                // activateAR срабатывает только на загруженной модели:
                // если она ещё качается — ставим в очередь и откроем AR по событию load
                if (viewer.loaded) {
                    viewer.activateAR();
                } else {
                    arPendingAfterLoad = true;
                    showToast(currentLang === 'ru'
                        ? 'Модель загружается — AR откроется автоматически'
                        : 'Model is loading — AR will open automatically');
                    if (!viewer.src) loadCurrentModel();
                }
            } else {
                const modelName = modelsList[currentModelIndex].name;
                const magicUrl = new URL(`qr.php?name=${modelName}`, window.location.href).href;
                // Генерируем QR локально (qrcodejs) вместо внешнего сервиса
                dynamicQrBox.innerHTML = '';
                try {
                    new QRCode(dynamicQrBox, { text: magicUrl, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
                } catch (e) {
                    console.warn('Не удалось сгенерировать QR:', e);
                    showToast(currentLang === 'ru' ? 'Не удалось создать QR-код' : 'Failed to create QR code');
                    return;
                }
                qrOverlay.classList.add('show');
            }
        });

        qrCloseBtn.addEventListener('click', () => { qrOverlay.classList.remove('show'); });

        // QR-модалка: закрытие по клику на фон и по Escape
        qrOverlay.addEventListener('click', (e) => {
            if (e.target === qrOverlay) qrOverlay.classList.remove('show');
        });

        // Пользовательский флаг: ждём загрузки модели, чтобы открыть AR
        let arPendingAfterLoad = false;

        function drawLines() {
            if (!isRulerActive || !viewer.src) return;
            
            const containerRect = app3dContainer.getBoundingClientRect();
            
            function getCoords(id) {
                const el = document.getElementById(id); 
                if (!el) return {x: 0, y: 0};
                const rect = el.getBoundingClientRect();
                return { 
                    x: rect.left + rect.width / 2 - containerRect.left, 
                    y: rect.top + rect.height / 2 - containerRect.top 
                };
            }
            
            const o = getCoords('ref-o');
            const x = getCoords('ref-x');
            const y = getCoords('ref-y');
            const z = getCoords('ref-z');
            const lx = getCoords('ref-lx');
            const ly = getCoords('ref-ly');
            const lz = getCoords('ref-lz');

            lineX.setAttribute('x1', o.x); lineX.setAttribute('y1', o.y); lineX.setAttribute('x2', x.x); lineX.setAttribute('y2', x.y);
            lineY.setAttribute('x1', o.x); lineY.setAttribute('y1', o.y); lineY.setAttribute('x2', y.x); lineY.setAttribute('y2', y.y);
            lineZ.setAttribute('x1', o.x); lineZ.setAttribute('y1', o.y); lineZ.setAttribute('x2', z.x); lineZ.setAttribute('y2', z.y);

            document.getElementById('ext-dot-o').style.left = o.x + 'px'; document.getElementById('ext-dot-o').style.top = o.y + 'px';
            document.getElementById('ext-dot-x').style.left = x.x + 'px'; document.getElementById('ext-dot-x').style.top = x.y + 'px';
            document.getElementById('ext-dot-y').style.left = y.x + 'px'; document.getElementById('ext-dot-y').style.top = y.y + 'px';
            document.getElementById('ext-dot-z').style.left = z.x + 'px'; document.getElementById('ext-dot-z').style.top = z.y + 'px';

            document.getElementById('ext-label-x').style.left = lx.x + 'px'; document.getElementById('ext-label-x').style.top = lx.y + 'px';
            document.getElementById('ext-label-y').style.left = ly.x + 'px'; document.getElementById('ext-label-y').style.top = ly.y + 'px';
            document.getElementById('ext-label-z').style.left = lz.x + 'px'; document.getElementById('ext-label-z').style.top = lz.y + 'px';
        }

        function renderLoop() { 
            if (isRulerActive) { 
                drawLines(); 
                animationFrameId = requestAnimationFrame(renderLoop); 
            } 
        }

        rulerBtn.addEventListener('click', () => {
            isRulerActive = !isRulerActive; 
            rulerBtn.classList.toggle('active', isRulerActive);
            
            if (viewer.src) { 
                svgCanvas.classList.toggle('show', isRulerActive); 
                rulerElements.classList.toggle('show', isRulerActive);
                if (isRulerActive) renderLoop(); 
                else cancelAnimationFrame(animationFrameId); 
            }
        });

        viewer.addEventListener('load', () => {
            // Если пользователь нажал AR до готовности модели — открываем сейчас
            if (arPendingAfterLoad) {
                arPendingAfterLoad = false;
                viewer.activateAR();
            }

            const size = viewer.getDimensions(); const center = viewer.getBoundingBoxCenter();
            if (!size) return;
            
            document.getElementById('ext-label-x').textContent = (size.x * 100).toFixed(0) + ' cm';
            document.getElementById('ext-label-y').textContent = (size.y * 100).toFixed(0) + ' cm';
            document.getElementById('ext-label-z').textContent = (size.z * 100).toFixed(0) + ' cm';
            
            const oX = center.x - size.x / 2, oY = center.y - size.y / 2, oZ = center.z - size.z / 2;
            
            viewer.updateHotspot({ name: 'hotspot-dot-o', position: `${oX} ${oY} ${oZ}` });
            viewer.updateHotspot({ name: 'hotspot-dot-x', position: `${oX + size.x} ${oY} ${oZ}` }); 
            viewer.updateHotspot({ name: 'hotspot-dot-y', position: `${oX} ${oY + size.y} ${oZ}` }); 
            viewer.updateHotspot({ name: 'hotspot-dot-z', position: `${oX} ${oY} ${oZ + size.z}` }); 
            viewer.updateHotspot({ name: 'hotspot-label-x', position: `${center.x} ${oY} ${oZ}` });
            viewer.updateHotspot({ name: 'hotspot-label-y', position: `${oX} ${center.y} ${oZ}` });
            viewer.updateHotspot({ name: 'hotspot-label-z', position: `${oX} ${oY} ${center.z}` });
            
            if (isRulerActive) { 
                svgCanvas.classList.add('show'); 
                rulerElements.classList.add('show'); 
                renderLoop(); 
            }

            const variants = viewer.availableVariants; 
            variantsContainer.innerHTML = ''; 
            
            if (variants && variants.length > 0) {
                const colorMap = {
                    'Yellow_Fabric': '#D4B85C', 
                    'Red_Fabric': '#A32B2B',    
                    'Brown_Fabric': '#5C4033',  
                    'Orange_Fabric': '#E85D04', 
                    'Blue_Fabric': '#3B5998',   
                    'Beige_Fabric': '#D9C5B2',
                    'wite': '#E8E8E8',
                    'black': '#222222',
                    'yellow': '#D4B85C'
                };

                variants.forEach((variantName, index) => {
                    const btn = document.createElement('button'); 
                    btn.className = 'variant-btn';
                    
                    btn.style.backgroundColor = (index === 0 ? '#FF6A00' : (colorMap[variantName] || '#cccccc'));
                    btn.title = variantName.replace('_Fabric', ' Цвет'); 

                    if (index === 0) btn.classList.add('active'); 
                    
                    btn.addEventListener('click', () => { 
                        viewer.variantName = variantName; 
                        document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active')); 
                        btn.classList.add('active'); 
                    });
                    variantsContainer.appendChild(btn);
                });
            }
        });

        const modelsList = [
            { name: "chair1", src: "assets/models/rattan-chair.glb", iosSrc: "assets/models/rattan-chair.usdz", poster: "assets/img/poster-chair1.webp" },
            { name: "puff", src: "assets/models/puff.glb", iosSrc: "assets/models/puff.usdz", poster: "assets/img/poster-puff.webp" },
            { name: "model3", src: "assets/models/model.glb", iosSrc: "assets/models/model.usdz", poster: "assets/img/poster-model3.webp" },
            { name: "chair2", src: "assets/models/chair.glb", iosSrc: "assets/models/chair.usdz", poster: null }
        ];

        let currentModelIndex = 0;
        const prevBtn = document.getElementById('prev-model-btn');
        const nextBtn = document.getElementById('next-model-btn');

        function loadCurrentModel() {
            variantsContainer.innerHTML = '';
            if (isRulerActive) rulerBtn.click(); 

            viewer.src = modelsList[currentModelIndex].src;
            if (modelsList[currentModelIndex].iosSrc) {
                viewer.setAttribute('ios-src', modelsList[currentModelIndex].iosSrc);
            } else {
                viewer.removeAttribute('ios-src');
            }

            // Обложка модели: показывается, пока 3D-модель загружается
            if (modelsList[currentModelIndex].poster) {
                viewer.setAttribute('poster', modelsList[currentModelIndex].poster);
            } else {
                viewer.removeAttribute('poster');
            }
        }

        prevBtn.addEventListener('click', () => {
            currentModelIndex = (currentModelIndex > 0) ? currentModelIndex - 1 : modelsList.length - 1;
            loadCurrentModel();
        });

        nextBtn.addEventListener('click', () => {
            currentModelIndex = (currentModelIndex < modelsList.length - 1) ? currentModelIndex + 1 : 0;
            loadCurrentModel();
        });

        // Ленивая загрузка 3D-модели: src/ios-src ставятся только при приближении
        // к виджету, чтобы ~10 МБ первой модели не грузились при открытии страницы.
        // Стрелки переключения моделей вызывают loadCurrentModel() сами.
        let isFirstModelLoaded = false;
        if ('IntersectionObserver' in window) {
            const modelObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isFirstModelLoaded) {
                    isFirstModelLoaded = true;
                    loadCurrentModel();
                    modelObserver.disconnect();
                }
            }, { rootMargin: '400px' });
            modelObserver.observe(app3dContainer);
        } else {
            // Старый браузер без IntersectionObserver — грузим сразу
            isFirstModelLoaded = true;
            loadCurrentModel();
        }

        // ==========================================
        // ЛОГИКА FAQ: высота раскрытия считается через scrollHeight,
        // чтобы длинные ответы не обрезались
        // ==========================================
        const faqHeaders = document.querySelectorAll('.faq-header');
        faqHeaders.forEach(header => {
            const toggleFaq = () => {
                const item = header.parentElement;
                const content = item.querySelector('.faq-content');
                const isActive = item.classList.toggle('active');

                // Синхронизируем доступность (скринридеры)
                header.setAttribute('aria-expanded', isActive ? 'true' : 'false');

                // Пересчитываем высоту при каждом открытии — текст может быть любой длины
                content.style.maxHeight = isActive ? content.scrollHeight + 'px' : '0px';
            };

            header.addEventListener('click', toggleFaq);

            // Клавиатурная активация: Enter или Space
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFaq();
                }
            });
        });

        // Пересчёт высоты открытых FAQ-пунктов: смена языка или resize
        // меняет длину текста, фиксированный scrollHeight устаревает
        function updateOpenFaqHeights() {
            document.querySelectorAll('.faq-item.active .faq-content').forEach(content => {
                content.style.maxHeight = content.scrollHeight + 'px';
            });
        }
        window.addEventListener('resize', updateOpenFaqHeights);

        const contactForm = document.getElementById('contact-form');
        const successMessage = document.getElementById('form-success-message');

        if (contactForm) {
            contactForm.addEventListener('submit', async function(event) {
                event.preventDefault(); 
                
                const submitBtn = contactForm.querySelector('.submit-btn');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = currentLang === 'ru' ? 'Отправка...' : 'Sending...';
                submitBtn.disabled = true;

                const formData = new FormData(contactForm);

                try {
                    const response = await fetch(contactForm.action, {
                        method: contactForm.method,
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        contactForm.style.display = 'none';
                        successMessage.style.display = 'block';
                        contactForm.reset();
                    } else {
                        alert(currentLang === 'ru' ? "Произошла ошибка при отправке." : "An error occurred while sending.");
                        submitBtn.textContent = originalBtnText;
                        submitBtn.disabled = false;
                    }
                } catch (error) {
                    alert(currentLang === 'ru' ? "Ошибка соединения." : "Connection error.");
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        }
    
        // ==========================================
        // ЛЕНИВАЯ ЗАГРУЗКА ВИДЕО: воспроизведение только в зоне видимости
        // ==========================================
        const allVideos = document.querySelectorAll('video');

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // При preload="none" браузер мог не начать загрузку — запускаем её явно перед первым play
                    if (video.readyState === 0) video.load();
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { rootMargin: '200px' });

        allVideos.forEach(video => videoObserver.observe(video));

        // Первый автоматический показ переворота карточек метрик при первом просмотре
        const metricsSection = document.querySelector('#metrics');
        let metricsPlayed = false;
        if (metricsSection) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !metricsPlayed) {
                    metricsPlayed = true;
                    document.querySelectorAll('#metrics .flip-card-inner').forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('auto-flip');
                            setTimeout(() => card.classList.remove('auto-flip'), 1300);
                        }, index * 250);
                    });
                    observer.disconnect();
                }
            }, {threshold: 0.35});
            observer.observe(metricsSection);
        }
