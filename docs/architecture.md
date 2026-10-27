# SmartEvent — System Architecture & API Documentation

**Author:** Elvis Wanyama Wafuke (154210)  
**Institution:** Strathmore University — School of Computing and Engineering Sciences  

---

## 1. System Overview

SmartEvent is an enterprise university event management platform combining real-time machine learning turnout prediction and high-priority SMS notifications for Strathmore University.

```text
                               ┌───────────────────────────┐
                               │   Node.js / Express API   │
                               │  Backend Gateway (Port 5000)│
                               └─────────────┬─────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             │                               │                               │
    ┌────────▼────────┐             ┌────────▼────────┐             ┌────────▼────────┐
    │  React 18 Web   │             │   React Native  │             │ Python FastAPI  │
    │ Frontend (Vite) │             │    Expo Mobile  │             │   ML Service    │
    │   (Port 5173)   │             │   (Port 8081)   │             │   (Port 8000)   │
    └─────────────────┘             └─────────────────┘             └─────────────────┘
```

---

## 2. Component Isolation & Roles

### Web Frontend (`frontend/`)
- **Public Homepage (`/`)**: Accessible without login. Allows visitors to search, filter by category/venue/date, and inspect upcoming campus events.
- **Student Dashboard (`/student/dashboard`)**: Dedicated student interface for 1-tap RSVPs, RSVP schedule manager, favorite event bookmarks, and notification alerts.
- **Organizer Dashboard (`/organizer/dashboard`)**: Dedicated organizer interface for creating, editing, and canceling events, inspecting real-time attendee rosters, ML turnout forecasts, and sending priority SMS.
- **Admin Control Center (`/admin/dashboard`)**: Dedicated system administration dashboard for user management, event moderation, category CRUD, and system log inspection.

### Mobile App (`mobile/`)
- Completely independent React Native / Expo application designed specifically for student iOS & Android devices.

### ML Prediction Service (`ml-service/`)
- Python FastAPI microservice utilizing a trained Scikit-Learn Random Forest Classifier to forecast student turnout headcount based on venue capacity, time slot, category, and past attendance rates.

---

## 3. Security & Role-Based Access Control (RBAC)

All protected REST API endpoints verify Bearer tokens and enforce role restrictions via backend middleware (`backend/middleware/auth.js`):

| Role | Permitted Actions | Dashboard Route |
| :--- | :--- | :--- |
| **Public Visitor** | Browse events, search, filter categories, view event details | `/` |
| **Student** | RSVP for events, cancel own RSVP, view/manage schedule, favorite events, manage profile | `/student/dashboard` |
| **Organizer** | Create events, edit own events, delete own events, view attendee rosters, run ML forecasts, send SMS | `/organizer/dashboard` |
| **Admin** | Full system-wide CRUD across users, events, categories, registrations, view metrics & logs | `/admin/dashboard` |

---

## 4. REST API Endpoint Registry

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/users`
- **User Management**: `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- **Events API**: `GET /api/events`, `GET /api/events/:id`, `GET /api/events/:id/attendees`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`
- **Categories API**: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- **Registrations API**: `GET /api/registrations`, `POST /api/registrations`, `DELETE /api/registrations/:id`
- **Favorites API**: `GET /api/favorites`, `POST /api/favorites/:eventId`
- **Notifications API**: `GET /api/notifications`, `PUT /api/notifications/read-all`
- **Admin Overview API**: `GET /api/admin/overview`
- **Priority SMS API**: `GET /api/sms/logs`, `POST /api/sms/send`
- **ML Turnout API**: `POST /api/predict`
