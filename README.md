# 🚗 Vehicle Maintenance System Documentation

---

## 🌐 Project Overview

A web application to manage vehicle maintenance. Users register, add vehicles, log odometer readings, and get maintenance reminders. Admins manage users, service requests, and vehicle records.

---

## 🔌 Backend API Reference

### 🔐 Auth

#### `POST /api/auth/register`
**Request:**
```json
{
  "Username": "Mohamed Elnahas",
  "email": "AhmedElnahas@gmail.com",
  "password": "Mohamed@2511",
  "PhoneNumber": "01016928780",
  "address": "Cairo"
}
```
**Response:** 200 OK

#### `GET /api/auth/login`
**Query:** email, password  
**Response:**
```json
{
  "token": "<JWT token>",
  "user": {
    "id": 1,
    "email": "AhmedElnahas@gmail.com",
    "username": "Mohamed Elnahas"
  }
}
```

#### `GET /api/auth/adminlogin`
Same as above.

---

### 🚘 Vehicle

#### `POST /api/vehicles`
**Header:** Bearer Token  
**Body:**
```json
{
  "model": "Toyota Corolla",
  "plate": "ABC-1234",
  "licenseDate": "2022-05-01",
  "year": 2022
}
```

#### `GET /api/vehicles`
Returns vehicles of logged-in user.

#### `GET /api/admin/vehicles`
Returns all registered vehicles.

#### `PUT /api/vehicles/status`
**Body:**
```json
{
  "vehicleId": 2,
  "status": "under_maintenance"
}
```

---

### 📏 Odometer Reading

#### `POST /api/odometer`
**Header:** Bearer Token  
**Body:**
```json
{
  "vehicleId": 2,
  "reading": 21000
}
```

#### `GET /api/reading/history`
Returns reading history of user.

---

### 🔧 Services

#### `POST /api/services`
```json
{
  "rangeStart": 10000,
  "rangeEnd": 20000,
  "services": [
    { "name": "Oil Change", "price": 1000 },
    { "name": "Filter Change", "price": 500 }
  ]
}
```

#### `GET /api/services`  
Returns all defined services.

#### `GET /api/services/:id`  
Returns single service.

#### `PUT /api/services/:id`  
Update range/services.

#### `DELETE /api/services/:id`

---

### 🧾 Maintenance Requests

#### `GET /api/maintenance/user`
User's request history.

#### `POST /api/maintenance`
```json
{
  "vehicleId": 2,
  "reading": 20000,
  "selectedServices": ["Oil Change", "Filter Change"]
}
```

#### `PUT /api/maintenance/:id/status`
```json
{
  "status": "completed"
}
```

---

## 💻 Frontend Setup (React + Vite + Tailwind + ShadCN + PNPM)

### 1. 🔨 Init Project

```bash
pnpm create vite frontend --template react
cd frontend
pnpm install -D tailwindcss postcss autoprefixer
pnpm install axios react-router-dom clsx
pnpm install @shadcn/ui lucide-react
pnpm install zustand react-hook-form
```

```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```js
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

---

### 2. 📁 Folder Structure

```
/src
  /api
  /components
  /contexts
  /features
    /auth
    /vehicles
    /reading
    /maintenance
    /admin
  /hooks
  /layouts
  /pages
    /user
    /admin
  /routes
  /lib
  /styles
  /constants
```

---

### 3. ⚙️ Axios Setup

```js
// src/api/instance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "https://localhost:7091/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
```

---

### 4. 🔐 AuthContext

- Manages `user`, `login`, `logout`, `token`, and `isAuthenticated`.
- Store JWT in localStorage.
- Wrap app with `<AuthProvider>`.

---

### 5. 🧠 Pages Logic Summary

#### Home
- Submit reading
- Prompt if divisible by 10000
- If yes → show services → confirm → create request

#### Vehicles
- Add & view user's vehicles

#### Reading History
- Show all past readings

#### Services (Admin)
- Add/edit service ranges

#### Requests (Admin)
- Change status of requests

---

## 🤖 Cursor AI Instructions

1. **Create folders and file structure** based on above.
2. **Use Tailwind + ShadCN UI** for every component.
3. **For every page**, create a layout (`/layouts/MainLayout`) and use routing (`react-router-dom`).
4. **Fetch data from `/src/api/` functions** using Axios instance.
5. **Use Zustand** to store minimal global state like `user`, `toast`, `notification`.
6. **Implement `useEffect` logic** in home page to warn if no reading in 7 days.
7. **All forms must use `react-hook-form`** for validation.
8. **Protect routes** using simple token-based middleware inside `routes/PrivateRoute.jsx`.

---

## ✅ Developer Checklist

| Task | Status |
|------|--------|
| Set up project with Vite, Tailwind, ShadCN | ⬜ |
| Build AuthContext and Axios interceptor | ⬜ |
| Create routing and layouts | ⬜ |
| Create login/register pages | ⬜ |
| Build vehicle add/view page | ⬜ |
| Add odometer logging with reminder prompt | ⬜ |
| Implement reading history table | ⬜ |
| Show reminder if reading > 7 days old | ⬜ |
| Admin dashboard: view all vehicles | ⬜ |
| Admin: Add/edit/delete services | ⬜ |
| Admin: Manage requests (approve/cancel) | ⬜ |
| Final polish and deployment | ⬜ |

---

## 🌟 Final Note

This system is designed to be scalable, clean, and user/admin role-specific. With modular React design and centralized backend, it supports fast iteration and future extensions."# carmen" 
