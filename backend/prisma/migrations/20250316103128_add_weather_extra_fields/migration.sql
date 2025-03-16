-- AlterTable
ALTER TABLE "WeatherData" ADD COLUMN     "precipitation" DOUBLE PRECISION,
ADD COLUMN     "pressure" DOUBLE PRECISION,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "timeOfDay" TEXT;
