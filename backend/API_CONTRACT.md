# Student Attendance API Contract

Base URL: `http://localhost:5000`

## Authentication
- Scheme: Bearer JWT
- Header: `Authorization: Bearer <token>`
- Login/Register endpoints are public.

## Public Endpoints

### `POST /auth/register`
Register a new user.

Request body:
```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

Success response `201`:
```json
{
  "message": "Registered successfully",
  "user": {
    "userId": 1,
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-02-28T07:19:40.813Z",
    "updatedAt": "2026-02-28T07:19:40.813Z"
  },
  "token": "<jwt>"
}
```

Common errors:
- `400` invalid input
- `409` email already exists

### `POST /auth/login`
Login with email/password.

Request body:
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Success response `200`:
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "userId": 1,
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "admin",
    "status": "active"
  }
}
```

Common errors:
- `400` invalid payload
- `401` invalid credentials
- `403` inactive user

## Protected Endpoints

### Users
- `POST /users` -> `admin`
- `GET /users` -> `admin`, `teacher`
- `GET /users/:id` -> `admin`, `teacher`
- `PUT /users/:id` -> `admin`
- `DELETE /users/:id` -> `admin`

`GET /users` supports pagination:
- Query params: `page` (default `1`), `limit` (default `10`, max `100`)
- Example: `GET /users?page=1&limit=5`

Response shape:
```json
{
  "users": [],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "totalPages": 1
  }
}
```

### Classes
- `POST /classes` -> `admin`
- `GET /classes` -> authenticated
- `GET /classes/:id` -> authenticated
- `PUT /classes/:id` -> `admin`
- `DELETE /classes/:id` -> `admin`

### Students
- `POST /students` -> `admin`, `teacher`
- `GET /students` -> authenticated
- `GET /students/:id` -> authenticated
- `PUT /students/:id` -> `admin`, `teacher`
- `DELETE /students/:id` -> `admin`

### Subjects
- `POST /subjects` -> `admin`, `teacher`
- `GET /subjects` -> authenticated
- `GET /subjects/:id` -> authenticated
- `PUT /subjects/:id` -> `admin`, `teacher`
- `DELETE /subjects/:id` -> `admin`

### Attendance Sessions
- `POST /attendance-sessions` -> `admin`, `teacher`
- `GET /attendance-sessions` -> authenticated

### Attendance
- `POST /attendance` -> `admin`, `teacher`
- `GET /attendance` -> authenticated
- `GET /attendance/student/:studentId` -> authenticated

## Standard Error Responses
- `401`: missing/invalid/expired token
- `403`: role not authorized
- `404`: resource/route not found
- `500`: internal server error
