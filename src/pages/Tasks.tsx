 import { useEffect, useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Checkbox } from '@/components/ui/checkbox';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { CheckSquare, Plus, Trash2 } from 'lucide-react';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 interface Task {
   id: string;
   title: string;
   description: string | null;
   category: string;
   priority: string;
   status: string;
   due_date: string | null;
   completed_at: string | null;
   created_at: string;
 }
 
 const CATEGORIES = ['clinic', 'hospital', 'research', 'admin', 'personal'];
 const PRIORITIES = ['low', 'medium', 'high'];
 
 export default function Tasks() {
   const { user } = useAuth();
   const [tasks, setTasks] = useState<Task[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [loading, setLoading] = useState(true);
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
 
   // Form state
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [category, setCategory] = useState('clinic');
   const [priority, setPriority] = useState('medium');
   const [dueDate, setDueDate] = useState('');
 
   const fetchTasks = async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('tasks')
       .select('*')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false });
 
     if (data) setTasks(data);
     if (error) toast.error('Failed to load tasks');
     setLoading(false);
   };
 
   useEffect(() => {
     fetchTasks();
   }, [user]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     const { error } = await supabase.from('tasks').insert({
       user_id: user.id,
       title,
       description: description || null,
       category,
       priority,
       due_date: dueDate || null,
       status: 'pending',
     });
 
     if (error) {
       toast.error('Failed to create task');
     } else {
       toast.success('Task created');
       setIsOpen(false);
       setTitle('');
       setDescription('');
       setCategory('clinic');
       setPriority('medium');
       setDueDate('');
       fetchTasks();
     }
   };
 
   const toggleComplete = async (task: Task) => {
     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
     const { error } = await supabase
       .from('tasks')
       .update({ 
         status: newStatus, 
         completed_at: newStatus === 'completed' ? new Date().toISOString() : null 
       })
       .eq('id', task.id);
 
     if (error) {
       toast.error('Failed to update task');
     } else {
       fetchTasks();
     }
   };
 
   const deleteTask = async (id: string) => {
     const { error } = await supabase.from('tasks').delete().eq('id', id);
     if (error) {
       toast.error('Failed to delete task');
     } else {
       toast.success('Task deleted');
       fetchTasks();
     }
   };
 
   const filteredTasks = tasks.filter(t => 
     selectedCategory === 'all' || t.category === selectedCategory
   );
 
   const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
   const completedTasks = filteredTasks.filter(t => t.status === 'completed');
 
   const getPriorityColor = (priority: string) => {
     switch (priority) {
       case 'high': return 'text-destructive';
       case 'medium': return 'text-warning';
       default: return 'text-muted-foreground';
     }
   };
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <CheckSquare className="h-6 w-6 text-primary" />
               Tasks
             </h1>
             <p className="text-muted-foreground">Manage your professional tasks</p>
           </div>
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogTrigger asChild>
               <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                 Add Task
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>New Task</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                 <div>
                   <Label>Title</Label>
                   <Input
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     required
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label>Description</Label>
                   <Input
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="mt-1"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Category</Label>
                     <Select value={category} onValueChange={setCategory}>
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {CATEGORIES.map((c) => (
                           <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label>Priority</Label>
                     <Select value={priority} onValueChange={setPriority}>
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {PRIORITIES.map((p) => (
                           <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div>
                   <Label>Due Date</Label>
                   <Input
                     type="date"
                     value={dueDate}
                     onChange={(e) => setDueDate(e.target.value)}
                     className="mt-1"
                   />
                 </div>
                 <Button type="submit" className="w-full">Create Task</Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Category Filters */}
         <div className="flex flex-wrap gap-2 mb-6">
           <Button
             variant={selectedCategory === 'all' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setSelectedCategory('all')}
           >
             All
           </Button>
           {CATEGORIES.map((c) => (
             <Button
               key={c}
               variant={selectedCategory === c ? 'default' : 'outline'}
               size="sm"
               onClick={() => setSelectedCategory(c)}
               className="capitalize"
             >
               {c}
             </Button>
           ))}
         </div>
 
         <div className="grid lg:grid-cols-2 gap-6">
           {/* Pending */}
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Pending ({pendingTasks.length})</CardTitle>
             </CardHeader>
             <CardContent>
               {pendingTasks.length === 0 ? (
                 <p className="text-muted-foreground text-sm text-center py-4">No pending tasks</p>
               ) : (
                 <div className="space-y-2">
                   {pendingTasks.map((task) => (
                     <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg group">
                       <Checkbox
                         checked={false}
                         onCheckedChange={() => toggleComplete(task)}
                         className="mt-0.5"
                       />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm">{task.title}</p>
                         {task.description && (
                           <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                         )}
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs bg-secondary px-2 py-0.5 rounded capitalize">{task.category}</span>
                           <span className={cn('text-xs', getPriorityColor(task.priority))}>{task.priority}</span>
                           {task.due_date && (
                             <span className="text-xs text-muted-foreground">
                               Due: {format(new Date(task.due_date), 'MMM d')}
                             </span>
                           )}
                         </div>
                       </div>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="opacity-0 group-hover:opacity-100 h-8 w-8"
                         onClick={() => deleteTask(task.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Completed */}
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Completed ({completedTasks.length})</CardTitle>
             </CardHeader>
             <CardContent>
               {completedTasks.length === 0 ? (
                 <p className="text-muted-foreground text-sm text-center py-4">No completed tasks</p>
               ) : (
                 <div className="space-y-2">
                   {completedTasks.slice(0, 10).map((task) => (
                     <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg opacity-70">
                       <Checkbox
                         checked={true}
                         onCheckedChange={() => toggleComplete(task)}
                         className="mt-0.5"
                       />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm line-through">{task.title}</p>
                         <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
       </div>
     </AppLayout>
   );
 }