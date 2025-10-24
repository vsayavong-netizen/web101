@echo off
echo Setting up Git for projectsouk@gmail.com...

REM Configure Git user
git config --global user.name "projectsouk"
git config --global user.email "projectsouk@gmail.com"

REM Initialize Git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: BM23 Project Setup"

echo Git setup completed!
echo Next steps:
echo 1. Create a new repository on GitHub
echo 2. Add remote origin: git remote add origin https://github.com/projectsouk/[repository-name].git
echo 3. Push to GitHub: git push -u origin main

pause
