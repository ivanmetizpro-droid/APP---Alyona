# Электросмета

Автономное приложение электрика: ручная смета и смета по плану, SVG-редактор,
материалы, нагрузки и щит, версии, локальный PDF с кириллицей и резервные копии.
HTML/CSS/JavaScript и безопасная локальная Android-оболочка на Java.

## Промежуточная разработка

Реализация и Android-сборка продолжаются. Фактический статус:
[docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
Продуктовая приёмка этого промежуточного коммита ещё не завершена.

Веб-разработка: `npm ci --cache /workspace/.npm-cache`, `npm run vendor`, `npm run dev`.
Проверки: `npm run check`, `npm run test:e2e`.
Android: `scripts/install-android.py`, `scripts/create-signing-key.sh`, `scripts/build-android.sh`.
Ключ находится вне репозитория; не публикуйте его и резервные копии объектов.

Требования: [полное ТЗ](docs/TZ_Elektrosmeta_HTML_CSS_JavaScript_Codex.md),
[Android-дополнение](docs/ANDROID_DELIVERY.md).
