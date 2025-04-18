-- Шаблон безопасной миграции для обновления схемы БД AirPulse
-- Эта миграция должна выполняться в несколько этапов для сохранения существующих данных

-- Шаг 1: Временная обработка существующих записей отчетов с NULL в поле userId
-- Установим временный userId = 1 для отчетов, где он не заполнен
-- ВАЖНО! Заменить 1 на ID существующего пользователя
UPDATE "Report" SET "userId" = 1 WHERE "userId" IS NULL;

-- Шаг 2: Изменение схемы (будет создано автоматически Prisma)
-- ALTER TABLE "Report" ALTER COLUMN "userId" SET NOT NULL;

-- Примечание: перед применением этой миграции создайте бэкап базы данных
-- Команда для создания бэкапа:
-- pg_dump -U имя_пользователя -W -F c имя_базы > backup_before_migration.sql 