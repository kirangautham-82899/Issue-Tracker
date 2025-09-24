# 🚀 Issue Tracker - Professional Project Management

A modern, full-stack issue tracking system built with **Angular 17** and **FastAPI**. Features a beautiful emerald-themed UI with glassmorphism design, real-time notifications, and comprehensive project management capabilities.

![Issue Tracker](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Angular](https://img.shields.io/badge/Angular-17-red)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Python](https://img.shields.io/badge/Python-3.9+-yellow)

## ✨ Features

### 🎯 Core Functionality
- **Issue Management**: Create, edit, delete, and track issues
- **Smart Filtering**: Advanced search with multiple criteria
- **Priority System**: Low, Medium, High, Critical levels
- **Status Tracking**: Open, In Progress, Closed workflows
- **User Assignment**: Assign issues to team members

### 🎨 Modern UI/UX
- **Emerald Theme**: Beautiful green gradient design
- **Glassmorphism**: Modern frosted glass effects
- **Dark Mode**: Professional dark theme
- **Responsive Design**: Perfect on all devices
- **Smooth Animations**: Polished user interactions

### 🔔 Real-time Features
- **Live Notifications**: Instant updates and alerts
- **Connection Monitoring**: Backend health indicators
- **WebSocket Support**: Real-time communication ready
- **Auto-refresh**: Live data synchronization

### 📊 Advanced Features
- **Time Tracking**: Log and monitor work hours
- **Issue Templates**: Quick creation with predefined formats
- **Comment System**: Collaborative discussions with @mentions
- **File Attachments**: Document and media support
- **Analytics Dashboard**: Comprehensive project insights

## 🛠️ Tech Stack

### Frontend
- **Angular 17** - Modern TypeScript framework
- **Angular Material** - Professional UI components
- **RxJS** - Reactive programming
- **TypeScript 5.2** - Type-safe development

### Backend
- **FastAPI** - High-performance Python framework
- **Pydantic** - Data validation and serialization
- **SQLAlchemy** - Database ORM
- **PostgreSQL/SQLite** - Database support
- **JWT Authentication** - Secure token-based auth

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.9+**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/issue-tracker.git
cd issue-tracker
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic

# Start server
python simple_server.py
```
**Backend runs on**: http://localhost:8003

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve --port 4201
```
**Frontend runs on**: http://localhost:4201

### 4. Open Application
Visit **http://localhost:4201** to see your Issue Tracker in action! 🎉

## 📁 Project Structure

```
issue-tracker/
├── 📁 frontend/                 # Angular 17 Application
│   ├── 📁 src/app/
│   │   ├── 📁 components/       # UI Components
│   │   │   ├── issue-list/      # Issue dashboard
│   │   │   ├── issue-form/      # Create/edit forms
│   │   │   ├── notification-bell/ # Real-time notifications
│   │   │   └── time-tracking/   # Time logging
│   │   ├── 📁 services/         # API Services
│   │   ├── 📁 models/           # TypeScript interfaces
│   │   └── 📄 app.component.ts  # Main app component
│   ├── 📄 package.json
│   └── 📄 angular.json
├── 📁 backend/                  # FastAPI Application
│   ├── 📄 simple_server.py      # Development server
│   ├── 📄 main.py              # Production server
│   ├── 📄 models.py            # Data models
│   └── 📄 requirements.txt     # Dependencies
├── 📄 .gitignore               # Git ignore rules
└── 📄 README.md                # This file
```

## 🎮 Usage Guide

### Creating Issues
1. Click **"Create Issue"** button
2. Fill in title, description, priority, and assignee
3. Submit to add to your project

### Managing Issues
- **Filter**: Use search bar and dropdown filters
- **Sort**: Click column headers to sort
- **Edit**: Click on any issue row to view/edit
- **Status**: Update progress as work continues

### Notifications
- **Bell Icon**: Shows unread notification count
- **Real-time**: Instant updates for assignments and changes
- **Mark Read**: Click notifications to mark as read

## 🔧 Configuration

### Environment Variables

Create `.env` files for configuration:

**Backend (.env)**:
```env
DATABASE_URL=sqlite:///./issues.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:4201,http://localhost:4200
```

**Frontend (environment.ts)**:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8003'
};
```

## 🚢 Deployment

### Development
- Frontend: `ng serve --port 4201`
- Backend: `python simple_server.py`

### Production
- Frontend: `ng build --prod`
- Backend: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Docker (Optional)
```bash
# Build and run
docker-compose up --build
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Commit** changes: `git commit -am 'Add feature'`
4. **Push** to branch: `git push origin feature-name`
5. **Submit** a pull request

## 📝 API Documentation

When backend is running, visit:
- **Swagger UI**: http://localhost:8003/docs
- **Health Check**: http://localhost:8003/health

## 🔍 Troubleshooting

### Common Issues

**Port Conflicts**:
- Change ports in `simple_server.py` and service files
- Ensure no other applications are using ports 4201/8003

**CORS Errors**:
- Check `allow_origins` in backend CORS configuration
- Verify frontend URL matches allowed origins

**Dependencies**:
- Run `npm install` in frontend directory
- Ensure Python virtual environment is activated

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** - Amazing frontend framework
- **FastAPI Creators** - Excellent Python web framework  
- **Material Design** - Beautiful UI components
- **Community Contributors** - Testing and feedback

---

**⭐ Star this repository if you found it helpful!**

**🚀 Built with passion using Angular 17 + FastAPI**
