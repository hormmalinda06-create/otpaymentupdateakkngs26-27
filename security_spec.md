# Security Specification: Part-Time Student Tuition Management

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every class, student, and payment record belongs to a single verified teacher/admin (`ownerId == request.auth.uid`). No user may read, list, create, update, or delete another user's records.
2. **Email Verification Mandate**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Referential Integrity on Create**:
   - A `Student` cannot be created unless `classId` references an existing `/classes/{classId}` document owned by `request.auth.uid`.
   - A `Payment` cannot be created unless `studentId` references an existing `/students/{studentId}` document owned by `request.auth.uid` and `classId` references an existing `/classes/{classId}` document owned by `request.auth.uid`.
4. **Immutable Ownership & Temporal Integrity**:
   - `ownerId` and `createdAt` are immutable once created.
   - `createdAt` must equal `request.time` on creation; `updatedAt` must equal `request.time` on creation and every update.
5. **Path & Payload Volumetric Guards**:
   - Every document ID path variable must pass `isValidId()` (`^[a-zA-Z0-9_\-]+$`, length 1..128).
   - Every string field has explicit `.size()` bounds; numeric amounts are bounded and non-negative (`amountPaid > 0`, `feeAmount >= 0`, `dueDay >= 1 && dueDay <= 31`).
   - Exact key sets enforced with `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Creating a `/students/{id}` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Writing to `/users/{uid}` with `email_verified == false` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Ownership Spoof (Create)**: Creating a `/classes/{id}` with `ownerId: "victim_uid"` while authenticated as `"attacker_uid"` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Ownership Takeover (Update)**: Updating `/students/{id}` changing `ownerId` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Creating `/payments/{id}` with extra field `isAdminApproved: true` -> `PERMISSION_DENIED`.
6. **Orphaned Student Record**: Creating `/students/{id}` with non-existent `classId: "fake_class_999"` -> `PERMISSION_DENIED`.
7. **Cross-Tenant Relational Hijack**: Creating `/payments/{id}` pointing `studentId` to another teacher's student -> `PERMISSION_DENIED`.
8. **Path ID Poisoning**: Creating `/students/bad..id..with..1500chars` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Creating `/payments/{id}` with backdated `createdAt` not matching `request.time` -> `PERMISSION_DENIED`.
10. **Negative / Zero Payment Poisoning**: Creating `/payments/{id}` with `amountPaid: -50` or `amountPaid: 0` -> `PERMISSION_DENIED`.
11. **Blanket List Query Scraping**: Listing `/students` without filtering by `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
12. **PII / Profile Cross-User Read**: Reading `/users/{otherUserId}` (contains email) as a different authenticated user -> `PERMISSION_DENIED`.
