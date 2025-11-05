# SVG Extractor Pro

![SVG Extractor Pro Header](data/header3.png)

<div align="center">
  <img src="icons/icon128.png" alt="SVG Extractor Pro Logo" width="128" height="128">

  <h3>Find, Extract, and Download SVG Images from Any Web Page</h3>

  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](#)
  [![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/addon/svg-extractor-pro/)
  [![Version](https://img.shields.io/badge/Version-1.1.1-blue?style=for-the-badge)](https://github.com/ruslanlap/SVG-Extractor-Firefox-add-on/releases)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

> **✨ Тепер доступно для Google Chrome!** Це робоча версія для Chrome з повною підтримкою Manifest V3.

## 🚀 Features

- **Comprehensive SVG Detection**: Finds SVGs in various formats including inline SVGs, image tags, objects, embeds, and even CSS backgrounds
- **PNG Export**: Export SVGs as PNG files
- **Modern User Interface**: Clean, responsive design with both light and dark mode support
- **Batch Download**: Download all SVGs at once as a ZIP file
- **Individual Downloads**: Download specific SVGs as needed
- **Preview Functionality**: View SVGs before downloading
- **Multilingual Support**: Available in English and Ukrainian
- **Copy SVG Code**: Copy SVG source code directly to clipboard

## 📸 Screenshots

<div align="center">
  <img src="data/header1.png" alt="SVG Extractor Pro Screenshot 1" width="400">
  <img src="data/header2.png" alt="SVG Extractor Pro Screenshot 2" width="400">
</div>

## 📋 How It Works

1. **Install the Extension**:
   - **Chrome**: See [CHROME_INSTALLATION.md](CHROME_INSTALLATION.md) for detailed instructions
   - **Firefox**: Install from [Firefox Add-ons store](https://addons.mozilla.org/firefox/addon/svg-extractor-pro/)
2. **Navigate to Any Website**: Go to a website containing SVG images
3. **Click the Extension Icon**: The extension will scan the page for SVGs
4. **View Results**: Browse through all detected SVGs on the results page
5. **Download or Copy**: Save individual SVGs or download all as a ZIP file

## 💻 Chrome Installation

For Chrome users, this extension uses **Manifest V3**. To install:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension is now ready to use!

For detailed instructions, see [CHROME_INSTALLATION.md](CHROME_INSTALLATION.md).

## 🔧 Technical Details

SVG Extractor Pro uses advanced detection techniques to find SVG images that other tools might miss:

- Detects inline `<svg>` elements
- Finds SVG files loaded via `<img>` tags
- Discovers SVGs in `<object>` and `<embed>` elements
- Extracts SVGs used as CSS backgrounds
- Handles data URI SVGs

## 📥 Download and Installation

<div align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/svg-extractor-pro/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search">
    <img src="https://img.shields.io/badge/Download_from-Firefox_Add--on_Store-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white" alt="Download from Firefox Add-on Store">
  </a>
</div>

### Installation Steps:

1. Visit the [SVG Extractor Pro page on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/svg-extractor-pro/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)
2. Click the "Add to Firefox" button
3. Follow the prompts to complete installation
4. The SVG Extractor Pro icon will appear in your browser toolbar

### Leave a Review

If you find SVG Extractor Pro helpful, please consider leaving a review on the Firefox Add-ons page. Your feedback helps others discover this tool!

<div align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/svg-extractor-pro/reviews/">
    <img src="data/stars.png" alt="Leave a 5-star review" width="800">
  </a>
</div>

## 🛠️ Development

### Prerequisites

- Firefox Browser
- Node.js and npm (for development)

### Installation for Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ruslanlap/SVG-Extractor-Firefox-add-on.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Firefox:
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the project directory

## ☕ Support My Work

If you find SVG Extractor Pro useful in your projects or workflow, please consider supporting its continued development:

<div align="center">
  <a href="https://ruslanlap.github.io/ruslanlap_buymeacoffe/">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
  </a>
</div>

Your support helps me:
- Maintain and improve SVG Extractor Pro
- Add new features and capabilities
- Create more useful tools and extensions
- Provide better documentation and support

Every contribution, no matter how small, is greatly appreciated and motivates me to continue developing free and open-source tools for the community.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ☕ Support

If you find this add-on useful, consider [buying me a coffee](https://ruslanlap.github.io/ruslanlap_buymeacoffe/).

## 📬 Feedback

Have suggestions or found a bug? [Leave feedback](https://forms.gle/xDCN4ACr5QKDmYkYA) or [report a bug](https://forms.gle/xDCN4ACr5QKDmYkYA).