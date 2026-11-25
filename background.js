// background.js - MV3 Service Worker & Tab Coordinator
let isProcessingSVGs = false;

const RESTRICTED_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "moz-extension://",
  "about:",
  "edge://",
  "mozilla://",
  "view-source:",
  "devtools://"
];

function isRestrictedUrl(url) {
  if (!url) return true;
  if (RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return true;
  }
  return url.includes("results.html");
}

function getResultsUrl() {
  return chrome.runtime.getURL("results.html");
}

async function openOrFocusResultsTab(notifyUpdate = false) {
  const resultsUrl = getResultsUrl();
  const allTabs = await chrome.tabs.query({});
  const existingTabs = allTabs.filter((t) => t.url && t.url.startsWith(resultsUrl));

  if (existingTabs.length > 0) {
    const targetTab = existingTabs[0];
    await chrome.tabs.update(targetTab.id, { active: true });
    if (targetTab.windowId !== undefined) {
      try {
        await chrome.windows.update(targetTab.windowId, { focused: true });
      } catch {
        // Ignore window focus errors on platforms where unsupported
      }
    }
    if (notifyUpdate) {
      try {
        await chrome.tabs.sendMessage(targetTab.id, { action: "svgsUpdated" });
      } catch {
        // Tab may still be loading; storage listener will pick up the update
      }
    }
    return targetTab;
  }

  return chrome.tabs.create({ url: "results.html", active: true });
}

function safeNotifyResults(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {
    // Ignore when no extension listener is currently open
  });
}

// Extension icon click -> scan active tab and open/focus studio results
chrome.action.onClicked.addListener(async (tab) => {
  isProcessingSVGs = false;

  if (!tab || isRestrictedUrl(tab.url)) {
    if (!tab?.url?.includes("results.html")) {
      await openOrFocusResultsTab(false);
    }
    return;
  }

  try {
    const scanStartedAt = Date.now();
    await chrome.storage.local.set({
      scanning: true,
      lastError: null,
      sourceTabId: tab.id,
      pageUrl: tab.url,
      pageTitle: tab.title || "",
      updatedAt: scanStartedAt
    });

    await injectScanner(tab.id);

    // Safety fallback if content-script fails silently or hangs
    setTimeout(async () => {
      try {
        const state = await chrome.storage.local.get(["scanning", "updatedAt"]);
        if (state?.scanning && state.updatedAt === scanStartedAt) {
          await chrome.storage.local.set({
            scanning: false,
            lastError: "Scan timed out. Please click Rescan.",
            updatedAt: Date.now()
          });
          await openOrFocusResultsTab(true);
        }
      } catch {
        // Ignore timeout fallback errors
      }
    }, 2000);
  } catch (error) {
    console.error("Error executing content script:", error);
    await chrome.storage.local.set({
      scanning: false,
      lastError: `Cannot access this page: ${error.message}`,
      updatedAt: Date.now()
    });
    await openOrFocusResultsTab(true);
    safeNotifyResults({
      action: "showError",
      message: `Cannot access this page: ${error.message}`
    });
  }
});

// Desktop and mobile browsers may discard inactive tabs. Retry injection once.
async function injectScanner(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"]
    });
  } catch (firstError) {
    const original = firstError?.message || String(firstError);
    console.warn("[SVG Extractor] Initial script injection failed:", original);
    const tab = await chrome.tabs.get(tabId);
    if (isRestrictedUrl(tab?.url)) throw firstError;
    try {
      await chrome.tabs.update(tabId, { active: true });
      if (tab.windowId !== undefined) {
        try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
      }
      // Give the browser time to restore a discarded tab.
      await new Promise((resolve) => setTimeout(resolve, 500));
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-script.js"]
      });
    } catch (retryError) {
      console.error("[SVG Extractor] Retry injection failed:", retryError);
      throw new Error(`Cannot scan source tab: ${retryError?.message || original}. Open the page and retry.`);
    }
  }
}

// Message handling between content-script, popup, and results page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  if (message.action === "foundSVGs" && !isProcessingSVGs) {
    isProcessingSVGs = true;
    const payload = {
      svgs: Array.isArray(message.svgs) ? message.svgs : [],
      scanning: false,
      lastError: null,
      pageTitle: message.pageTitle || sender?.tab?.title || "",
      pageUrl: message.pageUrl || sender?.tab?.url || "",
      sourceTabId: sender?.tab?.id ?? null,
      updatedAt: Date.now()
    };

    chrome.storage.local
      .set(payload)
      .then(() => openOrFocusResultsTab(true))
      .catch((error) => {
        console.error("Storage or tab error:", error);
        safeNotifyResults({
          action: "showError",
          message: `Failed to process SVGs: ${error.message}`
        });
      })
      .finally(() => {
        isProcessingSVGs = false;
      });
    return false;
  }

  if (message.action === "rescanSourceTab") {
    const requestedTabId = message.tabId;
    (async () => {
      try {
        let targetTab = null;
        if (requestedTabId) {
          try {
            const candidate = await chrome.tabs.get(requestedTabId);
            if (candidate && !isRestrictedUrl(candidate.url)) {
              targetTab = candidate;
            }
          } catch {
            targetTab = null;
          }
        }

        if (!targetTab) {
          const tabs = await chrome.tabs.query({ currentWindow: true });
          targetTab = tabs.find((t) => t.url && !isRestrictedUrl(t.url)) || null;
        }

        if (!targetTab) {
          sendResponse({ ok: false, error: "Source tab is no longer open." });
          return;
        }

        await chrome.storage.local.set({
          scanning: true,
          lastError: null,
          sourceTabId: targetTab.id,
          pageUrl: targetTab.url,
          pageTitle: targetTab.title || "",
          updatedAt: Date.now()
        });

        await injectScanner(targetTab.id);

        sendResponse({ ok: true, tabId: targetTab.id });
      } catch (error) {
        const message = error?.message || String(error);
        await chrome.storage.local.set({
          scanning: false,
          lastError: message,
          updatedAt: Date.now()
        });
        sendResponse({ ok: false, error: message });
      }
    })();
    return true;
  }

  if (message.action === "openStudioResults") {
    openOrFocusResultsTab(true)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.action === "downloadSVG") {
    downloadSVG(message.svg)
      .then((downloadId) => {
        safeNotifyResults({
          action: "downloadSuccess",
          id: message.svg?.id,
          downloadId
        });
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Standard download failed, trying direct fallback:", error.message);
        const filename = buildSvgFilename(message.svg);
        downloadSVGDirect(message.svg, filename)
          .then(() => {
            safeNotifyResults({
              action: "downloadSuccess",
              id: message.svg?.id
            });
            sendResponse({ success: true });
          })
          .catch((directError) => {
            console.error("Direct download failed:", directError.message);
            safeNotifyResults({
              action: "downloadError",
              id: message.svg?.id,
              error: directError.message
            });
            sendResponse({ success: false, error: directError.message });
          });
      });
    return true;
  }

  if (message.action === "downloadAllSVGs") {
    const svgs = Array.isArray(message.svgs) ? message.svgs : [];
    let successCount = 0;
    let failCount = 0;

    (async () => {
      for (const svg of svgs) {
        try {
          await downloadSVG(svg);
          successCount++;
        } catch {
          try {
            await downloadSVGDirect(svg, buildSvgFilename(svg));
            successCount++;
          } catch (directError) {
            failCount++;
            console.error(`Failed to download ${svg?.name}:`, directError.message);
          }
        }
        safeNotifyResults({
          action: "downloadProgress",
          total: svgs.length,
          success: successCount,
          failed: failCount
        });
      }

      safeNotifyResults({
        action: "allDownloadsComplete",
        total: svgs.length,
        success: successCount,
        failed: failCount
      });
    })();
    return true;
  }

  if (message.action === "error") {
    isProcessingSVGs = false;
    console.error("Content script error:", message.message);
    chrome.storage.local
      .set({
        svgs: [],
        scanning: false,
        lastError: message.message || "Unknown error",
        updatedAt: Date.now()
      })
      .then(() => openOrFocusResultsTab(true))
      .then(() => {
        safeNotifyResults({
          action: "showError",
          message: message.message
        });
      })
      .catch(() => {
        // Ignore tab notification failures
      });
  }

  return false;
});

// Preserve user preferences across extension updates; initialize only missing keys
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.local.get(["theme", "language"]);
    const updates = {};
    if (!existing.theme) {
      updates.theme = "dark";
    }
    if (!existing.language) {
      const uiLang = chrome.i18n?.getUILanguage?.() || "en";
      updates.language = uiLang.toLowerCase().startsWith("uk") ? "uk" : "en";
    }
    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
    }
  } catch (error) {
    console.error("Error initializing extension settings:", error);
  }
});

function buildSvgFilename(svgData) {
  const cleanName = (svgData?.name || "svg")
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "svg";
  const timestamp = Date.now().toString(36);
  return `${cleanName}-${timestamp}.svg`;
}

function canUseObjectUrl() {
  return typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
}

function downloadSvgContent(svgText, filename) {
  if (canUseObjectUrl()) {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return chrome.downloads
      .download({ url, filename, saveAs: false })
      .then((downloadId) => {
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return downloadId;
      })
      .catch((err) => {
        URL.revokeObjectURL(url);
        throw err;
      });
  }

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  return chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false
  });
}

function decodeSvgDataUrl(dataUrl) {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return "";
  const meta = dataUrl.slice(0, commaIdx);
  const payload = dataUrl.slice(commaIdx + 1);
  return meta.includes(";base64") ? atob(payload) : decodeURIComponent(payload);
}

function downloadSVG(svgData) {
  return new Promise((resolve, reject) => {
    try {
      const filename = buildSvgFilename(svgData);

      if (svgData?.content) {
        let svgContent = svgData.content.trim();
        if (!svgContent.startsWith("<?xml") && !svgContent.startsWith("<svg")) {
          svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgContent}`;
        }
        downloadSvgContent(svgContent, filename).then(resolve).catch(reject);
        return;
      }

      if (svgData?.url) {
        if (svgData.url.startsWith("data:")) {
          if (canUseObjectUrl() && svgData.url.startsWith("data:image/svg+xml")) {
            const decoded = decodeSvgDataUrl(svgData.url);
            downloadSvgContent(decoded, filename).then(resolve).catch(reject);
          } else {
            chrome.downloads
              .download({ url: svgData.url, filename, saveAs: false })
              .then(resolve)
              .catch(reject);
          }
          return;
        }

        const targetUrl = svgData.url;
        const fetchSvg = (url) =>
          fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: { Accept: "image/svg+xml,*/*" }
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          });

        fetchSvg(targetUrl)
          .catch((primaryErr) => {
            if (svgData.fallbackUrl && svgData.fallbackUrl !== targetUrl) {
              return fetchSvg(svgData.fallbackUrl).then((text) => {
                if (!text.includes("<svg")) {
                  throw new Error("Fallback response is not valid SVG");
                }
                return text;
              });
            }
            throw primaryErr;
          })
          .then((svgText) => downloadSvgContent(svgText, filename))
          .then(resolve)
          .catch(() => {
            chrome.downloads
              .download({ url: targetUrl, filename, saveAs: false })
              .then(resolve)
              .catch(reject);
          });
        return;
      }

      reject(new Error("No SVG content or URL provided"));
    } catch (error) {
      reject(error);
    }
  });
}

function downloadSVGDirect(svg, filename) {
  if (svg?.content) {
    return downloadSvgContent(svg.content, filename);
  }
  if (svg?.url) {
    if (canUseObjectUrl() && svg.url.startsWith("data:image/svg+xml")) {
      return downloadSvgContent(decodeSvgDataUrl(svg.url), filename);
    }
    return chrome.downloads.download({
      url: svg.url,
      filename,
      saveAs: false
    });
  }
  return Promise.reject(new Error("No valid SVG data"));
}
