 import { useEditor, EditorContent } from '@tiptap/react';
 import StarterKit from '@tiptap/starter-kit';
 import Placeholder from '@tiptap/extension-placeholder';
 import { Button } from '@/components/ui/button';
 import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface RichTextEditorProps {
   content: string;
   onChange: (content: string) => void;
   placeholder?: string;
   className?: string;
 }
 
 export function RichTextEditor({ content, onChange, placeholder = 'Write something...', className }: RichTextEditorProps) {
   const editor = useEditor({
     extensions: [
       StarterKit,
       Placeholder.configure({ placeholder }),
     ],
     content,
     onUpdate: ({ editor }) => {
       onChange(editor.getHTML());
     },
     editorProps: {
       attributes: {
         class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
       },
     },
   });
 
   if (!editor) return null;
 
   return (
     <div className={cn('border border-input rounded-md bg-background', className)}>
       <div className="flex items-center gap-1 border-b border-input px-2 py-1 bg-muted/30">
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className={cn('h-7 w-7 p-0', editor.isActive('bold') && 'bg-muted')}
           onClick={() => editor.chain().focus().toggleBold().run()}
         >
           <Bold className="h-4 w-4" />
         </Button>
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className={cn('h-7 w-7 p-0', editor.isActive('italic') && 'bg-muted')}
           onClick={() => editor.chain().focus().toggleItalic().run()}
         >
           <Italic className="h-4 w-4" />
         </Button>
         <div className="w-px h-4 bg-border mx-1" />
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className={cn('h-7 w-7 p-0', editor.isActive('bulletList') && 'bg-muted')}
           onClick={() => editor.chain().focus().toggleBulletList().run()}
         >
           <List className="h-4 w-4" />
         </Button>
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className={cn('h-7 w-7 p-0', editor.isActive('orderedList') && 'bg-muted')}
           onClick={() => editor.chain().focus().toggleOrderedList().run()}
         >
           <ListOrdered className="h-4 w-4" />
         </Button>
         <div className="w-px h-4 bg-border mx-1" />
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className="h-7 w-7 p-0"
           onClick={() => editor.chain().focus().undo().run()}
           disabled={!editor.can().undo()}
         >
           <Undo className="h-4 w-4" />
         </Button>
         <Button
           type="button"
           variant="ghost"
           size="sm"
           className="h-7 w-7 p-0"
           onClick={() => editor.chain().focus().redo().run()}
           disabled={!editor.can().redo()}
         >
           <Redo className="h-4 w-4" />
         </Button>
       </div>
       <EditorContent editor={editor} />
     </div>
   );
 }