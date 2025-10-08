# Authentication Setup Guide

## Overview

The application now includes a complete authentication system with JWT tokens, user management, and protected routes.

## Features Implemented

### 1. **Enhanced Navigation Highlighting**

-   Updated sidebar with schema colors for hover and selected states
-   Smooth transitions and visual feedback
-   Gradient backgrounds matching the theme

### 2. **Login Page**

-   Beautiful login form with theme colors
-   Username and password authentication
-   Error handling and loading states
-   Responsive design

### 3. **Access Token Management**

-   JWT tokens stored in localStorage
-   Automatic token inclusion in all API requests
-   Token expiration handling
-   Secure logout functionality

### 4. **Authentication Middleware**

-   Backend middleware for protecting routes
-   JWT token verification
-   User role management
-   Error handling for expired/invalid tokens

### 5. **Frontend Authentication**

-   AuthContext for state management
-   Protected routes wrapper
-   Automatic token refresh handling
-   User session persistence

## Setup Instructions

### Backend Setup

1. **Install Dependencies**

    ```bash
    cd backend
    npm install bcryptjs jsonwebtoken
    ```

2. **Environment Variables**
   Create a `.env` file in the backend directory:

    ```
    JWT_SECRET=your-super-secret-jwt-key-here
    MONGODB_URI=your-mongodb-connection-string
    ```

3. **Seed Default Users**

    ```bash
    node src/scripts/seedUsers.js
    ```

    This creates:

    - Admin user: `admin` / `admin123`
    - Seller user: `seller` / `seller123`

4. **Start Backend Server**
    ```bash
    npm start
    ```

### Frontend Setup

1. **Environment Variables**
   Create a `.env` file in the frontend directory:

    ```
    REACT_APP_BACKEND=http://localhost:5000/api/
    ```

2. **Start Frontend**
    ```bash
    cd frontend
    npm start
    ```

## API Endpoints

### Authentication Routes

-   `POST /api/auth/login` - User login
-   `GET /api/auth/me` - Get current user info
-   `POST /api/auth/logout` - User logout

### Protected Routes

All existing API routes now support authentication. Add the auth middleware to protect specific routes:

```javascript
const authMiddleware = require("./middleware/auth");
router.get("/protected-route", authMiddleware, (req, res) => {
    // req.user contains the authenticated user
    res.json({ user: req.user });
});
```

## User Roles

-   **admin**: Full access to all features
-   **manager**: Management access
-   **seller**: Sales and inventory access

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: 1-year token lifetime (effectively non-expiring)
4. **Automatic Logout**: On token expiration
5. **Protected Routes**: Backend middleware protection
6. **Input Validation**: Server-side validation

## Usage Examples

### Frontend Authentication

```javascript
import { useAuth } from "./contexts/AuthContext";

function MyComponent() {
    const { user, isAuthenticated, logout } = useAuth();

    if (!isAuthenticated) {
        return <Login />;
    }

    return <div>Welcome, {user.name}!</div>;
}
```

### Backend Protected Route

```javascript
const authMiddleware = require("./middleware/auth");

app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Protected data",
        user: req.user,
    });
});
```

## Default Login Credentials

-   **Admin**: `admin` / `admin123`
-   **Seller**: `seller` / `seller123`

**Important**: Change these default passwords in production!

## Troubleshooting

### Common Issues

1. **Token Expired**: User will be automatically redirected to login
2. **CORS Issues**: Ensure backend CORS is configured for frontend URL
3. **Database Connection**: Verify MongoDB connection string
4. **JWT Secret**: Ensure JWT_SECRET is set in environment variables

### Error Messages

-   `لا يوجد رمز وصول`: No access token provided
-   `رمز الوصول غير صحيح`: Invalid access token
-   `انتهت صلاحية رمز الوصول`: Token expired
-   `اسم المستخدم أو كلمة المرور غير صحيحة`: Invalid credentials

## Next Steps

1. Implement role-based access control for different features
2. Add password reset functionality
3. Implement user management interface
4. Add audit logging for user actions
5. Implement session timeout warnings
