# Kopfkino Application Code Review & Remediation Tracker

This document tracks the security, efficiency, code quality, data integrity, and refactoring findings across the Kopfkino codebase.

## Status Legend
- `[ ]` Pending
- `[~]` In Progress
- `[x]` Completed

---

## 1. Security

| ID | Status | Severity | Area | Finding & Remediation |
|---|---|---|---|---|
| **SEC-01** | `[x]` | High | `firestore.rules` / `storage.ts` | **Invitation & Cross-User `projectRefs` Access:**<br>1. Restricted `invitations` creation to callers with write access to the referenced project (`canWrite(request.resource.data.projectId)`).<br>2. Allowed project owners and editors to query and revoke pending invitations.<br>3. Allowed invitees to add their own UID to `members` when accepting invitations (`isSelfJoiningMember()`), and allowed project owners/editors to create/update/delete member `projectRefs` on role adjustments or removal. |
| **SEC-02** | `[x]` | High | `storage.rules` | **Storage Write Role Enforcement:**<br>1. Replaced permissive `isProjectMember` write check with `canWriteProject(projectId)` (`role in ['owner', 'editor']`) so viewers cannot upload or overwrite image and video assets.<br>2. Restricted `/knowledge/{allPaths=**}` writes to valid image and video MIME types. |
| **SEC-03** | `[x]` | Medium | `src/hooks/usePollinationsAuth.ts` | **Open Redirect Protection on OAuth Callback:**<br>Added origin verification (`storedReturnUrl.startsWith(window.location.origin)`) before calling `window.location.replace(returnUrl)` to prevent cross-site open redirect vulnerabilities. |

---

## 2. Efficiency & Performance

| ID | Status | Severity | Area | Finding & Remediation |
|---|---|---|---|---|
| **PERF-01** | `[x]` | High | `src/services/storage.ts` | **$O(N \times 3)$ Full-Collection Downloads in `getAllProjectStats`:**<br>Switched locations and characters fetching in `getAllProjectStats` to Firestore's server-side aggregation `getCountFromServer()`, avoiding entire collection downloads just to read document count. |
| **PERF-02** | `[x]` | Medium | `src/services/storageService.ts` | **Storage Filename Collision Prevention:**<br>Added `generateUniqueFileId()` (`${Date.now()}-${crypto.randomUUID().slice(0, 8)}`) to all file upload paths in `storageService.ts`, preventing accidental overwrite collisions during rapid or parallel uploads. |
| **PERF-03** | `[x]` | Medium | `src/services/storageService.ts` | **Invalidate Image Count Cache on Upload/Delete:**<br>Invalidated `imageCountCache` upon successful image upload (`uploadImage`) and image deletion (`deleteFileByPath`), ensuring accurate cache counts. |

---

## 3. Code Quality & Data Integrity

| ID | Status | Severity | Area | Finding & Remediation |
|---|---|---|---|---|
| **QUAL-01** | `[x]` | High | `src/services/storage.ts` | **Universal Deep `undefined` Sanitization & Chunked Batching:**<br>Added universal `sanitizeForFirestore<T>(obj: T): T` to strip top-level and nested `undefined` properties before every write (preventing Firestore `Unsupported field value: undefined` crashes) and implemented `commitChunkedOperations` (max 450 ops per batch) to respect Firestore's 500-operation limit. |
| **QUAL-02** | `[x]` | High | `src/services/storage.ts` | **Destructive `replaceAll*` for CSV Import:**<br>Updated `replaceProjectCollection` to query existing documents in the subcollection and queue deletions for any existing document IDs not present in the replacement array, fulfilling the replacement contract. |
| **QUAL-03** | `[x]` | Medium | `src/services/storage.ts` | **Clean Up Subcollections & Member Refs on `deleteProject`:**<br>Enhanced `deleteProject` to fetch all project subcollections and delete all child documents and all members' `projectRefs` in chunked batches when deleting a project, preventing orphaned documents and broken indexes. |

---

## 4. Code Redundancy & Refactoring

| ID | Status | Severity | Area | Finding & Remediation |
|---|---|---|---|---|
| **REF-01** | `[x]` | Medium | `src/services/storage.ts` | **Generic Project Subcollection CRUD Factory:**<br>Introduced generic collection helpers (`subscribeProjectCollection`, `saveProjectItem`, `deleteProjectItem`, `updateProjectOrders`, `replaceProjectCollection`, `saveProjectItems`) in `storage.ts`, eliminating over 150 lines of duplicate Firestore boilerplate while preserving types and sorting. |
| **REF-02** | `[x]` | Medium | `LocationDetail.tsx`, `CharacterDetail.tsx`, `SceneDetail.tsx` | **Standardize on `useDetailState` Hook:**<br>Refactored `LocationDetail`, `CharacterDetail`, and `SceneDetail` to use the unified `useDetailState` custom hook, eliminating redundant reducer implementations and ensuring consistent dirty/save state tracking. |
| **REF-03** | `[x]` | Low | `src/components/ui/Modal.tsx` | **Reusable `<Modal>` UI Component:**<br>Extracted the Headless UI `Dialog` shell into a reusable `Modal` component in `src/components/ui/Modal.tsx` and refactored `PlanModal`, `SectionModal`, `ItemModal`, and `TaskModal` to use it. |
