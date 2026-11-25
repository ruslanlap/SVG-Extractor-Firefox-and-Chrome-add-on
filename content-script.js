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
  const SVG_PAINT_TAGS_SELECTOR = "path, circle, rect, polygon, polyline, line, ellipse, text";
  const SVG_NON_RENDER_CONTAINERS = new Set([
    "defs", "symbol", "clippath", "mask", "pattern", "marker"
  ]);
  const NON_SVG_EXTENSION_RE = /\.(?:png|jpe?g|webp|avif|gif|bmp|ico|tiff?|pdf|html?|php|js|mjs|css|json|xml|woff2?|ttf|eot|mp4|webm)$/i;
  const PROXY_QUERY_KEYS = ["url", "src", "href", "image", "img", "file", "source", "path"];
  const GENERIC_LABEL_RE = /^(?:image|img|icon|card\s+image|photo|picture|graphic|decorative|untitled)$/i;
  const URL_FN_RE = /url\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|([^)]*))\s*\)/gi;
  const CSS_SVG_HINT_RE = /(?:\.svg|%2esvg|image\/svg\+xml)/i;

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

  function cleanDescriptiveLabel(raw) {
    const trimmed = String(raw || "").replace(/\s+/g, " ").trim();
    if (!trimmed || GENERIC_LABEL_RE.test(trimmed)) {
      return "";
    }
    return trimmed;
  }

  function tryDecodeURIComponent(str) {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  function getElementWindow(el) {
    return el?.ownerDocument?.defaultView || window;
  }

  function getElementBaseUri(el) {
    return el?.ownerDocument?.baseURI || document.baseURI;
  }

  function safeGetComputedStyle(win, el, pseudo = null) {
    if (!win || typeof win.getComputedStyle !== "function" || !el) return null;
    try {
      return pseudo ? win.getComputedStyle(el, pseudo) : win.getComputedStyle(el);
    } catch {
      return null;
    }
  }

  function safeQueryAll(root, selector) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  function resolveAbsoluteUrl(rawUrl, baseUri = document.baseURI) {
    if (!rawUrl) return "";
    const trimmed = String(rawUrl).trim();
    if (!trimmed || trimmed.startsWith("#") || /^(?:javascript|mailto|tel|about):/i.test(trimmed)) {
      return "";
    }
    if (/^(?:data|blob):/i.test(trimmed)) {
      return trimmed;
    }
    try {
      return new URL(trimmed, baseUri).href;
    } catch {
      return "";
    }
  }

  function isDirectSvgPath(urlStr) {
    try {
      const parsed = new URL(urlStr);
      const pathname = tryDecodeURIComponent(parsed.pathname || "");
      if (/\.svg$/i.test(pathname)) {
        return true;
      }
      const idx = pathname.toLowerCase().indexOf(".svg/");
      if (idx !== -1) {
        const tail = pathname.slice(idx + 5);
        return !NON_SVG_EXTENSION_RE.test(tail);
      }
      return false;
    } catch {
      return false;
    }
  }

  function looksLikeOpaqueHash(segment) {
    const base = segment.replace(/\.svg$/i, "");
    if (base.endsWith("=")) return true;
    if (base.length >= 24 && !/[-_\s]/.test(base) && /[a-z]/.test(base) && /[A-Z0-9]/.test(base)) {
      return true;
    }
    return false;
  }

  function extractSvgUrlInfo(rawUrl, baseUri = document.baseURI, options = {}) {
    const depth = options.depth || 0;
    const forceSvgMime = Boolean(options.forceSvgMime);
    if (!rawUrl || depth > 3) return null;

    const trimmed = String(rawUrl).trim();
    if (!trimmed) return null;

    if (/^data:image\/svg\+xml/i.test(trimmed)) {
      return { url: trimmed, fallbackUrl: "" };
    }

    const absUrl = resolveAbsoluteUrl(trimmed, baseUri);
    if (!absUrl) return null;

    if (/^data:image\/svg\+xml/i.test(absUrl)) {
      return { url: absUrl, fallbackUrl: "" };
    }

    if (/^data:/i.test(absUrl)) {
      return null;
    }

    if (/^blob:/i.test(absUrl)) {
      return forceSvgMime ? { url: absUrl, fallbackUrl: "" } : null;
    }

    let parsed;
    try {
      parsed = new URL(absUrl);
    } catch {
      return null;
    }

    // Unwrap path-based image proxies (Cloudflare /cdn-cgi/image/... & Nuxt /_ipx/...)
    const pathProxyMatch =
      parsed.pathname.match(/\/cdn-cgi\/image\/[^/]+\/(.+)$/i) ||
      parsed.pathname.match(/\/_ipx\/[^/]+\/(.+)$/i);
    if (pathProxyMatch && pathProxyMatch[1]) {
      const innerRaw = tryDecodeURIComponent(pathProxyMatch[1]);
      const innerTarget = /^(?:https?:)?\/\//i.test(innerRaw)
        ? innerRaw
        : `/${innerRaw.replace(/^\/+/, "")}`;
      const inner = extractSvgUrlInfo(innerTarget, parsed.origin, { depth: depth + 1 });
      if (inner) {
        return { url: inner.url, fallbackUrl: absUrl };
      }
    }

    if (isDirectSvgPath(absUrl)) {
      return { url: absUrl, fallbackUrl: "" };
    }

    // Unwrap proxy/image-optimizer query params (e.g. /_next/image?url=..., /_image?href=...)
    const checkedKeys = new Set();
    const candidates = [];
    for (const key of PROXY_QUERY_KEYS) {
      for (const val of parsed.searchParams.getAll(key)) {
        if (val) candidates.push(val);
      }
      checkedKeys.add(key);
    }
    for (const [key, val] of parsed.searchParams.entries()) {
      if (!checkedKeys.has(key.toLowerCase()) && val) {
        candidates.push(val);
      }
    }

    for (const candidate of candidates) {
      if (!CSS_SVG_HINT_RE.test(candidate) && !candidate.includes("%2F") && !candidate.startsWith("/") && !/^https?:/i.test(candidate)) {
        continue;
      }
      const inner = extractSvgUrlInfo(candidate, parsed.origin, { depth: depth + 1 });
      if (inner) {
        return { url: inner.url, fallbackUrl: absUrl };
      }
    }

    if (forceSvgMime && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return { url: absUrl, fallbackUrl: "" };
    }

    return null;
  }

  function nameFromUrl(url, fallback) {
    if (!url || /^(?:data|blob):/i.test(url)) {
      return fallback;
    }
    try {
      const parsed = new URL(url, document.baseURI);
      const segments = parsed.pathname.split("/").filter(Boolean).map(tryDecodeURIComponent);
      const svgSeg = [...segments].reverse().find((seg) => /\.svg$/i.test(seg));
      const chosen = svgSeg || segments[segments.length - 1] || "";
      if (!chosen || looksLikeOpaqueHash(chosen)) {
        return fallback;
      }
      return sanitizeName(chosen, fallback);
    } catch {
      const seg = (url.split("/").pop() || "").split(/[?#]/)[0];
      if (!seg || looksLikeOpaqueHash(seg)) {
        return fallback;
      }
      return sanitizeName(seg, fallback);
    }
  }

  function parseSrcsetUrls(srcset) {
    if (!srcset) return [];
    const input = String(srcset).trim();
    if (!input) return [];

    // Single data: URL without descriptors
    if (/^data:/i.test(input) && !/\s+\d+(?:\.\d+)?[wx](?:\s*,|\s*$)/i.test(input)) {
      return [input];
    }

    const urls = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      while (i < len && (input[i] === "," || /\s/.test(input[i]))) i++;
      if (i >= len) break;

      let url = "";
      if (input.slice(i, i + 5).toLowerCase() === "data:") {
        const rest = input.slice(i);
        const endMatch = rest.match(/\s+\d+(?:\.\d+)?[wx](?:\s*,|\s*$)/i);
        if (endMatch) {
          url = rest.slice(0, endMatch.index).trim();
          i += endMatch.index + endMatch[0].length;
        } else {
          const commaNext = rest.search(/,\s+(?:https?:|\/|data:|blob:)/i);
          if (commaNext !== -1) {
            url = rest.slice(0, commaNext).trim();
            i += commaNext + 1;
          } else {
            url = rest.trim();
            i = len;
          }
        }
      } else {
        const start = i;
        while (i < len && !/\s/.test(input[i])) i++;
        url = input.slice(start, i);

        // If candidate had no descriptor and ended with comma, or multiple comma-joined URLs without spaces
        if (url.endsWith(",")) {
          url = url.slice(0, -1);
        } else {
          while (i < len && /\s/.test(input[i])) i++;
          // Skip optional width/density descriptor (e.g. 2x, 256w)
          const descMatch = input.slice(i).match(/^\d+(?:\.\d+)?[wx](?=\s*,|\s*$)/i);
          if (descMatch) {
            i += descMatch[0].length;
          }
          const commaIdx = input.indexOf(",", i);
          if (commaIdx !== -1 && /^\s*$/.test(input.slice(i, commaIdx))) {
            i = commaIdx + 1;
          }
        }
      }

      if (url) urls.push(url);
    }

    return urls;
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

  function parseIconSizeArea(sizesAttr) {
    if (!sizesAttr) return 0;
    const trimmed = sizesAttr.trim().toLowerCase();
    if (trimmed === "any") return Number.MAX_SAFE_INTEGER;
    let best = 0;
    for (const token of trimmed.split(/\s+/)) {
      const m = token.match(/^(\d+)x(\d+)$/);
      if (m) {
        best = Math.max(best, parseInt(m[1], 10) * parseInt(m[2], 10));
      }
    }
    return best;
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

  function ensureSvgNamespaces(svgEl) {
    if (!svgEl.getAttribute("xmlns")) {
      svgEl.setAttribute("xmlns", SVG_NS);
    }
  }

  function serializeSvgElement(svgEl) {
    const clone = svgEl.cloneNode(true);
    ensureSvgNamespaces(clone);
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(clone);
    if (xml.includes("xlink:") && !clone.getAttribute("xmlns:xlink")) {
      clone.setAttribute("xmlns:xlink", XLINK_NS);
      xml = serializer.serializeToString(clone);
    }
    return xml;
  }

  function collectQueryRoots() {
    const roots = [];
    const visited = new Set();
    const queue = [document];

    while (queue.length) {
      const root = queue.shift();
      if (!root || visited.has(root)) continue;
      visited.add(root);
      roots.push(root);

      const elements = safeQueryAll(root, "*");
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.shadowRoot && !visited.has(el.shadowRoot)) {
          queue.push(el.shadowRoot);
        }
        const tag = (el.tagName || "").toUpperCase();
        if (tag === "IFRAME" || tag === "FRAME") {
          const frameStyle = safeGetComputedStyle(getElementWindow(el), el);
          if (!frameStyle || frameStyle.display === "none" || frameStyle.visibility === "hidden") {
            continue;
          }
          try {
            const childDoc = el.contentDocument;
            if (
              childDoc &&
              childDoc.documentElement &&
              childDoc.defaultView &&
              safeGetComputedStyle(childDoc.defaultView, childDoc.documentElement) &&
              !visited.has(childDoc)
            ) {
              queue.push(childDoc);
            }
          } catch {
            // Cross-origin frame cannot be accessed
          }
        }
      }
    }

    return roots;
  }

  function collectSymbolRegistry(roots) {
    const registry = new Map();
    for (const root of roots) {
      safeQueryAll(root, "symbol[id], svg defs [id], svg g[id]").forEach((el) => {
        const id = el.getAttribute("id");
        if (id && !registry.has(id)) {
          registry.set(id, el);
        }
      });
    }
    return registry;
  }

  function getUseRawHref(useEl) {
    return (
      useEl.getAttribute("href") ||
      (typeof useEl.getAttributeNS === "function" ? useEl.getAttributeNS(XLINK_NS, "href") : "") ||
      useEl.getAttribute("xlink:href") ||
      ""
    ).trim();
  }

  async function collectExternalSymbols(roots) {
    const externalSpriteUrls = new Set();
    for (const root of roots) {
      safeQueryAll(root, "svg use").forEach((useEl) => {
        const rawHref = getUseRawHref(useEl);
        if (!rawHref || rawHref.startsWith("#")) return;
        const hashIdx = rawHref.indexOf("#");
        const urlPart = hashIdx === -1 ? rawHref : rawHref.slice(0, hashIdx);
        if (!urlPart) return;
        const resolved = resolveAbsoluteUrl(urlPart, getElementBaseUri(useEl));
        if (resolved) externalSpriteUrls.add(resolved);
      });
    }

    const externalRegistry = new Map();
    const failedSprites = [];

    if (!externalSpriteUrls.size) {
      return { externalRegistry, failedSprites };
    }

    const parser = new DOMParser();
    await Promise.all(
      Array.from(externalSpriteUrls).map(async (spriteUrl) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        try {
          const res = await fetch(spriteUrl, {
            signal: controller.signal,
            headers: { Accept: "image/svg+xml,*/*" }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!text.includes("<svg")) throw new Error("Not SVG");
          const doc = parser.parseFromString(text, "image/svg+xml");
          if (doc.querySelector("parsererror")) throw new Error("Invalid SVG");

          let indexed = 0;
          safeQueryAll(doc, "symbol[id], defs [id], g[id]").forEach((el) => {
            const id = el.getAttribute("id");
            if (id) {
              externalRegistry.set(`${spriteUrl}#${id}`, el);
              indexed++;
            }
          });
          if (!indexed && doc.documentElement) {
            externalRegistry.set(spriteUrl, doc.documentElement);
          }
        } catch {
          failedSprites.push(spriteUrl);
        } finally {
          clearTimeout(timer);
        }
      })
    );

    return { externalRegistry, failedSprites };
  }

  function isInsideNonRenderContainer(el, stopAt) {
    let cur = el.parentElement;
    while (cur && cur !== stopAt) {
      if (SVG_NON_RENDER_CONTAINERS.has(cur.tagName.toLowerCase())) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function hasRenderableGraphicsOutsideDefs(svgEl) {
    const candidates = svgEl.querySelectorAll(
      Array.from(VISUAL_SVG_TAGS).join(", ")
    );
    for (let i = 0; i < candidates.length; i++) {
      if (!isInsideNonRenderContainer(candidates[i], svgEl)) {
        return true;
      }
    }
    return false;
  }

  function isSpriteContainerOnly(svgEl) {
    if (!svgEl.querySelector("symbol, defs")) return false;
    return !hasRenderableGraphicsOutsideDefs(svgEl);
  }

  function hasExplicitPaintAttr(node, stopAt, attrName) {
    let cur = node;
    while (cur) {
      if (cur.hasAttribute && cur.hasAttribute(attrName)) {
        return true;
      }
      const styleVal =
        cur.style && typeof cur.style.getPropertyValue === "function"
          ? cur.style.getPropertyValue(attrName)
          : cur.style && cur.style[attrName];
      if (styleVal) {
        return true;
      }
      if (cur === stopAt) break;
      cur = cur.parentElement;
    }
    return false;
  }

  function applyComputedSvgPaint(origSvg, cloneSvg) {
    const win = getElementWindow(origSvg);
    if (!win || typeof win.getComputedStyle !== "function") return;

    const origNodes = safeQueryAll(origSvg, SVG_PAINT_TAGS_SELECTOR);
    const cloneNodes = safeQueryAll(cloneSvg, SVG_PAINT_TAGS_SELECTOR);
    if (origNodes.length !== cloneNodes.length) return;

    for (let i = 0; i < origNodes.length; i++) {
      const origNode = origNodes[i];
      if (isInsideNonRenderContainer(origNode, origSvg)) continue;

      const cloneNode = cloneNodes[i];
      const computed = safeGetComputedStyle(win, origNode);
      if (!computed) continue;

      if (!hasExplicitPaintAttr(origNode, origSvg, "fill")) {
        const fill = computed.fill;
        if (fill && fill !== "rgb(0, 0, 0)" && !fill.startsWith("url(")) {
          cloneNode.setAttribute("fill", fill);
        }
      }

      if (!hasExplicitPaintAttr(origNode, origSvg, "stroke")) {
        const stroke = computed.stroke;
        if (stroke && stroke !== "none" && !stroke.startsWith("url(")) {
          cloneNode.setAttribute("stroke", stroke);
          const sw = computed.strokeWidth;
          if (
            sw &&
            sw !== "1px" &&
            sw !== "0px" &&
            !hasExplicitPaintAttr(origNode, origSvg, "stroke-width")
          ) {
            cloneNode.setAttribute("stroke-width", sw);
          }
        }
      }
    }
  }

  function resolveSpriteSvg(svgEl, symbolRegistry, externalRegistry) {
    const uses = svgEl.querySelectorAll("use");
    const clone = svgEl.cloneNode(true);
    applyComputedSvgPaint(svgEl, clone);

    if (!uses.length) return { element: clone, isSprite: false };

    const baseUri = getElementBaseUri(svgEl);
    const clonedUses = clone.querySelectorAll("use");
    let resolvedAny = false;
    let adoptedViewBox = clone.getAttribute("viewBox") || "";

    clonedUses.forEach((useEl) => {
      const rawHref = getUseRawHref(useEl);
      if (!rawHref) return;

      let target = null;
      if (rawHref.startsWith("#")) {
        const targetId = rawHref.slice(1);
        target = symbolRegistry.get(targetId) || svgEl.ownerDocument?.getElementById(targetId) || null;
      } else {
        const hashIdx = rawHref.indexOf("#");
        if (hashIdx !== -1) {
          const spriteUrl = resolveAbsoluteUrl(rawHref.slice(0, hashIdx), baseUri);
          const targetId = rawHref.slice(hashIdx + 1);
          if (spriteUrl && targetId) {
            target = externalRegistry.get(`${spriteUrl}#${targetId}`) || null;
          }
        } else {
          const spriteUrl = resolveAbsoluteUrl(rawHref, baseUri);
          if (spriteUrl) {
            target = externalRegistry.get(spriteUrl) || null;
          }
        }
      }

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

      if (target.tagName.toLowerCase() === "symbol" || target.tagName.toLowerCase() === "svg") {
        Array.from(target.childNodes).forEach((child) => {
          wrapper.appendChild(document.importNode(child, true));
        });
      } else {
        const targetClone = document.importNode(target, true);
        targetClone.removeAttribute("id");
        wrapper.appendChild(targetClone);
      }

      useEl.parentNode.replaceChild(wrapper, useEl);
    });

    return { element: clone, isSprite: resolvedAny };
  }

  function extractCssUrls(propValue) {
    const rawUrls = [];
    if (!propValue || propValue === "none" || !CSS_SVG_HINT_RE.test(propValue)) {
      return rawUrls;
    }
    URL_FN_RE.lastIndex = 0;
    let match;
    while ((match = URL_FN_RE.exec(propValue)) !== null) {
      const rawUrl = (match[1] || match[2] || match[3] || "").replace(/\\(['"])/g, "$1").trim();
      if (rawUrl) rawUrls.push(rawUrl);
    }
    return rawUrls;
  }

  async function findSVGs() {
    const svgs = [];
    let index = 0;
    const roots = collectQueryRoots();
    const symbolRegistry = collectSymbolRegistry(roots);
    let externalRegistry = new Map();
    let failedSprites = [];
    try {
      const external = await collectExternalSymbols(roots);
      externalRegistry = external.externalRegistry;
      failedSprites = external.failedSprites;
    } catch {
      // Ignore external sprite fetch errors
    }
    const usedSymbolIds = new Set();
    const pictureImageUrls = new WeakMap();

    // 1. Inline <svg> elements & <use> sprite resolution across all roots
    try {
      for (const root of roots) {
        safeQueryAll(root, "svg").forEach((svg) => {
          try {
            if (svg.parentElement && svg.parentElement.closest("svg")) {
              return; // Nested <svg> is already captured inside its parent
            }

            if (isSpriteContainerOnly(svg)) {
              return;
            }

            safeQueryAll(svg, "use").forEach((u) => {
              const href = getUseRawHref(u);
              if (href.startsWith("#")) usedSymbolIds.add(href.slice(1));
            });

            const resolved = resolveSpriteSvg(svg, symbolRegistry, externalRegistry);
            const targetSvg = resolved.element;
            const svgContent = serializeSvgElement(targetSvg);

            if (!svgContent || svgContent.length < 16) return;

            const win = getElementWindow(svg);
            const rect = svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 0, height: 0 };
            const computed = safeGetComputedStyle(win, svg);
            const viewBox = targetSvg.getAttribute("viewBox") || "";
            const vbDims = parseViewBoxDims(viewBox);

            const width =
              parseNumericDim(targetSvg.getAttribute("width")) ||
              parseNumericDim(svg.style?.width) ||
              Math.round(rect.width) ||
              vbDims.width ||
              100;

            const height =
              parseNumericDim(targetSvg.getAttribute("height")) ||
              parseNumericDim(svg.style?.height) ||
              Math.round(rect.height) ||
              vbDims.height ||
              100;

            const firstUseEl = svg.querySelector("use");
            const firstUseHref = firstUseEl ? getUseRawHref(firstUseEl) : "";
            const hashIdx = firstUseHref.indexOf("#");
            const useSymbolName = hashIdx !== -1 ? firstUseHref.slice(hashIdx + 1) : "";

            const rawName =
              svg.getAttribute("id") ||
              svg.getAttribute("aria-label") ||
              svg.querySelector("title")?.textContent ||
              useSymbolName ||
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
              computedColor: usesCurrentColor && computed ? computed.color : ""
            });
          } catch {
            // Skip malformed inline SVG node without breaking full scan
          }
        });
      }
    } catch {
      // Ignore stage 1 error
    }

    // 1b. Unreferenced <symbol id="..."> definitions inside hidden spritesheets
    try {
      for (const root of roots) {
        safeQueryAll(root, "svg symbol[id]").forEach((symbol) => {
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
            wrapperSvg.appendChild(document.importNode(child, true));
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
      }
    } catch {
      // Ignore stage 1b error
    }

    // 1c. External <use> sprite files that could not be fetched/parsed inline (e.g. CORS)
    try {
      for (const spriteUrl of failedSprites) {
        index++;
        svgs.push({
          id: `sprite-${index}`,
          name: nameFromUrl(spriteUrl, `sprite-${index}`),
          type: "sprite",
          url: spriteUrl,
          width: 100,
          height: 100,
          size: 0
        });
      }
    } catch {
      // Ignore stage 1c error
    }

    // 2. <img>, <input type="image">, <picture>/<source>, and <svg><image> SVG sources
    try {
      for (const root of roots) {
        safeQueryAll(root, 'img, input[type="image"]').forEach((img) => {
          const baseUri = getElementBaseUri(img);
          const rawCandidates = [
            img.currentSrc,
            img.getAttribute("src"),
            img.src,
            img.getAttribute("data-src"),
            img.getAttribute("data-lazy-src"),
            img.getAttribute("data-original"),
            img.getAttribute("data-url"),
            img.getAttribute("data-svg"),
            ...parseSrcsetUrls(img.getAttribute("srcset")),
            ...parseSrcsetUrls(img.getAttribute("data-srcset"))
          ];

          const seenOnElement = new Set();
          const rect = img.getBoundingClientRect ? img.getBoundingClientRect() : { width: 0, height: 0 };
          const width =
            img.naturalWidth ||
            parseNumericDim(img.getAttribute("width")) ||
            Math.round(rect.width) ||
            img.width ||
            100;
          const height =
            img.naturalHeight ||
            parseNumericDim(img.getAttribute("height")) ||
            Math.round(rect.height) ||
            img.height ||
            100;

          const rawLabel =
            cleanDescriptiveLabel(img.alt) ||
            cleanDescriptiveLabel(img.getAttribute("aria-label")) ||
            cleanDescriptiveLabel(img.getAttribute("title")) ||
            "";

          const pictureEl = img.closest("picture");
          let pictureSeen = pictureEl ? pictureImageUrls.get(pictureEl) : null;
          if (pictureEl && !pictureSeen) {
            pictureSeen = new Set();
            pictureImageUrls.set(pictureEl, pictureSeen);
          }

          for (const candidate of rawCandidates) {
            const info = extractSvgUrlInfo(candidate, baseUri);
            if (!info || seenOnElement.has(info.url)) continue;
            seenOnElement.add(info.url);
            if (pictureSeen) pictureSeen.add(info.url);

            index++;
            const name = sanitizeName(rawLabel, nameFromUrl(info.url, `svg-image-${index}`));
            const entry = {
              id: `img-${index}`,
              name,
              type: "image",
              url: info.url,
              width,
              height,
              size: estimateDataUrlSize(info.url)
            };
            if (info.fallbackUrl && info.fallbackUrl !== info.url) {
              entry.fallbackUrl = info.fallbackUrl;
            }
            svgs.push(entry);
          }
        });

        safeQueryAll(root, "picture source, source[srcset], source[data-srcset], source[type]").forEach((source) => {
          const baseUri = getElementBaseUri(source);
          const forceSvgMime = /image\/svg\+xml/i.test(source.getAttribute("type") || "");
          const pictureEl = source.closest("picture");
          const pictureSeen = pictureEl ? pictureImageUrls.get(pictureEl) : null;
          const seenOnElement = new Set();

          const rawCandidates = [
            ...parseSrcsetUrls(source.getAttribute("srcset")),
            ...parseSrcsetUrls(source.getAttribute("data-srcset")),
            source.getAttribute("src")
          ];

          for (const candidate of rawCandidates) {
            const info = extractSvgUrlInfo(candidate, baseUri, { forceSvgMime });
            if (!info || seenOnElement.has(info.url)) continue;
            if (pictureSeen && pictureSeen.has(info.url)) continue;
            seenOnElement.add(info.url);
            if (pictureSeen) pictureSeen.add(info.url);

            index++;
            const entry = {
              id: `img-${index}`,
              name: nameFromUrl(info.url, `svg-source-${index}`),
              type: "image",
              url: info.url,
              width: 100,
              height: 100,
              size: estimateDataUrlSize(info.url)
            };
            if (info.fallbackUrl && info.fallbackUrl !== info.url) {
              entry.fallbackUrl = info.fallbackUrl;
            }
            svgs.push(entry);
          }
        });

        safeQueryAll(root, "svg image").forEach((svgImg) => {
          const baseUri = getElementBaseUri(svgImg);
          const rawHref =
            svgImg.getAttribute("href") ||
            (typeof svgImg.getAttributeNS === "function" ? svgImg.getAttributeNS(XLINK_NS, "href") : "") ||
            svgImg.getAttribute("xlink:href") ||
            "";
          const info = extractSvgUrlInfo(rawHref, baseUri);
          if (!info) return;

          index++;
          const entry = {
            id: `img-${index}`,
            name: nameFromUrl(info.url, `svg-image-${index}`),
            type: "image",
            url: info.url,
            width: parseNumericDim(svgImg.getAttribute("width")) || 100,
            height: parseNumericDim(svgImg.getAttribute("height")) || 100,
            size: estimateDataUrlSize(info.url)
          };
          if (info.fallbackUrl && info.fallbackUrl !== info.url) {
            entry.fallbackUrl = info.fallbackUrl;
          }
          svgs.push(entry);
        });
      }
    } catch {
      // Ignore stage 2 error
    }

    // 3. <object> / <embed> / <iframe> SVGs
    try {
      for (const root of roots) {
        safeQueryAll(root, "object, embed, iframe").forEach((obj) => {
          const baseUri = getElementBaseUri(obj);
          const forceSvgMime = /image\/svg\+xml/i.test(obj.getAttribute("type") || "");
          const rawUrl = obj.getAttribute("data") || obj.getAttribute("src") || obj.data || obj.src || "";
          const info = extractSvgUrlInfo(rawUrl, baseUri, { forceSvgMime });
          if (!info) return;

          index++;
          const rawName =
            cleanDescriptiveLabel(obj.getAttribute("title")) ||
            cleanDescriptiveLabel(obj.getAttribute("aria-label")) ||
            "";
          const name = sanitizeName(rawName, nameFromUrl(info.url, `svg-object-${index}`));
          const rect = obj.getBoundingClientRect ? obj.getBoundingClientRect() : { width: 0, height: 0 };

          const entry = {
            id: `obj-${index}`,
            name,
            type: "object",
            url: info.url,
            width: parseNumericDim(obj.getAttribute("width")) || Math.round(rect.width) || 100,
            height: parseNumericDim(obj.getAttribute("height")) || Math.round(rect.height) || 100,
            size: estimateDataUrlSize(info.url)
          };
          if (info.fallbackUrl && info.fallbackUrl !== info.url) {
            entry.fallbackUrl = info.fallbackUrl;
          }
          svgs.push(entry);
        });
      }
    } catch {
      // Ignore stage 3 error
    }

    // 3b. SVG <link rel="*icon*"> assets (grouped into at most best favicon + mask-icon)
    try {
      let bestFavicon = null;
      let bestMaskIcon = null;
      for (const root of roots) {
        safeQueryAll(root, "link[rel][href]").forEach((link) => {
          const rel = (link.getAttribute("rel") || "").toLowerCase();
          if (!rel.includes("icon")) return;
          const isMask = /\bmask-icon\b/.test(rel);
          const forceSvgMime = /image\/svg\+xml/i.test(link.getAttribute("type") || "") || isMask;
          const info = extractSvgUrlInfo(link.getAttribute("href"), getElementBaseUri(link), { forceSvgMime });
          if (!info) return;

          const area = parseIconSizeArea(link.getAttribute("sizes"));
          if (isMask) {
            if (!bestMaskIcon || area > bestMaskIcon.area) {
              bestMaskIcon = { info, area };
            }
          } else if (!bestFavicon || area > bestFavicon.area) {
            bestFavicon = { info, area };
          }
        });
      }

      if (bestFavicon) {
        index++;
        const entry = {
          id: `img-${index}`,
          name: nameFromUrl(bestFavicon.info.url, "favicon"),
          type: "image",
          url: bestFavicon.info.url,
          width: 32,
          height: 32,
          size: estimateDataUrlSize(bestFavicon.info.url)
        };
        if (bestFavicon.info.fallbackUrl && bestFavicon.info.fallbackUrl !== bestFavicon.info.url) {
          entry.fallbackUrl = bestFavicon.info.fallbackUrl;
        }
        svgs.push(entry);
      }

      if (bestMaskIcon && (!bestFavicon || bestMaskIcon.info.url !== bestFavicon.info.url)) {
        index++;
        const entry = {
          id: `img-${index}`,
          name: nameFromUrl(bestMaskIcon.info.url, "mask-icon"),
          type: "image",
          url: bestMaskIcon.info.url,
          width: 32,
          height: 32,
          size: estimateDataUrlSize(bestMaskIcon.info.url)
        };
        if (bestMaskIcon.info.fallbackUrl && bestMaskIcon.info.fallbackUrl !== bestMaskIcon.info.url) {
          entry.fallbackUrl = bestMaskIcon.info.fallbackUrl;
        }
        svgs.push(entry);
      }
    } catch {
      // Ignore stage 3b error
    }

    // 4. CSS background-image, mask-image, list-style-image, border-image-source & ::before/::after
    try {
      for (const root of roots) {
        const allElements = safeQueryAll(root, "*");
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          const upperTag = (el.tagName || "").toUpperCase();
          if (NON_VISUAL_TAGS.has(upperTag) || el.namespaceURI === SVG_NS) {
            continue;
          }

          const win = getElementWindow(el);
          const baseUri = getElementBaseUri(el);
          const style = safeGetComputedStyle(win, el);
          if (!style) continue;

          const rawCssUrls = [];
          const mainProps = [
            style.backgroundImage,
            style.maskImage || style.webkitMaskImage,
            style.listStyleImage,
            style.borderImageSource
          ];
          for (const propVal of mainProps) {
            rawCssUrls.push(...extractCssUrls(propVal));
          }

          if (style.display !== "none") {
            for (const pseudo of ["::before", "::after"]) {
              const pStyle = safeGetComputedStyle(win, el, pseudo);
              if (!pStyle || !pStyle.content || pStyle.content === "none" || pStyle.content === "normal") {
                continue;
              }
              const pseudoProps = [
                pStyle.backgroundImage,
                pStyle.maskImage || pStyle.webkitMaskImage,
                pStyle.listStyleImage,
                pStyle.borderImageSource
              ];
              if (pStyle.content.includes("url(")) {
                pseudoProps.push(pStyle.content);
              }
              for (const propVal of pseudoProps) {
                rawCssUrls.push(...extractCssUrls(propVal));
              }
            }
          }

          if (!rawCssUrls.length) continue;

          const seenOnElement = new Set();
          const rawLabel =
            cleanDescriptiveLabel(el.getAttribute("id")) ||
            cleanDescriptiveLabel(el.getAttribute("aria-label")) ||
            "";

          for (const rawUrl of rawCssUrls) {
            const info = extractSvgUrlInfo(rawUrl, baseUri);
            if (!info || seenOnElement.has(info.url)) continue;
            seenOnElement.add(info.url);

            index++;
            const name = sanitizeName(rawLabel, nameFromUrl(info.url, `svg-bg-${index}`));
            const entry = {
              id: `bg-${index}`,
              name,
              type: "background",
              url: info.url,
              width: el.offsetWidth || 100,
              height: el.offsetHeight || 100,
              size: estimateDataUrlSize(info.url)
            };
            if (info.fallbackUrl && info.fallbackUrl !== info.url) {
              entry.fallbackUrl = info.fallbackUrl;
            }
            svgs.push(entry);
          }
        }
      }
    } catch {
      // Ignore stage 4 error
    }

    // 5. Deduplicate while tracking occurrence counts
    const uniqueSvgs = [];
    const svgMap = new Map();

    for (const svg of svgs) {
      const key = svg.content ? `content:${svg.content.replace(/\s+/g, " ").trim()}` : `url:${svg.url}`;
      const existing = svgMap.get(key);
      if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
        if (!existing.fallbackUrl && svg.fallbackUrl) {
          existing.fallbackUrl = svg.fallbackUrl;
        }
      } else {
        svg.occurrences = 1;
        svgMap.set(key, svg);
        uniqueSvgs.push(svg);
      }
    }

    return uniqueSvgs;
  }

  (async () => {
    try {
      const svgs = await findSVGs();
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
})();
