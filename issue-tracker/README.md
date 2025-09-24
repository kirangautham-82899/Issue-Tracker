# Issue Tracker Application

A full-stack Issue Tracker application built with Python FastAPI backend and Angular TypeScript frontend.

## Features

### Backend (Python FastAPI)
- **Health Check**: `GET /health` - Returns system health status
- **Issue Management**: Full CRUD operations for issues
  - `GET /issues` - List issues with search, filtering, sorting, and pagination
  - `GET /issues/:id` - Get single issue by ID
  - `POST /issues` - Create new issue
  - `PUT /issues/:id` - Update existing issue
- **Advanced Filtering**: Search by title/description, filter by status/priority/assignee
- **Sorting**: Sort by any field (id, title, status, priority, assignee, created_at, updated_at)
- **Pagination**: Configurable page size and navigation
- **Auto-generated Documentation**: Available at `/docs` when server is running

### Frontend (Angular TypeScript)
- **Issues List Page**: 
  - Responsive table with columns: id, title, status, priority, assignee, updated_at
  - Real-time search functionality
  - Filter dropdowns for status, priority, and assignee
  - Column sorting with visual indicators
  - Pagination with configurable page sizes
  - Action buttons for creating and editing issues
- **Issue Detail View**: 
  - Side drawer showing complete issue information
  - Full JSON display for technical details
  - Quick edit access
- **Issue Forms**: 
  - Create new issues with validation
  - Edit existing issues
  - Form validation with error messages
  - User-friendly status and priority selection

## Project Structure

```
issue-tracker/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main FastAPI application
│   ├── models.py           # Pydantic models and enums
│   ├── database.py         # In-memory database with sample data
│   └── requirements.txt    # Python dependencies
├── frontend/               # Angular TypeScript frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── issue-list/     # Issues list with table and filters
│   │   │   │   ├── issue-form/     # Create/edit issue forms
│   │   │   │   └── issue-detail/   # Issue detail view
│   │   │   ├── models/
│   │   │   │   └── issue.model.ts  # TypeScript interfaces
│   │   │   ├── services/
│   │   │   │   └── issue.service.ts # HTTP service for API calls
│   │   │   ├── app.component.ts    # Main app component
│   │   │   └── app.routes.ts       # Routing configuration
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
└── README.md
```

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   python main.py
   ```
   
   The backend will be available at `http://localhost:8000`
   
   - API Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:4200`

## Usage

1. **Start both servers**: Make sure both backend (port 8000) and frontend (port 4200) are running
2. **Access the application**: Open `http://localhost:4200` in your browser
3. **View Issues**: The main page shows all issues in a sortable, filterable table
4. **Search Issues**: Use the search box to find issues by title or description
5. **Filter Issues**: Use the dropdown filters for status, priority, and assignee
6. **Sort Issues**: Click on column headers to sort by that field
7. **View Issue Details**: Click on any row (except the Edit button) to open the detail drawer
8. **Create New Issue**: Click the "Create Issue" button in the top-right
9. **Edit Issue**: Click the edit icon in the Actions column or use the "Edit Issue" button in the detail view

## API Endpoints

### Health Check
- `GET /health` - Returns `{"status": "ok"}`

### Issues
- `GET /issues` - List issues with optional query parameters:
  - `search` - Search in title and description
  - `status` - Filter by status (open, in_progress, closed)
  - `priority` - Filter by priority (low, medium, high, critical)
  - `assignee` - Filter by assignee email
  - `sort_by` - Sort field (default: updated_at)
  - `sort_order` - Sort direction: asc/desc (default: desc)
  - `page` - Page number (default: 1)
  - `page_size` - Items per page (default: 10, max: 100)

- `GET /issues/{id}` - Get single issue by ID
- `POST /issues` - Create new issue
- `PUT /issues/{id}` - Update existing issue

### Sample Data

The application comes pre-loaded with sample issues for testing:
- Login bug (High priority, Open)
- Dark mode theme (Medium priority, In Progress)
- Database optimization (Critical priority, Open)
- Documentation update (Low priority, Closed)
- User notifications (Medium priority, Open)

## Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server for running FastAPI applications
- **CORS Middleware**: Cross-origin resource sharing support

### Frontend
- **Angular 17**: Modern TypeScript-based web framework
- **Angular Material**: UI component library with Material Design
- **RxJS**: Reactive programming library for handling async operations
- **TypeScript**: Typed superset of JavaScript

## Development Notes

- **In-Memory Database**: The backend uses an in-memory database that resets on restart
- **CORS Configuration**: Backend is configured to allow requests from `http://localhost:4200`
- **Responsive Design**: Frontend is responsive and works on mobile devices
- **Form Validation**: Client-side validation with error messages
- **Error Handling**: Proper error handling and user feedback
- **Type Safety**: Full TypeScript support with proper typing

## Future Enhancements

- Persistent database (PostgreSQL, MongoDB)
- User authentication and authorization
- Real-time updates using WebSockets
- File attachments for issues
- Comments and activity history
- Email notifications
- Advanced reporting and analytics
- Issue templates and workflows

## Testing

To test the application:

1. Start both backend and frontend servers
2. Navigate to `http://localhost:4200`
3. Test all CRUD operations:
   - Create a new issue
   - View issue details
   - Edit an existing issue
   - Use search and filters
   - Test pagination and sorting
4. Verify API endpoints at `http://localhost:8000/docs`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend is running on port 8000 and frontend on port 4200
2. **Module Not Found**: Ensure all dependencies are installed (`pip install -r requirements.txt` and `npm install`)
3. **Port Already in Use**: Change ports in the configuration if needed
4. **Angular CLI Not Found**: Install globally with `npm install -g @angular/cli`

### Backend Issues
- Check Python version compatibility (3.8+)
- Verify virtual environment activation
- Check for missing dependencies

### Frontend Issues
- Check Node.js version (16+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

This project is created for educational and demonstration purposes.
