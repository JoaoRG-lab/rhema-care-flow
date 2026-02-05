 import { useState, useMemo } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { 
   Plus, 
   Search, 
   BookOpen, 
   FileText, 
   Video, 
   Eye,
   EyeOff,
   LayoutGrid,
   List,
 } from 'lucide-react';
 import { useEducationContent } from '@/hooks/useEducationContent';
 import { ContentEditor } from '@/components/education/ContentEditor';
 import { ContentCard } from '@/components/education/ContentCard';
 import { ContentViewer } from '@/components/education/ContentViewer';
 import { EDUCATION_CATEGORIES, type EducationContent } from '@/types/education';
 import { 
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 
 export default function Education() {
   const { content, loading, createContent, updateContent, deleteContent, togglePublish } = useEducationContent();
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
   const [showPublishedOnly, setShowPublishedOnly] = useState(false);
   const [isEditorOpen, setIsEditorOpen] = useState(false);
   const [editingContent, setEditingContent] = useState<EducationContent | null>(null);
   const [viewingContent, setViewingContent] = useState<EducationContent | null>(null);
   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
 
   const filteredContent = useMemo(() => {
     return content.filter(item => {
       const matchesSearch = !searchQuery || 
         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.category.toLowerCase().includes(searchQuery.toLowerCase());
       
       const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
       const matchesPublished = !showPublishedOnly || item.is_published;
       
       return matchesSearch && matchesCategory && matchesPublished;
     });
   }, [content, searchQuery, selectedCategory, showPublishedOnly]);
 
   const stats = useMemo(() => ({
     total: content.length,
     published: content.filter(c => c.is_published).length,
     drafts: content.filter(c => !c.is_published).length,
     featured: content.filter(c => c.is_featured).length,
   }), [content]);
 
   const handleEdit = (item: EducationContent) => {
     setEditingContent(item);
     setIsEditorOpen(true);
   };
 
   const handleCreate = () => {
     setEditingContent(null);
     setIsEditorOpen(true);
   };
 
   const handleDelete = async () => {
     if (deleteConfirmId) {
       await deleteContent(deleteConfirmId);
       setDeleteConfirmId(null);
     }
   };
 
   const handleSave = async (data: any) => {
     if (editingContent) {
       return updateContent({ id: editingContent.id, ...data });
     }
     return createContent(data);
   };
 
   return (
     <AppLayout>
       <div className="p-4 md:p-6 lg:p-8 space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <BookOpen className="h-6 w-6 text-primary" />
               Patient Education
             </h1>
             <p className="text-muted-foreground mt-1">
               Create and manage educational content for patients
             </p>
           </div>
           <Button onClick={handleCreate} className="gap-2">
             <Plus className="h-4 w-4" />
             New Content
           </Button>
         </div>
 
         {/* Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card>
             <CardContent className="pt-4 text-center">
               <p className="text-3xl font-bold text-primary">{stats.total}</p>
               <p className="text-xs text-muted-foreground">Total Content</p>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4 text-center">
               <p className="text-3xl font-bold text-success">{stats.published}</p>
               <p className="text-xs text-muted-foreground">Published</p>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4 text-center">
               <p className="text-3xl font-bold text-warning">{stats.drafts}</p>
               <p className="text-xs text-muted-foreground">Drafts</p>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4 text-center">
               <p className="text-3xl font-bold">{stats.featured}</p>
               <p className="text-xs text-muted-foreground">Featured</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Filters */}
         <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search content..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9"
             />
           </div>
           
           <div className="flex items-center gap-2">
             <Button
               variant={showPublishedOnly ? 'default' : 'outline'}
               size="sm"
               onClick={() => setShowPublishedOnly(!showPublishedOnly)}
               className="gap-1"
             >
               {showPublishedOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
               Published Only
             </Button>
             
             <div className="flex border rounded-md">
               <Button
                 variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                 size="icon"
                 className="h-9 w-9 rounded-r-none"
                 onClick={() => setViewMode('grid')}
               >
                 <LayoutGrid className="h-4 w-4" />
               </Button>
               <Button
                 variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                 size="icon"
                 className="h-9 w-9 rounded-l-none"
                 onClick={() => setViewMode('list')}
               >
                 <List className="h-4 w-4" />
               </Button>
             </div>
           </div>
         </div>
 
         {/* Category Tabs */}
         <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
           <TabsList className="flex-wrap h-auto gap-1 p-1">
             <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
             {EDUCATION_CATEGORIES.map(cat => (
               <TabsTrigger key={cat} value={cat} className="text-xs">
                 {cat}
               </TabsTrigger>
             ))}
           </TabsList>
         </Tabs>
 
         {/* Content Grid/List */}
         {loading ? (
           <div className="text-center py-12 text-muted-foreground">
             Loading content...
           </div>
         ) : filteredContent.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
               <p className="text-muted-foreground">No content found</p>
               <p className="text-sm text-muted-foreground mt-1">
                 {content.length === 0 
                   ? 'Create your first educational article or resource'
                   : 'Try adjusting your search or filters'}
               </p>
               {content.length === 0 && (
                 <Button onClick={handleCreate} className="mt-4 gap-2">
                   <Plus className="h-4 w-4" />
                   Create Content
                 </Button>
               )}
             </CardContent>
           </Card>
         ) : (
           <div className={viewMode === 'grid' 
             ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' 
             : 'space-y-3'
           }>
             {filteredContent.map(item => (
               <ContentCard
                 key={item.id}
                 content={item}
                 onEdit={() => handleEdit(item)}
                 onDelete={() => setDeleteConfirmId(item.id)}
                 onTogglePublish={() => togglePublish(item.id, !item.is_published)}
                 onView={() => setViewingContent(item)}
               />
             ))}
           </div>
         )}
 
         {/* Editor Dialog */}
         <ContentEditor
           open={isEditorOpen}
           onOpenChange={setIsEditorOpen}
           content={editingContent}
           onSave={handleSave}
           onUpdate={(id, data) => updateContent({ id, ...data })}
         />
 
         {/* Viewer Dialog */}
         <ContentViewer
           content={viewingContent}
           open={!!viewingContent}
           onOpenChange={(open) => !open && setViewingContent(null)}
         />
 
         {/* Delete Confirmation */}
         <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Delete Content?</AlertDialogTitle>
               <AlertDialogDescription>
                 This action cannot be undone. This will permanently delete this educational content.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                 Delete
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       </div>
     </AppLayout>
   );
 }