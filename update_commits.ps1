# Создаем резервную ветку
git branch backup-before-update

# Обновляем сообщения коммитов
git commit --amend -m "feat: improve pollen dispersion model based on scientific data"
git commit --amend -m "fix: improve intensity scale, data security and configuration"
git commit --amend -m "fix: remove .env from repository and add to .gitignore"
git commit --amend -m "feat: initial version of AirPulse with Gaussian pollen dispersion" 