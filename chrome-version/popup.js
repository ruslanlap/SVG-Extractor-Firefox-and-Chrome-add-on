// popup.js - Вдосконалена версія
document.addEventListener('DOMContentLoaded', function() {
  const contentDiv = document.getElementById('content');
  const loadingDiv = document.getElementById('loading');
  const noSvgDiv = document.getElementById('no-svg');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconLight = document.getElementById('theme-icon-light');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const langToggleEn = document.getElementById('lang-toggle-en');
  const langToggleUk = document.getElementById('lang-toggle-uk');
  const pageTitle = document.getElementById('page-title');

  // Визначаємо SVG namespace один раз на початку файлу
  const svgNS = "http://www.w3.org/2000/svg";

  // Переклади
  const translations = {
    en: {
      title: "SVG Extractor",
      loading: "Searching for SVGs on the page...",
      noSvg: "No SVG images found on this page",
      save: "Save",
      savePNG: "Save PNG",
      copy: "Copy",
      copied: "Copied!",
      error: "Error: ",
      errorHint: "Cannot access this page. Make sure the extension has permissions.",
      retry: "Retry"
    },
    uk: {
      title: "SVG Екстрактор",
      loading: "Пошук SVG на сторінці...",
      noSvg: "SVG-зображення не знайдено на цій сторінці",
      save: "Save",
      savePNG: "Зберегти PNG",
      copy: "Copy",
      copied: "Скопійовано!",
      error: "Помилка: ",
      errorHint: "Немає доступу до цієї сторінки. Переконайтесь, що розширення має дозволи.",
      retry: "Спробувати знову"
    }
  };

  // Ініціалізація теми
  async function initTheme() {
    try {
      // Встановлюємо темну тему за замовчуванням
      document.documentElement.classList.add('dark');
      themeIconLight.style.display = 'none';
      themeIconDark.style.display = 'block';

      // Зберігаємо налаштування
      localStorage.setItem('theme', 'dark');
      await chrome.storage.local.set({ 'theme': 'dark' });
    } catch (error) {
      console.error("Error setting default theme:", error);
      // Fallback to localStorage
      document.documentElement.classList.add('dark');
      themeIconLight.style.display = 'none';
      themeIconDark.style.display = 'block';
      localStorage.setItem('theme', 'dark');
    }
  }

  // Функція для встановлення мови
  async function setLanguage(lang) {
    // Зберігаємо вибір мови
    localStorage.setItem('language', lang);
    try {
      await chrome.storage.local.set({ 'language': lang });
    } catch (error) {
      console.error("Error saving language preference:", error);
    }

    // Оновлюємо текст інтерфейсу
    if (pageTitle) pageTitle.textContent = translations[lang].title;
    if (loadingDiv) loadingDiv.textContent = translations[lang].loading;
    if (noSvgDiv) noSvgDiv.textContent = translations[lang].noSvg;

    // Оновлюємо будь-який динамічний текст, який може вже існувати
    document.querySelectorAll('.svg-buttons button').forEach(btn => {
      const svg = btn.querySelector('svg');
      const textContent = btn.textContent.trim();

      if (btn.classList.contains('download-btn')) {
        btn.textContent = '';
        if (svg) btn.appendChild(svg);
        btn.appendChild(document.createTextNode(' ' + translations[lang].save));
      } else if (btn.classList.contains('copy-btn')) {
        btn.textContent = '';
        if (svg) btn.appendChild(svg);
        btn.appendChild(document.createTextNode(' ' + translations[lang].copy));
      } else if (btn.classList.contains('download-png-btn')) {
        btn.textContent = '';
        if (svg) btn.appendChild(svg);
        btn.appendChild(document.createTextNode(' ' + translations[lang].savePNG));
      }
    });
  }

  // Ініціалізація мови
  async function initLanguage() {
    try {
      // Встановлюємо англійську мову за замовчуванням
      await setLanguage('en');

      // Позначаємо активну мову
      langToggleEn.style.opacity = '1';
      langToggleUk.style.opacity = '0.6';

      // Зберігаємо налаштування
      localStorage.setItem('language', 'en');
      await chrome.storage.local.set({ 'language': 'en' });

      // Встановлюємо атрибут lang для документа
      document.documentElement.setAttribute('lang', 'en');
    } catch (error) {
      console.error("Error setting default language:", error);
      // Fallback до локального сховища
      setLanguage('en');
      langToggleEn.style.opacity = '1';
      langToggleUk.style.opacity = '0.6';
      localStorage.setItem('language', 'en');
      document.documentElement.setAttribute('lang', 'en');
    }
  }

  // Ініціалізуємо тему і мову
  initTheme();
  initLanguage();

  // Перемикач теми - ОНОВЛЕНИЙ КОД
  themeToggle.addEventListener('click', async () => {
    // Перемикаємо клас теми без анімації
    const isDark = document.documentElement.classList.toggle('dark');

    // Миттєво перемикаємо видимість іконок
    themeIconLight.style.display = isDark ? 'none' : 'block';
    themeIconDark.style.display = isDark ? 'block' : 'none';

    // Зберігаємо налаштування (асинхронно, не блокуючи інтерфейс)
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    try {
      await chrome.storage.local.set({ 'theme': isDark ? 'dark' : 'light' });
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  });

  // Обробники перемикання мови
  langToggleEn.addEventListener('click', () => {
    setLanguage('en');
    // Позначаємо активну мову
    langToggleEn.style.opacity = '1';
    langToggleUk.style.opacity = '0.6';
    // Встановлюємо атрибут lang для документа
    document.documentElement.setAttribute('lang', 'en');
  });

  langToggleUk.addEventListener('click', () => {
    setLanguage('uk');
    // Позначаємо активну мову
    langToggleUk.style.opacity = '1';
    langToggleEn.style.opacity = '0.6';
    // Встановлюємо атрибут lang для документа
    document.documentElement.setAttribute('lang', 'uk');
  });

  // Функція для безпечного створення SVG елемента
  function createSVGElement(svgString) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

    // Перевірка на помилки парсингу
    const parserError = svgDoc.querySelector("parsererror");
    if (parserError) {
      console.error("Помилка парсингу SVG:", parserError);
      return document.createElementNS(svgNS, "svg");
    }

    // Копіюємо елемент з правильним неймспейсом
    const originalSvg = svgDoc.documentElement;
    const svg = document.createElementNS(svgNS, "svg");

    // Копіюємо атрибути
    for (const attr of originalSvg.attributes) {
      svg.setAttribute(attr.name, attr.value);
    }

    // Копіюємо вміст SVG за допомогою глибокого клонування
    Array.from(originalSvg.childNodes).forEach(child => {
      svg.appendChild(child.cloneNode(true));
    });

    return svg;
  }

  // Функція для створення унікального ідентифікатора
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Функція для перетворення SVG на PNG
  function svgToPng(svgElement, width, height) {
    return new Promise((resolve, reject) => {
      try {
        // Отримуємо розміри SVG
        const svgWidth = width || parseInt(svgElement.getAttribute('width')) || 200;
        const svgHeight = height || parseInt(svgElement.getAttribute('height')) || 200;

        // Створюємо копію SVG для перетворення
        const svgString = new XMLSerializer().serializeToString(svgElement);

        // Створюємо канвас потрібного розміру
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth;
        canvas.height = svgHeight;

        // Отримуємо контекст для малювання
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Створюємо зображення з SVG
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (error) => {
          reject(error);
        };

        // Завантажуємо SVG як зображення (через data URL)
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  // Функція для відображення помилки
  function showError(message) {
    loadingDiv.style.display = 'none';

    // Створюємо елемент для повідомлення про помилку
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.padding = '2rem';
    errorDiv.style.color = 'var(--muted-foreground)';

    // Поточна мова
    const currentLang = localStorage.getItem('language') || 'en';

    // Текст помилки
    const errorText = document.createElement('p');
    errorText.textContent = `${translations[currentLang].error}${message}`;

    // Додаткова інформація
    const errorHint = document.createElement('p');
    errorHint.style.marginTop = '1rem';
    errorHint.style.fontSize = '0.875rem';
    errorHint.textContent = translations[currentLang].errorHint;

    // Кнопка повторної спроби
    const retryBtn = document.createElement('button');
    retryBtn.style.marginTop = '1rem';
    retryBtn.style.padding = '0.5rem 1rem';
    retryBtn.style.backgroundColor = 'var(--primary, #4285f4)';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.textContent = translations[currentLang].retry;

    retryBtn.addEventListener('click', () => {
      // Показуємо знову завантаження
      errorDiv.style.display = 'none';
      loadingDiv.style.display = 'block';

      // Спробуємо ще раз запустити content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content-script.js']
        }).catch(error => {
          console.error("Retry failed:", error);
          showError(error.message);
        });
      });

    const errorIcon = document.createElementNS(svgNS, "svg");
    errorIcon.setAttribute("width", "24");
    errorIcon.setAttribute("height", "24");
    errorIcon.setAttribute("viewBox", "0 0 24 24");
    errorIcon.setAttribute("fill", "none");
    errorIcon.setAttribute("stroke", "currentColor");
    errorIcon.setAttribute("stroke-width", "2");
    errorIcon.setAttribute("stroke-linecap", "round");
    errorIcon.setAttribute("stroke-linejoin", "round");
    errorIcon.style.marginBottom = "1rem";

    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "10");

    const line1 = document.createElementNS(svgNS, "line");
    line1.setAttribute("x1", "12");
    line1.setAttribute("y1", "8");
    line1.setAttribute("x2", "12");
    line1.setAttribute("y2", "12");

    const line2 = document.createElementNS(svgNS, "line");
    line2.setAttribute("x1", "12");
    line2.setAttribute("y1", "16");
    line2.setAttribute("x2", "12.01");
    line2.setAttribute("y2", "16");

    errorIcon.appendChild(circle);
    errorIcon.appendChild(line1);
    errorIcon.appendChild(line2);

    errorDiv.appendChild(errorIcon);
    errorDiv.appendChild(errorText);
    errorDiv.appendChild(errorHint);
    errorDiv.appendChild(retryBtn);

    contentDiv.innerHTML = '';
    contentDiv.appendChild(errorDiv);
    contentDiv.style.display = 'block';
  }

  // Функція для відображення SVG
  function displaySVGs(svgs) {
    loadingDiv.style.display = 'none';

    if (!svgs || svgs.length === 0) {
      noSvgDiv.style.display = 'block';
      return;
    }

    contentDiv.style.display = 'grid';
    contentDiv.innerHTML = ''; // Очищаємо перед новим наповненням

    // Створюємо елементи для кожного SVG
    svgs.forEach(svg => {
      // Перевіряємо наявність необхідних полів
      if (!svg || (!svg.content && !svg.url)) {
        return;
      }

      // Створюємо контейнер для елемента
      const svgItem = document.createElement('div');
      svgItem.className = 'svg-item';

      // Створюємо превью
      const previewDiv = document.createElement('div');
      previewDiv.className = 'svg-preview';

      // Змінна для зберігання посилання на SVG елемент
      let svgElement = null;

      // Відображаємо SVG в залежності від типу
      if (svg.type === 'inline' && svg.content) {
        try {
          // Безпечно вставляємо SVG
          svgElement = createSVGElement(svg.content);
          previewDiv.appendChild(svgElement);
        } catch (error) {
          console.error("Помилка створення SVG елемента:", error);
          previewDiv.textContent = "Помилка відображення SVG";
        }
      } else if (svg.url) {
        const img = document.createElement('img');
        img.src = svg.url;
        img.alt = svg.name || "SVG зображення";
        img.loading = "lazy";
        img.onerror = () => {
          img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3C/svg%3E";
          img.alt = "Помилка завантаження SVG";
        };
        previewDiv.appendChild(img);
      }

      // Інформація про SVG
      const infoDiv = document.createElement('div');
      infoDiv.className = 'svg-info';

      // Назва SVG
      const nameElem = document.createElement('div');
      nameElem.className = 'svg-name';
      nameElem.textContent = svg.name || `SVG ${generateUniqueId().slice(0, 6)}`;
      infoDiv.appendChild(nameElem);

      // Розмір SVG
      if (svg.width || svg.height) {
        const sizeElem = document.createElement('div');
        sizeElem.className = 'svg-size';
        const width = svg.width || 'auto';
        const height = svg.height || 'auto';
        sizeElem.textContent = `${width}×${height}`;
        infoDiv.appendChild(sizeElem);
      }

      // Тип SVG (нова фічка)
      const typeElem = document.createElement('div');
      typeElem.className = 'svg-type';
      const currentLang = localStorage.getItem('language') || 'en';

      switch(svg.type) {
        case 'inline':
          typeElem.textContent = currentLang === 'uk' ? 'Вбудований SVG' : 'Inline SVG';
          break;
        case 'image':
          typeElem.textContent = currentLang === 'uk' ? 'SVG-зображення' : 'Image SVG';
          break;
        case 'object':
          typeElem.textContent = currentLang === 'uk' ? 'SVG-об\'єкт' : 'Object SVG';
          break;
        case 'background':
          typeElem.textContent = currentLang === 'uk' ? 'Фоновий SVG' : 'Background SVG';
          break;
        default:
          typeElem.textContent = svg.type || 'SVG';
      }

      infoDiv.appendChild(typeElem);

      // Кнопки
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'svg-buttons';

      // Кнопка завантаження
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';

      // Створюємо SVG-іконку завантаження
      const downloadSvg = document.createElementNS(svgNS, "svg");
      downloadSvg.setAttribute("width", "16");
      downloadSvg.setAttribute("height", "16");
      downloadSvg.setAttribute("viewBox", "0 0 24 24");
      downloadSvg.setAttribute("fill", "none");
      downloadSvg.setAttribute("stroke", "currentColor");
      downloadSvg.setAttribute("stroke-width", "2");
      downloadSvg.setAttribute("stroke-linecap", "round");
      downloadSvg.setAttribute("stroke-linejoin", "round");

      // Створюємо елементи шляху для SVG
      const downloadPath = document.createElementNS(svgNS, "path");
      downloadPath.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");

      const polyline = document.createElementNS(svgNS, "polyline");
      polyline.setAttribute("points", "7 10 12 15 17 10");

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", "12");
      line.setAttribute("y1", "15");
      line.setAttribute("x2", "12");
      line.setAttribute("y2", "3");

      // Додаємо елементи
      downloadSvg.appendChild(downloadPath);
      downloadSvg.appendChild(polyline);
      downloadSvg.appendChild(line);

      downloadBtn.appendChild(downloadSvg);

      // Додаємо текстовий вузол
      const textNode = document.createTextNode(" " + translations[currentLang].save);
      downloadBtn.appendChild(textNode);

      downloadBtn.addEventListener('click', () => {
        try {
          // Передаємо його в background.js, щоб почати завантаження
          chrome.runtime.sendMessage({
            action: "downloadSVG",
            svg: svg
          });
        } catch (error) {
          console.error("Error initiating download:", error);

          // Прямий варіант завантаження як запасний
          if (svg.type === 'inline') {
            const blob = new Blob([svg.content], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${svg.name || 'svg'}-${Date.now()}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } else if (svg.url) {
            const a = document.createElement('a');
            a.href = svg.url;
            a.download = `${svg.name || 'svg'}-${Date.now()}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      });

      buttonsDiv.appendChild(downloadBtn);

      // Кнопка завантаження PNG (НОВА)
      if (svg.type === 'inline' && svgElement) {
        const downloadPngBtn = document.createElement('button');
        downloadPngBtn.className = 'download-png-btn';

        // Створюємо SVG-іконку для PNG
        const pngSvg = document.createElementNS(svgNS, "svg");
        pngSvg.setAttribute("width", "16");
        pngSvg.setAttribute("height", "16");
        pngSvg.setAttribute("viewBox", "0 0 24 24");
        pngSvg.setAttribute("fill", "none");
        pngSvg.setAttribute("stroke", "currentColor");
        pngSvg.setAttribute("stroke-width", "2");
        pngSvg.setAttribute("stroke-linecap", "round");
        pngSvg.setAttribute("stroke-linejoin", "round");

        // Створюємо елементи для PNG іконки (модифікована іконка завантаження)
        const pngRect = document.createElementNS(svgNS, "rect");
        pngRect.setAttribute("x", "3");
        pngRect.setAttribute("y", "3");
        pngRect.setAttribute("width", "18");
        pngRect.setAttribute("height", "18");
        pngRect.setAttribute("rx", "2");
        pngRect.setAttribute("ry", "2");

        const pngPath = document.createElementNS(svgNS, "path");
        pngPath.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");

        const pngText = document.createElementNS(svgNS, "text");
        pngText.setAttribute("x", "12");
        pngText.setAttribute("y", "14");
        pngText.setAttribute("text-anchor", "middle");
        pngText.setAttribute("fill", "currentColor");
        pngText.setAttribute("font-size", "6");
        pngText.textContent = "PNG";

        // Додаємо елементи
        pngSvg.appendChild(pngRect);
        pngSvg.appendChild(pngPath);
        pngSvg.appendChild(pngText);

        downloadPngBtn.appendChild(pngSvg);

        // Додаємо текстовий вузол
        const pngTextNode = document.createTextNode(" " + translations[currentLang].savePNG);
        downloadPngBtn.appendChild(pngTextNode);

        downloadPngBtn.addEventListener('click', async () => {
          try {
            const pngDataUrl = await svgToPng(svgElement, svg.width, svg.height);

            // Створюємо ім'я для файлу
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
            const filename = `png-${svg.name || 'image'}-${timestamp}.png`;

            // Завантажуємо PNG
            const a = document.createElement('a');
            a.href = pngDataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (error) {
            console.error("Error converting SVG to PNG:", error);
            alert("Failed to convert SVG to PNG. Please try again.");
          }
        });

        buttonsDiv.appendChild(downloadPngBtn);
      }

      // Кнопка копіювання
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';

      // Створюємо SVG-іконку копіювання
      const copySvg = document.createElementNS(svgNS, "svg");
      copySvg.setAttribute("width", "16");
      copySvg.setAttribute("height", "16");
      copySvg.setAttribute("viewBox", "0 0 24 24");
      copySvg.setAttribute("fill", "none");
      copySvg.setAttribute("stroke", "currentColor");
      copySvg.setAttribute("stroke-width", "2");
      copySvg.setAttribute("stroke-linecap", "round");
      copySvg.setAttribute("stroke-linejoin", "round");

      // Створюємо SVG rect
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", "9");
      rect.setAttribute("y", "9");
      rect.setAttribute("width", "13");
      rect.setAttribute("height", "13");
      rect.setAttribute("rx", "2");
      rect.setAttribute("ry", "2");

      // Створюємо SVG path
      const copyPath = document.createElementNS(svgNS, "path");
      copyPath.setAttribute("d", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1");

      // Додаємо елементи
      copySvg.appendChild(rect);
      copySvg.appendChild(copyPath);

      copyBtn.appendChild(copySvg);

      // Додаємо текстовий вузол
      const copyTextNode = document.createTextNode(" " + translations[currentLang].copy);
      copyBtn.appendChild(copyTextNode);

      copyBtn.addEventListener('click', () => {
        let textToCopy = svg.type === 'inline' ? svg.content : svg.url;

        navigator.clipboard.writeText(textToCopy).then(() => {
          // Показуємо повідомлення про успіх
          const originalBtn = copyBtn.cloneNode(true);

          // Очищаємо вміст кнопки
          while (copyBtn.firstChild) {
            copyBtn.removeChild(copyBtn.firstChild);
          }

          // Створюємо SVG для успішної дії
          const successSvg = document.createElementNS(svgNS, "svg");
          successSvg.setAttribute("width", "16");
          successSvg.setAttribute("height", "16");
          successSvg.setAttribute("viewBox", "0 0 24 24");
          successSvg.setAttribute("fill", "none");
          successSvg.setAttribute("stroke", "currentColor");
          successSvg.setAttribute("stroke-width", "2");
          successSvg.setAttribute("stroke-linecap", "round");
          successSvg.setAttribute("stroke-linejoin", "round");

          const successPolyline = document.createElementNS(svgNS, "polyline");
          successPolyline.setAttribute("points", "20 6 9 17 4 12");

          successSvg.appendChild(successPolyline);
          copyBtn.appendChild(successSvg);

          // Додаємо текст успіху
          const successText = document.createTextNode(" " + translations[currentLang].copied);
          copyBtn.appendChild(successText);

          setTimeout(() => {
            // Відновлюємо оригінальну кнопку
            while (copyBtn.firstChild) {
              copyBtn.removeChild(copyBtn.firstChild);
            }

            Array.from(originalBtn.childNodes).forEach(node => {
              copyBtn.appendChild(node.cloneNode(true));
            });
          }, 2000);
        }).catch(error => {
          console.error("Clipboard error:", error);
        });
      });

      buttonsDiv.appendChild(copyBtn);

      // Додаємо все до контейнера
      svgItem.appendChild(previewDiv);
      svgItem.appendChild(infoDiv);
      svgItem.appendChild(buttonsDiv);
      contentDiv.appendChild(svgItem);
    });
  }

  // Функція для завантаження SVG
    function downloadSVG(svg) {
      if (!svg) return;

      // Створюємо ім'я файлу
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const filename = `svg-${svg.name || 'image'}-${timestamp}.svg`;

      try {
        if (svg.type === 'inline') {
          // Для інлайнових SVG створюємо blob
          const blob = new Blob([svg.content], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);

          // Завантажуємо файл
          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          }).catch(error => {
            console.error("Помилка завантаження SVG:", error);

            // Запасний варіант, якщо API завантаження недоступне
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });

          // Звільняємо ресурси URL через 1 секунду
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else if (svg.url) {
          // Для зовнішніх SVG завантажуємо URL
          chrome.downloads.download({
            url: svg.url,
            filename: filename,
            saveAs: true
          }).catch(error => {
            console.error("Помилка завантаження SVG за URL:", error);

            // Запасний варіант для завантаження
            fetch(svg.url)
              .then(response => response.text())
              .then(svgText => {
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => URL.revokeObjectURL(url), 1000);
              })
              .catch(fetchError => {
                console.error("Помилка отримання SVG:", fetchError);

                // Якщо fetch не працює, намагаємося безпосередньо через тег <a>
                const a = document.createElement('a');
                a.href = svg.url;
                a.download = filename;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              });
          });
        }
      } catch (error) {
        console.error("Помилка при спробі завантаження:", error);

        // Показуємо повідомлення про помилку
        alert("Не вдалося завантажити SVG. Будь ласка, спробуйте знову.");
      }
    }

    // Запитуємо у вкладки дані SVG
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content-script.js']
      }).catch(error => {
        console.error(`Error executing content script: ${error}`);
        showError(error.message);
      });
    });

    // Отримуємо повідомлення з SVG від content-script
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.action === "foundSVGs") {
        displaySVGs(message.svgs);
      } else if (message && message.action === "error") {
        showError(message.message || "Unknown error");
      }
    });
  });

  // Встановлюємо темну тему за замовчуванням
  document.documentElement.classList.add('dark'); 
  localStorage.setItem('theme', 'dark');

  // Встановлюємо англійську мову за замовчуванням
  document.documentElement.setAttribute('lang', 'en');
  localStorage.setItem('language', 'en');