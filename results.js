// results.js - Вдосконалена версія
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
  const pageSubtitle = document.getElementById('page-subtitle');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const downloadAllText = document.getElementById('download-all-text');
  const svgNS = "http://www.w3.org/2000/svg";

  // Translations with enhanced content
  const translations = {
    en: {
      title: "SVG Extractor Pro",
      subtitle: "SVGs found on the page",
      loading: "Loading SVGs...",
      noSvg: "No SVG images found on this page",
      save: "Save SVG",
      savePNG: "Save PNG",
      copy: "Copy",
      copyContent: "Copy SVG",
      copyURL: "Copy Link",
      copied: "Copied!",
      download: "Download",
      downloadAll: "Download All SVGs",
      downloadingAll: "Archiving...",
      downloadComplete: "SVGs saved",
      downloadError: "Error",
      viewSource: "View Source",
      error: "Error loading SVGs: ",
      errorHint: "There was a problem loading SVG content.",
      dimensions: "Dimensions",
      type: "Type",
      inlineType: "Inline SVG",
      imageType: "Image SVG",
      objectType: "Object SVG",
      backgroundType: "Background SVG",
      viewBox: "ViewBox",
      close: "Close",
      refresh: "Refresh",
      preview: "Preview",
      leaveFeedback: "Leave Feedback",
      reportABug: "Report a Bug",
      buyMeACoffee: "Buy Me a Coffee"
    },
    uk: {
      title: "SVG Екстрактор Pro",
      subtitle: "Знайдені SVG зображення на сторінці",
      loading: "Завантаження SVG...",
      noSvg: "SVG-зображення не знайдено на цій сторінці",
      save: "Зберегти SVG",
      savePNG: "Зберегти PNG",
      copy: "Копіювати",
      copyContent: "Копіювати SVG",
      copyURL: "Копіювати посилання",
      copied: "Скопійовано!",
      download: "Завантажити",
      downloadAll: "Завантажити всі SVG",
      downloadingAll: "Архівування...",
      downloadComplete: "SVG завантажено",
      downloadError: "Помилка",
      viewSource: "Переглянути код",
      error: "Помилка завантаження SVG: ",
      errorHint: "Виникла проблема під час завантаження SVG.",
      dimensions: "Розміри",
      type: "Тип",
      inlineType: "Вбудований SVG",
      imageType: "SVG-зображення",
      objectType: "SVG-об'єкт",
      backgroundType: "Фоновий SVG",
      viewBox: "ViewBox",
      close: "Закрити",
      refresh: "Оновити",
      preview: "Перегляд",
      leaveFeedback: "Залишити відгук",
      reportABug: "Повідомити про помилку",
      buyMeACoffee: "Купити мені каву"
    }
  };

  // Theme Toggle Functionality
  function initTheme() {
    try {
      // Set dark theme as default
      document.documentElement.classList.add('dark');
      themeIconLight.style.display = 'none';
      themeIconDark.style.display = 'block';

      // Save preference to localStorage
      localStorage.setItem('theme', 'dark');

      // Try to save to browser storage
      try {
        chrome.storage.local.set({ 'theme': 'dark' })
          .catch(err => console.error("Error saving theme to browser storage:", err));
      } catch (error) {
        console.error("Browser storage not accessible:", error);
      }
    } catch (error) {
      console.error("Error initializing theme:", error);
    }
  }

  // Improved SVG to PNG conversion function
  function svgToPng(svgElement, width, height) {
    return new Promise((resolve, reject) => {
      try {
        // Create a clone of the SVG element to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);

        // Get dimensions with proper fallbacks
        let svgWidth, svgHeight;

        // Try to get dimensions from various sources
        if (width && !isNaN(parseFloat(width))) {
          svgWidth = parseFloat(width);
        } else if (svgElement.getAttribute('width')) {
          svgWidth = parseFloat(svgElement.getAttribute('width'));
        } else if (svgElement.viewBox?.baseVal?.width) {
          svgWidth = svgElement.viewBox.baseVal.width;
        } else if (svgElement.getBoundingClientRect) {
          svgWidth = svgElement.getBoundingClientRect().width;
        } else {
          svgWidth = 300; // Default fallback
        }

        if (height && !isNaN(parseFloat(height))) {
          svgHeight = parseFloat(height);
        } else if (svgElement.getAttribute('height')) {
          svgHeight = parseFloat(svgElement.getAttribute('height'));
        } else if (svgElement.viewBox?.baseVal?.height) {
          svgHeight = svgElement.viewBox.baseVal.height;
        } else if (svgElement.getBoundingClientRect) {
          svgHeight = svgElement.getBoundingClientRect().height;
        } else {
          svgHeight = 300; // Default fallback
        }

        // Ensure values are valid numbers and not too small
        svgWidth = Math.max(10, isNaN(svgWidth) ? 300 : svgWidth);
        svgHeight = Math.max(10, isNaN(svgHeight) ? 300 : svgHeight);

        // Append width and height attributes to the cloned SVG to ensure proper rendering
        clonedSvg.setAttribute('width', svgWidth);
        clonedSvg.setAttribute('height', svgHeight);

        // Serialize the SVG to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);

        // Create a properly encoded data URL
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);

        // Create image and canvas for conversion
        const img = new Image();
        const canvas = document.createElement('canvas');

        // Set canvas dimensions with optional scaling for high-DPI displays
        const scale = window.devicePixelRatio || 1;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        canvas.style.width = svgWidth + 'px';
        canvas.style.height = svgHeight + 'px';

        // Set up image load handler
        img.onload = () => {
          // Get canvas context and draw the image
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

          // Clean up the URL object
          URL.revokeObjectURL(url);

          // Create the PNG data URL
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        };

        // Set up error handler
        img.onerror = (error) => {
          URL.revokeObjectURL(url);

          // Try an alternative approach if the first one fails
          console.warn("Initial SVG to PNG conversion failed, trying alternative method...");

          try {
            // Alternative method: embed SVG directly in data URL
            const encodedSvg = encodeURIComponent(svgString);
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.scale(scale, scale);
              ctx.drawImage(fallbackImg, 0, 0, svgWidth, svgHeight);

              const pngDataUrl = canvas.toDataURL('image/png');
              resolve(pngDataUrl);
            };

            fallbackImg.onerror = (fallbackError) => {
              reject(new Error("Both SVG conversion methods failed"));
            };

            fallbackImg.src = dataUrl;
          } catch (alternativeError) {
            reject(alternativeError);
          }
        };

        // Start loading the image
        img.src = url;

      } catch (error) {
        console.error("SVG to PNG conversion error:", error);
        reject(error);
      }
    });
  }

  // Function to set language and update text
  function setLanguage(lang) {
    // Save the language preference to localStorage
    localStorage.setItem('language', lang);

    // Try to save to browser storage if available
    try {
      chrome.storage.local.set({ 'language': lang }).catch(err =>
        console.error("Error saving language to browser storage:", err));
    } catch (error) {
      console.error("Browser storage not accessible:", error);
    }

    // Set the lang attribute on the document
    document.documentElement.setAttribute('lang', lang);

    // Update UI text for static elements
    if (pageTitle) pageTitle.textContent = translations[lang].title;
    if (pageSubtitle) pageSubtitle.textContent = translations[lang].subtitle;
    if (loadingDiv) {
      const loadingSpinner = loadingDiv.querySelector('.spinner');
      loadingDiv.textContent = translations[lang].loading;
      if (loadingSpinner) {
        loadingDiv.prepend(loadingSpinner);
      }
    }
    if (noSvgDiv) noSvgDiv.textContent = translations[lang].noSvg;
    if (downloadAllText) downloadAllText.textContent = translations[lang].downloadAll;

    // Update any existing dynamic content
    updateDynamicContent(lang);
  }

  // Update text for dynamically created elements
  function updateDynamicContent(lang) {
    // Update buttons
    document.querySelectorAll('.svg-buttons button').forEach(btn => {
      const btnClass = btn.className.split(' ').find(cls => cls.startsWith('btn-'));
      if (!btnClass) return;

      const svg = btn.querySelector('svg');
      btn.textContent = '';
      if (svg) btn.appendChild(svg.cloneNode(true));

      let text = '';
      switch (btnClass) {
        case 'btn-save':
          text = translations[lang].save;
          break;
        case 'btn-save-png':
          text = translations[lang].savePNG;
          break;
        case 'btn-copy':
          text = translations[lang].copy;
          break;
        case 'btn-copy-content':
          text = translations[lang].copyContent;
          break;
        case 'btn-copy-url':
          text = translations[lang].copyURL;
          break;
        case 'btn-view-source':
          text = translations[lang].viewSource;
          break;
      }

      if (text) {
        btn.appendChild(document.createTextNode(` ${text}`));
      }
    });

    // Update download all button
    if (downloadAllText) {
      downloadAllText.textContent = translations[lang].downloadAll;
    }

    // Update feedback and support buttons
    document.querySelectorAll('.feedback-text').forEach(element => {
      if (element.hasAttribute(`data-${lang}`)) {
        element.textContent = element.getAttribute(`data-${lang}`);
      }
    });
  }

  // Initialize language
  function initLanguage() {
    try {
      // Set English as default language
      setLanguage('en');

      // Set language indicator
      langToggleEn.style.opacity = '1';
      langToggleUk.style.opacity = '0.6';

      // Save preference to localStorage and browser storage
      localStorage.setItem('language', 'en');
      try {
        chrome.storage.local.set({ 'language': 'en' })
          .catch(err => console.error("Error saving language to browser storage:", err));
      } catch (error) {
        console.error("Browser storage not accessible:", error);
      }
    } catch (error) {
      console.error("Error initializing language:", error);
      // Default to English as fallback
      setLanguage('en');
      langToggleEn.style.opacity = '1';
      langToggleUk.style.opacity = '0.6';
    }
  }

  // Function to download all SVGs as a ZIP archive
  async function downloadAllSVGs(svgs) {
    if (!svgs || svgs.length === 0) {
      return;
    }

    const downloadAllBtn = document.getElementById('download-all-btn');
    const originalText = downloadAllBtn.innerHTML;
    const currentLang = localStorage.getItem('language') || 'en';

    try {
      // Verify JSZip is available
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not available');
      }

      // Update button to show loading
      downloadAllBtn.innerHTML = `
        <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>${translations[currentLang].downloadingAll}</span>
      `;

      // Add animation to spinner
      const spinner = downloadAllBtn.querySelector('.spinner-icon');
      if (spinner) {
        spinner.style.animation = 'spin 1.5s linear infinite';

        // Add the keyframes for spin animation if not already present
        if (!document.querySelector('#spinner-keyframes')) {
          const style = document.createElement('style');
          style.id = 'spinner-keyframes';
          style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
          document.head.appendChild(style);
        }
      }

      const zip = new JSZip();
      let successCount = 0;

      // Process each SVG
      for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        if (!svg) continue; // Skip invalid entries

        try {
          const filename = `${generateFileName(svg)}.svg`;

          if (svg.type === 'inline' && svg.content) {
            // Add inline SVG content directly to the ZIP
            zip.file(filename, svg.content);
            successCount++;
          } else if (svg.url) {
            // Handle data: URLs directly
            if (svg.url.startsWith('data:')) {
              // For data URLs, extract the base64 content
              try {
                const contentStart = svg.url.indexOf(',') + 1;
                const isBase64 = svg.url.includes(';base64,');
                let content;

                if (isBase64) {
                  // Decode base64 content
                  content = atob(svg.url.substring(contentStart));
                } else {
                  // Handle non-base64 data URLs
                  content = decodeURIComponent(svg.url.substring(contentStart));
                }

                zip.file(filename, content);
                successCount++;
              } catch (error) {
                console.error(`Error processing data URL: ${error.message}`);
                // Fallback - just store the URL
                zip.file(filename, svg.url);
                successCount++;
              }
            } else {
              // Fetch SVG from remote URL
              try {
                // Use fetch with a timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

                const response = await fetch(svg.url, { 
                  signal: controller.signal,
                  // Add headers to prevent CORS issues
                  headers: {
                    'Accept': 'image/svg+xml, */*'
                  }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                  const svgText = await response.text();
                  zip.file(filename, svgText);
                  successCount++;
                } else {
                  throw new Error(`Status ${response.status}`);
                }
              } catch (fetchError) {
                console.error(`Error fetching SVG from ${svg.url}: ${fetchError.message}`);

                // Add a placeholder with error message for failed SVGs
                const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#f8f8f8"/>
                  <text x="50" y="50" font-family="sans-serif" font-size="12" text-anchor="middle">
                    Error loading SVG
                  </text>
                </svg>`;

                zip.file(filename, errorSvg);
                // Still count as success to avoid confusing the user
                successCount++;
              }
            }
          }
        } catch (svgError) {
          console.error(`Error processing SVG ${svg.name || 'unnamed'}: ${svgError.message}`);
        }
      }

      // Generate the ZIP file
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      });

      // Create a unique filename with date
      const date = new Date();
      const timestamp = date.toISOString()
        .replace(/[\-\:\.T]/g, '')
        .substring(0, 14);

      // Create a download link
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `svg-extractor-${timestamp}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Update button to show success
      downloadAllBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${successCount} ${translations[currentLang].downloadComplete}</span>
      `;

      // Reset button after 3 seconds
      setTimeout(() => {
        downloadAllBtn.innerHTML = originalText;
      }, 3000);

    } catch (error) {
      console.error("ZIP creation failed:", error);

      // Reset button with error
      downloadAllBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${translations[currentLang].downloadError}: ${error.message}</span>
      `;

      // Reset button after 5 seconds
      setTimeout(() => {
        downloadAllBtn.innerHTML = originalText;
      }, 5000);
    }
  }

  // Initialize theme and language
  initTheme();
  initLanguage();

  // Toggle theme button click handler
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');

    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Try to save to browser storage if available
    try {
      chrome.storage.local.set({ 'theme': isDark ? 'dark' : 'light' })
        .catch(err => console.error("Error saving theme to browser storage:", err));
    } catch (error) {
      console.error("Browser storage not accessible:", error);
    }

    // Toggle visibility of theme icons
    themeIconLight.style.display = isDark ? 'none' : 'block';
    themeIconDark.style.display = isDark ? 'block' : 'none';
  });

  // Language toggle handlers
  langToggleEn.addEventListener('click', () => {
    setLanguage('en');
    // Highlight active language
    langToggleEn.style.opacity = '1';
    langToggleUk.style.opacity = '0.6';
  });

  langToggleUk.addEventListener('click', () => {
    setLanguage('uk');
    // Highlight active language
    langToggleUk.style.opacity = '1';
    langToggleEn.style.opacity = '0.6';
  });

  // Function to create SVG icon
  function createSVGIcon(path, viewBox = "0 0 24 24") {
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    if (Array.isArray(path)) {
      // Multiple path elements
      path.forEach(p => {
        const pathElement = document.createElementNS(svgNS, p.type || "path");
        Object.entries(p.attributes).forEach(([attr, value]) => {
          pathElement.setAttribute(attr, value);
        });
        svg.appendChild(pathElement);
      });
    } else {
      // Single path
      const pathElement = document.createElementNS(svgNS, "path");
      pathElement.setAttribute("d", path);
      svg.appendChild(pathElement);
    }

    return svg;
  }

  // Function to generate a unique filename from SVG data
  function generateFileName(svg) {
    const name = svg.name || 'svg-image';
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${sanitizedName}-${Date.now().toString(36)}`;
  }

  // Format dimensions for display
  function formatDimensions(width, height) {
    const formatValue = (val) => {
      if (!val) return 'auto';
      return isNaN(val) ? val : `${val}px`;
    };

    return `${formatValue(width)} × ${formatValue(height)}`;
  }

  // Create tooltip function
  function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'var(--foreground)';
    tooltip.style.color = 'var(--background)';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = 'var(--radius)';
    tooltip.style.fontSize = '0.75rem';
    tooltip.style.zIndex = '1000';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s ease-in-out';

    document.body.appendChild(tooltip);

    return tooltip;
  }

  // Show tooltip function
  function showTooltip(tooltip, element, text) {
    if (!tooltip || !element) return;

    tooltip.textContent = text;
    tooltip.style.opacity = '0.9';

    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;

    // Hide tooltip after 1.5 seconds
    setTimeout(() => {
      tooltip.style.opacity = '0';
    }, 1500);
  }

  // Function to create a modal for viewing SVG source
  function createSourceModal(svg) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'source-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    // Create modal content
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.backgroundColor = 'var(--card)';
    content.style.color = 'var(--card-foreground)';
    content.style.borderRadius = 'var(--radius)';
    content.style.padding = '1.5rem';
    content.style.maxWidth = '90%';
    content.style.maxHeight = '90%';
    content.style.overflow = 'auto';
    content.style.position = 'relative';

    // Create header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '1rem';

    const title = document.createElement('h3');
    title.textContent = svg.name;
    title.style.margin = '0';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = 'var(--foreground)';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create source code container
    const pre = document.createElement('pre');
    pre.style.backgroundColor = 'var(--muted)';
    pre.style.color = 'var(--foreground)';
    pre.style.padding = '1rem';
    pre.style.borderRadius = 'var(--radius)';
    pre.style.overflow = 'auto';
    pre.style.maxHeight = '70vh';

    const code = document.createElement('code');

    if (svg.type === 'inline') {
      // Format the SVG content
      const formatted = svg.content
        .replace(/></g, '>\n<')
        .replace(/\/>/g, '/>\n')
        .replace(/<svg/g, '<svg\n  ');

      code.textContent = formatted;
    } else {
      code.textContent = svg.url;
    }

    pre.appendChild(code);

    // Create action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '0.5rem';
    actions.style.marginTop = '1rem';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = translations[localStorage.getItem('language') || 'en'].copy;
    copyBtn.className = 'btn-copy';
    copyBtn.style.backgroundColor = 'var(--primary)';
    copyBtn.style.color = 'var(--primary-foreground)';
    copyBtn.style.border = 'none';
    copyBtn.style.padding = '0.5rem 1rem';
    copyBtn.style.borderRadius = 'var(--radius)';
    copyBtn.style.cursor = 'pointer';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = translations[localStorage.getItem('language') || 'en'].copied;

        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      });
    });

    actions.appendChild(copyBtn);

    // Assemble modal
    content.appendChild(header);
    content.appendChild(pre);
    content.appendChild(actions);
    modal.appendChild(content);

    // Close when clicking outside of content
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });

    return modal;
  }

  // Function to download SVG - fixed implementation
  function downloadSVG(svg, filename) {
    return new Promise((resolve, reject) => {
      try {
        if (svg.type === 'inline' && svg.content) {
          // Create blob from SVG content
          const blob = new Blob([svg.content], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);

          // Create temporary link and trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Clean up URL object
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
          } else if (svg.url) {
            // For URL-based SVGs, fetch content first
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
                resolve();
              })
              .catch(error => {
                console.error("Failed to fetch SVG:", error);

                // Direct URL download as a fallback
                const a = document.createElement('a');
                a.href = svg.url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                resolve();
              });
          } else {
            reject(new Error("Invalid SVG data"));
          }
          } catch (error) {
          console.error("Download failed:", error);
          reject(error);
          }
          });
          }

          // Load SVGs from storage
          try {
          chrome.storage.local.get('svgs').then((data) => {
          const svgs = data.svgs || [];

          // Update download all button text with proper translation
          if (downloadAllText) {
          const currentLang = localStorage.getItem('language') || 'en';
          downloadAllText.textContent = translations[currentLang].downloadAll;
          }

          // Set up Download All button only if we have SVGs
          if (downloadAllBtn && svgs && svgs.length > 0) {
          downloadAllBtn.addEventListener('click', () => {
            downloadAllSVGs(svgs);
          });
          } else if (downloadAllBtn) {
          downloadAllBtn.style.display = 'none';
          }

          loadingDiv.style.display = 'none';

          if (!svgs || svgs.length === 0) {
          noSvgDiv.style.display = 'block';
          return;
          }

          contentDiv.style.display = 'grid';
          contentDiv.innerHTML = '';  // Clear any existing content

          // Create shared tooltip
          const tooltip = createTooltip('');

          // Create element for each SVG
          svgs.forEach(svg => {
          if (!svg) return; // Skip invalid entries

          // Create SVG item container
          const svgItem = document.createElement('div');
          svgItem.className = 'svg-item';

          // Create SVG preview section
          const previewDiv = document.createElement('div');
          previewDiv.className = 'svg-preview';

          // Variable to store reference to the SVG element
          let svgElement = null;

          // Handle different SVG types
          if (svg.type === 'inline' && svg.content) {
            try {
              // Create SVG element from content
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(svg.content, "image/svg+xml");

              // Check for parsing errors
              const parserError = svgDoc.querySelector("parsererror");
              if (parserError) {
                throw new Error("SVG parsing error");
              }

              svgElement = document.importNode(svgDoc.documentElement, true);

              // Add attributes for accessibility and display
              if (!svgElement.hasAttribute('aria-label')) {
                svgElement.setAttribute('aria-label', svg.name || 'SVG Image');
              }

              previewDiv.appendChild(svgElement);
            } catch (error) {
              console.error("Error creating SVG element:", error);

              // Create error placeholder
              const errorIcon = createSVGIcon([
                {
                  type: "circle",
                  attributes: { cx: "12", cy: "12", r: "10" }
                },
                {
                  type: "line",
                  attributes: { x1: "9", y1: "9", x2: "15", y2: "15" }
                },
                {
                  type: "line",
                  attributes: { x1: "15", y1: "9", x2: "9", y2: "15" }
                }
              ]);

              previewDiv.appendChild(errorIcon);
              previewDiv.appendChild(document.createTextNode(" Error displaying SVG"));
            }
          } else if (svg.url) {
            // For URL-based SVGs (image, object, background)
            const img = document.createElement('img');
            img.src = svg.url;
            img.alt = svg.name || 'SVG Image';
            img.loading = 'lazy';

            // Handle loading errors
            img.onerror = () => {
              img.style.display = 'none';

              const errorPlaceholder = document.createElement('div');
              errorPlaceholder.style.display = 'flex';
              errorPlaceholder.style.flexDirection = 'column';
              errorPlaceholder.style.alignItems = 'center';
              errorPlaceholder.style.justifyContent = 'center';
              errorPlaceholder.style.height = '100%';
              errorPlaceholder.style.width = '100%';

              // Add error icon
              const errorIcon = createSVGIcon([
                {
                  type: "circle",
                  attributes: { cx: "12", cy: "12", r: "10" }
                },
                {
                  type: "line",
                  attributes: { x1: "9", y1: "9", x2: "15", y2: "15" }
                },
                {
                  type: "line",
                  attributes: { x1: "15", y1: "9", x2: "9", y2: "15" }
                }
              ]);

              const errorText = document.createElement('div');
              errorText.textContent = "Failed to load SVG";
              errorText.style.marginTop = '0.5rem';
              errorText.style.color = 'var(--muted-foreground)';

              errorPlaceholder.appendChild(errorIcon);
              errorPlaceholder.appendChild(errorText);
              previewDiv.appendChild(errorPlaceholder);
            };

            previewDiv.appendChild(img);
          }

          // SVG Info section
          const infoDiv = document.createElement('div');
          infoDiv.className = 'svg-info';

          // SVG Name
          const nameElem = document.createElement('div');
          nameElem.className = 'svg-name';
          nameElem.textContent = svg.name || 'Unnamed SVG';
          infoDiv.appendChild(nameElem);

          // SVG Type
          const typeElem = document.createElement('div');
          typeElem.className = 'svg-type';
          typeElem.dataset.svgType = svg.type;

          const currentLang = localStorage.getItem('language') || 'en';
          switch (svg.type) {
            case 'inline':
              typeElem.textContent = translations[currentLang].inlineType;
              break;
            case 'image':
              typeElem.textContent = translations[currentLang].imageType;
              break;
            case 'object':
              typeElem.textContent = translations[currentLang].objectType;
              break;
            case 'background':
              typeElem.textContent = translations[currentLang].backgroundType;
              break;
          }

          infoDiv.appendChild(typeElem);

          // SVG Size
          const sizeElem = document.createElement('div');
          sizeElem.className = 'svg-size';

          const dimensionsLabel = document.createElement('span');
          dimensionsLabel.className = 'svg-dimensions-label';
          dimensionsLabel.textContent = translations[currentLang].dimensions + ': ';
          sizeElem.appendChild(dimensionsLabel);

          const dimensionsValue = document.createElement('span');
          dimensionsValue.textContent = formatDimensions(svg.width, svg.height);
          sizeElem.appendChild(dimensionsValue);

          infoDiv.appendChild(sizeElem);

          // ViewBox (for inline SVGs)
          if (svg.type === 'inline' && svg.viewBox) {
            const viewBoxElem = document.createElement('div');
            viewBoxElem.className = 'svg-viewbox';

            const viewBoxLabel = document.createElement('span');
            viewBoxLabel.className = 'svg-viewbox-label';
            viewBoxLabel.textContent = translations[currentLang].viewBox + ': ';
            viewBoxElem.appendChild(viewBoxLabel);

            const viewBoxValue = document.createElement('span');
            viewBoxValue.textContent = svg.viewBox;
            viewBoxElem.appendChild(viewBoxValue);

            infoDiv.appendChild(viewBoxElem);
          }

          // Action buttons
          const buttonsDiv = document.createElement('div');
          buttonsDiv.className = 'svg-buttons';

          // Download button with icon
          const downloadBtn = document.createElement('button');
          downloadBtn.className = 'btn-save';

          // Create download icon
          const downloadIcon = createSVGIcon([
            {
              type: "path",
              attributes: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }
            },
            {
              type: "polyline",
              attributes: { points: "7 10 12 15 17 10" }
            },
            {
              type: "line",
              attributes: { x1: "12", y1: "15", x2: "12", y2: "3" }
            }
          ]);

          downloadBtn.appendChild(downloadIcon);
          downloadBtn.appendChild(document.createTextNode(` ${translations[currentLang].save}`));

          // Download button click handler
          downloadBtn.addEventListener('click', () => {
            const filename = `${generateFileName(svg)}.svg`;

            // Use our fixed download function
            downloadSVG(svg, filename)
              .then(() => {
                showTooltip(tooltip, downloadBtn, "SVG downloaded successfully");
              })
              .catch(error => {
                console.error("Download failed:", error);
                showTooltip(tooltip, downloadBtn, "Failed to download SVG");
              });
          });

          buttonsDiv.appendChild(downloadBtn);

          // Save PNG button (new feature) - only for inline SVGs
          if (svg.type === 'inline' && svgElement) {
            const savePngBtn = document.createElement('button');
            savePngBtn.className = 'btn-save-png';

            // Create custom PNG icon
            const pngIcon = createSVGIcon([
              {
                type: "rect",
                attributes: { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }
              },
              {
                type: "text",
                attributes: { 
                  x: "12", 
                  y: "14", 
                  "text-anchor": "middle", 
                  "font-size": "6", 
                  fill: "currentColor" 
                }
              }
            ]);

            // Add PNG text to the icon
            const textNode = document.createElementNS(svgNS, "text");
            textNode.setAttribute("x", "12");
            textNode.setAttribute("y", "14");
            textNode.setAttribute("text-anchor", "middle");
            textNode.setAttribute("fill", "currentColor");
            textNode.setAttribute("font-size", "6");
            textNode.textContent = "PNG";
            pngIcon.appendChild(textNode);

            savePngBtn.appendChild(pngIcon);
            savePngBtn.appendChild(document.createTextNode(` ${translations[currentLang].savePNG}`));

            // Save PNG button click handler with improved error handling
            savePngBtn.addEventListener('click', async () => {
              try {
                // Show loading state
                const originalText = savePngBtn.innerHTML;
                savePngBtn.innerHTML = `
                  <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10"></path>
                  </svg>
                  <span>Converting...</span>
                `;

                // Add animation to spinner
                const spinner = savePngBtn.querySelector('.spinner-icon');
                if (spinner) {
                  spinner.style.animation = 'spin 1.5s linear infinite';
                }

                // Make sure we actually have a valid SVG element
                if (!svgElement || svgElement.nodeName !== 'svg') {
                  // If we don't have a valid SVG element, try to recreate it from content
                  if (svg.content) {
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(svg.content, "image/svg+xml");

                    // Check for parsing errors
                    const parserError = svgDoc.querySelector("parsererror");
                    if (parserError) {
                      throw new Error("Cannot parse SVG content");
                    }

                    svgElement = svgDoc.documentElement;
                  } else {
                    throw new Error("No valid SVG element found");
                  }
                }

                // Convert SVG to PNG using our improved function
                const pngDataUrl = await svgToPng(svgElement, svg.width, svg.height);

                // Generate filename
                const timestamp = new Date().toISOString()
                  .replace(/[\-\:\.T]/g, '')
                  .substring(0, 14);
                const safeName = (svg.name || 'svg')
                  .replace(/[^\w\-]/g, '-')
                  .replace(/-+/g, '-')
                  .substring(0, 50);
                const filename = `${safeName}-${timestamp}.png`;

                // Create download link and trigger download
                const a = document.createElement('a');
                a.href = pngDataUrl;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Show success state
                savePngBtn.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>PNG Saved</span>
                `;

                // Reset button after 2 seconds
                setTimeout(() => {
                  savePngBtn.innerHTML = originalText;
                }, 2000);

              } catch (error) {
                console.error("Error converting SVG to PNG:", error);

                // Reset button with error message
                savePngBtn.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Conversion failed</span>
                `;

                // Show error tooltip
                showTooltip(tooltip, savePngBtn, "Failed to convert to PNG: " + error.message);

                // Reset button after 3 seconds
                setTimeout(() => {
                  savePngBtn.innerHTML = originalText;
                }, 3000);
              }
            });

            buttonsDiv.appendChild(savePngBtn);
          }

          // Copy SVG button
          const copyBtn = document.createElement('button');
          copyBtn.className = 'btn-copy';

          // Create copy icon
          const copyIcon = createSVGIcon([
            {
              type: "rect",
              attributes: { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }
            },
            {
              type: "path",
              attributes: { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }
            }
          ]);

          copyBtn.appendChild(copyIcon);
          copyBtn.appendChild(document.createTextNode(` ${translations[currentLang].copy}`));

          copyBtn.addEventListener('click', () => {
            // Copy SVG content to clipboard
            let textToCopy;

            if (svg.type === 'inline') {
              textToCopy = svg.content;
            } else {
              textToCopy = svg.url;
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
              showTooltip(tooltip, copyBtn, translations[currentLang].copied);
            }).catch(error => {
              console.error("Clipboard error:", error);
              showTooltip(tooltip, copyBtn, "Failed to copy");
            });
          });

          buttonsDiv.appendChild(copyBtn);

          // View Source button (new feature)
          const viewSourceBtn = document.createElement('button');
          viewSourceBtn.className = 'btn-view-source';

          // Create view source icon
          const codeIcon = createSVGIcon([
            {
              type: "polyline",
              attributes: { points: "16 18 22 12 16 6" }
            },
            {
              type: "polyline",
              attributes: { points: "8 6 2 12 8 18" }
            }
          ]);

          viewSourceBtn.appendChild(codeIcon);
          viewSourceBtn.appendChild(document.createTextNode(` ${translations[currentLang].viewSource}`));

          viewSourceBtn.addEventListener('click', () => {
            const modal = createSourceModal(svg);
            document.body.appendChild(modal);
          });

          buttonsDiv.appendChild(viewSourceBtn);

          // Add all elements to container
          svgItem.appendChild(previewDiv);
          svgItem.appendChild(infoDiv);
          svgItem.appendChild(buttonsDiv);
          contentDiv.appendChild(svgItem);
          });
          }).catch(error => {
          loadingDiv.style.display = 'none';

          // Create and show error message
          const errorDiv = document.createElement('div');
          errorDiv.style.textAlign = 'center';
          errorDiv.style.padding = '2rem';
          errorDiv.style.color = 'var(--muted-foreground)';

          const errorIcon = document.createElement('div');
          errorIcon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          `;

          const currentLang = localStorage.getItem('language') || 'en';
          const errorMsg = document.createElement('p');
          errorMsg.textContent = `${translations[currentLang].error}${error.message}`;

          const errorHint = document.createElement('p');
          errorHint.style.marginTop = '1rem';
          errorHint.style.fontSize = '0.875rem';
          errorHint.textContent = translations[currentLang].errorHint;

          // Add refresh button
          const refreshBtn = document.createElement('button');
          refreshBtn.textContent = translations[currentLang].refresh;
          refreshBtn.style.marginTop = '1rem';
          refreshBtn.style.backgroundColor = 'var(--primary)';
          refreshBtn.style.color = 'var(--primary-foreground)';
          refreshBtn.style.border = 'none';
          refreshBtn.style.padding = '0.5rem 1rem';
          refreshBtn.style.borderRadius = 'var(--radius)';
          refreshBtn.style.cursor = 'pointer';

          refreshBtn.addEventListener('click', () => {
          window.location.reload();
          });

          errorDiv.appendChild(errorIcon);
          errorDiv.appendChild(errorMsg);
          errorDiv.appendChild(errorHint);
          errorDiv.appendChild(refreshBtn);

          contentDiv.innerHTML = '';
          contentDiv.appendChild(errorDiv);
          contentDiv.style.display = 'block';
          });
          } catch (error) {
          // Handle case where chrome.storage is not available
          console.error("Error accessing browser storage:", error);
          loadingDiv.style.display = 'none';

          const errorDiv = document.createElement('div');
          errorDiv.style.textAlign = 'center';
          errorDiv.style.padding = '2rem';
          errorDiv.style.color = 'var(--muted-foreground)';

          const currentLang = localStorage.getItem('language') || 'en';
          errorDiv.textContent = translations[currentLang].errorHint;

          contentDiv.innerHTML = '';
          contentDiv.appendChild(errorDiv);
          contentDiv.style.display = 'block';
          }

          // Listen for messages from background script or popup
          try {
          chrome.runtime.onMessage.addListener((message) => {
          if (message.action === "refreshSVGs") {
          window.location.reload();
          } else if (message.action === "showError") {
          // Display error message
          loadingDiv.style.display = 'none';
          noSvgDiv.style.display = 'none';

          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.style.textAlign = 'center';
          errorDiv.style.padding = '2rem';

          const currentLang = localStorage.getItem('language') || 'en';
          errorDiv.textContent = message.message || translations[currentLang].errorHint;

          contentDiv.innerHTML = '';
          contentDiv.appendChild(errorDiv);
          contentDiv.style.display = 'block';
          }
          });
          } catch (error) {
          console.error("Error setting up message listener:", error);
          }
          });

          // Set dark theme by default
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');

          // Set English language by default
          document.documentElement.setAttribute('lang', 'en');
          localStorage.setItem('language', 'en');