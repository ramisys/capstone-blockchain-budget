import React from 'react';
import { FileVerificationCard } from '../../components/verification/FileVerificationCard';

/**
 * External file verification page (Phase 4.6 M6). Lets any authenticated user
 * upload a file and check it against stored document hashes and the blockchain
 * ledger without storing the file.
 */
export function VerifyDocument() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">File Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify that a document file matches the system&apos;s records and is anchored on the
            blockchain ledger. Your file is never uploaded to the system — it is hashed on the
            server and discarded.
          </p>
        </div>
        <FileVerificationCard />
      </div>
    </div>
  );
}

export default VerifyDocument;
