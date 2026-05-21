import React, { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useSupabaseStorage, StorageBucket, UploadResult } from '@/hooks/useSupabaseStorage';
import { cn } from '@/lib/utils';

export interface StorageUploadButtonProps {
  bucket: StorageBucket;
  folder?: string;
  accept?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (message: string) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function StorageUploadButton({
  bucket, folder, accept, label = 'Upload', disabled = false,
  className, onSuccess, onError, variant = 'outline', size = 'default',
}: StorageUploadButtonProps) {
  const resolvedAccept = accept ?? (bucket === 'laudos' ? 'application/pdf,image/*' : 'image/*');
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, uploadFile } = useSupabaseStorage();

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(bucket, file, folder);
    if (result) { onSuccess?.(result); }
    else { onError?.('Falha no upload. Tente novamente.'); }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <input ref={inputRef} type="file" accept={resolvedAccept}
        className="hidden" onChange={handleChange}
        disabled={uploading || disabled} aria-label={label} />
      <Button variant={variant} size={size}
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" />
          : bucket === 'laudos' ? <FileText className="h-4 w-4" />
          : <Upload className="h-4 w-4" />}
        {uploading ? `Enviando... ${progress}%` : label}
      </Button>
      {uploading && <Progress value={progress} className="h-1.5 w-full" />}
    </div>
  );
}

export function AvatarUploadButton({
  onSuccess, className,
}: Pick<StorageUploadButtonProps, 'onSuccess' | 'className'>) {
  return (
    <StorageUploadButton bucket="avatars" label="Alterar foto"
      accept="image/png,image/jpeg,image/webp"
      variant="secondary" size="sm"
      onSuccess={onSuccess} className={className} />
  );
}

export function LaudoUploadButton({
  folder = 'laudos', onSuccess, className,
}: Pick<StorageUploadButtonProps, 'onSuccess' | 'className'> & { folder?: string }) {
  return (
    <StorageUploadButton bucket="laudos" folder={folder}
      label="Anexar laudo" accept="application/pdf"
      variant="outline" size="sm"
      onSuccess={onSuccess} className={className} />
  );
}
