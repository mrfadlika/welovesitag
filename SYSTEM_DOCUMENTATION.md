# SITAG System - Complete Documentation

## Project Overview
**SITAG** adalah sistem manajemen truck retase (registrasi masuk/keluar) untuk operasi tambang dengan 3 role berbeda:
- **Staff POS**: Input truck masuk + verifikasi truck keluar
- **Checker**: Input checkout (pemetaan excavator ke truck)
- **Admin**: Monitoring semua aktivitas

---

## System Architecture

### Technology Stack
```
Frontend:
  - React 19.2.4 + Vite 8.0.8
  - React Router 7.14.0
  - Lucide React (icons)
  - CSS Modules per component
  - Context API (Authentication)

Backend:
  - Express 5.2.1
  - CORS 2.8.6 (cross-origin)
  - Body-parser 1.20.4
  - In-memory database (development)

Deployment:
  - Frontend: http://localhost:5173
  - Backend: http://localhost:3000
```

### Data Models

**Trucks:**
```javascript
{
  id: "TRK-001",
  truckNumber: "DD 1234 AB",
  truckType: "dyna" | "fuso",
  status: "entered" | "in_checkout" | "exited" | "verified",
  registeredBy: "username",
  registeredByRole: "staff_pos",
  registeredAt: "2026-04-13T10:30:00Z"
}
```

**Checkouts:**
```javascript
{
  id: "CHK-001",
  truckId: "TRK-001",
  truckNumber: "DD 1234 AB",
  pitOwner: "PT Maju Jaya",
  excaId: "EXC-001",
  excaOperator: "Budi Santoso",
  status: "ready_for_exit" | "verified" | "exited",
  createdBy: "checker",
  createdAt: "2026-04-13T10:30:00Z",
  verifiedBy: "staffpos",
  verifiedAt: "2026-04-13T10:45:00Z"
}
```

**Users:**
```javascript
{
  id: 1,
  username: "staffpos",
  password: "staff123",
  name: "Budi Santoso",
  role: "staff_pos",
  email: "budi@sitag.co.id",
  posName: "Pos Utama A"
}
```

---

## API Endpoints

### Authentication
```
POST /api/auth/login
  Request: { username, password }
  Response: { success, data: {id, username, name, role, email, ...} }
```

### Trucks
```
GET /api/trucks
  Query: ?status=entered|in_checkout|exited|verified
  Response: { success, data: [truck, ...], count }

POST /api/trucks
  Request: { truckNumber, truckType, createdBy }
  Response: { success, data: {id, truckNumber, status, ...} }

PATCH /api/trucks/:id/status
  Request: { status, updatedBy }
  Response: { success, data: truck }
```

### Checkouts
```
GET /api/checkouts
  Query: ?status=ready_for_exit|verified|exited&truckId=TRK-001
  Response: { success, data: [checkout, ...], count }

POST /api/checkouts
  Request: {
    truckNumber,      // Auto-resolves to truckId
    pitOwner,
    excaId,
    excaOperator,
    createdBy
  }
  Response: { success, data: {id, status: "ready_for_exit", ...} }

PATCH /api/checkouts/:id/verify
  Request: { verifiedBy, approved: true|false }
  Response: { success, data: checkout }
```

---

## User Workflows

### Workflow 1: Staff POS - Truck Registration
```
1. Login: staffpos / staff123
2. Navigate: /staff/dashboard → register truck button
3. Input: Truck number (DD 1234 AB), type (dyna/fuso)
4. Submit: POST /api/trucks
5. Result: Truck status = "entered", visible to Checker
```

### Workflow 2: Checker - Checkout Input
```
1. Login: checker / checker123
2. Navigate: /checker/dashboard → input checkout
3. Select: Truck from dropdown (auto-lookup)
4. Input: Pit owner, excavator ID, operator name
5. Submit: POST /api/checkouts (auto-resolves truckNumber → truckId)
6. Result: Checkout status = "ready_for_exit", visible to Staff POS
```

### Workflow 3: Staff POS - Exit Verification
```
1. Login: staffpos / staff123
2. Navigate: /staff/exit-verification
3. View: All checkouts with status "ready_for_exit"
4. Action: Click approve/reject
5. Submit: PATCH /api/checkouts/:id/verify?approved=true/false
6. Result: Truck status = "exited", checkout verified
```

### Workflow 4: Admin - System Monitoring
```
1. Login: admin / admin123
2. Navigate: /admin/dashboard
3. View: All metrics (registrations, checkouts, verified)
4. Access: All role-specific pages via mode parameter
   - Demo Staff Mode: /admin?mode=staff
   - Demo Checker Mode: /admin?mode=checker
```

---

## Frontend Components

### Directory Structure
```
src/
├── App.jsx                          # Main router
├── contexts/
│   └── AuthContext.jsx              # Authentication state
├── services/
│   └── api.js                       # API client (auth, trucks, checkouts)
├── components/
│   └── Layout/
│       ├── DashboardLayout.jsx      # Main layout with navigation
│       └── DashboardLayout.css
├── pages/
│   ├── Login/
│   │   ├── LoginPage.jsx
│   │   └── LoginPage.css
│   ├── Dashboard/
│   │   ├── DashboardPage.jsx        # Role-specific stats (API-driven)
│   │   └── DashboardPage.css
│   ├── InputRetase/
│   │   ├── InputRetasePage.jsx      # Truck reg (Staff) / Checkout (Checker)
│   │   └── InputRetasePage.css
│   ├── ExitVerification/
│   │   ├── ExitVerificationPage.jsx # Exit approval (Staff POS)
│   │   └── ExitVerificationPage.css
│   ├── Riwayat/ (future)
│   │   ├── RiwayatPage.jsx
│   │   └── RiwayatPage.css
```

### Key Components

**AuthContext.jsx** - Real authentication
- `login(username, password)` → POST /api/auth/login
- Stores user profile in localStorage
- Provides `user`, `login`, `logout`, `isLoading`, `error`

**api.js** - Unified API client
- `authAPI.login(username, password)`
- `truckAPI.create()`, `truckAPI.getAll()`, `truckAPI.updateStatus()`
- `checkoutAPI.create()`, `checkoutAPI.getAll()`, `checkoutAPI.verify()`
- Error handling: Wraps all responses in `{success, data, message}`

**DashboardPage.jsx** - Dynamic stats
- Fetches real data: `GET /api/trucks` + `GET /api/checkouts`
- Calculates: total trucks, verified checkouts, truck types ratio
- Updates on mount, shows loading state

**InputRetasePage.jsx** - Dual-purpose form
- **Staff POS mode**: Registers truck → `POST /api/trucks`
- **Checker mode**: Creates checkout → `POST /api/checkouts`
- Validates fields per role, displays role-specific labels
- Shows success toast with returned ID

**ExitVerificationPage.jsx** - Verification interface
- Fetches: `GET /api/checkouts?status=ready_for_exit`
- Actions: Approve `PATCH /verify?approved=true` / Reject `approved=false`
- Removes verified items from list, shows loading spinners
- Error handling for network/validation failures

---

## Testing Results

### End-to-End Workflow Test ✅
```
[PASS] Staff POS Login - Credentials verified, user data returned
[PASS] Truck Registration - Truck TRK-003 created with status "entered"
[PASS] Checker Login - Different user authenticated successfully
[PASS] Checkout Creation - Checkout CHK-002 created, auto-resolved truck
[PASS] Exit Verification - Truck verified, status updated to "verified"

5/5 Tests Passed
```

### API Response Format
All endpoints return consistent structure:
```javascript
{
  success: true/false,
  data: {...},           // Single object or array
  message: "...",        // User-friendly message
  count: 5               // For list endpoints only
}
```

### Error Handling
```
Success (200/201):
  {success: true, data: {...}}

Validation Error (400):
  {success: false, message: "Field validation failed"}

Not Found (404):
  {success: false, message: "Resource tidak ditemukan"}

Server Error (500):
  {success: false, message: "Internal server error"}
```

---

## Running the System

### Terminal 1: Backend
```bash
cd d:\SITAG\welovesitag\be
npm start
# Starts on http://localhost:3000
```

### Terminal 2: Frontend
```bash
cd d:\SITAG\welovesitag\fe
npm run dev
# Starts on http://localhost:5173
```

### Access Application
```
http://localhost:5173
```

### Test Users
```
Staff POS:    staffpos / staff123
Checker:      checker / checker123
Admin:        admin / admin123
```

---

## Current Features

### Implemented ✅
- ✅ Role-based authentication (3 roles)
- ✅ Staff POS: Truck registration workflow
- ✅ Checker: Checkout mapping workflow
- ✅ Staff POS: Exit verification workflow
- ✅ Admin: System monitoring & demo modes
- ✅ Real API integration (no dummy data)
- ✅ Error handling & validation
- ✅ Loading states & user feedback
- ✅ In-memory database (development)
- ✅ CORS support for cross-origin requests

### Future Enhancements
- [ ] JWT token authentication
- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] Photo upload for truck verification
- [ ] Real-time notifications (WebSocket)
- [ ] Audit trail & activity logging
- [ ] Export reports (PDF/CSV)
- [ ] Role-based API middleware
- [ ] Search & advanced filtering
- [ ] Multi-language support

---

## File Structure

### Backend (be/)
```
be/
├── index.js                    # Express server
├── package.json                # Dependencies
├── data/
│   └── db.js                   # In-memory database
└── routes/
    ├── auth.js                 # Authentication endpoints
    ├── trucks.js               # Truck management
    └── checkouts.js            # Checkout management
```

### Frontend (fe/)
```
fe/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── src/
│   ├── App.jsx                 # Main router
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── components/
│   ├── pages/
│   ├── data/
│   │   └── dummyData.js        # Constants only
│   └── assets/
└── public/
```

---

## Architecture Decisions

### Why In-Memory Database?
- ✅ Fast prototyping & development
- ✅ No external dependencies
- ✅ Perfect for MVP testing
- ⚠️ Data lost on server restart
- 🔄 Easy migration to PostgreSQL/MongoDB later

### Why API-First Design?
- ✅ Clean separation of concerns
- ✅ Easy to test individual components
- ✅ Future mobile app support
- ✅ Can replace frontend without touching backend

### Why Context API (not Redux)?
- ✅ Sufficient for authentication state
- ✅ No extra dependencies
- 🔄 Can upgrade to Redux later if needed

### Why CSS Modules?
- ✅ No style conflicts
- ✅ Component-scoped styling
- ✅ Maintainable & scalable

---

## Troubleshooting

### Backend not starting?
```bash
# Kill old processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete node_modules and reinstall
cd be
rm -r node_modules
npm install

# Start again
npm start
```

### Frontend shows blank page?
```bash
# Clear Vite cache
rm -r node_modules/.vite

# Restart dev server
npm run dev
```

### API requests timing out?
```
Check: Both servers running?
  Backend: http://localhost:3000 (check terminal)
  Frontend: http://localhost:5173 (check terminal)
  
Check: CORS enabled?
  Backend: index.js has app.use(cors())
  
Check: Network connectivity?
  Try: curl http://localhost:3000/api/trucks
```

### Login fails?
```
Verify credentials:
  staffpos / staff123
  checker / checker123
  admin / admin123
  
Check: DB has users?
  Look at: be/data/db.js (db.users array)
```

---

## Performance Notes

### Current Bottlenecks
- In-memory database: O(n) lookup for trucks by number
- No pagination on long lists
- No caching on API responses

### Optimization Opportunities
1. Add pagination: `GET /api/checkouts?page=1&limit=20`
2. Add database indexes: `truckNumber`, `status`
3. Cache frequently accessed data
4. Implement virtual scrolling for long lists
5. Use React.memo for component memoization

---

## Security Considerations

### Current (Development Only)
- ⚠️ Passwords in plaintext in database
- ⚠️ No JWT tokens
- ⚠️ No rate limiting
- ⚠️ No input sanitization

### Production Requirements
- [ ] Hash passwords with bcrypt
- [ ] Implement JWT authentication
- [ ] Add rate limiting middleware
- [ ] Validate & sanitize all inputs
- [ ] HTTPS only
- [ ] Environment variables for secrets
- [ ] SQL injection protection (when using DB)
- [ ] CSRF token validation

---

## Summary

The SITAG system is now **fully functional** with:
- ✅ Complete API backend (Express + in-memory DB)
- ✅ Role-based frontend (React + Vite)
- ✅ Real-time API integration (no dummy data)
- ✅ End-to-end workflow verified (5/5 tests passed)
- ✅ Error handling & validation
- ✅ User-friendly interfaces

**Ready for**: Testing, feedback, and production deployment planning.

**Next Steps**: Database implementation, JWT auth, production deployment.

---

*Last Updated: April 13, 2026*
*Status: COMPLETE & TESTED ✅*
