# User API Documentation

## Base URL

```
api.dev.manrisk.simulasibimtek.
```

## Authentication

- **Access Token**: JWT (Bearer Token) dikirim melalui header `Authorization`
- **Refresh Token**: Disimpan sebagai **HTTP Only Cookie** atau dikirim melalui body

---

## 1. Registrasi User

### Endpoint

```
POST /users
```

### Request Body

```json
{
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Validasi

- `username`: min 3, alfanumerik + underscore
- `password`: min 8, huruf besar, kecil, angka, simbol

### Response (201)

```json
{
  "message": "Registrasi user berhasil",
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "isActive": true,
    "isVerified": false
  }
}
```

---

## 2. Login User

### Endpoint

```
POST /user/login
```

### Request Body

```json
{
  "identifier": "johndoe | john@example.com",
  "password": "Password@123"
}
```

### Response (200)

```json
{
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "roles": ["USER"]
    },
    "accessToken": "jwt-token"
  }
}
```

### Cookie

- `refreshToken` (HttpOnly, Secure, SameSite=Strict)

---

## 3. Refresh Access Token

### Endpoint

```
POST /user/refresh-token
```

### Request Body (Optional jika cookie tersedia)

```json
{
  "refreshToken": "refresh-token"
}
```

### Response

```json
{
  "message": "Access token berhasil diperbarui",
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

---

## 4. Logout

### Endpoint

```
POST /user/logout
```

### Header

```
Authorization: Bearer <accessToken>
```

### Response

```json
{
  "message": "Logout berhasil"
}
```

---

## 5. Update Password

### Endpoint

```
PUT /user/password
```

### Header

```
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

### Response

```json
{
  "message": "Password berhasil diubah. Semua sesi telah diakhiri. Silakan login kembali."
}
```

---

## 6. Search User (Admin)

### Endpoint

```
GET /users/search
```

### Query Params

| Parameter  | Tipe    | Keterangan        |
| ---------- | ------- | ----------------- |
| name       | string  | Filter nama       |
| username   | string  | Filter username   |
| role       | string  | Role user         |
| isActive   | boolean | Status aktif      |
| isVerified | boolean | Status verifikasi |
| page       | number  | Default 1         |
| limit      | number  | Default 10        |

### Response

```json
{
  "message": "User berhasil ditemukan",
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "roles": ["USER"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

## Error Response Format

```json
{
  "message": "Deskripsi error"
}
```

## Status Code

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error
