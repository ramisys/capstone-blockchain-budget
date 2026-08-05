/**
 * Document activity action names recorded in the `document_activities` history
 * table. These are human/UI-readable event identifiers, distinct from the
 * structured console audit actions in `constants/auditActions.js`.
 */
export const DOCUMENT_ACTIVITY_ACTIONS = {
  UPLOAD: 'UPLOAD',
  METADATA_UPDATE: 'METADATA_UPDATE',
  REPLACE: 'REPLACE',
  ARCHIVE: 'ARCHIVE',
  VERIFY: 'VERIFY',
  ANCHOR_RETRY: 'ANCHOR_RETRY',
};

export const DOCUMENT_ACTIVITY_ACTIONS_LIST = Object.values(DOCUMENT_ACTIVITY_ACTIONS);
