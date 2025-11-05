# GitHub Actions Workflows Documentation

Цей проект використовує GitHub Actions для автоматичної збірки розширень для різних браузерів.

## 📋 Доступні Workflows

### 1. **Build Firefox Extension** (`build-firefox.yml`)

Автоматично збирає Firefox версію розширення.

**Коли запускається:**
- При push в гілки `main`, `master`, або `firefox/**`
- При створенні тегу з суфіксом `-firefox` (наприклад, `v1.1.1-firefox`)
- При Pull Request до `main` або `master`

**Що робить:**
- ✅ Створює Firefox build директорію
- ✅ Валідує розширення за допомогою `web-ext`
- ✅ Збирає `.zip` файл
- ✅ Завантажує артефакт
- ✅ Створює GitHub Release (якщо це тег)

**Артефакти:**
- `svg-extractor-pro-firefox-{version}.zip`

**Вимоги:**
- Manifest version 2
- Використання `browser.*` API

---

### 2. **Build Chrome Extension** (`build-chrome.yml`)

Автоматично збирає Chrome версію розширення.

**Коли запускається:**
- При push в гілки `chrome/**` або `claude/chrome-*`
- При створенні тегу з суфіксом `-chrome` (наприклад, `v1.1.1-chrome`)
- При Pull Request до `main` або `master`

**Що робить:**
- ✅ Створює Chrome build директорію
- ✅ Валідує Manifest V3
- ✅ Перевіряє використання Chrome API
- ✅ Створює `.zip` пакет
- ✅ Генерує інструкцію встановлення
- ✅ Завантажує артефакт
- ✅ Створює GitHub Release (якщо це тег)

**Артефакти:**
- `svg-extractor-pro-chrome-{version}.zip`
- `INSTALLATION.txt`

**Вимоги:**
- Manifest version 3
- Використання `chrome.*` API

---

### 3. **Create Release** (`release.yml`)

Створює офіційний реліз з обома версіями (Firefox + Chrome).

**Коли запускається:**
- При push тегу `v*` (наприклад, `v1.1.1`)
- Вручну через GitHub Actions UI

**Параметри для ручного запуску:**
- `version` - Версія релізу (наприклад, 1.1.2)
- `build_firefox` - Чи будувати Firefox версію (true/false)
- `build_chrome` - Чи будувати Chrome версію (true/false)

**Що робить:**
- ✅ Створює draft release на GitHub
- ✅ Збирає Firefox версію (.zip)
- ✅ Збирає Chrome версію (.zip)
- ✅ Додає обидва файли до release
- ✅ Публікує release (знімає draft)
- ✅ Генерує release notes автоматично

**Артефакти:**
- `svg-extractor-pro-{version}-firefox.zip`
- `svg-extractor-pro-{version}-chrome.zip`
- `CHROME-INSTALLATION.txt`

---

### 4. **Validate Extension** (`validate.yml`)

Перевіряє якість коду та структуру проекту.

**Коли запускається:**
- При push в будь-яку гілку
- При Pull Request

**Що перевіряє:**
- ✅ Наявність `manifest.json`
- ✅ Валідність JSON
- ✅ Наявність усіх необхідних файлів
- ✅ Наявність іконок
- ✅ Автоматичне визначення типу браузера (Firefox/Chrome)
- ✅ Відповідність API до типу браузера
- ⚠️ Попередження про `console.log`
- ❌ Помилка при наявності `debugger`

**Не блокує:**
- Попередження про console.log

**Блокує:**
- Відсутні файли
- Невалідний JSON
- Debugger statements

---

## 🚀 Як використовувати

### Автоматична збірка Firefox

1. Створіть гілку `firefox/feature-name`
2. Зробіть зміни та commit
3. Push до GitHub
4. Workflow автоматично запуститься

```bash
git checkout -b firefox/new-feature
# make changes
git commit -m "Add new feature"
git push origin firefox/new-feature
```

---

### Автоматична збірка Chrome

1. Створіть гілку `chrome/feature-name`
2. Зробіть зміни та commit
3. Push до GitHub
4. Workflow автоматично запуститься

```bash
git checkout -b chrome/new-feature
# make changes
git commit -m "Add new feature"
git push origin chrome/new-feature
```

---

### Створення релізу

#### Метод 1: Через теги (автоматично)

```bash
# Створити тег з версією
git tag v1.1.2

# Запушити тег
git push origin v1.1.2
```

Workflow автоматично:
- Створить реліз
- Збере обидві версії
- Опублікує на GitHub

#### Метод 2: Вручну через UI

1. Перейдіть на GitHub: **Actions** → **Create Release**
2. Натисніть **Run workflow**
3. Введіть параметри:
   - Version: `1.1.2`
   - Build Firefox: ✅
   - Build Chrome: ✅
4. Натисніть **Run workflow**

---

## 📦 Завантаження артефактів

### Після успішної збірки:

1. Перейдіть на **Actions** tab
2. Виберіть завершений workflow
3. Прокрутіть вниз до **Artifacts**
4. Завантажте потрібний файл:
   - `firefox-extension-{version}`
   - `chrome-extension-{version}`

---

## 🔧 Налаштування workflows

### Змінити гілки для збірки

Відредагуйте файли у `.github/workflows/`:

**Firefox** (`build-firefox.yml`):
```yaml
on:
  push:
    branches:
      - main
      - master
      - 'firefox/**'  # ← додайте свої гілки
```

**Chrome** (`build-chrome.yml`):
```yaml
on:
  push:
    branches:
      - 'chrome/**'  # ← додайте свої гілки
```

### Додати нові перевірки

Відредагуйте `validate.yml` та додайте нові кроки:

```yaml
- name: Your custom check
  run: |
    echo "Running custom validation..."
    # your commands here
```

---

## 🐛 Troubleshooting

### Workflow не запускається

**Перевірте:**
- Чи правильна назва гілки (повинна починатися з `firefox/` або `chrome/`)
- Чи є файл workflow у `.github/workflows/`
- Чи є у вас права на запуск Actions

### Збірка падає з помилкою

**Перегляньте логи:**
1. Перейдіть на **Actions** tab
2. Виберіть failed workflow
3. Розгорніть failed step
4. Прочитайте error message

**Часті помилки:**
- Невалідний `manifest.json` → перевірте JSON синтаксис
- Відсутні файли → перевірте структуру проекту
- API mismatch → переконайтесь, що використовуєте правильний API

### Реліз не створюється

**Перевірте:**
- Чи правильний формат тегу (`v1.1.1`, не `1.1.1`)
- Чи є у репозиторії permission для створення релізів
- Чи є `GITHUB_TOKEN` (він створюється автоматично)

---

## 📊 Status Badges

Додайте badges до README:

```markdown
![Firefox Build](https://github.com/USERNAME/REPO/actions/workflows/build-firefox.yml/badge.svg)
![Chrome Build](https://github.com/USERNAME/REPO/actions/workflows/build-chrome.yml/badge.svg)
![Validate](https://github.com/USERNAME/REPO/actions/workflows/validate.yml/badge.svg)
```

---

## 🔐 Secrets

Workflows використовують тільки стандартний `GITHUB_TOKEN`.

Якщо потрібні додаткові secrets:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Використовуйте у workflow: `${{ secrets.YOUR_SECRET }}`

---

## 📝 Приклади використання

### Реліз тільки Firefox версії

```bash
git tag v1.1.1-firefox
git push origin v1.1.1-firefox
```

### Реліз тільки Chrome версії

```bash
git tag v1.1.1-chrome
git push origin v1.1.1-chrome
```

### Реліз обох версій

```bash
git tag v1.1.1
git push origin v1.1.1
```

---

## 🎯 Best Practices

1. **Завжди перевіряйте локально** перед push
2. **Використовуйте feature branches** для розробки
3. **Створюйте Pull Requests** для code review
4. **Чекайте на green build** перед merge
5. **Версіонуйте правильно** (semantic versioning)
6. **Тестуйте артефакти** після завантаження

---

## 📚 Додаткові ресурси

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [web-ext Documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Chrome Extensions Publishing](https://developer.chrome.com/docs/webstore/publish/)
- [Firefox Add-ons Publishing](https://extensionworkshop.com/documentation/publish/)

---

**Version**: 1.0
**Last Updated**: 2025-11-05
