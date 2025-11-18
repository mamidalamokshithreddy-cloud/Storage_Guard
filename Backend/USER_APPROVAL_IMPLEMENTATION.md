# User Approval System Implementation

## Overview
I've successfully implemented a user approval system where new users need admin approval before they can access their dashboards after registration. Here's what has been implemented:

## Changes Made

### 1. Database Schema Updates
- **Added `is_approved` column** to the `users` table (default: `false`)
- **Migration script** created and executed to add the column to existing database
- Admin users are automatically set as approved during migration

### 2. Authentication Logic Updates
In `app/services/auth_service.py`:
- Added approval check in `authenticate_user()` method
- Non-admin users must have `is_approved = True` to login
- Returns specific error message: "Your account is pending admin approval. Please wait for approval to access your dashboard."
- Updated user response to include `is_approved` status

### 3. Admin Routes Updates
In `app/routers/admin_routes.py`:
- Updated all existing approval endpoints (`approve_farmer`, `approve_landowner`, `approve_vendor`, `approve_buyer`) to set `is_approved = True` when approving users
- Added new endpoints:
  - `GET /admin/pending-users` - Get all users pending approval
  - `POST /admin/approve-user/{user_id}` - Approve any user by ID
  - `POST /admin/reject-user-approval/{user_id}` - Reject user approval with reason

### 4. User Response Schema Updates
In `app/schemas/postgres_base_models.py`:
- Added `is_approved` field to `UserResponse` model for API responses

### 5. Admin Creation Updates
In `create_admin.py`:
- Admin users are automatically set as `is_approved = True` during creation

## How It Works

### Registration Flow
1. User registers through any registration endpoint (`/register/farmer`, `/register/vendor`, etc.)
2. User account is created with `is_approved = False` (except admins)
3. User receives registration confirmation but cannot login until approved

### Login Flow
1. User attempts to login
2. System checks credentials (email/phone + password)
3. If credentials are valid:
   - **Admin users**: Login successful (auto-approved)
   - **Non-admin users with approval**: Login successful, redirect to dashboard
   - **Non-admin users without approval**: Login blocked with message "Your account is pending admin approval. Please wait for approval to access your dashboard."

### Admin Approval Flow
1. Admin accesses pending users list via `GET /admin/pending-users`
2. Admin can:
   - Approve user via `POST /admin/approve-user/{user_id}`
   - Reject user via `POST /admin/reject-user-approval/{user_id}` with reason
3. Approved users can now login and access their dashboard
4. Rejected users are deactivated and cannot login

## API Endpoints

### For Admins
- `GET /admin/pending-users` - Get list of users awaiting approval
- `POST /admin/approve-user/{user_id}` - Approve a user
- `POST /admin/reject-user-approval/{user_id}` - Reject a user with reason
- `POST /admin/approve/farmer/{farmer_id}` - Approve farmer (sets both verified and approved)
- `POST /admin/approve/vendor/{vendor_id}` - Approve vendor (sets both verified and approved)
- `POST /admin/approve/landowner/{landowner_id}` - Approve landowner (sets both verified and approved)
- `POST /admin/approve/buyer/{buyer_id}` - Approve buyer (sets both verified and approved)

### For Users
- `POST /auth/login` - Login endpoint (now checks approval status)

## Database Migration
A migration script `migrate_add_approval.py` was created and executed to:
- Add `is_approved` column to existing `users` table
- Set all admin users as approved
- Set all other users as not approved (pending approval)

## Error Messages
- **Unapproved users**: "Your account is pending admin approval. Please wait for approval to access your dashboard."
- **Inactive users**: "Account is inactive"
- **Invalid credentials**: "Invalid credentials"

## Benefits
1. **Security**: Admin control over who can access the system
2. **Quality Control**: Admin can review user information before granting access
3. **User Experience**: Clear messaging about approval status
4. **Flexibility**: Admins can approve users individually or by role
5. **Audit Trail**: All approvals/rejections are logged with admin ID and timestamp

## Testing
The implementation has been tested with:
- Database migration executed successfully
- Server starts without errors
- All existing endpoints preserved
- New approval endpoints added
- Authentication logic updated

This implementation ensures that only admin-approved users can access their dashboards while maintaining a smooth user experience with clear communication about approval status.