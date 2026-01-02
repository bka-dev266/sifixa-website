# SIFIXA Testing Checklist

## 📋 Pre-Testing Setup

Run these SQL files in Supabase SQL Editor in order:
1. `database/sifixa_setup.sql` (if not already done)
2. `database/seed.sql` (if not already done)
3. `database/views.sql` ← **NEW**
4. `database/rpc_functions.sql` ← **NEW**
5. `database/rls_policies_update.sql` ← **NEW**

---

## 🏠 Homepage Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Page Load | Go to `http://localhost:5173/` | Hero, Services, Testimonials, FAQ load | ❌ |
| Hero Content | Check hero section | Shows title, subtitle from database | ⬜ |
| Services Section | Scroll to services | Shows 3+ service cards | ❌ |
| Testimonials | Scroll to testimonials | Shows customer reviews | ⬜ |
| FAQ | Scroll to FAQ | Accordion items work | ⬜ |
| Navigation | Click nav links | Routes work correctly | ⬜ |
| Book Repair CTA | Click "Book Repair" | Goes to /booking | ⬜ |

---

## 📅 Booking Flow Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Booking Page | Go to `/booking` | Form loads with steps | ⬜ |
| Device Info Step | Fill device type, model, issue | Next button enables | ⬜ |
| Time Slot Step | Select date and time slot | Shows available slots | ⬜ |
| Contact Step | Fill name, email, phone | Fields validate | ⬜ |
| Submit Booking | Click Confirm | Shows tracking number (SFX-YYYYMMDD-XXX) | ⬜ |
| Database Check | Check Supabase | New appointment, customer, device created | ⬜ |

---

## 🔍 Track Repair Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Track Page | Go to `/track` | Search form displays | ⬜ |
| Invalid Tracking | Enter "INVALID123" | Shows "not found" message | ⬜ |
| Valid Tracking | Enter real tracking number | Shows booking details | ⬜ |
| Status Timeline | Check timeline | Shows status history | ⬜ |

---

## 🔐 Auth Tests - Customer

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Customer Login | Go to `/login` | Login form displays | ⬜ |
| Invalid Login | Wrong credentials | Error message shows | ⬜ |
| Go to Signup | Click signup link | Signup form shows | ⬜ |
| Create Account | Fill email, password | Account created (check Supabase Auth) | ⬜ |
| Login as Customer | Use new credentials | Redirects to `/customer/profile` | ⬜ |
| View Profile | Check profile page | Shows customer info | ⬜ |
| Logout | Click logout | Returns to home | ⬜ |

---

## 🔐 Auth Tests - Staff

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Staff Login | Go to `/staff/login` | Login form displays | ⬜ |
| Login as Admin | Use admin@sifixa.com | Redirects to `/admin` | ⬜ |
| Login as Manager | Use manager credentials | Redirects to `/employee` | ⬜ |
| Login as Technician | Use technician credentials | Redirects to `/employee` | ⬜ |
| Admin Dashboard | Check `/admin` | Shows dashboard stats | ⬜ |
| Logout | Click logout | Returns to home | ⬜ |

---

## 🖥️ Admin Dashboard Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Dashboard Load | Login as admin, go to `/admin` | Dashboard loads | ⬜ |
| Stats Cards | Check top cards | Shows today's stats | ⬜ |
| Bookings Tab | Click Bookings | Lists appointments | ⬜ |
| Customers Tab | Click Customers | Lists customers | ⬜ |
| Inventory Tab | Click Inventory | Lists items with stock | ⬜ |
| CMS Tab | Click CMS/Landing | Shows content editor | ⬜ |
| Edit Hero | Modify hero content | Changes save to DB | ⬜ |

---

## 📦 Inventory Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| View Inventory | Go to inventory tab | Shows items from `inventory_view` | ⬜ |
| Search Items | Type in search | Filters results | ⬜ |
| Adjust Stock | Click adjust on an item | Stock updates | ⬜ |
| Stock History | Check stock_movements | Movement logged | ⬜ |

---

## 💬 Contact Form Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Contact | Go to `/contact` | Form displays | ⬜ |
| Submit Message | Fill and submit | Success message | ⬜ |
| Check Database | Check conversations/messages | New records created | ⬜ |

---

## 📱 Sell Device Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Load Sell Page | Go to `/sell` | Form displays | ⬜ |
| Fill Details | Enter device info | Fields accept input | ⬜ |
| Get Estimate | Complete form | Shows estimated value | ⬜ |
| Submit | Confirm submission | Device record created | ⬜ |

---

## 📄 Legal Pages Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Privacy Policy | Go to `/privacy` | Content loads | ⬜ |
| Terms of Use | Go to `/terms` | Content loads | ⬜ |
| Warranty | Go to `/warranty` | Content loads | ⬜ |
| Footer Links | Click footer legal links | Navigate correctly | ⬜ |

---

## 🌙 Theme Tests

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Default Theme | Load site | Check initial theme | ⬜ |
| Toggle Theme | Click theme toggle | Theme switches | ⬜ |
| Persistence | Refresh page | Theme persists | ⬜ |

---

## ✅ Completion Checklist

- [/] All homepage tests pass
- [ ] Booking flow works end-to-end
- [ ] Tracking system finds bookings
- [ ] Customer auth works
- [ ] Staff auth works with role routing
- [ ] Admin dashboard functional
- [ ] CMS edits save to database
- [ ] Contact form creates messages
- [ ] Legal pages load content
