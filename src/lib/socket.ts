import { io as ioClient, type Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

let socket: Socket | null = null;

/** Get or create the shared Socket.IO connection to the server (same origin as API). */
export function getSocket(): Socket | null {
  if (!SOCKET_URL) return null;
  if (socket?.connected) return socket;
  try {
    socket = ioClient(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socket.on("connect_error", () => {
      // Fail silently when backend is not running; app works without real-time features
    });
    return socket;
  } catch {
    return null;
  }
}

/** Subscribe to real-time category changes (admin create/update/delete). Calls refetch when server broadcasts. */
export function onCategoriesChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("categories:changed", refetch);
  return () => {
    s.off("categories:changed", refetch);
  };
}

/** Subscribe to real-time product changes (seller add/update/delete/hide). Calls refetch when server broadcasts. */
export function onProductsChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("products:changed", refetch);
  return () => {
    s.off("products:changed", refetch);
  };
}

/** Subscribe to real-time order changes (new order or seller updated status). Calls refetch when server broadcasts. */
export function onOrdersChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("orders:changed", refetch);
  return () => {
    s.off("orders:changed", refetch);
  };
}

/** Subscribe to seller notifications changed (new or mark read). Calls refetch when server broadcasts. */
export function onNotificationsChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("notifications:changed", refetch);
  return () => {
    s.off("notifications:changed", refetch);
  };
}

/** Subscribe to pets changed (shelter add/edit/delete or adoption). Calls refetch when server broadcasts. */
export function onPetsChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("pets:changed", refetch);
  return () => {
    s.off("pets:changed", refetch);
  };
}

/** Subscribe to events changed (shelter create/update/delete). Shelter, main site, adopter, admin can refetch. */
export function onEventsChanged(refetch: () => void): (() => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("events:changed", refetch);
  return () => {
    s.off("events:changed", refetch);
  };
}

export interface AdoptionRequestsChangedPayload {
  shelterId: string;
  requestId?: string;
  adopterId?: string;
}

/** Subscribe to adoption requests changed. Callback receives { shelterId, requestId?, adopterId? }.
 *  Shelter: refetch when shelterId matches. Admin: refetch on any event. Adopter: refetch when adopterId matches. */
export function onAdoptionRequestsChanged(callback: (payload: AdoptionRequestsChangedPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("adoption-requests:changed", callback);
  return () => {
    s.off("adoption-requests:changed", callback);
  };
}

export interface UserStatusChangedPayload {
  userId: string;
  status: string;
}

/** Subscribe to real-time user status changes (e.g. admin activated seller). Callback receives { userId, status }. */
export function onUserStatusChanged(callback: (payload: UserStatusChangedPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("user:status-changed", callback);
  return () => {
    s.off("user:status-changed", callback);
  };
}

/** Payload when admin resets a user's password – that user should log out and sign in with new password */
export interface PasswordResetPayload {
  userId: string;
}

/** Subscribe to password-reset event (admin set temp password). Callback receives { userId }. */
export function onPasswordReset(callback: (payload: PasswordResetPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("user:password-reset", callback);
  return () => {
    s.off("user:password-reset", callback);
  };
}

/** Payload when admin deletes a user – that user must be logged out. */
export interface UserDeletedPayload {
  userId: string;
}

/** Subscribe to user-deleted event (admin deleted the account). Callback receives { userId }. */
export function onUserDeleted(callback: (payload: UserDeletedPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("user:deleted", callback);
  return () => {
    s.off("user:deleted", callback);
  };
}

/** Subscribe to fundraising campaigns changed (create/approve/reject/edit/delete/new donation). Shelter and public list can refetch. */
export function onFundraisingChanged(refetch: () => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("fundraising:changed", refetch);
  return () => {
    s.off("fundraising:changed", refetch);
  };
}

/** Subscribe to donations changed (new donation). Admin and shelter donation lists can refetch. */
export function onDonationsChanged(refetch: () => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("donations:changed", refetch);
  return () => {
    s.off("donations:changed", refetch);
  };
}

export interface FundraisingApprovedPayload {
  shelterId: string;
  campaignId: string;
}

/** Subscribe to campaign approved (for shelter: real-time notification when admin approves). Callback receives { shelterId, campaignId }. */
export function onFundraisingApproved(callback: (payload: FundraisingApprovedPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("fundraising:approved", callback);
  return () => {
    s.off("fundraising:approved", callback);
  };
}
