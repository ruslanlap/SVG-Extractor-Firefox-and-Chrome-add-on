// background.js - Updated to open results page (which loads result.js)

// Прапори для відстеження стану
let isProcessingSVGs = false;
let resultsTabId = null;
let firstRun = true;

chrome.runtime.onStartup.addListener(() => {
  console.log("SVG Extractor Pro started.");
});

// Обробка кліку на іконку розширення
chrome.action.onClicked.addListener((tab) => {
  // Перевіряємо, чи підтримується даний URL
  if (
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("mozilla://")
  ) {
    console.warn("Cannot run on this page type:", tab.url);
    return;
  }

  console.log("Extension icon clicked. Opening results page.");

  // Інжектуємо content script для пошуку SVG на поточній сторінці
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-script.js"]
  }).catch(error => {
    console.error(`Error executing content script: ${error}`);
    chrome.runtime.sendMessage({
      action: "error",
      message: `Cannot access this page: ${error.message}`
    });
  });

  // Відкриваємо (або активуємо) вкладку з результатами, де завантажується result.js
  openResultsTab();
});

// Функція відкриття/створення вкладки з результатами (results.html)
function openResultsTab() {
  return new Promise((resolve, reject) => {
    if (resultsTabId !== null) {
      // Якщо вкладка вже відкрита – активуємо її
      chrome.tabs.get(resultsTabId).then(tab => {
        chrome.tabs.update(tab.id, { active: true })
          .then(() => chrome.tabs.reload(tab.id))
          .then(() => resolve())
          .catch(err => {
            console.error("Error updating existing tab:", err);
            resultsTabId = null;
            createNewResultsTab().then(resolve).catch(reject);
          });
      }).catch(err => {
        console.info("Stored tab no longer exists:", err);
        resultsTabId = null;
        createNewResultsTab().then(resolve).catch(reject);
      });
    } else {
      // Якщо вкладка ще не відкрита, створюємо нову
      createNewResultsTab().then(resolve).catch(reject);
    }
  });
}

function createNewResultsTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({
      url: "results.html",
      active: true
    }).then(tab => {
      resultsTabId = tab.id;
      // Скидання resultsTabId після закриття вкладки
      chrome.tabs.onRemoved.addListener(function onTabRemoved(tabId) {
        if (tabId === resultsTabId) {
          resultsTabId = null;
          chrome.tabs.onRemoved.removeListener(onTabRemoved);
        }
      });
      resolve();
    }).catch(err => {
      console.error("Error creating tab:", err);
      reject(err);
    });
  });
}

// Обробка повідомлень від content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "foundSVGs" && !isProcessingSVGs) {
    isProcessingSVGs = true;
    // Зберігаємо SVG дані у localStorage
    chrome.storage.local.set({ 'svgs': message.svgs }).then(() => {
      // Після збереження SVG відкриваємо вкладку з результатами
      return openResultsTab();
    }).then(() => {
      isProcessingSVGs = false;
    }).catch(error => {
      isProcessingSVGs = false;
      console.error(`Storage or tab error: ${error}`);
      chrome.runtime.sendMessage({
        action: "error",
        message: `Failed to process SVGs: ${error.message}`
      });
    });
  } else if (message.action === "downloadSVG") {
    // Обробка завантаження окремого SVG (код завантаження залишається без змін)
    downloadSVG(message.svg)
      .then((downloadId) => {
        chrome.runtime.sendMessage({
          action: "downloadSuccess",
          id: message.svg.id,
          downloadId: downloadId
        });
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error(`Standard download failed: ${error.message}. Trying direct method...`);
        const timestamp = Date.now().toString(36);
        const safeName = (message.svg.name || 'svg')
          .replace(/[^\w\-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);
        const filename = `${safeName}-${timestamp}.svg`;
        downloadSVGDirect(message.svg, filename)
          .then(() => {
            chrome.runtime.sendMessage({
              action: "downloadSuccess",
              id: message.svg.id
            });
            sendResponse({ success: true });
          })
          .catch(directError => {
            console.error(`Direct download also failed: ${directError.message}`);
            chrome.runtime.sendMessage({
              action: "downloadError",
              id: message.svg.id,
              error: directError.message
            });
            sendResponse({ success: false, error: directError.message });
          });
      });
    return true;
  } else if (message.action === "downloadAllSVGs") {
    // Обробка завантаження всіх SVG
    const svgs = message.svgs;
    let successCount = 0;
    let failCount = 0;
    const downloadSequentially = async () => {
      for (const svg of svgs) {
        try {
          await downloadSVG(svg);
          successCount++;
          chrome.runtime.sendMessage({
            action: "downloadProgress",
            total: svgs.length,
            success: successCount,
            failed: failCount
          });
        } catch (error) {
          try {
            const timestamp = Date.now().toString(36);
            const safeName = (svg.name || 'svg')
              .replace(/[^\w\-]/g, '-')
              .replace(/-+/g, '-')
              .substring(0, 50);
            const filename = `${safeName}-${timestamp}.svg`;
            await downloadSVGDirect(svg, filename);
            successCount++;
          } catch (directError) {
            failCount++;
            console.error(`Failed to download ${svg.name}: ${directError.message}`);
          }
          chrome.runtime.sendMessage({
            action: "downloadProgress",
            total: svgs.length,
            success: successCount,
            failed: failCount
          });
        }
      }
      chrome.runtime.sendMessage({
        action: "allDownloadsComplete",
        total: svgs.length,
        success: successCount,
        failed: failCount
      });
    };
    downloadSequentially();
    return true;
  } else if (message.action === "error") {
    console.error(`Content script error: ${message.message}`);
    chrome.runtime.sendMessage({
      action: "showError",
      message: message.message
    });
  }
});

// Відстеження закриття вкладок для очищення resultsTabId
chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === resultsTabId) {
    resultsTabId = null;
  }
});

// При встановленні чи оновленні розширення задаємо налаштування за замовчуванням
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({
    'theme': 'dark',
    'language': 'en',
    'firstRun': true
  });
  console.log("SVG Extractor Pro installed successfully. Click the extension icon to use it.");
});

// Функції downloadSVG та downloadSVGDirect (їх реалізація залишається без змін)
function downloadSVG(svgData) {
  return new Promise((resolve, reject) => {
    try {
      const cleanName = (svgData.name || 'svg')
        .replace(/[^\w\-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      const timestamp = Date.now().toString(36);
      const filename = `${cleanName}-${timestamp}.svg`;

      if (svgData.content) {
        let svgContent = svgData.content;
        if (!svgContent.trim().startsWith('<?xml') && !svgContent.trim().startsWith('<svg')) {
          svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgContent}`;
        }
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        }).then(downloadId => {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(downloadId);
        }).catch(error => {
          console.error(`Download error for ${cleanName}: ${error.message}`);
          const reader = new FileReader();
          reader.onloadend = function () {
            const dataUrl = reader.result;
            chrome.downloads.download({
              url: dataUrl,
              filename: filename,
              saveAs: false
            }).then(resolve).catch(reject);
          };
          reader.readAsDataURL(blob);
        });
      } else if (svgData.url) {
        if (svgData.url.startsWith('data:')) {
          chrome.downloads.download({
            url: svgData.url,
            filename: filename,
            saveAs: false
          }).then(resolve).catch(reject);
          return;
        }
        let cleanUrl = svgData.url.split('#')[0].split('?')[0];
        fetch(cleanUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: {
            'Accept': 'image/svg+xml,*/*'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(svgText => {
          const blob = new Blob([svgText], { type: 'image/svg+xml' });
          const objectUrl = URL.createObjectURL(blob);
          return chrome.downloads.download({
            url: objectUrl,
            filename: filename,
            saveAs: false
          }).then(downloadId => {
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            resolve(downloadId);
          });
        })
        .catch(fetchError => {
          console.error(`Fetch error for ${cleanUrl}: ${fetchError.message}`);
          chrome.downloads.download({
            url: cleanUrl,
            filename: filename,
            saveAs: false
          }).then(resolve).catch(secondError => {
            console.error(`Direct download also failed: ${secondError.message}`);
            fetch(cleanUrl, { mode: 'no-cors' })
              .then(response => response.blob())
              .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                return chrome.downloads.download({
                  url: objectUrl,
                  filename: filename,
                  saveAs: false
                }).then(downloadId => {
                  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                  resolve(downloadId);
                });
              })
              .catch(finalError => {
                reject(finalError);
              });
          });
        });
      } else {
        reject(new Error('No SVG content or URL provided'));
      }
    } catch (error) {
      console.error('Download function error:', error);
      reject(error);
    }
  });
}

// Note: This function is a simplified version for Chrome service workers
// DOM manipulation is handled in content scripts or extension pages
function downloadSVGDirect(svg, filename) {
  return new Promise((resolve, reject) => {
    try {
      // For Chrome service workers, we use chrome.downloads API directly
      if (svg.content) {
        const blob = new Blob([svg.content], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        }).then(downloadId => {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(downloadId);
        }).catch(reject);
      } else if (svg.url) {
        chrome.downloads.download({
          url: svg.url,
          filename: filename,
          saveAs: false
        }).then(resolve).catch(reject);
      } else {
        reject(new Error('No valid SVG data'));
      }
    } catch (error) {
      reject(error);
    }
  });
}
