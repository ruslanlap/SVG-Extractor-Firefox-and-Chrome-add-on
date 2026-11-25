// popup.js - Compact Vector Studio Popup
document.addEventListener("DOMContentLoaded", () => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const contentDiv = document.getElementById("content");
  const loadingDiv = document.getElementById("loading");
  const loadingText = document.getElementById("loading-text");
  const noSvgDiv = document.getElementById("no-svg");
  const noSvgText = document.getElementById("no-svg-text");
  const summaryBar = document.getElementById("popup-summary");
  const summaryCount = document.getElementById("summary-count");
  const openStudioBtn = document.getElementById("open-studio-btn");

  const themeToggle = document.getElementById("theme-toggle");
  const themeIconLight = document.getElementById("theme-icon-light");
  const themeIconDark = document.getElementById("theme-icon-dark");
  const langToggleEn = document.getElementById("lang-toggle-en");
  const langToggleUk = document.getElementById("lang-toggle-uk");
  const pageTitle = document.getElementById("page-title");

  let currentLang = "en";
  let currentSvgs = [];

  const translations = {
    en: {
      title: "SVG Extractor Pro",
      loading: "Scanning page vectors...",
      noSvg: "No SVG vectors found on this page.",
      openStudio: "Open Studio",
      vectors: "vectors",
      save: "SVG",
      savePNG: "PNG",
      copy: "Copy",
      copied: "Copied",
      error: "Error: ",
      errorHint: "Cannot access this page. Make sure the extension has permissions.",
      retry: "Retry"
    },
    uk: {
      title: "SVG Extractor Pro",
      loading: "Сканування SVG на сторінці...",
      noSvg: "SVG-зображення не знайдено на цій сторінці.",
      openStudio: "Відкрити студію",
      vectors: "векторів",
      save: "SVG",
      savePNG: "PNG",
      copy: "Копія",
      copied: "Готово",
      error: "Помилка: ",
      errorHint: "Немає доступу до цієї сторінки. Перевірте дозволи розширення.",
      retry: "Спробувати знову"
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
  }

  function applyTheme(theme) {
    const isDark = theme !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    themeIconLight.hidden = !isDark;
    themeIconDark.hidden = isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  async function initTheme() {
    let saved = localStorage.getItem("theme");
    try {
      const data = await chrome.storage.local.get("theme");
      if (data?.theme === "light" || data?.theme === "dark") {
        saved = data.theme;
      }
    } catch {}
    applyTheme(saved || "dark");
  }

  function applyLanguage(lang) {
    currentLang = lang === "uk" ? "uk" : "en";
    document.documentElement.setAttribute("lang", currentLang);
    localStorage.setItem("language", currentLang);

    langToggleEn.classList.toggle("is-active", currentLang === "en");
    langToggleEn.setAttribute("aria-pressed", String(currentLang === "en"));
    langToggleUk.classList.toggle("is-active", currentLang === "uk");
    langToggleUk.setAttribute("aria-pressed", String(currentLang === "uk"));

    pageTitle.textContent = t("title");
    loadingText.textContent = t("loading");
    noSvgText.textContent = t("noSvg");
    openStudioBtn.textContent = t("openStudio");
    summaryCount.textContent = `${currentSvgs.length} ${t("vectors")}`;

    if (currentSvgs.length) {
      displaySVGs(currentSvgs);
    }
  }

  async function initLanguage() {
    let saved = localStorage.getItem("language");
    try {
      const data = await chrome.storage.local.get("language");
      if (data?.language === "uk" || data?.language === "en") {
        saved = data.language;
      }
    } catch {}
    if (!saved) {
      const navLang = (navigator.language || "en").toLowerCase();
      saved = navLang.startsWith("uk") ? "uk" : "en";
    }
    applyLanguage(saved);
  }

  function sanitizeSvgElement(svgString) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    if (svgDoc.querySelector("parsererror")) {
      return document.createElementNS(SVG_NS, "svg");
    }
    const root = document.importNode(svgDoc.documentElement, true);
    root.querySelectorAll("script, foreignObject").forEach((el) => el.remove());
    [root, ...root.querySelectorAll("*")].forEach((node) => {
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

  function svgToPng(svg, width, height) {
    return new Promise((resolve, reject) => {
      try {
        const w = Math.max(16, Math.round(parseFloat(width) || 200));
        const h = Math.max(16, Math.round(parseFloat(height) || 200));
        let srcUrl = svg.url || "";

        if (svg.content) {
          const el = sanitizeSvgElement(svg.content);
          el.setAttribute("width", String(w));
          el.setAttribute("height", String(h));
          const serialized = new XMLSerializer().serializeToString(el);
          srcUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = w * scale;
          canvas.height = h * scale;
          const ctx = canvas.getContext("2d");
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("PNG conversion failed"));
        img.src = srcUrl;
      } catch (err) {
        reject(err);
      }
    });
  }

  function showError(message) {
    loadingDiv.hidden = true;
    noSvgDiv.hidden = true;
    summaryBar.hidden = true;

    const errorDiv = document.createElement("div");
    errorDiv.className = "state-box";

    const errTitle = document.createElement("p");
    errTitle.textContent = `${t("error")}${message}`;

    const errHint = document.createElement("p");
    errHint.textContent = t("errorHint");

    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "studio-btn";
    retryBtn.textContent = t("retry");
    retryBtn.addEventListener("click", () => {
      errorDiv.remove();
      loadingDiv.hidden = false;
      scanActiveTab();
    });

    errorDiv.appendChild(errTitle);
    errorDiv.appendChild(errHint);
    errorDiv.appendChild(retryBtn);

    contentDiv.replaceChildren(errorDiv);
    contentDiv.hidden = false;
  }

  function displaySVGs(svgs) {
    currentSvgs = Array.isArray(svgs) ? svgs : [];
    loadingDiv.hidden = true;

    if (!currentSvgs.length) {
      summaryBar.hidden = true;
      contentDiv.hidden = true;
      noSvgDiv.hidden = false;
      return;
    }

    noSvgDiv.hidden = true;
    summaryBar.hidden = false;
    summaryCount.textContent = `${currentSvgs.length} ${t("vectors")}`;
    contentDiv.hidden = false;

    const fragment = document.createDocumentFragment();
    const previewList = currentSvgs.slice(0, 60);

    for (const svg of previewList) {
      if (!svg || (!svg.content && !svg.url)) continue;

      const card = document.createElement("div");
      card.className = "svg-item";

      const topbar = document.createElement("div");
      topbar.className = "card-topbar";

      const nameEl = document.createElement("span");
      nameEl.className = "svg-name";
      nameEl.textContent = `${svg.name || "vector"}.svg`;

      const typeBadge = document.createElement("span");
      typeBadge.className = "type-badge";
      typeBadge.textContent = (svg.type || "svg").toUpperCase();

      topbar.appendChild(nameEl);
      topbar.appendChild(typeBadge);

      const previewDiv = document.createElement("div");
      previewDiv.className = "svg-preview";
      if (svg.content) {
        previewDiv.appendChild(sanitizeSvgElement(svg.content));
      } else if (svg.url) {
        const img = document.createElement("img");
        img.src = svg.url;
        img.alt = svg.name || "SVG";
        img.loading = "lazy";
        previewDiv.appendChild(img);
      }

      const metaDiv = document.createElement("div");
      metaDiv.className = "svg-meta";
      const dimSpan = document.createElement("span");
      dimSpan.textContent = `${Math.round(svg.width || 100)} × ${Math.round(svg.height || 100)} px`;
      const vbSpan = document.createElement("span");
      vbSpan.textContent = svg.viewBox ? `vb ${svg.viewBox}` : "";
      metaDiv.appendChild(dimSpan);
      metaDiv.appendChild(vbSpan);

      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "svg-buttons";

      const downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.className = "card-btn card-btn-primary";
      downloadBtn.textContent = t("save");
      downloadBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "downloadSVG", svg });
      });

      const pngBtn = document.createElement("button");
      pngBtn.type = "button";
      pngBtn.className = "card-btn";
      pngBtn.textContent = t("savePNG");
      pngBtn.addEventListener("click", async () => {
        try {
          const dataUrl = await svgToPng(svg, svg.width, svg.height);
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${svg.name || "vector"}-${Date.now().toString(36)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          console.error("PNG conversion failed:", err);
        }
      });

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "card-btn";
      copyBtn.textContent = t("copy");
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(svg.content || svg.url || "");
          copyBtn.textContent = t("copied");
          setTimeout(() => {
            copyBtn.textContent = t("copy");
          }, 1500);
        } catch (err) {
          console.error("Clipboard error:", err);
        }
      });

      buttonsDiv.appendChild(downloadBtn);
      buttonsDiv.appendChild(pngBtn);
      buttonsDiv.appendChild(copyBtn);

      card.appendChild(topbar);
      card.appendChild(previewDiv);
      card.appendChild(metaDiv);
      card.appendChild(buttonsDiv);
      fragment.appendChild(card);
    }

    contentDiv.replaceChildren(fragment);
  }

  function scanActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab) {
        showError("No active tab");
        return;
      }
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["content-script.js"]
        })
        .catch((error) => {
          showError(error.message);
        });
    });
  }

  themeToggle.addEventListener("click", async () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    try {
      await chrome.storage.local.set({ theme: next });
    } catch {}
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

  openStudioBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openStudioResults" });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.action === "foundSVGs") {
      displaySVGs(message.svgs);
    } else if (message?.action === "error") {
      showError(message.message || "Unknown error");
    }
  });

  initTheme().then(initLanguage).then(scanActiveTab);
});
