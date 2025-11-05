# GitHub Actions Permissions Fix

## ⚠️ Проблема

Якщо ви бачите помилку:
```
⚠️ Unexpected error fetching GitHub release for tag refs/tags/v1.1.2:
HttpError: Resource not accessible by integration
```

Це означає, що GitHub Actions не має прав для створення релізів.

## ✅ Рішення

### Автоматичне (вже зроблено)

Додано `permissions: contents: write` до всіх workflows:
- ✅ `build-firefox.yml`
- ✅ `build-chrome.yml`
- ✅ `release.yml`

### Якщо помилка все ще виникає

Потрібно перевірити налаштування репозиторію:

1. Перейдіть на GitHub: **Settings** → **Actions** → **General**

2. Прокрутіть до секції **Workflow permissions**

3. Виберіть один з варіантів:
   - **Read and write permissions** ← Виберіть це ✅
   - ~~Read repository contents and packages permissions~~

4. Також переконайтесь, що увімкнено:
   - ✅ **Allow GitHub Actions to create and approve pull requests** (опціонально)

5. Натисніть **Save**

## 🔒 Що дозволяють ці права?

- ✅ Створювати GitHub Releases
- ✅ Завантажувати файли до releases
- ✅ Створювати теги
- ✅ Оновлювати release notes
- ✅ Публікувати артефакти

## 🛡️ Безпека

Ці права:
- ✅ Дозволяють тільки Actions створювати releases
- ✅ Не дають доступу до secrets
- ✅ Не дають доступу до інших репозиторіїв
- ✅ Обмежені тільки в межах цього репозиторію

## 📝 Перевірка

Після налаштування спробуйте створити тестовий реліз:

```bash
git tag v1.1.3-test
git push origin v1.1.3-test
```

Якщо workflow пройде успішно - все працює! 🎉

## 🐛 Все ще не працює?

1. Перевірте, чи є у вас права адміністратора репозиторію
2. Перевірте, чи не заблоковані Actions в organization settings
3. Перегляньте логи workflow для детальної інформації

## 📚 Документація

- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Configuring permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-the-default-github_token-permissions)

---

**Версія**: 1.0
**Дата**: 2025-11-05
