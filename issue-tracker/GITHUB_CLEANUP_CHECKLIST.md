# 🧹 GitHub Upload Cleanup Checklist

## ❌ FILES TO REMOVE BEFORE UPLOADING

### 1. **Node.js Dependencies**
```bash
# Remove these folders (they'll be recreated with npm install)
frontend/node_modules/
frontend/.angular/
frontend/dist/
frontend/.nx/
```

### 2. **Python Dependencies**
```bash
# Remove these folders/files
backend/__pycache__/
backend/*.pyc
backend/*.pyo
backend/venv/
backend/.venv/
backend/env/
```

### 3. **IDE/Editor Files**
```bash
# Remove these if they exist
.vscode/
.idea/
*.swp
*.swo
*~
```

### 4. **OS Generated Files**
```bash
# Remove these system files
.DS_Store
.DS_Store?
._*
Thumbs.db
desktop.ini
```

### 5. **Log Files**
```bash
# Remove any log files
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### 6. **Database Files (if any)**
```bash
# Remove local database files
*.db
*.sqlite
*.sqlite3
issues.db
```

### 7. **Environment Files with Secrets**
```bash
# Remove files containing sensitive information
.env
.env.local
.env.production
backend/.env
frontend/.env
```

### 8. **Build/Temporary Files**
```bash
# Remove build outputs
frontend/dist/
backend/build/
tmp/
temp/
.tmp/
```

## ✅ FILES TO KEEP/ADD

### 1. **Essential Configuration**
- ✅ `package.json` (frontend)
- ✅ `angular.json` (frontend)
- ✅ `tsconfig.json` (frontend)
- ✅ `requirements.txt` (backend) - **CREATE IF MISSING**

### 2. **Source Code**
- ✅ All `.ts` files in `frontend/src/`
- ✅ All `.py` files in `backend/`
- ✅ All `.html` and `.css` files

### 3. **Documentation**
- ✅ `README.md` (replace with README_NEW.md)
- ✅ `LICENSE` file (create if needed)
- ✅ `.gitignore` (already created)

### 4. **Sample Environment Files**
- ✅ `.env.example` (create template without secrets)

## 🔧 ACTIONS TO TAKE

### 1. **Create Requirements.txt**
```bash
cd backend
# If you have a virtual environment active:
pip freeze > requirements.txt

# Or manually create with these dependencies:
echo "fastapi>=0.104.0" > requirements.txt
echo "uvicorn>=0.24.0" >> requirements.txt
echo "pydantic>=2.0.0" >> requirements.txt
```

### 2. **Create .env.example**
```bash
# Create backend/.env.example
DATABASE_URL=sqlite:///./issues.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:4201,http://localhost:4200
```

### 3. **Replace README**
```bash
# Replace the old README with the new one
mv README_NEW.md README.md
```

### 4. **Create LICENSE (Optional)**
```bash
# Add MIT License or your preferred license
```

## 🚀 FINAL STEPS

### 1. **Initialize Git Repository**
```bash
git init
git add .
git commit -m "Initial commit: Issue Tracker application"
```

### 2. **Create GitHub Repository**
1. Go to GitHub.com
2. Click "New Repository"
3. Name it "issue-tracker" or similar
4. Don't initialize with README (you already have one)

### 3. **Push to GitHub**
```bash
git remote add origin https://github.com/yourusername/issue-tracker.git
git branch -M main
git push -u origin main
```

## ⚠️ SECURITY CHECKLIST

- [ ] No API keys or passwords in code
- [ ] No database files with real data
- [ ] No `.env` files with secrets
- [ ] No personal information in commits
- [ ] No hardcoded URLs or credentials

## 📝 RECOMMENDED ADDITIONS

### 1. **Create requirements.txt** (if missing)
```txt
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
python-multipart>=0.0.6
```

### 2. **Create .env.example**
```env
# Backend Configuration
DATABASE_URL=sqlite:///./issues.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:4201

# Optional: Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
```

### 3. **Create LICENSE file**
```txt
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

**✅ After completing this checklist, your repository will be clean and professional for GitHub!**
