# 🚀 CI/CD Guide - Автоматична збірка розширень

## ✨ Що це дає?

Тепер GitHub автоматично збирає розширення для Firefox та Chrome з різних гілок!

## 📋 Швидкий старт

### 1️⃣ Збірка для Firefox

```bash
# Створюємо гілку для Firefox
git checkout -b firefox/my-new-feature

# Робимо зміни
# (редагуємо файли)

# Комітимо та пушимо
git add .
git commit -m "Add new feature"
git push origin firefox/my-new-feature
```

**Результат:**
- ✅ GitHub автоматично запустить збірку
- 📦 Створить `.zip` файл для Firefox
- 🔍 Перевірить код через `web-ext`
- 💾 Завантажить артефакт

---

### 2️⃣ Збірка для Chrome

```bash
# Створюємо гілку для Chrome
git checkout -b chrome/my-new-feature

# Робимо зміни
# (редагуємо файли)

# Комітимо та пушимо
git add .
git commit -m "Add new feature"
git push origin chrome/my-new-feature
```

**Результат:**
- ✅ GitHub автоматично запустить збірку
- 📦 Створить `.zip` файл для Chrome
- 🔍 Перевірить Manifest V3
- ✅ Перевірить використання Chrome API
- 💾 Завантажить артефакт

---

### 3️⃣ Створення релізу (обидві версії)

```bash
# Створюємо тег з версією
git tag v1.2.0

# Пушимо тег
git push origin v1.2.0
```

**Результат:**
- ✅ Створить GitHub Release
- 🦊 Збере Firefox версію (.zip)
- 🌐 Збере Chrome версію (.zip)
- 📝 Згенерує release notes
- 🎉 Опублікує реліз

---

## 📦 Де знайти готові файли?

### Після збірки:

1. Перейдіть на GitHub → вкладка **Actions**
2. Знайдіть свій workflow (зелена галочка ✅)
3. Клікніть на workflow
4. Прокрутіть вниз до секції **Artifacts**
5. Завантажте потрібний файл

### Після релізу:

1. Перейдіть на GitHub → вкладка **Releases**
2. Знайдіть свій реліз
3. Завантажте файли:
   - `svg-extractor-pro-{version}-firefox.zip`
   - `svg-extractor-pro-{version}-chrome.zip`

---

## 🎯 Корисні команди

### Тільки Firefox реліз
```bash
git tag v1.2.0-firefox
git push origin v1.2.0-firefox
```

### Тільки Chrome реліз
```bash
git tag v1.2.0-chrome
git push origin v1.2.0-chrome
```

### Перевірити статус workflows
```bash
# Відкрити Actions на GitHub
gh browse --actions
```

---

## 🔍 Перевірка коду (автоматична)

При кожному push GitHub автоматично перевіряє:

- ✅ Наявність `manifest.json`
- ✅ Валідність JSON
- ✅ Наявність всіх необхідних файлів
- ✅ Правильність використання API
- ⚠️ Попередження про `console.log`
- ❌ Заборона `debugger` statements

---

## 📊 Status Badges

На головній сторінці README тепер є badges:

![Firefox Build](https://github.com/ruslanlap/SVG-Extractor-Firefox-add-on/actions/workflows/build-firefox.yml/badge.svg)
![Chrome Build](https://github.com/ruslanlap/SVG-Extractor-Firefox-add-on/actions/workflows/build-chrome.yml/badge.svg)
![Validate](https://github.com/ruslanlap/SVG-Extractor-Firefox-add-on/actions/workflows/validate.yml/badge.svg)

Вони показують статус останніх збірок.

---

## 🛠️ Як це працює?

### Схема workflows:

```
┌─────────────────────────────────────────────────┐
│  Push до гілки firefox/*                        │
│  → Запускається build-firefox.yml               │
│  → Створюється .zip файл                        │
│  → Завантажується як artifact                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Push до гілки chrome/*                         │
│  → Запускається build-chrome.yml                │
│  → Створюється .zip файл                        │
│  → Завантажується як artifact                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Push тегу v1.2.0                               │
│  → Запускається release.yml                     │
│  → Збирає обидві версії                         │
│  → Створює GitHub Release                       │
│  → Публікує файли                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Push до будь-якої гілки                        │
│  → Запускається validate.yml                    │
│  → Перевіряє код                                │
│  → Повертає OK або Error                        │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Налаштування (опціонально)

Всі workflows знаходяться в `.github/workflows/`:

- `build-firefox.yml` - Збірка Firefox
- `build-chrome.yml` - Збірка Chrome
- `release.yml` - Створення релізів
- `validate.yml` - Перевірка коду

Можна редагувати під свої потреби!

---

## ❓ FAQ

**Q: Чому мій workflow не запустився?**
A: Перевірте назву гілки. Повинна починатися з `firefox/` або `chrome/`

**Q: Де взяти готовий файл після збірки?**
A: Actions → Виберіть workflow → Artifacts (внизу сторінки)

**Q: Як створити реліз вручну?**
A: Actions → Create Release → Run workflow → Заповніть форму

**Q: Workflow падає з помилкою**
A: Actions → Виберіть failed workflow → Розгорніть червоний крок → Прочитайте помилку

**Q: Чи можна змінити версію без тегу?**
A: Так, використайте manual workflow trigger на вкладці Actions

---

## 📚 Детальна документація

Повна документація: [.github/WORKFLOWS.md](.github/WORKFLOWS.md)

---

## 🎉 Приклад використання

### Сценарій: Додати нову функцію для Firefox

```bash
# 1. Створюємо гілку
git checkout -b firefox/add-export-feature

# 2. Додаємо функцію
# (редагуємо код)

# 3. Комітимо
git add .
git commit -m "Add export to PDF feature"

# 4. Пушимо
git push origin firefox/add-export-feature

# 5. Перевіряємо на GitHub
# GitHub → Actions → Чекаємо зелену галочку ✅

# 6. Завантажуємо артефакт
# Actions → Workflow → Artifacts → Завантажити .zip

# 7. Тестуємо локально
# Розпаковуємо .zip та завантажуємо в Firefox (about:debugging)

# 8. Якщо все ОК - мержимо в main
# Створюємо PR → Merge

# 9. Створюємо реліз
git checkout main
git pull
git tag v1.3.0
git push origin v1.3.0

# 10. GitHub автоматично створить реліз! 🎉
```

---

## 🚀 Готово!

Тепер ви можете:
- ✅ Автоматично збирати Firefox версію
- ✅ Автоматично збирати Chrome версію
- ✅ Створювати релізи однією командою
- ✅ Завантажувати готові файли
- ✅ Перевіряти код автоматично

**Приємної розробки!** 🎊

---

**Версія Guide**: 1.0
**Дата**: 2025-11-05
**Автор**: Claude Code Assistant
