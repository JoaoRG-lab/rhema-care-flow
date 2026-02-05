 import { useState, useRef } from 'react';
 import { Button } from '@/components/ui/button';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Paperclip, X, FileText, Image, File, Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 
 interface FileAttachmentsProps {
   attachments: string[];
   onChange: (attachments: string[]) => void;
   disabled?: boolean;
 }
 
 export function FileAttachments({ attachments, onChange, disabled }: FileAttachmentsProps) {
   const { user } = useAuth();
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [uploading, setUploading] = useState(false);
 
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || files.length === 0 || !user) return;
 
     setUploading(true);
     const newAttachments: string[] = [];
 
     for (const file of Array.from(files)) {
       if (file.size > 10 * 1024 * 1024) {
         toast.error(`${file.name} is too large (max 10MB)`);
         continue;
       }
 
       const fileExt = file.name.split('.').pop();
       const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
 
       const { error } = await supabase.storage
         .from('visit-attachments')
         .upload(fileName, file);
 
       if (error) {
         toast.error(`Failed to upload ${file.name}`);
       } else {
         newAttachments.push(fileName);
       }
     }
 
     if (newAttachments.length > 0) {
       onChange([...attachments, ...newAttachments]);
       toast.success(`${newAttachments.length} file(s) uploaded`);
     }
 
     setUploading(false);
     if (fileInputRef.current) fileInputRef.current.value = '';
   };
 
   const handleRemove = async (attachment: string) => {
     const { error } = await supabase.storage
       .from('visit-attachments')
       .remove([attachment]);
 
     if (error) {
       toast.error('Failed to remove file');
     } else {
       onChange(attachments.filter(a => a !== attachment));
     }
   };
 
   const getFileIcon = (path: string) => {
     const ext = path.split('.').pop()?.toLowerCase();
     if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
       return <Image className="h-4 w-4" />;
     }
     if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
       return <FileText className="h-4 w-4" />;
     }
     return <File className="h-4 w-4" />;
   };
 
   const getFileName = (path: string) => {
     const parts = path.split('/');
     const fileName = parts[parts.length - 1];
     // Remove timestamp prefix for display
     const match = fileName.match(/^\d+-[a-z0-9]+-(.+)$/);
     return match ? match[1] : fileName;
   };
 
   const getDownloadUrl = async (path: string) => {
     const { data } = await supabase.storage
       .from('visit-attachments')
       .createSignedUrl(path, 3600);
     if (data?.signedUrl) {
       window.open(data.signedUrl, '_blank');
     }
   };
 
   return (
     <div className="space-y-2">
       <div className="flex items-center gap-2">
         <input
           ref={fileInputRef}
           type="file"
           multiple
           onChange={handleFileSelect}
           className="hidden"
           disabled={disabled || uploading}
         />
         <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={() => fileInputRef.current?.click()}
           disabled={disabled || uploading}
         >
           {uploading ? (
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           ) : (
             <Paperclip className="h-4 w-4 mr-2" />
           )}
           {uploading ? 'Uploading...' : 'Attach Files'}
         </Button>
         <span className="text-xs text-muted-foreground">Max 10MB per file</span>
       </div>
 
       {attachments.length > 0 && (
         <div className="flex flex-wrap gap-2">
           {attachments.map((attachment) => (
             <div
               key={attachment}
               className="flex items-center gap-2 bg-muted rounded-md px-2 py-1 text-sm"
             >
               {getFileIcon(attachment)}
               <button
                 type="button"
                 onClick={() => getDownloadUrl(attachment)}
                 className="hover:underline truncate max-w-[150px]"
               >
                 {getFileName(attachment)}
               </button>
               <button
                 type="button"
                 onClick={() => handleRemove(attachment)}
                 className="text-muted-foreground hover:text-destructive"
                 disabled={disabled}
               >
                 <X className="h-3 w-3" />
               </button>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }