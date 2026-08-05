import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useDocumentOptions } from '../../hooks/useDocumentOptions';
import { useUpdateDocument } from '../../hooks/useDocuments';
import { DOCUMENT_TYPE, DOCUMENT_TYPE_LIST, DOCUMENT_TYPE_LABELS } from '../../constants/documentType';
import { AlertCircle, FileEdit, Loader2, X } from 'lucide-react';
import type { DocumentType, ManagedDocument } from '../../types/document';

interface DocumentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: ManagedDocument | null;
}

interface FieldSelectProps {
  id: string;
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: Array<{ id: string; code: string; name?: string }>;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
}

const FieldSelect: React.FC<FieldSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  loading = false,
  disabled = false,
}) => {
  const isDisabled = disabled || loading;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </Label>
      <Select value={value ?? ''} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="__loading__" disabled>
              Loading...
            </SelectItem>
          ) : (
            <>
              <SelectItem value="__none__">
                Not assigned
              </SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.code && option.name ? `${option.code} — ${option.name}` : option.code || option.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

const DocumentEditDialog: React.FC<DocumentEditDialogProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { fiscalYears, departments, allocations, isLoading: optionsLoading } =
    useDocumentOptions();
  const { mutateAsync: updateDocument, isPending: isUpdating } = useUpdateDocument();

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [allocationId, setAllocationId] = useState<string>('');
  const [fiscalYearId, setFiscalYearId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && document) {
      setTitle(document.title ?? '');
      setDocumentType(document.documentType ?? '');
      setDescription(document.description ?? '');
      setAllocationId(document.allocationId ?? '');
      setFiscalYearId(document.fiscalYearId ?? '');
      setDepartmentId(document.departmentId ?? '');
      setErrors({});
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const isFormDisabled = isUpdating;

  const inputClassName = (hasError: boolean) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`;

  const onFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!documentType) nextErrors.documentType = 'Document type is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateDocument({
        id: document.id,
        data: {
          title: title.trim(),
          documentType: documentType as DocumentType,
          description: description.trim() || undefined,
          allocationId: allocationId || null,
          fiscalYearId: fiscalYearId || null,
          departmentId: departmentId || null,
        },
      });
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FileEdit className="w-5 h-5" />
              </div>
              Edit Document Metadata
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Update the metadata for {document.documentCode}. The file itself and its blockchain
              anchors are unchanged.
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
            {/* Title + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-800">
                  Title <span className="text-red-500">*</span>
                </Label>
                <input
                  id="title"
                  type="text"
                  disabled={isFormDisabled}
                  placeholder="e.g., Purchase Request - Laptops FY2026"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  className={inputClassName(Boolean(errors.title))}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType" className="text-sm font-semibold text-slate-800">
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select value={documentType} onValueChange={(value) => setDocumentType(value)} disabled={isFormDisabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_LIST.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentType && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.documentType}
                  </p>
                )}
              </div>
            </div>

            {/* Classification (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <FieldSelect
                id="allocationId"
                label="Budget Allocation"
                value={allocationId || null}
                onChange={(value) => setAllocationId(value === '__none__' ? '' : value)}
                options={allocations.map((allocation) => ({
                  id: allocation.id,
                  code: allocation.allocationCode,
                  name: undefined,
                }))}
                placeholder="Select allocation"
                loading={optionsLoading}
                disabled={isFormDisabled}
              />
              <FieldSelect
                id="fiscalYearId"
                label="Fiscal Year"
                value={fiscalYearId || null}
                onChange={(value) => setFiscalYearId(value === '__none__' ? '' : value)}
                options={fiscalYears.map((year) => ({
                  id: year.id,
                  code: year.code,
                  name: undefined,
                }))}
                placeholder="Select fiscal year"
                loading={optionsLoading}
                disabled={isFormDisabled}
              />
              <FieldSelect
                id="departmentId"
                label="Department"
                value={departmentId || null}
                onChange={(value) => setDepartmentId(value === '__none__' ? '' : value)}
                options={departments.map((dept) => ({
                  id: dept.id,
                  code: dept.code,
                  name: dept.name,
                }))}
                placeholder="Select department"
                loading={optionsLoading}
                disabled={isFormDisabled}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                Description <span className="text-xs font-normal text-slate-400">(optional)</span>
              </Label>
              <textarea
                id="description"
                rows={4}
                disabled={isFormDisabled}
                placeholder="Provide additional details about this document..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { DocumentEditDialog };
export default DocumentEditDialog;
