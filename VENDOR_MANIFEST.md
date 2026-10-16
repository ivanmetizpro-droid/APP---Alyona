# Зависимости среды

Точные версии закреплены в package-lock.json; исходные пакеты установлены из npm.

| Пакет | Версия | Назначение |
|---|---|---|
| jspdf | 4.2.1 | Локальная генерация PDF |
| jspdf-autotable | 5.0.9 | Таблицы PDF |
| @eslint/js | 10.0.1 | Базовые правила ESLint |
| @playwright/test | 1.64.1 | Браузерные smoke/e2e-проверки |
| eslint | 10.12.0 | Проверка JavaScript |
| globals | 17.13.0 | Области глобальных имён для линтера |

## PDF-файлы и лицензии

После npm run vendor файл assets/vendor/manifest.json содержит URL исходного пакета, версию, лицензию и SHA-256 каждого JS-ресурса. Его содержимое воспроизводится из lock-файла.

## Шрифты

DejaVuSans.ttf и DejaVuSans-Bold.ttf скопированы из установленного пакета fonts-dejavu-core. Полный файл прав находится в assets/fonts/LICENSE.txt.
- DejaVuSans-Bold.ttf: SHA-256 5c1247acef7f2b8522a31742c76d6adcb5569bacc0be7ceaa4dc39dd252ce895
- DejaVuSans.ttf: SHA-256 ae7b7855e115a5966d8b1b3f80f254ccc117ec86f9965e202ee2940453837280
