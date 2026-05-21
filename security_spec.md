# Security Specification - JDM Retro Rides

## Data Invariants
1. A vehicle listing must have a valid `name`, `year`, `chassis`, `img`, `priceJPY`, and `status`.
2. `chassis` codes are immutable once a listing is created.
3. `updatedAt` must always match the server's time on write.
4. User roles can only be updated by verified Admins.
5. Public users can only read `vehicles` and `settings`.

## The "Dirty Dozen" Payloads

### Vehicle Collection (Match: `/vehicles/{vehicleId}`)

1. **Identity Spoofing (Non-Admin Write)**
   - Payload: `{ "name": "Fake Supra", ... }`
   - Actor: Authenticated User (Non-Admin)
   - Expected: `PERMISSION_DENIED`

2. **Resource Poisoning (Long Document ID)**
   - Path: `/vehicles/very-long-id-intended-to-exhaust-resources-1234567890...`
   - Actor: Admin
   - Expected: `PERMISSION_DENIED` (via `isValidId`)

3. **Schema Violation (Missing Required Field)**
   - Payload: `{ "name": "Nissan Skyline" }` (Missing `priceJPY`, `status`, etc.)
   - Actor: Admin
   - Expected: `PERMISSION_DENIED`

4. **Type Poisoning (Invalid Price Type)**
   - Payload: `{ "priceJPY": "1000000", ... }` (String instead of Number)
   - Actor: Admin
   - Expected: `PERMISSION_DENIED`

5. **State Shortcutting (Invalid Status)**
   - Payload: `{ "status": "DESTROYED", ... }` (Not in enum)
   - Actor: Admin
   - Expected: `PERMISSION_DENIED`

6. **Immutable Field Attack (Update Chassis)**
   - Payload: `{ "chassis": "NEW_CHASSIS" }`
   - Actor: Admin
   - Expected: `PERMISSION_DENIED`

7. **Temporal Integrity (Old Timestamp)**
   - Payload: `{ "updatedAt": "2000-01-01T00:00:00Z" }`
   - Actor: Admin
   - Expected: `PERMISSION_DENIED` (must be `reuest.time`)

8. **Shadow Update (Ghost Field)**
   - Payload: `{ "extra_verified": true, ... }`
   - Actor: Admin
   - Expected: `PERMISSION_DENIED` (via `affectedKeys().hasOnly`)

### User Collection (Match: `/users/{userId}`)

9. **Privilege Escalation (Self-Promote to Admin)**
   - Payload: `{ "role": "admin" }`
   - Path: `/users/MY_UID`
   - Actor: Authenticated User
   - Expected: `PERMISSION_DENIED`

10. **PII Leak (Direct Read of Other User)**
    - Path: `/users/OTHER_UID`
    - Actor: Authenticated User
    - Expected: `PERMISSION_DENIED`

### Global / Settings

11. **Denial of Wallet (Huge String in Description)**
    - Payload: `{ "description": "A" * 1024 * 1024 }` (1MB String)
    - Actor: Admin
    - Expected: `PERMISSION_DENIED` (size constraint)

12. **Unauthorized Settings Write**
    - Path: `/settings/global`
    - Actor: Authenticated User (Non-Admin)
    - Expected: `PERMISSION_DENIED`
