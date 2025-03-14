
# Скрипт для сбора frontend-файлов в один текстовый файл

# Определяем выходной файл
$outputFile = "frontend_code_combined.txt"

# Определяем кодировку для корректного отображения русского языка
$encoding = [System.Text.Encoding]::UTF8

# Очищаем файл, если он существует
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Определяем типы файлов, которые хотим собрать
$extensions = @("*.js", "*.jsx", "*.ts", "*.tsx", "*.vue", "*.html")

# Файлы и папки, которые следует исключить
$excludedDirs = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage"
)

$excludedFiles = @(
    # Package managers
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    
    # Documentation
    "README.md",
    "*.md",
    "LICENSE",
    
    # Config files
    "*.config.js",
    "*.config.ts",
    "tsconfig.json",
    "*.d.ts",
    "webpack.config.js",
    "vite.config.js",
    "babel.config.js",
    "jest.config.js",
    ".eslintrc.js",
    ".prettierrc.js",
    ".eslintrc.json",
    ".prettierrc",
    
    # Styles
    "*.css",
    "*.scss",
    "*.sass",
    "*.less",
    "*.styl"
)

# Функция для определения, должен ли файл быть пропущен
function ShouldSkipFile($filePath) {
    $fileName = Split-Path $filePath -Leaf
    
    foreach ($excluded in $excludedFiles) {
        if ($fileName -like $excluded) {
            return $true
        }
    }
    
    foreach ($dir in $excludedDirs) {
        if ($filePath -like "*\$dir\*") {
            return $true
        }
    }
    
    return $false
}

# Получаем все файлы с нужными расширениями
$files = @()
foreach ($ext in $extensions) {
    $files += Get-ChildItem -Path . -Filter $ext -Recurse -File | Where-Object { -not (ShouldSkipFile $_.FullName) }
}

# Создаем новый файл с корректной кодировкой
[System.IO.File]::WriteAllText($outputFile, "", $encoding)

# Обрабатываем каждый файл
foreach ($file in $files) {
    # Получаем относительный путь к файлу
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    
    try {
        # Открываем файл для чтения с корректной кодировкой
        $content = [System.IO.File]::ReadAllText($file.FullName, $encoding)
        
        # Добавляем информацию о файле и его содержимое в выходной файл
        $output = "///$relativePath`n$content`n`n"
        [System.IO.File]::AppendAllText($outputFile, $output, $encoding)
        
        Write-Host "Добавлен файл: $relativePath"
    }
    catch {
        Write-Host "Ошибка при обработке файла $relativePath`: $_" -ForegroundColor Red
    }
}

Write-Host "Ошибка при обработке файла $relativePath`: $_" -ForegroundColor Red
