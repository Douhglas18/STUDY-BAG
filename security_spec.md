# Security Specification: Kairon - AI Goal & Accountability OS

## 1. Data Invariants

1. **User Scope & Identity Integrity**:
   - Every document under `/users/{userId}` and its subcollections (`goals`, `tasks`, `roadmaps`, `resources`) MUST belong strictly to the authenticated user where `request.auth.uid == userId`.
   - No user may read, list, create, update, or delete records belonging to another user.
   - The `userId` field inside any entity must match `request.auth.uid`.

2. **Immutable System Fields**:
   - `createdAt` and `userId` are immutable after document creation.
   - Timestamps (`createdAt`, `updatedAt`) must evaluate using `request.time`.

3. **Type & Boundary Constraints**:
   - Document IDs and UID path variables must conform to `isValidId()` (`^[a-zA-Z0-9_\-]+$` and length <= 128).
   - String fields must strictly satisfy `.size() <= MAX_LENGTH` limits specified in `firebase-blueprint.json` to prevent Denial of Wallet.

4. **Default Deny**:
   - Any unknown path or unauthenticated operation returns `PERMISSION_DENIED`.

---

## 2. The "Dirty Dozen" Payloads (Adversarial TDD Test Cases)

| Payload ID | Target Path | Malicious Intent / Vector | Expected Outcome |
|---|---|---|---|
| `DD-01` | `/users/victim_123` | Unauthenticated read | `PERMISSION_DENIED` |
| `DD-02` | `/users/victim_123` | Cross-user read by attacker with valid token | `PERMISSION_DENIED` |
| `DD-03` | `/users/attacker_uid` | User profile creation with spoofed `userId: "admin_uid"` | `PERMISSION_DENIED` |
| `DD-04` | `/users/attacker_uid` | Ghost field injection (`isAdmin: true`, `shadowField: "exploit"`) | `PERMISSION_DENIED` |
| `DD-05` | `/users/attacker_uid/goals/g1` | Goal creation with missing required fields (`title` omitted) | `PERMISSION_DENIED` |
| `DD-06` | `/users/attacker_uid/goals/g1` | Goal creation with 2MB title string (Denial of Wallet payload) | `PERMISSION_DENIED` |
| `DD-07` | `/users/victim_123/tasks/t1` | Cross-user task creation into victim's subcollection | `PERMISSION_DENIED` |
| `DD-08` | `/users/attacker_uid/tasks/t1` | Task status set to invalid status (`status: "Hacked"`) | `PERMISSION_DENIED` |
| `DD-09` | `/users/attacker_uid/tasks/t1` | Task update mutating immutable `createdAt` timestamp | `PERMISSION_DENIED` |
| `DD-10` | `/users/attacker_uid/resources/r1` | Resource creation with invalid URL type (`url: 12345`) | `PERMISSION_DENIED` |
| `DD-11` | `/users/attacker_uid/roadmaps/rd1` | Negative task count injection (`totalTasks: -50`) | `PERMISSION_DENIED` |
| `DD-12` | `/any_undefined_collection/doc1` | Global arbitrary collection write bypass attempt | `PERMISSION_DENIED` |

---

## 3. Test Runner Invariant Summary
All 12 adversarial payloads fail static and rule-level gatekeeper checks, preventing privilege escalation, data poisoning, and unauthorized cross-tenant reads or writes.
