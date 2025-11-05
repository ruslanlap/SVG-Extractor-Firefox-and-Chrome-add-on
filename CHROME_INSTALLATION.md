# SVG Extractor Pro - Chrome Installation Guide

## Chrome Version (Manifest V3)

Цей проект тепер повністю сумісний з Google Chrome та використовує Manifest V3.

## Інструкція з встановлення

### 1. Завантаження розширення

Клонуйте або завантажте цей репозиторій на свій комп'ютер.

### 2. Встановлення в Chrome

1. Відкрийте Google Chrome
2. Перейдіть до `chrome://extensions/`
3. Увімкніть "Режим розробника" (Developer mode) у верхньому правому куті
4. Натисніть кнопку "Завантажити розпаковане розширення" (Load unpacked)
5. Виберіть папку з розширенням (цю папку)

### 3. Використання

1. Натисніть на іконку розширення в панелі інструментів Chrome
2. Розширення автоматично знайде всі SVG-зображення на поточній сторінці
3. Відкриється нова вкладка з результатами
4. Ви можете:
   - Завантажити окремі SVG-файли
   - Скопіювати SVG-код
   - Конвертувати SVG в PNG (для вбудованих SVG)
   - Завантажити всі SVG одразу

## Основні зміни для Chrome

- Оновлено manifest.json до версії 3
- Замінено `browser.*` API на `chrome.*`
- Оновлено background script до service worker
- Використано `chrome.scripting.executeScript` замість `browser.tabs.executeScript`
- Оновлено `browser_action` на `action`

## Підтримувані функції

- ✅ Пошук inline SVG
- ✅ Пошук SVG зображень (<img> теги)
- ✅ Пошук SVG об'єктів (<object>, <embed>)
- ✅ Пошук SVG в CSS backgrounds
- ✅ Завантаження окремих SVG
- ✅ Завантаження всіх SVG
- ✅ Копіювання SVG коду
- ✅ Конвертація в PNG
- ✅ Темна/світла тема
- ✅ Підтримка англійської та української мов

## Примітки

- Розширення не працює на внутрішніх сторінках Chrome (chrome://, chrome-extension://)
- Для деяких сайтів може знадобитися дозвіл на доступ до сайту
- При першому використанні Chrome може запитати дозволи

## Технічні деталі

- Manifest Version: 3
- Service Worker: background.js
- Content Script: content-script.js
- Permissions: activeTab, storage, downloads, tabs, scripting
- Host Permissions: <all_urls>
