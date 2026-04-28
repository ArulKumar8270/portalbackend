# Frontend Implementation Plan - Backend Security Updates

**Date:** December 31, 2025  
**Status:** Implementation Guide for Frontend Teams

---

## 📋 **OVERVIEW**

This document outlines the frontend implementation plan for the backend security updates. The backend now requires authentication tokens for all API endpoints (except public routes) and returns proper HTTP status codes.

---

## 🔑 **KEY CHANGES**

### 1. **Authentication Required**
- All API endpoints now require a valid access token
- Token can be provided via:
  - Cookie: `XSRF-token` (automatically sent by browser)
  - Header: `Authorization` header

### 2. **Error Response Changes**
- Authentication errors now return **401** (not 500)
- Response format: `{ success: false, errors: [...], message: "..." }`

### 3. **Public Routes** (No Token Required)
- `/api/auth/register`
- `/api/auth/rootLogin`
- `/api/customer/register`
- `/api/customer/login`

---

## 🚀 **IMPLEMENTATION STEPS**

### **Step 1: Update API Client/HTTP Utility**

#### **1.1 Create/Update HTTP Client**

**For React/Next.js (Axios):**
```javascript
// utils/apiClient.js or services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // Important: Send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookie
    const token = localStorage.getItem('authToken') || getCookie('XSRF-token');
    
    if (token) {
      // Add token to Authorization header
      config.headers.Authorization = token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Helper function to get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Handle unauthorized access
function handleUnauthorized() {
  // Clear auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Redirect to login
  window.location.href = '/login';
  
  // Or use your routing library
  // router.push('/login');
}

export default apiClient;
```

**For Vue.js (Axios):**
```javascript
// services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || getCookie('XSRF-token');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**For Flutter (Dio):**
```dart
// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  late Dio _dio;
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: 'http://localhost:8000/api',
      connectTimeout: 5000,
      receiveTimeout: 3000,
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    // Add interceptors
    _dio.interceptors.add(_AuthInterceptor());
    _dio.interceptors.add(_ErrorInterceptor());
  }
  
  Dio get dio => _dio;
}

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Get token from secure storage
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    
    if (token != null) {
      options.headers['Authorization'] = token;
    }
    
    handler.next(options);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Handle unauthorized
      _handleUnauthorized();
    }
    handler.next(err);
  }
  
  void _handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
    await prefs.remove('user');
    
    // Navigate to login
    // Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }
}
```

---

### **Step 2: Update Login/Authentication Flow**

#### **2.1 Login Component Update**

**React Example:**
```javascript
// components/Login.jsx
import { useState } from 'react';
import apiClient from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/rootLogin', {
        email,
        password,
      });

      if (response.data.success) {
        // Store token if provided in response
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      // Handle errors
      if (err.response?.status === 401) {
        setError('Invalid credentials. Please try again.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### **Step 3: Handle 401 Errors Globally**

#### **3.1 Create Auth Context/Store**

**React Context Example:**
```javascript
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Verify token by making a test request
        const response = await apiClient.get('/auth/user/me'); // If you have this endpoint
        if (response.data.success) {
          setUser(response.data.data);
        }
      }
    } catch (err) {
      // Token invalid, clear auth
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    if (token) localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### **3.2 Protected Route Component**

```javascript
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

### **Step 4: Update Error Handling**

#### **4.1 Error Handler Utility**

```javascript
// utils/errorHandler.js
export function handleApiError(error) {
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      type: 'network',
    };
  }

  const { status, data } = error.response;

  switch (status) {
    case 401:
      return {
        message: data.message || 'Authentication required. Please login.',
        type: 'auth',
        action: 'redirect', // Redirect to login
      };
    
    case 403:
      return {
        message: data.message || 'You do not have permission to access this resource.',
        type: 'permission',
      };
    
    case 404:
      return {
        message: data.message || 'Resource not found.',
        type: 'notFound',
      };
    
    case 429:
      return {
        message: data.message || 'Too many requests. Please try again later.',
        type: 'rateLimit',
        retryAfter: data.retryAfter,
      };
    
    case 500:
      return {
        message: data.message || 'Server error. Please try again later.',
        type: 'server',
      };
    
    default:
      return {
        message: data.message || 'An error occurred. Please try again.',
        type: 'unknown',
      };
  }
}

// Usage in components
try {
  await apiClient.get('/some-endpoint');
} catch (error) {
  const errorInfo = handleApiError(error);
  
  if (errorInfo.type === 'auth' && errorInfo.action === 'redirect') {
    // Redirect to login
    navigate('/login');
  } else {
    // Show error message
    setError(errorInfo.message);
  }
}
```

---

### **Step 5: Handle Rate Limiting**

#### **5.1 Rate Limit Handler**

```javascript
// utils/rateLimitHandler.js
export function handleRateLimit(error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.data.retryAfter; // seconds
    
    return {
      message: error.response.data.message,
      retryAfter,
      retryAt: new Date(Date.now() + retryAfter * 1000),
    };
  }
  return null;
}

// Usage
try {
  await apiClient.post('/auth/rootLogin', credentials);
} catch (error) {
  const rateLimitInfo = handleRateLimit(error);
  
  if (rateLimitInfo) {
    // Show countdown or disable button
    setRateLimitInfo(rateLimitInfo);
    setDisabled(true);
    
    // Re-enable after retry time
    setTimeout(() => {
      setDisabled(false);
      setRateLimitInfo(null);
    }, rateLimitInfo.retryAfter * 1000);
  }
}
```

---

### **Step 6: Update All API Calls**

#### **6.1 Replace fetch/axios calls**

**Before:**
```javascript
// ❌ Old way
fetch('/api/user/list')
  .then(res => res.json())
  .then(data => console.log(data));
```

**After:**
```javascript
// ✅ New way
import apiClient from '../utils/apiClient';

try {
  const response = await apiClient.get('/user/list');
  if (response.data.success) {
    console.log(response.data.data);
  }
} catch (error) {
  const errorInfo = handleApiError(error);
  console.error(errorInfo.message);
}
```

---

### **Step 7: Cookie Handling (If Using Cookies)**

#### **7.1 Ensure Cookies Are Sent**

**React/Next.js:**
```javascript
// Make sure withCredentials is true
axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Important
});
```

**Flutter:**
```dart
// Add cookie support
_dio = Dio(BaseOptions(
  baseUrl: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
));

// Use cookie_jar package for cookie management
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

final cookieJar = CookieJar();
_dio.interceptors.add(CookieManager(cookieJar));
```

---

## 📝 **CHECKLIST**

### **Immediate Actions:**
- [ ] Update HTTP client to include `withCredentials: true`
- [ ] Add Authorization header interceptor
- [ ] Add 401 error interceptor (redirect to login)
- [ ] Update login flow to store token
- [ ] Update logout flow to clear token
- [ ] Test authentication flow

### **Error Handling:**
- [ ] Create error handler utility
- [ ] Update all API calls to use new error handler
- [ ] Handle 401 errors globally
- [ ] Handle 429 (rate limit) errors
- [ ] Show user-friendly error messages

### **Testing:**
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials (should show error)
- [ ] Test API call without token (should redirect to login)
- [ ] Test API call with expired token (should redirect to login)
- [ ] Test rate limiting (make many requests)
- [ ] Test protected routes

---

## 🔧 **CONFIGURATION**

### **Environment Variables**

Create `.env` file:
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
# or
VUE_APP_API_URL=http://localhost:8000/api
# or
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### **Production Configuration**

```javascript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.yourdomain.com/api'
  : 'http://localhost:8000/api';
```

---

## 🎯 **EXAMPLE IMPLEMENTATION**

### **Complete Example: React + Axios**

```javascript
// 1. apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// 2. Login.jsx
import apiClient from './apiClient';

async function login(email, password) {
  try {
    const res = await apiClient.post('/auth/rootLogin', { email, password });
    if (res.data.success) {
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      return { success: true, user: res.data.data };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
}

// 3. Protected API Call
async function getUserList() {
  try {
    const res = await apiClient.get('/auth/user/getAllUserList');
    return res.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
    throw error;
  }
}
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Cookies vs Headers:**
   - Backend accepts tokens via cookie (`XSRF-token`) OR Authorization header
   - If using cookies, ensure `withCredentials: true`
   - If using headers, manually add `Authorization` header

2. **Token Storage:**
   - Store token in `localStorage` for persistence
   - Clear token on logout
   - Clear token on 401 errors

3. **Error Handling:**
   - Always check `response.data.success`
   - Handle 401 errors globally (redirect to login)
   - Show user-friendly error messages

4. **Rate Limiting:**
   - Handle 429 errors gracefully
   - Show retry countdown if available
   - Disable buttons during rate limit

5. **Testing:**
   - Test with valid token
   - Test with invalid/expired token
   - Test without token
   - Test rate limiting

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check browser console for errors
2. Verify token is being sent (check Network tab)
3. Verify API URL is correct
4. Check backend logs for detailed errors

---

**Last Updated:** December 31, 2025
