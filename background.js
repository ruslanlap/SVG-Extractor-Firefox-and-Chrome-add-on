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
  const existingTabs = await chrome.tabs.query({ url: `${resultsUrl}*` });

  if (existingTabs && existingTabs.length > 0) {
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
  if (!tab || isRestrictedUrl(tab.url)) {
    console.warn("Cannot run on restricted page:", tab?.url);
    return;
  }

  try {
    await chrome.storage.local.set({
      scanning: true,
      lastError: null,
      sourceTabId: tab.id,
      pageUrl: tab.url,
      pageTitle: tab.title || ""
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"]
    });
  } catch (error) {
    console.error("Error executing content script:", error);
    await chrome.storage.local.set({
      scanning: false,
      lastError: `Cannot access this page: ${error.message}`
    });
    await openOrFocusResultsTab(true);
    safeNotifyResults({
      action: "showError",
      message: `Cannot access this page: ${error.message}`
    });
  }
});

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
      .then(() => {
        isProcessingSVGs = false;
      })
      .catch((error) => {
        isProcessingSVGs = false;
        console.error("Storage or tab error:", error);
        safeNotifyResults({
          action: "showError",
          message: `Failed to process SVGs: ${error.message}`
        });
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
          pageTitle: targetTab.title || ""
        });

        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          files: ["content-script.js"]
        });

        sendResponse({ ok: true, tabId: targetTab.id });
      } catch (error) {
        await chrome.storage.local.set({
          scanning: false,
          lastError: error.message
        });
        sendResponse({ ok: false, error: error.message });
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
    console.error("Content script error:", message.message);
    chrome.storage.local.set({
      scanning: false,
      lastError: message.message || "Unknown error"
    });
    safeNotifyResults({
      action: "showError",
      message: message.message
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

function downloadViaDataUrl(svgText, filename) {
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  return chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false
  });
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

        if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
          const blob = new Blob([svgContent], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          chrome.downloads
            .download({ url, filename, saveAs: false })
            .then((downloadId) => {
              setTimeout(() => URL.revokeObjectURL(url), 1500);
              resolve(downloadId);
            })
            .catch(() => {
              URL.revokeObjectURL(url);
              downloadViaDataUrl(svgContent, filename).then(resolve).catch(reject);
            });
        } else {
          downloadViaDataUrl(svgContent, filename).then(resolve).catch(reject);
        }
        return;
      }

      if (svgData?.url) {
        if (svgData.url.startsWith("data:")) {
          chrome.downloads
            .download({ url: svgData.url, filename, saveAs: false })
            .then(resolve)
            .catch(reject);
          return;
        }

        const targetUrl = svgData.url;
        fetch(targetUrl, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: { Accept: "image/svg+xml,*/*" }
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then((svgText) => downloadViaDataUrl(svgText, filename))
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
    return downloadViaDataUrl(svg.content, filename);
  }
  if (svg?.url) {
    return chrome.downloads.download({
      url: svg.url,
      filename,
      saveAs: false
    });
  }
  return Promise.reject(new Error("No valid SVG data"));
}
