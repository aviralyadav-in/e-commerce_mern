# 📘 Authentication API Documentation — Complete Reference

> ✅ Latest changes included: Update Profile ab **sirf `PATCH`** support karta hai, cookie ka `Secure` flag **`.env` se configurable** hai (`COOKIE_SECURE`), aur avatar upload ke errors ab **clean 400 responses** dete hain.

---

## 🌐 Base URL

```
http://localhost:5000
```

- Production mein ye deployed backend ka URL hoga (HTTPS)
- Neeche har API ka **complete URL** diya hai — Base URL + path jodkar hi banta hai
- Example: Base URL `http://localhost:5000` + path `/api/auth/login` → `http://localhost:5000/api/auth/login`

---

## 📑 API Index (Quick Reference)

| # | API | Method | Path | Auth |
|---|---|---|---|---|
| 1 | Signup | `POST` | `/api/auth/signup` | ❌ Public |
| 2 | Login | `POST` | `/api/auth/login` | ❌ Public |
| 3 | Get Profile | `GET` | `/api/auth/profile` | 🔒 Cookie |
| 4 | Update Profile | `PATCH` | `/api/auth/profile` | 🔒 Cookie |
| 5 | Update Avatar | `PUT` | `/api/auth/profile/avatar` | 🔒 Cookie |
| 6 | Remove Avatar | `DELETE` | `/api/auth/profile/avatar` | 🔒 Cookie |
| 7 | Logout | `POST` | `/api/auth/logout` | 🔒 Cookie |

> ⚠️ **Update Profile ke liye sirf `PATCH` hai** — `PUT /api/auth/profile` ab supported NAHI hai (404/405 milega).

---

## 🔐 Global Auth Info (saari protected APIs ke liye)

### Auth Mechanism

- Auth **cookie-based JWT** hai — `Authorization: Bearer <token>` header ka use **NAHI** hota
- Login/Signup success par server `Set-Cookie` header se token bhejta hai, browser use save kar leta hai
- Aage ki har request me browser cookie **automatically attach** kar deta hai — frontend ko token handle karne ki zarurat nahi

### Cookie Details

| Property | Value | Details |
|---|---|---|
| **Cookie Name** | `token` | Admin panel ke liye alag cookie: `adminToken` (dono ek saath co-exist kar sakte hain) |
| **Value** | JWT — payload: `{ userId }` | Server har request par verify karta hai |
| **HttpOnly** | `true` | JavaScript se access NAHI hoti — `document.cookie` me nahi dikhegi (XSS protection) |
| **Secure** | `COOKIE_SECURE` env var se | Dev: `false` (HTTP chalega) • Production: `true` (HTTPS ke liye ZAROORI) |
| **SameSite** | `lax` | Cross-site requests me cookie nahi jayegi (CSRF protection) |
| **Path** | `/` | Domain ke saare routes par valid |
| **Max-Age** | 7 days | JWT token bhi 7 din me expire hota hai |

### Frontend ke liye ZAROORI Steps

1. **Axios global setup** (ek baar karo, sab jagah apply):
```js
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // 👈 iske bina cookie save/attach NAHI hogi
});
```
2. **Fetch API use karo to:** har request me `credentials: "include"` bhejo
3. Token ko **store na karo, manually attach na karo** — cookie browser khud handle karta hai
4. Logout par cookie **server clear karta hai** — frontend sirf apna local user state clear kare

### CORS Notes

- Backend dev me sirf `localhost` / `127.0.0.1` origins allow karta hai
- OPTIONS preflight requests handled hain
- `credentials: true` enabled hai, isliye `withCredentials: true` mandatory hai

### Status Code Conventions

| Code | Kab Aata Hai |
|---|---|
| `200 OK` | Read / Update / Delete success |
| `201 Created` | Naya record create hua (sirf Signup) |
| `400 Bad Request` | Validation fail, duplicate email, empty update, file errors |
| `401 Unauthorized` | Login nahi hai / galat credentials / token expire |
| `500` | Server-side error (frontend generic message dikhaye) |

### Validation Error Shape (400 responses)

Jab koi field validation fail ho, response me `errors` object aata hai — **sirf fail hui fields** hoti hain, har field ke messages ki array ke saath. Form ke neeche directly dikhane ke liye ready-made hai:

```json
{
  "message": "Please fix the validation errors",
  "errors": {
    "email": ["Please enter a valid email"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Standard User Object (har response me yehi shape)

| Field | Type | Notes |
|---|---|---|
| `_id` | String | MongoDB ObjectId |
| `name` | String | 2–50 chars |
| `email` | String | Lowercase me stored |
| `phone` | String | `""` ya 10-digit Indian number |
| `avatar` | String | `""` ya `/uploads/avatars/<filename>` |
| `gender` | String | `"male"` / `"female"` |
| `dateOfBirth` | String \| null | ISO date ya `null` |
| `createdAt` / `updatedAt` | String | ISO timestamps |
| ~~password~~ | — | **Kabhi response me nahi aata** |

### Avatar URL Kaise Dikhayein

`avatar` field me **relative path** aata hai. Image render karne ke liye Base URL jodna hoga:

```
http://localhost:5000 + /uploads/avatars/1725270000000-123456789.png
```

---

## 1️⃣ Signup — Register New User

### Request

| | |
|---|---|
| **Method** | `POST` |
| **Complete URL** | `http://localhost:5000/api/auth/signup` |
| **Auth** | ❌ Public (login zaroori nahi) |
| **Content-Type** | `application/json` |

### Payload (Request Body)

| Field | Type | Required | Rules / Constraints |
|---|---|---|---|
| `name` | String | ✅ Yes | Min 2, Max 50 characters |
| `email` | String | ✅ Yes | Valid email format, unique hona chahiye (case-insensitive) |
| `password` | String | ✅ Yes | Min 8 characters |
| `phone` | String | ❌ No | 10-digit Indian number, **first digit 6–9** (e.g. `9876543210`), ya empty `""` |
| `avatar` | String | ❌ No | Avatar path/URL string (photo normally baad me dedicated API se set hoti hai) |
| `gender` | String | ❌ No | Sirf `"male"` ya `"female"` (default: `"male"`) |
| `dateOfBirth` | String \| null | ❌ No | Valid date string (`"2000-05-15"`), empty ho to `""` ya `null` |

### Example Payload

```json
{
  "name": "Raghav Bajpai",
  "email": "raghav@example.com",
  "password": "Pass@1234",
  "phone": "9876543210",
  "gender": "male",
  "dateOfBirth": "2000-05-15"
}
```

### ✅ Success Response — `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Raghav Bajpai",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "",
    "gender": "male",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T10:30:00.000Z"
  }
}
```

> 🍪 **Set-Cookie:** Success par `token` cookie set hoti hai (7 days, HttpOnly). Isi request ke saath user logged-in ho jata hai.

### ❌ Error Responses

**`400` — Validation failed** (sirf fail hui fields aati hain):
```json
{
  "message": "Please fix the validation errors",
  "errors": {
    "name": ["Name must be at least 2 characters"],
    "email": ["Please enter a valid email"],
    "password": ["Password must be at least 8 characters"],
    "phone": ["Please enter a valid Indian phone number"]
  }
}
```

**`400` — Email already registered:**
```json
{ "message": "Email already registered" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Examples

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Raghav Bajpai","email":"raghav@example.com","password":"Pass@1234","phone":"9876543210","gender":"male","dateOfBirth":"2000-05-15"}'
```

**Axios (frontend):**
```js
const res = await API.post("/auth/signup", {
  name: "Raghav Bajpai",
  email: "raghav@example.com",
  password: "Pass@1234",
  phone: "9876543210",
  gender: "male",
  dateOfBirth: "2000-05-15",
});
// API instance me withCredentials: true already set hai
```

---

## 2️⃣ Login — Authenticate User

### Request

| | |
|---|---|
| **Method** | `POST` |
| **Complete URL** | `http://localhost:5000/api/auth/login` |
| **Auth** | ❌ Public |
| **Content-Type** | `application/json` |

### Payload (Request Body)

| Field | Type | Required | Rules / Constraints |
|---|---|---|---|
| `email` | String | ✅ Yes | Valid email. **Case-insensitive** — `RAGHAV@EXAMPLE.COM` bhi chalega |
| `password` | String | ✅ Yes | Min 1 char (empty nahi). **Note:** yahan signup wala min-8 check NAHI lagta |

> ⚠️ Sirf yehi 2 fields bhejo — extra fields (name, phone waghera) ignore ho jayengi, error nahi aayega.

### Example Payload

```json
{
  "email": "raghav@example.com",
  "password": "Pass@1234"
}
```

### ✅ Success Response — `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Raghav Bajpai",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "/uploads/avatars/1725270000000-123456789.png",
    "gender": "male",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T11:15:00.000Z"
  }
}
```

> 🍪 **Set-Cookie:** `token` cookie set hoti hai (7 days, HttpOnly). Error (`401`) hone par cookie set NAHI hoti.

### ❌ Error Responses

**`400` — Validation failed:**
```json
{
  "message": "Please fix the validation errors",
  "errors": { "email": ["Email is required"], "password": ["Password is required"] }
}
```

**`401` — Galat email YA password** (dono cases me same generic message — security ke liye):
```json
{ "message": "Invalid email or password" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Examples

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"raghav@example.com","password":"Pass@1234"}'
```

**Axios (frontend):**
```js
const res = await API.post("/auth/login", {
  email: "raghav@example.com",
  password: "Pass@1234",
});
```

---

## 3️⃣ Get Profile — Current User Details

### Request

| | |
|---|---|
| **Method** | `GET` |
| **Complete URL** | `http://localhost:5000/api/auth/profile` |
| **Auth** | 🔒 Required (auth cookie) |
| **Content-Type** | — (koi body nahi) |

### Payload

❌ **None** — koi body/query nahi. Sirf cookie chahiye.

### ✅ Success Response — `200 OK`

```json
{
  "message": "Profile fetched successfully",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Raghav Bajpai",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "/uploads/avatars/1725270000000-123456789.png",
    "gender": "male",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T11:15:00.000Z"
  }
}
```

> 💡 Frontend app open hote waqt ye API call karke check karo ki session valid hai ya nahi.

### ❌ Error Responses

**`401` — Login nahi hai / cookie nahi gayi / token expire:**
```json
{ "message": "Unauthorized, please login first" }
```
```json
{ "message": "Unauthorized, invalid or expired token" }
```
```json
{ "message": "User not found" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Example

**Axios (frontend):**
```js
const res = await API.get("/auth/profile");
// 401 aaye to user ko login page par bhejo
```

---

## 4️⃣ Update Profile — Partial Update

### Request

| | |
|---|---|
| **Method** | `PATCH` ⚠️ (sirf PATCH — `PUT` support removed) |
| **Complete URL** | `http://localhost:5000/api/auth/profile` |
| **Auth** | 🔒 Required (auth cookie) |
| **Content-Type** | `application/json` |

> 🛠️ **Why PATCH:** Ye **partial update** hai — sirf bheji hui fields update hoti hain, baaki fields untouched rehti hain. REST standard ke mutabiq partial update ke liye `PATCH` hi correct verb hai (`PUT` ka matlab hota hai poora resource replace karna). Isliye `PUT /api/auth/profile` route hata diya gaya hai — usse request bhejne par `404/405` milega.

### Payload (Request Body)

**Partial update** hai — **sirf wahi fields bhejo jo change karni hain**, baaki omit kar do. Saare fields optional hain:

| Field | Type | Required | Rules / Constraints |
|---|---|---|---|
| `name` | String | ❌ No | Min 2, Max 50 characters |
| `email` | String | ❌ No | Valid email, dusre user ke pass registered nahi hona chahiye |
| `phone` | String | ❌ No | 10-digit Indian number (first digit 6–9), ya clear karne ke liye `""` |
| `gender` | String | ❌ No | Sirf `"male"` ya `"female"` |
| `dateOfBirth` | String \| null | ❌ No | Valid date string; `""` ya `null` bhejne se DOB **clear** ho jati hai |

> ⚠️ **Important:** `avatar` is API se update **NAHI** hota — photo ke liye dedicated Update Avatar API (#5) use karo. `avatar` field bhejne par wo silently ignore ho jayegi.
>
> ⚠️ **Empty body (`{}`)** bhejne par error milega: `"Nothing to update"`.

### Example Payload

```json
{
  "name": "Naya Naam",
  "phone": "9876543210",
  "gender": "female"
}
```

### ✅ Success Response — `200 OK`

```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Naya Naam",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "/uploads/avatars/1725270000000-123456789.png",
    "gender": "female",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T12:00:00.000Z"
  }
}
```

### ❌ Error Responses

**`400` — Email dusre user ke pass registered hai:**
```json
{ "message": "Email already registered to another user" }
```

**`400` — Validation failed:**
```json
{
  "message": "Please fix the validation errors",
  "errors": { "phone": ["Please enter a valid Indian phone number"] }
}
```

**`400` — Kuch bhi update karne layak nahi bheja:**
```json
{ "message": "Nothing to update" }
```

**`401` — Login nahi hai:**
```json
{ "message": "Unauthorized, please login first" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Examples

**cURL:**
```bash
curl -X PATCH http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Naya Naam","gender":"female"}'
```

**Axios (frontend):**
```js
const res = await API.patch("/auth/profile", {
  name: "Naya Naam",
  gender: "female",
});
```

---

## 5️⃣ Update Avatar — Profile Photo Upload/Replace

### Request

| | |
|---|---|
| **Method** | `PUT` |
| **Complete URL** | `http://localhost:5000/api/auth/profile/avatar` |
| **Auth** | 🔒 Required (auth cookie) |
| **Content-Type** | `multipart/form-data` (Postman/axios khud set karta hai — **manually set mat karo**) |

### Payload (Body → **form-data**, JSON NAHI!)

| Key | Type | Required | Rules / Constraints |
|---|---|---|---|
| `avatar` | **File** | ✅ Yes | Sirf **JPG / PNG / WEBP**, max size **5MB**. Key ka naam **exactly `avatar`** hona chahiye |

**Postman steps:** Body tab → **form-data** → Key me `avatar` likho → type **File** select karo → image choose karo → Send.

### Behavior

- Nayi file `uploads/avatars/` folder me save hoti hai (unique naam ke saath)
- **Purani photo disk se delete** ho jati hai (replace hoti hai, orphan file nahi bachi)
- DB me avatar ka naya path set hota hai

### ✅ Success Response — `200 OK`

```json
{
  "message": "Profile photo updated successfully",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Raghav Bajpai",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "/uploads/avatars/1725270000000-123456789.png",
    "gender": "male",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T12:30:00.000Z"
  }
}
```

> 💡 Image render: `Base URL` + `avatar` path.

### ❌ Error Responses (sab clean `400` ab)

**File nahi bheji / field ka naam galat:**
```json
{ "message": "Avatar image is required (form field: 'avatar')" }
```

**File 5MB se badi:**
```json
{ "message": "Avatar image must be 5MB or smaller" }
```

**Galat file type (PDF, MP4, GIF, etc.):**
```json
{ "message": "Only JPG, PNG and WEBP images are allowed" }
```

**`401` — Login nahi hai:**
```json
{ "message": "Unauthorized, please login first" }
```

### 🧪 Example

**Axios (frontend):**
```js
const formData = new FormData();
formData.append("avatar", fileInput.files[0]); // key name "avatar" hi hona chahiye

const res = await API.put("/auth/profile/avatar", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

## 6️⃣ Remove Avatar — Profile Photo Delete

### Request

| | |
|---|---|
| **Method** | `DELETE` |
| **Complete URL** | `http://localhost:5000/api/auth/profile/avatar` |
| **Auth** | 🔒 Required (auth cookie) |
| **Content-Type** | — (koi body nahi) |

### Payload

❌ **None** — sirf cookie chahiye.

### Behavior

- Photo ka file `uploads/avatars/` se **permanently delete** hota hai
- DB me `avatar` field `""` ho jati hai

### ✅ Success Response — `200 OK`

```json
{
  "message": "Profile photo removed successfully",
  "user": {
    "_id": "68b7f1c2a9d4e3f5b6c7d8e9",
    "name": "Raghav Bajpai",
    "email": "raghav@example.com",
    "phone": "9876543210",
    "avatar": "",
    "gender": "male",
    "dateOfBirth": "2000-05-15T00:00:00.000Z",
    "createdAt": "2026-09-02T10:30:00.000Z",
    "updatedAt": "2026-09-02T12:45:00.000Z"
  }
}
```

> 💡 **Idempotent hai** — photo pehle se nahi hai to bhi `200` milega, message ke saath: `"No profile photo to remove"` (error nahi aayega).

### ❌ Error Responses

**`401` — Login nahi hai:**
```json
{ "message": "Unauthorized, please login first" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Example

**Axios (frontend):**
```js
const res = await API.delete("/auth/profile/avatar");
```

---

## 7️⃣ Logout

### Request

| | |
|---|---|
| **Method** | `POST` |
| **Complete URL** | `http://localhost:5000/api/auth/logout` |
| **Auth** | 🔒 Required (auth cookie) |
| **Content-Type** | — (koi body nahi) |

### Payload

❌ **None**

### Behavior

- Server `token` cookie **clear** kar deta hai — session khatam
- Frontend ka kaam: response ke baad local user state/Redux clear karna

### ✅ Success Response — `200 OK`

```json
{
  "message": "Raghav Bajpai Logged out successfully"
}
```

### ❌ Error Responses

**`401` — Login nahi hai:**
```json
{ "message": "Unauthorized, please login first" }
```

**`500` — Server error:**
```json
{ "message": "Internal server error" }
```

### 🧪 Example

**Axios (frontend):**
```js
await API.post("/auth/logout");
// iske baad local user state clear karo aur login page par redirect karo
```

---

## 🧪 Recommended Postman Testing Flow (order ke saath)

| Step | Request | Kya Verify Karna Hai |
|---|---|---|
| 1 | `POST /api/auth/signup` | `201` + user object + cookie save hui |
| 2 | `POST /api/auth/login` | `200` + user object + cookie save hui |
| 3 | `GET /api/auth/profile` | `200` — session valid hai |
| 4 | `PATCH /api/auth/profile` | `200` — sirf bheji fields badli, baaki same |
| 5 | `PATCH /api/auth/profile` (empty `{}`) | `400` — "Nothing to update" |
| 6 | `PUT /api/auth/profile/avatar` (form-data + file) | `200` — `uploads/avatars/` me nayi file, purani delete |
| 7 | `PUT /api/auth/profile/avatar` (6MB file) | `400` — "must be 5MB or smaller" |
| 8 | `DELETE /api/auth/profile/avatar` | `200` — file delete, avatar `""` |
| 9 | `DELETE /api/auth/profile/avatar` (dobara) | `200` — "No profile photo to remove" |
| 10 | `POST /api/auth/logout` | `200` — cookie clear |
| 11 | `GET /api/auth/profile` (logout ke baad) | `401` — session khatam confirm |

### ⚠️ Postman Cookie Notes

- Postman desktop cookies **automatically save** karta hai (login/signup ke baad) — jab tak requests `localhost:5000` par hi jayein
- Agar cookie manually bhejni ho: login ke response ke `Set-Cookie` header se token copy karo → Headers me add karo:
  ```
  Cookie: token=<yahan JWT paste karo>
  ```
- `PATCH /profile` ke liye Postman me method **PATCH** hi select karo — `PUT` ab `404/405` dega
