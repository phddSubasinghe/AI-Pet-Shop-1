/** Socket.IO instance – set from index.js after server starts. Used to broadcast category changes. */
let ioRef = null;

export function setIO(io) {
  ioRef = io;
}

export function notifyCategoriesChanged() {
  if (ioRef) ioRef.emit('categories:changed');
}

/** Notify all clients that products changed (seller add/update/delete/hide). Customer product list/detail can refetch. */
export function notifyProductsChanged() {
  if (ioRef) ioRef.emit('products:changed');
}

/** Notify all clients that a user's status changed (e.g. admin activated a seller). */
export function notifyUserStatusChanged(userId, status) {
  if (ioRef) ioRef.emit('user:status-changed', { userId, status });
}

/** Notify all clients that a user's password was reset (they must sign in again). */
export function notifyPasswordReset(userId) {
  if (ioRef) ioRef.emit('user:password-reset', { userId });
}

/** Notify all clients that a user was deleted (they must be logged out). */
export function notifyUserDeleted(userId) {
  if (ioRef) ioRef.emit('user:deleted', { userId });
}

/** Notify all clients that orders changed (new order or seller updated status). Sellers refetch their orders. */
export function notifyOrdersChanged() {
  if (ioRef) ioRef.emit('orders:changed');
}

/** Notify all clients that seller notifications changed (new or read). Seller dashboard can refetch notifications. */
export function notifyNotificationsChanged() {
  if (ioRef) ioRef.emit('notifications:changed');
}

/** Notify all clients that pets changed (shelter add/edit/delete or adoption). Adopters, admins, shelters refetch. */
export function notifyPetsChanged() {
  if (ioRef) ioRef.emit('pets:changed');
}

/** Notify that adoption requests changed. Emits to all; clients use:
 *  - shelterId: shelter dashboard refetches when it matches
 *  - requestId / adopterId: admin refetches on any change; adopter refetches when adopterId is theirs
 */
export function notifyAdoptionRequestsChanged(shelterId, requestId = null, adopterId = null) {
  if (ioRef) {
    const payload = { shelterId };
    if (requestId) payload.requestId = requestId;
    if (adopterId) payload.adopterId = String(adopterId);
    ioRef.emit('adoption-requests:changed', payload);
  }
}

/** Notify all clients that shelter events changed (create/update/delete). Shelter, main site, adopter, admin can refetch. */
export function notifyEventsChanged() {
  if (ioRef) ioRef.emit('events:changed');
}

/** Notify that fundraising campaigns changed (create/approve/reject/edit/delete). Public list and shelter list can refetch. */
export function notifyFundraisingChanged() {
  if (ioRef) ioRef.emit('fundraising:changed');
}

/** Notify a specific shelter that one of their campaigns was approved (real-time). Payload: { shelterId, campaignId }. */
export function notifyFundraisingApproved(shelterId, campaignId) {
  if (ioRef) ioRef.emit('fundraising:approved', { shelterId: String(shelterId), campaignId: String(campaignId) });
}

/** Notify all clients that donations changed (new donation). Admin and shelter donation lists can refetch. */
export function notifyDonationsChanged() {
  if (ioRef) ioRef.emit('donations:changed');
}
