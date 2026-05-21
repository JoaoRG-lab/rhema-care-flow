import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useToast } from '../../hooks/useToast';

const MAX_SIZE_MB = 20;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/dicom',
];

export interface UploadedFile {
  name: string;
  path: string;
  url:  string;
  size: number;
  type: string;
}

interface FileUploadProps {
  bucket?: string;
  folder?: string;    // ex: `patients/${patientId}/exames`
  onUpload?: (file: UploadedFile) => void;
  accept?: string;
  label?: string;
  multiple?: boolean;
}

export function FileUpload({
  bucket = 'patient-files',
  folder = 'uploads',
  onUpload,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  label = 'Clique ou arraste arquivos aqui',
  multiple = false,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { log } = useAuditLog();
  const { success, error: toastError } = useToast();

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toastError('Tipo de arquivo nao permitido', `Permitidos: PDF, JPEG, PNG, WebP`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toastError('Arquivo muito grande', `Tamanho maximo: ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    setProgress(10);

    const ext  = file.name.split('.').pop();
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const path = `${folder}/${name}`;

    setProgress(40);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });

    setProgress(80);

    if (error) {
      toastError('Erro no upload', error.message);
      setUploading(false);
      setProgress(0);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

    const uploaded: UploadedFile = {
      name: file.name,
      path: data.path,
      url:  publicUrl,
      size: file.size,
      type: file.type,
    };

    await log({
      action:       'file_uploaded',
      resourceType: 'storage',
      resourceId:   data.path,
      metadata:     { bucket, name: file.name, size: file.size, type: file.type },
    });

    setProgress(100);
    success('Arquivo enviado', file.name);
    onUpload?.(uploaded);
    setTimeout(() => { setUploading(false); setProgress(0); }, 600);
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const arr = Array.from(files);
    for (const f of arr) await uploadFile(f);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all ${
        dragging
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/15'
          : 'border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <>
          <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enviando... {progress}%</p>
        </>
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`transition-colors ${dragging ? 'text-teal-500' : 'text-gray-300 dark:text-gray-600'}`}
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">PDF, JPEG, PNG, WebP · max {MAX_SIZE_MB}MB</p>
        </>
      )}
    </div>
  );
}
