import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Label } from '@radix-ui/react-label';
import { useReplaceDocument } from '../../hooks/useDocuments';
import { AlertCircle, FileUp, Loader2, RefreshCw, X } from 'lucide-react';

interface DocumentReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentCode?: string;
  currentVersionNumber?: number;
}

const DocumentReplaceDialog: React.FC<DocumentReplaceDialogProps> = ({
  isOpen,
  onClose,
  documentId,
  documentCode,
  currentVersionNumber,
}) => {
  const { mutateAsync: replaceDocument, isPending: isReplacing } = useReplaceDocument();

  const [file, setFile] = useState<File | null>(null);
  const [replaceReason, setReplaceReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setReplaceReason('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !documentId) return null;

  const isFormDisabled = isReplacing;

  const inputClassName = (hasError: boolean) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`;

  const onFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!file) nextErrors.file = 'Please select a file to replace the current version';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await replaceDocument({
        id: documentId,
        data: {
          file,
          replaceReason: replaceReason.trim() || undefined,
        },
      });
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              Replace Document Version
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {documentCode}
              {currentVersionNumber !== undefined && ` — current version v${currentVersionNumber}`}. The
              existing file is preserved as an older version for audit.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isFormDisabled}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Wrap */}
        <form onSubmit={onFormSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-semibold text-slate-800">
                Replacement File <span className="text-red-500">*</span>
              </Label>
              <input
                id="file"
                type="file"
                disabled={isFormDisabled}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  if (errors.file) setErrors((prev) => ({ ...prev, file: '' }));
                }}
                className={`w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 ${
                  errors.file ? 'border border-red-400 rounded-xl' : 'border border-slate-300 rounded-xl'
                }`}
              />
              {errors.file && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.file}
                </p>
              )}
              {file && (
                <p className="text-xs text-slate-500 mt-1">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="replaceReason" className="text-sm font-semibold text-slate-800">
                Reason for Replacement <span className="text-xs font-normal text-slate-400">(optional)</span>
              </Label>
              <textarea
                id="replaceReason"
                rows={3}
                disabled={isFormDisabled}
                placeholder="e.g., Corrected amounts on the purchase order..."
                value={replaceReason}
                onChange={(event) => setReplaceReason(event.target.value)}
                className={inputClassName(false)}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isFormDisabled}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isFormDisabled}>
              {isFormDisabled ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Replacing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Replace Version
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { DocumentReplaceDialog };
export default DocumentReplaceDialog;
