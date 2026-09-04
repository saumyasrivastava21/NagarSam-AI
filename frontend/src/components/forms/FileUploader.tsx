import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface FileUploaderProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (fileUrl: string, file?: File) => void;
  error?: string;
  maxSizeMb?: number;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = 'Upload Photograph',
  helperText = 'Supported formats: JPG, PNG, WEBP (Max 10MB)',
  value,
  onChange,
  error,
  maxSizeMb = 10,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPG, PNG, WEBP) are supported.');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setUploadError(`File size exceeds maximum limit of ${maxSizeMb}MB.`);
      return;
    }

    // Create a local blob preview url
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl, file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange('', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      {value ? (
        // Preview State
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-slate-800"
            >
              Replace Photo
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleClear}
            >
              Remove
            </Button>
          </div>
          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready for Analysis</span>
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'p-6 sm:p-8 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-slate-50/60 hover:bg-slate-50',
            isDragging
              ? 'border-primary-500 bg-primary-50/50 scale-[1.01]'
              : error || uploadError
              ? 'border-red-300 hover:border-red-400'
              : 'border-slate-300 hover:border-primary-400'
          )}
        >
          <div className="p-3.5 rounded-full bg-primary-50 text-primary-600 mb-2">
            <UploadCloud className="w-7 h-7 stroke-[1.75]" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to upload <span className="text-slate-400 font-normal">or drag & drop</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {(error || uploadError) && (
        <p className="text-xs text-danger-600 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error || uploadError}</span>
        </p>
      )}
    </div>
  );
};
