import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StorageBucket = 'laudos' | 'avatars';

export interface UploadResult {
  path: string;
  publicUrl: string | null;
  signedUrl: string | null;
}

export interface UseSupabaseStorageReturn {
  uploading: boolean;
  progress: number;
  uploadFile: (bucket: StorageBucket, file: File, folder?: string) => Promise<UploadResult | null>;
  downloadFile: (bucket: StorageBucket, path: string) => Promise<string | null>;
  deleteFile: (bucket: StorageBucket, path: string) => Promise<boolean>;
  getSignedUrl: (bucket: StorageBucket, path: string, expiresIn?: number) => Promise<string | null>;
}

export function useSupabaseStorage(): UseSupabaseStorageReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = useCallback(
    async (bucket: StorageBucket, file: File, folder = ''): Promise<UploadResult | null> => {
      try {
        setUploading(true);
        setProgress(0);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario nao autenticado');
        const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        const filePath = folder
          ? `${folder}/${user.id}/${timestamp}_${sanitized}`
          : `${user.id}/${timestamp}_${sanitized}`;
        setProgress(30);
        const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        setProgress(80);
        let publicUrl: string | null = null;
        let signedUrl: string | null = null;
        if (bucket === 'avatars') {
          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          publicUrl = data.publicUrl;
        } else {
          const { data, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600);
          if (!signError) signedUrl = data?.signedUrl ?? null;
        }
        setProgress(100);
        toast({ title: 'Upload concluido', description: `${file.name} enviado com sucesso.` });
        return { path: filePath, publicUrl, signedUrl };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro no upload';
        toast({ title: 'Erro no upload', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [toast]
  );

  const downloadFile = useCallback(
    async (bucket: StorageBucket, path: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) throw error;
        return URL.createObjectURL(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro no download';
        toast({ title: 'Erro no download', description: msg, variant: 'destructive' });
        return null;
      }
    },
    [toast]
  );

  const deleteFile = useCallback(
    async (bucket: StorageBucket, path: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
        toast({ title: 'Arquivo removido', description: 'Excluido com sucesso.' });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao deletar';
        toast({ title: 'Erro ao deletar', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [toast]
  );

  const getSignedUrl = useCallback(
    async (bucket: StorageBucket, path: string, expiresIn = 3600): Promise<string | null> => {
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data.signedUrl;
      } catch {
        return null;
      }
    },
    []
  );

  return { uploading, progress, uploadFile, downloadFile, deleteFile, getSignedUrl };
}
