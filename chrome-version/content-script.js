// content-script.js - Вдосконалена версія
(function() {
  // Find all SVGs on the page with improved detection
  function findSVGs() {
    const svgs = [];
    let index = 0;

    // Process inline SVG elements
    document.querySelectorAll('svg').forEach(svg => {
      // Skip very small or hidden SVGs that are likely used as icons
      const boundingRect = svg.getBoundingClientRect();
      const isVisible = boundingRect.width > 0 && boundingRect.height > 0 &&
                        window.getComputedStyle(svg).display !== 'none' &&
                        window.getComputedStyle(svg).visibility !== 'hidden';

      // Get SVG content
      const svgContent = new XMLSerializer().serializeToString(svg);

      // Get dimensions with fallbacks
      const width = svg.getAttribute('width') || 
                    svg.style.width || 
                    (svg.viewBox?.baseVal?.width || 0);

      const height = svg.getAttribute('height') || 
                     svg.style.height || 
                     (svg.viewBox?.baseVal?.height || 0);

      // Extract a more meaningful name
      let name = svg.getAttribute('id') || 
                 svg.getAttribute('aria-label') || 
                 svg.querySelector('title')?.textContent || 
                 `svg-${index++}`;

      // Sanitize name
      name = name.replace(/[^\w\s-]/g, '').trim() || `svg-${index}`;

      svgs.push({
        id: `inline-${index}`,
        name: name,
        type: 'inline',
        content: svgContent,
        width: parseFloat(width) || boundingRect.width || 100,
        height: parseFloat(height) || boundingRect.height || 100,
        viewBox: svg.getAttribute('viewBox') || ''
      });
    });

    // Process SVG images - improved selector and detection
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      const isSVG = src.toLowerCase().endsWith('.svg') || 
                   src.toLowerCase().includes('.svg?') ||
                   src.startsWith('data:image/svg+xml');

      if (src && isSVG) {
        // Get a better name
        let name = img.alt || 
                   img.getAttribute('aria-label') || 
                   (src.includes('/') ? src.split('/').pop().replace(/\.svg.*$/i, '') : '') || 
                   `svg-image-${index++}`;

        // Sanitize name
        name = name.replace(/[^\w\s-]/g, '').trim() || `svg-image-${index}`;

        svgs.push({
          id: `img-${index}`,
          name: name,
          type: 'image',
          url: src,
          width: img.naturalWidth || img.width || 100,
          height: img.naturalHeight || img.height || 100
        });
      }
    });

    // Process object/embed SVGs with improved handling
    document.querySelectorAll('object, embed').forEach(obj => {
      const url = obj.data || obj.src || '';
      const isSVG = url.toLowerCase().endsWith('.svg') || 
                   url.toLowerCase().includes('.svg?');

      if (url && isSVG) {
        let name = obj.getAttribute('title') || 
                   obj.getAttribute('aria-label') || 
                   (url.includes('/') ? url.split('/').pop().replace(/\.svg.*$/i, '') : '') || 
                   `svg-object-${index++}`;

        // Sanitize name           
        name = name.replace(/[^\w\s-]/g, '').trim() || `svg-object-${index}`;

        svgs.push({
          id: `obj-${index}`,
          name: name,
          type: 'object',
          url: url,
          width: parseFloat(obj.width) || 100,
          height: parseFloat(obj.height) || 100
        });
      }
    });

    // Search for CSS backgrounds with SVG
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage || '';

      if (bgImage.includes('.svg') || bgImage.includes('data:image/svg+xml')) {
        // Extract URL from the background-image
        const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);

        if (match && match[1]) {
          const url = match[1];
          const isSVG = url.toLowerCase().endsWith('.svg') || 
                       url.toLowerCase().includes('.svg?') ||
                       url.startsWith('data:image/svg+xml');

          if (isSVG) {
            let name = el.getAttribute('id') || 
                       el.getAttribute('aria-label') || 
                       (url.includes('/') ? url.split('/').pop().replace(/\.svg.*$/i, '') : '') || 
                       `svg-bg-${index++}`;

            // Sanitize name
            name = name.replace(/[^\w\s-]/g, '').trim() || `svg-bg-${index}`;

            svgs.push({
              id: `bg-${index}`,
              name: name,
              type: 'background',
              url: url,
              width: el.offsetWidth || 100,
              height: el.offsetHeight || 100
            });
          }
        }
      }
    });

    // Deduplicate SVGs based on content or URL
    const uniqueSvgs = [];
    const svgMap = new Map();

    svgs.forEach(svg => {
      const key = svg.content || svg.url;
      if (!svgMap.has(key)) {
        svgMap.set(key, true);
        uniqueSvgs.push(svg);
      }
    });

    return uniqueSvgs;
  }

  // Find SVGs and send to background script
  try {
    const svgs = findSVGs();
    chrome.runtime.sendMessage({ action: "foundSVGs", svgs: svgs });
  } catch (error) {
    chrome.runtime.sendMessage({
      action: "error",
      message: `Error finding SVGs: ${error.message}`
    });
  }
})();