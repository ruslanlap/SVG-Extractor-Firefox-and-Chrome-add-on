// results.js - SVG Extractor Pro Studio Workspace
document.addEventListener("DOMContentLoaded", () => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Elements
  const contentDiv = document.getElementById("content");
  const loadingDiv = document.getElementById("loading");
  const loadingText = document.getElementById("loading-text");
  const noSvgDiv = document.getElementById("no-svg");
  const emptyTitle = document.getElementById("empty-title");
  const emptyDesc = document.getElementById("empty-desc");
  const emptyRescanBtn = document.getElementById("empty-rescan-btn");
  const toolbarDiv = document.getElementById("studio-toolbar");

  const themeToggle = document.getElementById("theme-toggle");
  const themeIconLight = document.getElementById("theme-icon-light");
  const themeIconDark = document.getElementById("theme-icon-dark");
  const langToggleEn = document.getElementById("lang-toggle-en");
  const langToggleUk = document.getElementById("lang-toggle-uk");

  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");
  const heroKicker = document.getElementById("hero-kicker");
  const headerCoffeeText = document.getElementById("header-coffee-text");
  const rescanBtn = document.getElementById("rescan-btn");
  const rescanLabel = document.getElementById("rescan-label");
  const downloadAllBtn = document.getElementById("download-all-btn");
  const downloadAllText = document.getElementById("download-all-text");
  const sourcePill = document.getElementById("source-pill");
  const sourceDomain = document.getElementById("source-domain");
  const footerDesc = document.getElementById("footer-desc");

  const statTotal = document.getElementById("stat-total");
  const statInline = document.getElementById("stat-inline");
  const statSprite = document.getElementById("stat-sprite");
  const statImage = document.getElementById("stat-image");
  const statBg = document.getElementById("stat-bg");

  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const sortSelect = document.getElementById("sort-select");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const backdropBtns = document.querySelectorAll(".backdrop-btn");
  const selectAllCheckbox = document.getElementById("select-all-checkbox");
  const selectAllText = document.getElementById("select-all-text");
  const selectionBadge = document.getElementById("selection-badge");

  // Modal Elements
  const modal = document.getElementById("inspector-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalTypeBadge = document.getElementById("modal-type-badge");
  const modalTitle = document.getElementById("modal-title");
  const modalPreviewStage = document.getElementById("modal-preview-stage");
  const modalMetaDimLabel = document.getElementById("modal-meta-dim-label");
  const modalMetaVbLabel = document.getElementById("modal-meta-vb-label");
  const modalMetaSizeLabel = document.getElementById("modal-meta-size-label");
  const modalScaleLabel = document.getElementById("modal-scale-label");
  const modalMetaDim = document.getElementById("modal-meta-dim");
  const modalMetaVb = document.getElementById("modal-meta-vb");
  const modalMetaSize = document.getElementById("modal-meta-size");
  const modalCodeLabel = document.getElementById("modal-code-label");
  const modalCodeContent = document.getElementById("modal-code-content");
  const modalCopyDataUriBtn = document.getElementById("modal-copy-datauri-btn");
  const modalCopyBtn = document.getElementById("modal-copy-btn");
  const modalPngBtn = document.getElementById("modal-png-btn");
  const modalSaveBtn = document.getElementById("modal-save-btn");
  const scalePills = document.querySelectorAll(".scale-pill");

  const toastContainer = document.getElementById("toast-container");

  // State
  let allSvgs = [];
  let filteredSvgs = [];
  let sourceTabId = null;
  let currentLang = "en";
  let currentFilter = "all";
  let currentSort = "order";
  let currentSearch = "";
  let currentBackdrop = "grid";
  let selectedKeys = new Set();
  let activeModalSvg = null;
  let pngExportScale = 2;

  const translations = {
    en: {
      heroKicker: "VECTOR ASSET INSPECTOR",
      title: "SVG Extractor Pro",
      subtitle: "Inspect, preview, and export clean vector assets from the active page.",
      headerCoffee: "Buy a coffee",
      rescan: "Rescan",
      loading: "Scanning page vectors...",
      emptyTitle: "No SVG vectors found",
      emptyDesc: "This page may not contain vector assets yet, or dynamic icons haven't mounted.",
      noMatchTitle: "No matching vectors",
      noMatchDesc: "Try clearing the search query or switching the active type filter.",
      rescanPage: "Rescan page",
      clearFilters: "Reset filters",
      searchPlaceholder: "Search by name, viewBox, or size...",
      sortOrder: "Page order",
      sortName: "Name (A–Z)",
      sortDimensions: "Dimensions (largest)",
      sortSize: "File size (largest)",
      backdropGrid: "Grid",
      backdropDark: "Dark",
      backdropLight: "Light",
      backdropChecker: "Checker",
      filterAll: "All",
      filterInline: "Inline",
      filterSprite: "Sprite",
      filterImage: "Image",
      filterBackground: "Background",
      selectAll: "Select all",
      selectedCount: "selected",
      downloadAll: "Download All ZIP",
      downloadSelected: "Download Selected ZIP",
      archiving: "Archiving",
      zipReady: "ZIP exported",
      zipFailed: "ZIP export failed",
      saveSvg: "SVG",
      savePng: "PNG",
      copy: "Copy",
      copied: "Copied",
      copySvg: "Copy SVG",
      copyDataUri: "Copy Data URI",
      exportPng: "Export PNG",
      saveSvgFull: "Save SVG",
      sourceCode: "SOURCE CODE",
      dimensions: "DIMENSIONS",
      viewBox: "VIEWBOX",
      size: "SIZE",
      pngScale: "PNG SCALE",
      leaveFeedback: "Leave Feedback",
      reportABug: "Report a Bug",
      buyMeACoffee: "Buy Me a Coffee",
      footerDesc: "Built independently for designers and frontend engineers. Zero ads, zero tracking.",
      statVectors: "vectors",
      statInline: "inline",
      statSprite: "sprite",
      statImage: "image",
      statBackground: "background",
      toastCopied: "SVG copied to clipboard",
      toastDataUriCopied: "Data URI copied to clipboard",
      toastCopyError: "Failed to copy to clipboard",
      toastSvgSaved: "SVG download started",
      toastPngSaved: "PNG exported",
      toastPngError: "Could not export PNG",
      toastRescanOk: "Page rescanned",
      toastRescanErr: "Unable to rescan source tab",
      previewFailed: "Preview unavailable"
    },
    uk: {
      heroKicker: "ІНСПЕКТОР ВЕКТОРНОЇ ГРАФІКИ",
      title: "SVG Extractor Pro",
      subtitle: "Переглядайте, фільтруйте та експортуйте чисті векторні ресурси зі сторінки.",
      headerCoffee: "Пригостити кавою",
      rescan: "Оновити",
      loading: "Сканування векторів на сторінці...",
      emptyTitle: "SVG-зображення не знайдено",
      emptyDesc: "На цій сторінці немає векторних елементів або вони ще не завантажились.",
      noMatchTitle: "Нічого не знайдено",
      noMatchDesc: "Спробуйте очистити пошуковий запит або змінити активний фільтр.",
      rescanPage: "Сканувати знову",
      clearFilters: "Скинути фільтри",
      searchPlaceholder: "Пошук за назвою, viewBox чи розміром...",
      sortOrder: "Порядок на сторінці",
      sortName: "Назва (A–Z)",
      sortDimensions: "Найбільший розмір",
      sortSize: "Найбільша вага файлу",
      backdropGrid: "Сітка",
      backdropDark: "Темний",
      backdropLight: "Світлий",
      backdropChecker: "Шахи",
      filterAll: "Усі",
      filterInline: "Inline",
      filterSprite: "Спрайти",
      filterImage: "Зображення",
      filterBackground: "Фон",
      selectAll: "Обрати всі",
      selectedCount: "обрано",
      downloadAll: "Завантажити все ZIP",
      downloadSelected: "Завантажити обрані ZIP",
      archiving: "Архівування",
      zipReady: "ZIP збережено",
      zipFailed: "Помилка створення ZIP",
      saveSvg: "SVG",
      savePng: "PNG",
      copy: "Копіювати",
      copied: "Скопійовано",
      copySvg: "Копіювати SVG",
      copyDataUri: "Копіювати Data URI",
      exportPng: "Експорт PNG",
      saveSvgFull: "Зберегти SVG",
      sourceCode: "ВИХІДНИЙ КОД",
      dimensions: "РОЗМІРИ",
      viewBox: "VIEWBOX",
      size: "РОЗМІР",
      pngScale: "МАСШТАБ PNG",
      leaveFeedback: "Залишити відгук",
      reportABug: "Повідомити про помилку",
      buyMeACoffee: "Пригостити кавою",
      footerDesc: "Незалежний інструмент для дизайнерів і фронтенд-розробників. Без реклами й трекерів.",
      statVectors: "векторів",
      statInline: "inline",
      statSprite: "спрайтів",
      statImage: "зображень",
      statBackground: "фонових",
      toastCopied: "SVG скопійовано в буфер обміну",
      toastDataUriCopied: "Data URI скопійовано",
      toastCopyError: "Не вдалося скопіювати",
      toastSvgSaved: "Завантаження SVG розпочато",
      toastPngSaved: "PNG експортовано",
      toastPngError: "Не вдалося експортувати PNG",
      toastRescanOk: "Сторінку проскановано",
      toastRescanErr: "Не вдалося оновити вихідну вкладку",
      previewFailed: "Попередній перегляд недоступний"
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
  }

  function showToast(message, isError = false) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `studio-toast${isError ? " is-error" : ""}`;

    const dot = document.createElement("span");
    dot.className = "toast-dot";
    const label = document.createElement("span");
    label.textContent = message;

    toast.appendChild(dot);
    toast.appendChild(label);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.2s ease";
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDimensions(width, height) {
    const w = width ? Math.round(width) : "auto";
    const h = height ? Math.round(height) : "auto";
    return `${w} × ${h} px`;
  }

  function getSvgKey(svg, index) {
    return svg.id || `${svg.type}-${svg.name}-${index}`;
  }

  function buildSafeFilename(svg, ext, usedNames) {
    const base = (svg.name || "vector")
      .replace(/[^\w-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 48) || "vector";

    let candidate = `${base}.${ext}`;
    if (usedNames) {
      let counter = 2;
      while (usedNames.has(candidate)) {
        candidate = `${base}-${counter}.${ext}`;
        counter++;
      }
      usedNames.add(candidate);
    }
    return candidate;
  }

  function sanitizeSvgElement(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("Invalid SVG markup");
    }
    const root = document.importNode(doc.documentElement, true);

    // Strip scripts and inline event handlers
    root.querySelectorAll("script, foreignObject").forEach((el) => el.remove());
    const walk = [root, ...root.querySelectorAll("*")];
    walk.forEach((node) => {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.toLowerCase().startsWith("on")) {
          node.removeAttribute(attr.name);
        }
      }
    });

    if (!root.getAttribute("xmlns")) {
      root.setAttribute("xmlns", SVG_NS);
    }
    return root;
  }

  function formatXmlSource(xml) {
    return (xml || "")
      .replace(/>\s*</g, ">\n<")
      .trim();
  }

  async function fetchSvgText(targetUrl) {
    if (targetUrl.startsWith("data:image/svg+xml")) {
      const commaIdx = targetUrl.indexOf(",");
      if (commaIdx === -1) throw new Error("Malformed data URL");
      const meta = targetUrl.slice(0, commaIdx);
      const payload = targetUrl.slice(commaIdx + 1);
      return meta.includes(";base64") ? atob(payload) : decodeURIComponent(payload);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { Accept: "image/svg+xml,*/*" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes("<svg")) {
        throw new Error("Response is not valid SVG");
      }
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  async function resolveSvgMarkup(svg) {
    if (svg.content) return svg.content;
    if (!svg.url && !svg.fallbackUrl) throw new Error("No SVG content or URL");

    const candidates = [svg.url, svg.fallbackUrl].filter(
      (u, i, arr) => Boolean(u) && arr.indexOf(u) === i
    );

    let lastError = null;
    for (const candidateUrl of candidates) {
      try {
        const text = await fetchSvgText(candidateUrl);
        svg.content = text; // Cache for subsequent copies/exports
        return text;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Unable to fetch SVG markup");
  }

  async function convertSvgToPngDataUrl(svg, scale = 2) {
    let width = parseFloat(svg.width) || 0;
    let height = parseFloat(svg.height) || 0;
    let markup = null;

    try {
      markup = await resolveSvgMarkup(svg);
    } catch {
      markup = null;
    }

    if (markup) {
      const parsed = sanitizeSvgElement(markup);
      if (!width || !height) {
        const vb = parsed.viewBox?.baseVal;
        width = width || vb?.width || 256;
        height = height || vb?.height || 256;
      }
      width = Math.max(16, Math.round(width));
      height = Math.max(16, Math.round(height));
      parsed.setAttribute("width", String(width));
      parsed.setAttribute("height", String(height));
      const serialized = new XMLSerializer().serializeToString(parsed);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
      return rasterizeImageToPng(dataUrl, width, height, scale);
    }

    if (svg.url) {
      width = Math.max(16, Math.round(width || 256));
      height = Math.max(16, Math.round(height || 256));
      try {
        return await rasterizeImageToPng(svg.url, width, height, scale, true);
      } catch (err) {
        if (svg.fallbackUrl && svg.fallbackUrl !== svg.url) {
          return rasterizeImageToPng(svg.fallbackUrl, width, height, scale, true);
        }
        throw err;
      }
    }

    throw new Error("No renderable SVG source");
  }

  function rasterizeImageToPng(src, width, height, scale, useCrossOrigin = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (useCrossOrigin) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = src;
    });
  }

  function triggerBrowserDownload(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function downloadSingleSvg(svg) {
    const filename = buildSafeFilename(svg, "svg");
    try {
      const markup = await resolveSvgMarkup(svg);
      const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      showToast(t("toastSvgSaved"));
    } catch {
      if (svg.url) {
        chrome.runtime.sendMessage({ action: "downloadSVG", svg });
        showToast(t("toastSvgSaved"));
      } else {
        showToast(t("zipFailed"), true);
      }
    }
  }

  async function downloadSinglePng(svg, scale = 2) {
    try {
      const pngDataUrl = await convertSvgToPngDataUrl(svg, scale);
      const filename = buildSafeFilename(svg, "png");
      triggerBrowserDownload(pngDataUrl, filename);
      showToast(`${t("toastPngSaved")} (${scale}×)`);
    } catch (error) {
      console.error("PNG export error:", error);
      showToast(t("toastPngError"), true);
    }
  }

  async function downloadZipArchive(svgsToExport) {
    if (!svgsToExport || !svgsToExport.length) return;
    if (typeof JSZip === "undefined") {
      showToast(t("zipFailed"), true);
      return;
    }

    downloadAllBtn.disabled = true;
    const zip = new JSZip();
    const usedNames = new Set();
    let completed = 0;
    let successCount = 0;

    const updateProgress = () => {
      downloadAllText.textContent = `${t("archiving")} ${completed}/${svgsToExport.length}...`;
    };
    updateProgress();

    const CONCURRENCY = 6;
    let cursor = 0;

    async function worker() {
      while (cursor < svgsToExport.length) {
        const idx = cursor++;
        const svg = svgsToExport[idx];
        const filename = buildSafeFilename(svg, "svg", usedNames);
        try {
          const markup = await resolveSvgMarkup(svg);
          zip.file(filename, markup);
          successCount++;
        } catch {
          // Skip broken remote assets rather than writing invalid placeholders
        } finally {
          completed++;
          updateProgress();
        }
      }
    }

    try {
      const workers = Array.from({ length: Math.min(CONCURRENCY, svgsToExport.length) }, worker);
      await Promise.all(workers);

      if (successCount === 0) {
        throw new Error("No valid SVGs could be packaged");
      }

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const ts = new Date().toISOString().replace(/[-:.T]/g, "").slice(0, 14);
      const url = URL.createObjectURL(blob);
      triggerBrowserDownload(url, `svg-extractor-pro-${ts}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast(`${t("zipReady")} (${successCount})`);
    } catch (error) {
      console.error("ZIP generation failed:", error);
      showToast(t("zipFailed"), true);
    } finally {
      downloadAllBtn.disabled = false;
      updateDownloadAllLabel();
    }
  }

  // Theme management (preserves saved choice)
  function applyTheme(theme) {
    const isDark = theme !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    themeIconLight.style.display = isDark ? "block" : "none";
    themeIconDark.style.display = isDark ? "none" : "block";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  async function initTheme() {
    let saved = localStorage.getItem("theme");
    try {
      const data = await chrome.storage.local.get("theme");
      if (data?.theme === "light" || data?.theme === "dark") {
        saved = data.theme;
      }
    } catch {
      // Fallback to localStorage
    }
    applyTheme(saved || "dark");
  }

  // Language management (preserves saved choice)
  function applyLanguage(lang) {
    currentLang = lang === "uk" ? "uk" : "en";
    document.documentElement.setAttribute("lang", currentLang);
    localStorage.setItem("language", currentLang);

    langToggleEn.classList.toggle("is-active", currentLang === "en");
    langToggleEn.setAttribute("aria-pressed", String(currentLang === "en"));
    langToggleUk.classList.toggle("is-active", currentLang === "uk");
    langToggleUk.setAttribute("aria-pressed", String(currentLang === "uk"));

    heroKicker.textContent = t("heroKicker");
    pageTitle.textContent = t("title");
    pageSubtitle.textContent = t("subtitle");
    headerCoffeeText.textContent = t("headerCoffee");
    rescanLabel.textContent = t("rescan");
    loadingText.textContent = t("loading");
    searchInput.placeholder = t("searchPlaceholder");
    selectAllText.textContent = t("selectAll");
    footerDesc.textContent = t("footerDesc");

    const sortOptions = sortSelect.options;
    if (sortOptions.length >= 4) {
      sortOptions[0].textContent = t("sortOrder");
      sortOptions[1].textContent = t("sortName");
      sortOptions[2].textContent = t("sortDimensions");
      sortOptions[3].textContent = t("sortSize");
    }

    backdropBtns.forEach((btn) => {
      const mode = btn.dataset.backdrop;
      const cap = mode.charAt(0).toUpperCase() + mode.slice(1);
      btn.textContent = t(`backdrop${cap}`);
    });

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });

    modalMetaDimLabel.textContent = t("dimensions");
    modalMetaVbLabel.textContent = t("viewBox");
    modalMetaSizeLabel.textContent = t("size");
    modalScaleLabel.textContent = t("pngScale");
    modalCodeLabel.textContent = t("sourceCode");
    modalCopyDataUriBtn.textContent = t("copyDataUri");
    modalCopyBtn.textContent = t("copySvg");
    modalPngBtn.textContent = t("exportPng");
    modalSaveBtn.textContent = t("saveSvgFull");

    updateStatsAndCounts();
    updateDownloadAllLabel();
    updateSelectionBadge();
    renderCards();
  }

  async function initLanguage() {
    let saved = localStorage.getItem("language");
    try {
      const data = await chrome.storage.local.get("language");
      if (data?.language === "uk" || data?.language === "en") {
        saved = data.language;
      }
    } catch {
      // Fallback
    }
    if (!saved) {
      const navLang = (navigator.language || "en").toLowerCase();
      saved = navLang.startsWith("uk") ? "uk" : "en";
    }
    applyLanguage(saved);
  }

  function updateDownloadAllLabel() {
    if (selectedKeys.size > 0) {
      downloadAllText.textContent = `${t("downloadSelected")} (${selectedKeys.size})`;
    } else {
      downloadAllText.textContent = `${t("downloadAll")} (${filteredSvgs.length || allSvgs.length})`;
    }
  }

  function updateSelectionBadge() {
    if (selectedKeys.size > 0) {
      selectionBadge.hidden = false;
      selectionBadge.textContent = `${selectedKeys.size} ${t("selectedCount")}`;
    } else {
      selectionBadge.hidden = true;
    }
    updateDownloadAllLabel();
  }

  function updateStatsAndCounts() {
    const counts = { all: allSvgs.length, inline: 0, sprite: 0, image: 0, background: 0 };
    for (const svg of allSvgs) {
      if (svg.type === "inline") counts.inline++;
      else if (svg.type === "sprite") counts.sprite++;
      else if (svg.type === "image" || svg.type === "object") counts.image++;
      else if (svg.type === "background") counts.background++;
    }

    document.getElementById("count-all").textContent = String(counts.all);
    document.getElementById("count-inline").textContent = String(counts.inline);
    document.getElementById("count-sprite").textContent = String(counts.sprite);
    document.getElementById("count-image").textContent = String(counts.image);
    document.getElementById("count-background").textContent = String(counts.background);

    statTotal.textContent = `• ${counts.all} ${t("statVectors")}`;
    statInline.textContent = `• ${counts.inline} ${t("statInline")}`;
    statSprite.textContent = `• ${counts.sprite} ${t("statSprite")}`;
    statImage.textContent = `• ${counts.image} ${t("statImage")}`;
    statBg.textContent = `• ${counts.background} ${t("statBackground")}`;
  }

  function computeFilteredAndSorted() {
    const query = currentSearch.trim().toLowerCase();
    let list = allSvgs.map((svg, idx) => ({ svg, idx }));

    if (currentFilter !== "all") {
      list = list.filter(({ svg }) => {
        if (currentFilter === "image") {
          return svg.type === "image" || svg.type === "object";
        }
        return svg.type === currentFilter;
      });
    }

    if (query) {
      list = list.filter(({ svg }) => {
        const hay = `${svg.name || ""} ${svg.type || ""} ${svg.viewBox || ""} ${svg.width || ""}x${svg.height || ""}`.toLowerCase();
        return hay.includes(query);
      });
    }

    if (currentSort === "name") {
      list.sort((a, b) => (a.svg.name || "").localeCompare(b.svg.name || ""));
    } else if (currentSort === "dimensions") {
      list.sort((a, b) => {
        const areaA = (parseFloat(a.svg.width) || 0) * (parseFloat(a.svg.height) || 0);
        const areaB = (parseFloat(b.svg.width) || 0) * (parseFloat(b.svg.height) || 0);
        return areaB - areaA;
      });
    } else if (currentSort === "size") {
      list.sort((a, b) => (b.svg.size || 0) - (a.svg.size || 0));
    }

    filteredSvgs = list.map((item) => item.svg);
    return list;
  }

  function createIconSvg(paths) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    paths.forEach(([tag, attrs]) => {
      const el = document.createElementNS(SVG_NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      svg.appendChild(el);
    });
    return svg;
  }

  function renderPreviewInto(container, svg) {
    container.innerHTML = "";
    if ((svg.type === "inline" || svg.type === "sprite") && svg.content) {
      try {
        const el = sanitizeSvgElement(svg.content);
        if (svg.computedColor && !el.style.color && svg.content.includes("currentColor")) {
          el.style.color = "currentColor";
        }
        container.appendChild(el);
        return;
      } catch {
        // Fallback below
      }
    }

    if (svg.url) {
      const img = document.createElement("img");
      img.src = svg.url;
      img.alt = svg.name || "SVG";
      img.loading = "lazy";
      img.onerror = () => {
        if (svg.fallbackUrl && !img.dataset.triedFallback && img.src !== svg.fallbackUrl) {
          img.dataset.triedFallback = "1";
          img.src = svg.fallbackUrl;
          return;
        }
        container.innerHTML = "";
        const err = document.createElement("div");
        err.className = "preview-error";
        err.appendChild(
          createIconSvg([
            ["circle", { cx: "12", cy: "12", r: "10" }],
            ["line", { x1: "9", y1: "9", x2: "15", y2: "15" }],
            ["line", { x1: "15", y1: "9", x2: "9", y2: "15" }]
          ])
        );
        const span = document.createElement("span");
        span.textContent = t("previewFailed");
        err.appendChild(span);
        container.appendChild(err);
      };
      container.appendChild(img);
    }
  }

  function renderCards() {
    loadingDiv.hidden = true;

    if (!allSvgs.length) {
      toolbarDiv.hidden = true;
      contentDiv.hidden = true;
      downloadAllBtn.hidden = true;
      noSvgDiv.hidden = false;
      emptyTitle.textContent = t("emptyTitle");
      emptyDesc.textContent = t("emptyDesc");
      emptyRescanBtn.textContent = t("rescanPage");
      emptyRescanBtn.dataset.mode = "rescan";
      return;
    }

    toolbarDiv.hidden = false;
    downloadAllBtn.hidden = false;

    const items = computeFilteredAndSorted();
    updateDownloadAllLabel();

    if (!items.length) {
      contentDiv.hidden = true;
      noSvgDiv.hidden = false;
      emptyTitle.textContent = t("noMatchTitle");
      emptyDesc.textContent = t("noMatchDesc");
      emptyRescanBtn.textContent = t("clearFilters");
      emptyRescanBtn.dataset.mode = "clear";
      return;
    }

    noSvgDiv.hidden = true;
    contentDiv.hidden = false;

    const fragment = document.createDocumentFragment();
    const backdropClass = `canvas-${currentBackdrop}`;

    for (const { svg, idx } of items) {
      const key = getSvgKey(svg, idx);
      const card = document.createElement("article");
      card.className = `svg-item specimen-frame${selectedKeys.has(key) ? " is-selected" : ""}`;

      ["anchor-tl", "anchor-tr", "anchor-bl", "anchor-br"].forEach((cls) => {
        const node = document.createElement("span");
        node.className = `anchor-node ${cls}`;
        node.setAttribute("aria-hidden", "true");
        card.appendChild(node);
      });

      // Top bar
      const topbar = document.createElement("div");
      topbar.className = "card-topbar";

      const titleGroup = document.createElement("div");
      titleGroup.className = "card-title-group";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "studio-checkbox";
      checkbox.checked = selectedKeys.has(key);
      checkbox.setAttribute("aria-label", `Select ${svg.name}`);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedKeys.add(key);
          card.classList.add("is-selected");
        } else {
          selectedKeys.delete(key);
          card.classList.remove("is-selected");
        }
        syncSelectAllCheckbox();
        updateSelectionBadge();
      });

      const nameEl = document.createElement("span");
      nameEl.className = "svg-name";
      nameEl.textContent = `${svg.name || "vector"}.svg`;
      nameEl.title = svg.name || "vector";

      titleGroup.appendChild(checkbox);
      titleGroup.appendChild(nameEl);

      const badges = document.createElement("div");
      badges.className = "card-badges";

      if (svg.occurrences && svg.occurrences > 1) {
        const occ = document.createElement("span");
        occ.className = "occurrence-pill";
        occ.textContent = `×${svg.occurrences}`;
        badges.appendChild(occ);
      }

      const typeBadge = document.createElement("span");
      typeBadge.className = "type-badge";
      typeBadge.dataset.type = svg.type || "inline";
      typeBadge.textContent = (svg.type || "svg").toUpperCase();
      badges.appendChild(typeBadge);

      topbar.appendChild(titleGroup);
      topbar.appendChild(badges);

      // Preview stage
      const preview = document.createElement("div");
      preview.className = `svg-preview ${backdropClass}`;
      preview.title = t("sourceCode");
      renderPreviewInto(preview, svg);
      preview.addEventListener("click", () => openInspectorModal(svg));

      // Metadata bar
      const metaBar = document.createElement("div");
      metaBar.className = "svg-meta-bar";

      const dimsEl = document.createElement("span");
      dimsEl.className = "meta-dims";
      dimsEl.textContent = formatDimensions(svg.width, svg.height);

      const vbEl = document.createElement("span");
      vbEl.className = "meta-viewbox";
      vbEl.textContent = svg.viewBox ? `vb ${svg.viewBox}` : "";

      const sizeEl = document.createElement("span");
      sizeEl.className = "meta-size";
      sizeEl.textContent = formatBytes(svg.size);

      metaBar.appendChild(dimsEl);
      if (svg.viewBox) metaBar.appendChild(vbEl);
      metaBar.appendChild(sizeEl);

      // Action buttons
      const btnBar = document.createElement("div");
      btnBar.className = "svg-buttons";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "card-btn card-btn-primary";
      saveBtn.appendChild(
        createIconSvg([
          ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
          ["polyline", { points: "7 10 12 15 17 10" }],
          ["line", { x1: "12", y1: "15", x2: "12", y2: "3" }]
        ])
      );
      saveBtn.appendChild(document.createTextNode(t("saveSvg")));
      saveBtn.addEventListener("click", () => downloadSingleSvg(svg));

      const pngBtn = document.createElement("button");
      pngBtn.type = "button";
      pngBtn.className = "card-btn";
      pngBtn.appendChild(
        createIconSvg([
          ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }],
          ["circle", { cx: "9", cy: "9", r: "2" }],
          ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
        ])
      );
      pngBtn.appendChild(document.createTextNode(t("savePng")));
      pngBtn.addEventListener("click", () => downloadSinglePng(svg, 2));

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "card-btn card-btn-icon";
      copyBtn.title = t("copySvg");
      copyBtn.setAttribute("aria-label", t("copySvg"));
      const copyIcon = createIconSvg([
        ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
        ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
      ]);
      const checkIcon = createIconSvg([["polyline", { points: "20 6 9 17 4 12" }]]);
      copyBtn.appendChild(copyIcon);
      copyBtn.addEventListener("click", async () => {
        try {
          const text = await resolveSvgMarkup(svg).catch(() => svg.url || "");
          await navigator.clipboard.writeText(text);
          copyBtn.classList.add("is-copied");
          copyBtn.replaceChildren(checkIcon.cloneNode(true));
          showToast(t("toastCopied"));
          setTimeout(() => {
            copyBtn.classList.remove("is-copied");
            copyBtn.replaceChildren(copyIcon.cloneNode(true));
          }, 1800);
        } catch {
          showToast(t("toastCopyError"), true);
        }
      });

      const inspectBtn = document.createElement("button");
      inspectBtn.type = "button";
      inspectBtn.className = "card-btn card-btn-icon";
      inspectBtn.title = t("sourceCode");
      inspectBtn.setAttribute("aria-label", t("sourceCode"));
      inspectBtn.appendChild(
        createIconSvg([
          ["polyline", { points: "16 18 22 12 16 6" }],
          ["polyline", { points: "8 6 2 12 8 18" }]
        ])
      );
      inspectBtn.addEventListener("click", () => openInspectorModal(svg));

      btnBar.appendChild(saveBtn);
      btnBar.appendChild(pngBtn);
      btnBar.appendChild(copyBtn);
      btnBar.appendChild(inspectBtn);

      card.appendChild(topbar);
      card.appendChild(preview);
      card.appendChild(metaBar);
      card.appendChild(btnBar);
      fragment.appendChild(card);
    }

    contentDiv.replaceChildren(fragment);
    syncSelectAllCheckbox();
  }

  function syncSelectAllCheckbox() {
    if (!filteredSvgs.length) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      return;
    }
    const items = computeFilteredAndSorted();
    const selectedVisible = items.filter(({ svg, idx }) => selectedKeys.has(getSvgKey(svg, idx))).length;
    selectAllCheckbox.checked = selectedVisible > 0 && selectedVisible === items.length;
    selectAllCheckbox.indeterminate = selectedVisible > 0 && selectedVisible < items.length;
  }

  async function openInspectorModal(svg) {
    activeModalSvg = svg;
    modal.hidden = false;
    modalTitle.textContent = `${svg.name || "vector"}.svg`;
    modalTypeBadge.textContent = (svg.type || "svg").toUpperCase();
    modalTypeBadge.dataset.type = svg.type || "inline";

    modalPreviewStage.className = `modal-preview-stage canvas-${currentBackdrop}`;
    renderPreviewInto(modalPreviewStage, svg);

    modalMetaDim.textContent = formatDimensions(svg.width, svg.height);
    modalMetaVb.textContent = svg.viewBox || "—";
    modalMetaSize.textContent = formatBytes(svg.size);
    modalCodeContent.textContent = svg.content ? formatXmlSource(svg.content) : svg.url || "";

    if (!svg.content && svg.url) {
      try {
        const fetched = await resolveSvgMarkup(svg);
        if (activeModalSvg === svg) {
          modalCodeContent.textContent = formatXmlSource(fetched);
          modalMetaSize.textContent = formatBytes(new Blob([fetched]).size);
        }
      } catch {
        // Keep URL displayed
      }
    }
  }

  function closeInspectorModal() {
    modal.hidden = true;
    activeModalSvg = null;
  }

  async function loadResultsFromStorage() {
    try {
      const data = await chrome.storage.local.get([
        "svgs",
        "pageTitle",
        "pageUrl",
        "sourceTabId",
        "lastError",
        "scanning"
      ]);

      sourceTabId = data.sourceTabId || null;

      if (data.pageUrl) {
        try {
          const parsed = new URL(data.pageUrl);
          sourcePill.hidden = false;
          sourceDomain.textContent = parsed.hostname || data.pageUrl;
          sourceDomain.title = data.pageUrl;
        } catch {
          sourcePill.hidden = true;
        }
      }

      if (data.scanning && (!data.svgs || !data.svgs.length)) {
        loadingDiv.hidden = false;
        noSvgDiv.hidden = true;
        contentDiv.hidden = true;
        return;
      }

      allSvgs = Array.isArray(data.svgs) ? data.svgs : [];
      selectedKeys.clear();
      updateStatsAndCounts();
      updateSelectionBadge();
      renderCards();

      if (data.lastError) {
        showToast(data.lastError, true);
      }
    } catch (error) {
      console.error("Failed to read SVGs from storage:", error);
      allSvgs = [];
      renderCards();
    }
  }

  function triggerRescan() {
    rescanBtn.disabled = true;
    chrome.runtime.sendMessage({ action: "rescanSourceTab", tabId: sourceTabId }, (res) => {
      rescanBtn.disabled = false;
      if (chrome.runtime.lastError || !res?.ok) {
        showToast(res?.error || t("toastRescanErr"), true);
        return;
      }
      showToast(t("toastRescanOk"));
    });
  }

  // Event Listeners
  themeToggle.addEventListener("click", async () => {
    const isDark = !document.documentElement.classList.contains("dark");
    const next = isDark ? "dark" : "light";
    applyTheme(next);
    try {
      await chrome.storage.local.set({ theme: next });
    } catch {
      // Ignore storage errors
    }
  });

  langToggleEn.addEventListener("click", async () => {
    applyLanguage("en");
    try {
      await chrome.storage.local.set({ language: "en" });
    } catch {}
  });

  langToggleUk.addEventListener("click", async () => {
    applyLanguage("uk");
    try {
      await chrome.storage.local.set({ language: "uk" });
    } catch {}
  });

  rescanBtn.addEventListener("click", triggerRescan);

  emptyRescanBtn.addEventListener("click", () => {
    if (emptyRescanBtn.dataset.mode === "clear") {
      currentSearch = "";
      searchInput.value = "";
      searchClear.hidden = true;
      currentFilter = "all";
      filterTabs.forEach((tab) => {
        const active = tab.dataset.filter === "all";
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      renderCards();
    } else {
      triggerRescan();
    }
  });

  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value;
    searchClear.hidden = !currentSearch;
    renderCards();
  });

  searchClear.addEventListener("click", () => {
    currentSearch = "";
    searchInput.value = "";
    searchClear.hidden = true;
    renderCards();
    searchInput.focus();
  });

  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderCards();
  });

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentFilter = tab.dataset.filter || "all";
      filterTabs.forEach((other) => {
        const active = other === tab;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-selected", String(active));
      });
      renderCards();
    });
  });

  backdropBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentBackdrop = btn.dataset.backdrop || "grid";
      backdropBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".svg-preview").forEach((stage) => {
        stage.className = `svg-preview canvas-${currentBackdrop}`;
      });
      if (!modal.hidden) {
        modalPreviewStage.className = `modal-preview-stage canvas-${currentBackdrop}`;
      }
    });
  });

  selectAllCheckbox.addEventListener("change", () => {
    const items = computeFilteredAndSorted();
    if (selectAllCheckbox.checked) {
      items.forEach(({ svg, idx }) => selectedKeys.add(getSvgKey(svg, idx)));
    } else {
      items.forEach(({ svg, idx }) => selectedKeys.delete(getSvgKey(svg, idx)));
    }
    updateSelectionBadge();
    renderCards();
  });

  downloadAllBtn.addEventListener("click", () => {
    if (selectedKeys.size > 0) {
      const selected = allSvgs.filter((svg, idx) => selectedKeys.has(getSvgKey(svg, idx)));
      downloadZipArchive(selected);
    } else {
      downloadZipArchive(filteredSvgs.length ? filteredSvgs : allSvgs);
    }
  });

  // Modal handlers
  modalBackdrop.addEventListener("click", closeInspectorModal);
  modalCloseBtn.addEventListener("click", closeInspectorModal);

  scalePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pngExportScale = parseInt(pill.dataset.scale, 10) || 2;
      scalePills.forEach((p) => p.classList.toggle("is-active", p === pill));
    });
  });

  modalCopyBtn.addEventListener("click", async () => {
    if (!activeModalSvg) return;
    try {
      const text = await resolveSvgMarkup(activeModalSvg).catch(() => activeModalSvg.url || "");
      await navigator.clipboard.writeText(text);
      showToast(t("toastCopied"));
    } catch {
      showToast(t("toastCopyError"), true);
    }
  });

  modalCopyDataUriBtn.addEventListener("click", async () => {
    if (!activeModalSvg) return;
    try {
      const text = await resolveSvgMarkup(activeModalSvg);
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
      await navigator.clipboard.writeText(dataUri);
      showToast(t("toastDataUriCopied"));
    } catch {
      showToast(t("toastCopyError"), true);
    }
  });

  modalPngBtn.addEventListener("click", () => {
    if (activeModalSvg) downloadSinglePng(activeModalSvg, pngExportScale);
  });

  modalSaveBtn.addEventListener("click", () => {
    if (activeModalSvg) downloadSingleSvg(activeModalSvg);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeInspectorModal();
    } else if (
      event.key === "/" &&
      modal.hidden &&
      document.activeElement !== searchInput &&
      !toolbarDiv.hidden
    ) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  // Live updates from background or storage changes
  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.action === "svgsUpdated" || message?.action === "refreshSVGs") {
        loadResultsFromStorage();
      } else if (message?.action === "showError" && message.message) {
        showToast(message.message, true);
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.svgs || changes.scanning || changes.lastError || changes.updatedAt)) {
        loadResultsFromStorage();
      }
    });
  } catch {
    // Ignore outside extension context
  }

  // Boot
  initTheme().then(initLanguage).then(loadResultsFromStorage);
});
