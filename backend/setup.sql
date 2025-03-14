-- Создаем пользователя для приложения
CREATE USER airpulse WITH PASSWORD 'airpulse123';

-- Создаем базу данных
CREATE DATABASE airpulse;

-- Даем права пользователю на базу данных
GRANT ALL PRIVILEGES ON DATABASE airpulse TO airpulse;

-- Подключаемся к базе данных airpulse
\c airpulse;

-- Даем права на схему public
GRANT ALL ON SCHEMA public TO airpulse; 