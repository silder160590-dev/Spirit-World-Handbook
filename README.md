# Страница для GitHub Pages

Каталог со статической страницей приложения **«Справочник Мира Духов»**.
Публикуется отдельным workflow: `.github/workflows/pages.yml`
(при пуше в `main`, затрагивающем `pages/**`, либо вручную через *Run workflow*).

## Состав

| Файл | Что это |
| --- | --- |
| `index.html` | Сама страница: описание, установка, характеристики, кнопка скачивания |
| `privacy.html` | Политика конфиденциальности (вторая страница, ссылка из подвала `index.html`) |
| `assets/icon.png`, `assets/favicon.png` | Иконки (копии из `assets/images/`) |
| `download/spravochnik-mira-dukhov-1.0.1.apk` | Release-APK для скачивания |
| `.nojekyll` | Отключает сборку Jekyll на GitHub Pages |

## Что нужно сделать один раз в репозитории

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Запушить ветку `main` — workflow развернёт сайт на
   `https://<логин>.github.io/<репозиторий>/`.

## Обновление APK на странице

1. Соберите свежий release-APK (см. `docs/android-release.md`).
2. Скопируйте его в `pages/download/` (имя файла меняется в двух местах
   `index.html` — обе кнопки `href="./download/..."`).
3. Обновите в `index.html` размер файла, SHA-256
   (`Get-FileHash -Algorithm SHA256`) и дату в таблице характеристик.
4. Запушьте — страница перепубликуется автоматически.
