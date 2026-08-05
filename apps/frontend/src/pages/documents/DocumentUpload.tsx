import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { DocumentUploadDialog } from '../../components/documents/DocumentUploadDialog';
import { Forbidden } from '../Forbidden';

const WRITE_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

/**
 * Dedicated upload page. Renders the upload dialog in an open state; once
 * closed, navigates back to the document list.
 */
export function DocumentUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpload = Boolean(user && WRITE_ROLES.includes(user.role as (typeof WRITE_ROLES)[number]));

  useEffect(() => {
    if (!canUpload) return;
    // The dialog handles its own open/close lifecycle.
  }, [canUpload]);

  if (!canUpload) {
    return <Forbidden />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <DocumentUploadDialog isOpen onClose={() => navigate('/documents', { replace: true })} />
      </div>
    </div>
  );
}

export default DocumentUpload;
