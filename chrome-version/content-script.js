// content-script.js - Optimized SVG Extractor Pro scanner
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const XLINK_NS = "http://www.w3.org/1999/xlink";
  const NON_VISUAL_TAGS = new Set([
    "SCRIPT", "STYLE", "HEAD", "META", "LINK", "TITLE", "NOSCRIPT",
    "TEMPLATE", "BR", "WBR", "SOURCE", "TRACK", "PARAM"
  ]);
  const VISUAL_SVG_TAGS = new Set([
    "path", "circle", "rect", "polygon", "polyline", "line", "ellipse", "text", "image", "use"
  ]);
  const URL_FN_RE = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^)]*))\s*\)/gi;

  function sanitizeName(raw, fallback) {
    const cleaned = String(raw || "")
      .replace(/\.svg(\?.*)?$/i, "")
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
    return cleaned || fallback;
  }

  function resolveAbsoluteUrl(rawUrl) {
    if (!rawUrl) return "";
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }
    try {
      return new URL(trimmed, document.baseURI).href;
    } catch {
      return trimmed;
    }
  }

  function isSvgUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.startsWith("data:image/svg+xml") ||
      /\.svg(?:$|[?#])/i.test(lower)
    );
  }

  function nameFromUrl(url, fallback) {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
      return fallback;
    }
    try {
      const parsed = new URL(url, document.baseURI);
      const lastSeg = parsed.pathname.split("/").filter(Boolean).pop() || "";
      return sanitizeName(decodeURIComponent(lastSeg), fallback);
    } catch {
      const seg = url.split("/").pop() || "";
      return sanitizeName(seg, fallback);
    }
  }

  function parseNumericDim(val) {
    if (typeof val === "number" && Number.isFinite(val) && val > 0) return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed || trimmed.endsWith("%") || trimmed === "auto") return 0;
      const parsed = parseFloat(trimmed);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }

  function parseViewBoxDims(viewBox) {
    if (!viewBox) return { width: 0, height: 0 };
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return {
        width: parts[2] > 0 ? parts[2] : 0,
        height: parts[3] > 0 ? parts[3] : 0
      };
    }
    return { width: 0, height: 0 };
  }

  function estimateByteSize(str) {
    if (!str) return 0;
    try {
      return new Blob([str]).size;
    } catch {
      return str.length;
    }
  }

  function estimateDataUrlSize(url) {
    if (!url || !url.startsWith("data:")) return 0;
    const commaIdx = url.indexOf(",");
    if (commaIdx === -1) return 0;
    const payload = url.slice(commaIdx + 1);
    if (url.slice(0, commaIdx).includes(";base64")) {
      return Math.floor((payload.length * 3) / 4);
    }
    try {
      return estimateByteSize(decodeURIComponent(payload));
    } catch {
      return payload.length;
    }
  }

  function ensureSvgNamespaces(svgEl, serialized) {
    if (!svgEl.getAttribute("xmlns")) {
      svgEl.setAttribute("xmlns", SVG_NS);
    }
    if (serialized && serialized.includes("xlink:") && !svgEl.getAttribute("xmlns:xlink")) {
      svgEl.setAttribute("xmlns:xlink", XLINK_NS);
    }
  }

  function serializeSvgElement(svgEl) {
    const clone = svgEl.cloneNode(true);
    ensureSvgNamespaces(clone, "");
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(clone);
    if (xml.includes("xlink:") && !clone.getAttribute("xmlns:xlink")) {
      clone.setAttribute("xmlns:xlink", XLINK_NS);
      xml = serializer.serializeToString(clone);
    }
    return xml;
  }

  function collectSymbolRegistry() {
    const registry = new Map();
    document.querySelectorAll("symbol[id], svg defs [id], svg g[id]").forEach((el) => {
      const id = el.getAttribute("id");
      if (id && !registry.has(id)) {
        registry.set(id, el);
      }
    });
    return registry;
  }

  function resolveSpriteSvg(svgEl, symbolRegistry) {
    const uses = svgEl.querySelectorAll("use");
    if (!uses.length) return { element: svgEl, isSprite: false };

    const clone = svgEl.cloneNode(true);
    const clonedUses = clone.querySelectorAll("use");
    let resolvedAny = false;
    let adoptedViewBox = clone.getAttribute("viewBox") || "";

    clonedUses.forEach((useEl) => {
      const rawHref =
        useEl.getAttribute("href") ||
        useEl.getAttributeNS(XLINK_NS, "href") ||
        useEl.getAttribute("xlink:href") ||
        "";

      if (!rawHref.startsWith("#")) return;
      const targetId = rawHref.slice(1);
      const target = symbolRegistry.get(targetId) || document.getElementById(targetId);
      if (!target) return;

      resolvedAny = true;
      if (!adoptedViewBox && target.getAttribute("viewBox")) {
        adoptedViewBox = target.getAttribute("viewBox");
        clone.setAttribute("viewBox", adoptedViewBox);
      }

      const wrapper = document.createElementNS(SVG_NS, "g");
      const copyAttrs = ["fill", "stroke", "stroke-width", "opacity", "transform", "class"];
      copyAttrs.forEach((attr) => {
        const val = useEl.getAttribute(attr);
        if (val) wrapper.setAttribute(attr, val);
      });

      const x = useEl.getAttribute("x");
      const y = useEl.getAttribute("y");
      if (x || y) {
        const existingTransform = wrapper.getAttribute("transform") || "";
        wrapper.setAttribute(
          "transform",
          `${existingTransform} translate(${parseFloat(x) || 0}, ${parseFloat(y) || 0})`.trim()
        );
      }

      if (target.tagName.toLowerCase() === "symbol") {
        Array.from(target.childNodes).forEach((child) => {
          wrapper.appendChild(child.cloneNode(true));
        });
      } else {
        const targetClone = target.cloneNode(true);
        targetClone.removeAttribute("id");
        wrapper.appendChild(targetClone);
      }

      useEl.parentNode.replaceChild(wrapper, useEl);
    });

    return { element: clone, isSprite: resolvedAny };
  }

  function isSpriteContainerOnly(svgEl) {
    const hasDefinitions = svgEl.querySelector("symbol, defs");
    if (!hasDefinitions) return false;
    const directVisuals = Array.from(svgEl.children).some((child) =>
      VISUAL_SVG_TAGS.has(child.tagName.toLowerCase())
    );
    if (directVisuals) return false;
    const rect = svgEl.getBoundingClientRect();
    const style = window.getComputedStyle(svgEl);
    return (
      rect.width === 0 ||
      rect.height === 0 ||
      style.display === "none" ||
      style.visibility === "hidden"
    );
  }

  function findSVGs() {
    const svgs = [];
    let index = 0;
    const symbolRegistry = collectSymbolRegistry();
    const usedSymbolIds = new Set();

    // 1. Inline <svg> elements & <use> sprite resolution
    document.querySelectorAll("svg").forEach((svg) => {
      if (svg.parentElement && svg.parentElement.closest("svg")) {
        return; // Nested <svg> is already captured inside its parent
      }

      if (isSpriteContainerOnly(svg)) {
        return;
      }

      svg.querySelectorAll("use").forEach((u) => {
        const href =
          u.getAttribute("href") ||
          u.getAttributeNS(XLINK_NS, "href") ||
          u.getAttribute("xlink:href") ||
          "";
        if (href.startsWith("#")) usedSymbolIds.add(href.slice(1));
      });

      const resolved = resolveSpriteSvg(svg, symbolRegistry);
      const targetSvg = resolved.element;
      const svgContent = serializeSvgElement(targetSvg);

      if (!svgContent || svgContent.length < 16) return;

      const rect = svg.getBoundingClientRect();
      const computed = window.getComputedStyle(svg);
      const viewBox = targetSvg.getAttribute("viewBox") || "";
      const vbDims = parseViewBoxDims(viewBox);

      const width =
        parseNumericDim(targetSvg.getAttribute("width")) ||
        parseNumericDim(svg.style.width) ||
        Math.round(rect.width) ||
        vbDims.width ||
        100;

      const height =
        parseNumericDim(targetSvg.getAttribute("height")) ||
        parseNumericDim(svg.style.height) ||
        Math.round(rect.height) ||
        vbDims.height ||
        100;

      const firstUseHref =
        svg.querySelector("use")?.getAttribute("href") ||
        svg.querySelector("use")?.getAttribute("xlink:href") ||
        "";

      const rawName =
        svg.getAttribute("id") ||
        svg.getAttribute("aria-label") ||
        svg.querySelector("title")?.textContent ||
        (firstUseHref.startsWith("#") ? firstUseHref.slice(1) : "") ||
        svg.getAttribute("data-icon") ||
        "";

      const fallback = resolved.isSprite ? `sprite-${index + 1}` : `svg-${index + 1}`;
      const name = sanitizeName(rawName, fallback);
      index++;

      const usesCurrentColor = svgContent.includes("currentColor");
      svgs.push({
        id: `${resolved.isSprite ? "sprite" : "inline"}-${index}`,
        name,
        type: resolved.isSprite ? "sprite" : "inline",
        content: svgContent,
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
        viewBox,
        size: estimateByteSize(svgContent),
        computedColor: usesCurrentColor ? computed.color : ""
      });
    });

    // 1b. Unreferenced <symbol id="..."> definitions inside hidden spritesheets
    document.querySelectorAll("svg symbol[id]").forEach((symbol) => {
      const symId = symbol.getAttribute("id");
      if (!symId || usedSymbolIds.has(symId)) return;

      const wrapperSvg = document.createElementNS(SVG_NS, "svg");
      wrapperSvg.setAttribute("xmlns", SVG_NS);
      const viewBox = symbol.getAttribute("viewBox") || "0 0 24 24";
      wrapperSvg.setAttribute("viewBox", viewBox);

      const vbDims = parseViewBoxDims(viewBox);
      const width = parseNumericDim(symbol.getAttribute("width")) || vbDims.width || 24;
      const height = parseNumericDim(symbol.getAttribute("height")) || vbDims.height || 24;
      wrapperSvg.setAttribute("width", String(width));
      wrapperSvg.setAttribute("height", String(height));

      Array.from(symbol.childNodes).forEach((child) => {
        wrapperSvg.appendChild(child.cloneNode(true));
      });

      const svgContent = serializeSvgElement(wrapperSvg);
      index++;
      svgs.push({
        id: `sprite-${index}`,
        name: sanitizeName(symId, `sprite-${index}`),
        type: "sprite",
        content: svgContent,
        width,
        height,
        viewBox,
        size: estimateByteSize(svgContent)
      });
    });

    // 2. <img> & <picture> SVG sources
    document.querySelectorAll("img").forEach((img) => {
      const src = resolveAbsoluteUrl(img.currentSrc || img.src || "");
      if (!isSvgUrl(src)) return;

      index++;
      const rawName =
        img.alt ||
        img.getAttribute("aria-label") ||
        img.getAttribute("title") ||
        "";
      const name = sanitizeName(rawName, nameFromUrl(src, `svg-image-${index}`));

      svgs.push({
        id: `img-${index}`,
        name,
        type: "image",
        url: src,
        width: img.naturalWidth || img.width || 100,
        height: img.naturalHeight || img.height || 100,
        size: estimateDataUrlSize(src)
      });
    });

    document.querySelectorAll('picture source[type="image/svg+xml"]').forEach((source) => {
      const srcset = source.getAttribute("srcset") || "";
      const firstUrl = resolveAbsoluteUrl(srcset.split(",")[0]?.trim().split(/\s+/)[0] || "");
      if (!isSvgUrl(firstUrl)) return;

      index++;
      svgs.push({
        id: `img-${index}`,
        name: nameFromUrl(firstUrl, `svg-source-${index}`),
        type: "image",
        url: firstUrl,
        width: 100,
        height: 100,
        size: estimateDataUrlSize(firstUrl)
      });
    });

    // 3. <object> / <embed> SVGs
    document.querySelectorAll("object, embed").forEach((obj) => {
      const rawUrl = obj.getAttribute("data") || obj.getAttribute("src") || obj.data || obj.src || "";
      const url = resolveAbsoluteUrl(rawUrl);
      if (!isSvgUrl(url)) return;

      index++;
      const rawName = obj.getAttribute("title") || obj.getAttribute("aria-label") || "";
      const name = sanitizeName(rawName, nameFromUrl(url, `svg-object-${index}`));

      svgs.push({
        id: `obj-${index}`,
        name,
        type: "object",
        url,
        width: parseNumericDim(obj.width) || 100,
        height: parseNumericDim(obj.height) || 100,
        size: estimateDataUrlSize(url)
      });
    });

    // 4. CSS background-image and mask-image SVGs (skip non-visual & SVG internal nodes)
    const allElements = document.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (NON_VISUAL_TAGS.has(el.tagName) || el instanceof SVGElement) {
        continue;
      }

      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      const maskImage = style.maskImage || style.webkitMaskImage;

      const sources = [];
      if (bgImage && bgImage !== "none" && (bgImage.includes(".svg") || bgImage.includes("data:image/svg+xml"))) {
        sources.push(bgImage);
      }
      if (maskImage && maskImage !== "none" && (maskImage.includes(".svg") || maskImage.includes("data:image/svg+xml"))) {
        sources.push(maskImage);
      }

      if (!sources.length) continue;

      for (const propValue of sources) {
        URL_FN_RE.lastIndex = 0;
        let match;
        while ((match = URL_FN_RE.exec(propValue)) !== null) {
          const rawUrl = (match[1] || match[2] || match[3] || "").trim();
          const url = resolveAbsoluteUrl(rawUrl);
          if (!isSvgUrl(url)) continue;

          index++;
          const rawName = el.getAttribute("id") || el.getAttribute("aria-label") || "";
          const name = sanitizeName(rawName, nameFromUrl(url, `svg-bg-${index}`));

          svgs.push({
            id: `bg-${index}`,
            name,
            type: "background",
            url,
            width: el.offsetWidth || 100,
            height: el.offsetHeight || 100,
            size: estimateDataUrlSize(url)
          });
        }
      }
    }

    // 5. Deduplicate while tracking occurrence counts
    const uniqueSvgs = [];
    const svgMap = new Map();

    for (const svg of svgs) {
      const key = svg.content ? `content:${svg.content.replace(/\s+/g, " ").trim()}` : `url:${svg.url}`;
      const existing = svgMap.get(key);
      if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
      } else {
        svg.occurrences = 1;
        svgMap.set(key, svg);
        uniqueSvgs.push(svg);
      }
    }

    return uniqueSvgs;
  }

  try {
    const svgs = findSVGs();
    chrome.runtime.sendMessage({
      action: "foundSVGs",
      svgs,
      pageTitle: document.title || "",
      pageUrl: location.href
    });
  } catch (error) {
    chrome.runtime.sendMessage({
      action: "error",
      message: `Error finding SVGs: ${error.message}`
    });
  }
})();
