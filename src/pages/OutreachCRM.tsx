import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Users,
  Send,
  Plus,
  Upload,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  GraduationCap,
  Landmark,
  Briefcase,
  Rocket,
  Eye,
  Edit,
  Trash2,
  Play,
  Loader2,
  Search,
  Filter,
  Bot,
  Sparkles,
} from 'lucide-react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AIOutreachResearchPanel, EPIC_CTA_TEMPLATE } from '@/components/outreach/AIOutreachResearchPanel';

interface OutreachContact {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  organization_type: string | null;
  position: string | null;
  country: string | null;
  status: string;
  created_at: string;
}

interface OutreachCampaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  email_subject: string;
  email_body: string;
  sender_name: string;
  sender_email: string;
  target_audience: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface OutreachTemplate {
  id: string;
  name: string;
  template_type: string;
  subject: string;
  body: string;
}

const ORGANIZATION_TYPES = [
  { value: 'university', label: 'University', icon: GraduationCap },
  { value: 'association', label: 'Medical Association', icon: Landmark },
  { value: 'college', label: 'Medical College', icon: Building2 },
  { value: 'investor', label: 'Investor', icon: Briefcase },
  { value: 'entrepreneur', label: 'Entrepreneur', icon: Rocket },
];

const CAMPAIGN_STATUSES = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileText },
  active: { label: 'Active', color: 'bg-blue-500/10 text-blue-500', icon: Play },
  paused: { label: 'Paused', color: 'bg-warning/10 text-warning', icon: Clock },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
};

export default function OutreachCRM() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Dialog states
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  // Form states
  const [newContact, setNewContact] = useState({
    email: '',
    name: '',
    organization: '',
    organization_type: '',
    position: '',
    country: '',
  });

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaign_type: 'general',
    email_subject: '',
    email_body: '',
    sender_name: 'Novus Oriens',
    sender_email: 'orienta@novusoriens.org',
    target_audience: [] as string[],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, contactsRes, templatesRes] = await Promise.all([
        supabase.from('outreach_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('outreach_contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('outreach_templates').select('*').order('created_at', { ascending: false }),
      ]);

      if (campaignsRes.data) setCampaigns(campaignsRes.data as OutreachCampaign[]);
      if (contactsRes.data) setContacts(contactsRes.data as OutreachContact[]);
      if (templatesRes.data) setTemplates(templatesRes.data as OutreachTemplate[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.email) {
      toast.error('Email is required');
      return;
    }

    try {
      const { error } = await supabase.from('outreach_contacts').insert({
        user_id: user?.id,
        ...newContact,
      });

      if (error) throw error;

      toast.success('Contact added');
      setShowAddContact(false);
      setNewContact({ email: '', name: '', organization: '', organization_type: '', position: '', country: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add contact');
    }
  };

  const handleAddCampaign = async () => {
    if (!newCampaign.name || !newCampaign.email_subject || !newCampaign.email_body) {
      toast.error('Name, subject, and body are required');
      return;
    }

    try {
      const { error } = await supabase.from('outreach_campaigns').insert({
        user_id: user?.id,
        ...newCampaign,
      });

      if (error) throw error;

      toast.success('Campaign created');
      setShowAddCampaign(false);
      setNewCampaign({
        name: '',
        campaign_type: 'general',
        email_subject: '',
        email_body: '',
        sender_name: 'Novus Oriens',
        sender_email: 'orienta@novusoriens.org',
        target_audience: [],
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string, testMode = false, testEmail = '') => {
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: result, error } = await invokeEdgeFn<any>('send-outreach-campaign', { campaignId, testMode, testEmail });

      if (error) throw new Error(error);

      if (result?.success) {
        if (testMode) {
          toast.success(`Test email sent to ${testEmail}`);
        } else {
          toast.success(`Campaign sent! ${result.results.sent} emails sent, ${result.results.failed} failed`);
        }
        fetchData();
      } else {
        throw new Error(result.error || 'Send failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await supabase.from('outreach_contacts').delete().eq('id', id);
      toast.success('Contact deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = !searchQuery || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || c.organization_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalContacts: contacts.length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Mail className="h-7 w-7 text-primary" />
              Outreach CRM
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage campaigns and contacts for universities, investors, and medical associations
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalContacts}</p>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ai-research" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Research
            </TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* AI Research Tab */}
          <TabsContent value="ai-research">
            <AIOutreachResearchPanel onComplete={fetchData} />
            
            {/* Quick Create Campaign with Epic Template */}
            {contacts.length > 0 && (
              <Card className="mt-6 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Ready to Launch Epic Campaign
                  </CardTitle>
                  <CardDescription>
                    You have {contacts.length} contacts ready. Create a campaign with the epic call-to-action template.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('outreach_campaigns').insert({
                          user_id: user?.id,
                          name: `Global Healthcare Outreach - ${new Date().toLocaleDateString()}`,
                          campaign_type: 'general',
                          email_subject: EPIC_CTA_TEMPLATE.subject,
                          email_body: EPIC_CTA_TEMPLATE.body,
                          sender_name: 'Novus Oriens',
                          sender_email: 'orienta@novusoriens.org',
                          target_audience: ['investor', 'university', 'association'],
                        });
                        if (error) throw error;
                        toast.success('Epic campaign created! Go to Campaigns tab to send.');
                        setActiveTab('campaigns');
                        fetchData();
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to create campaign');
                      }
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)]"
                  >
                    <Rocket className="h-4 w-4" />
                    Create Epic Campaign with Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Email Campaigns</h2>
              <Dialog open={showAddCampaign} onOpenChange={setShowAddCampaign}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>
                      Create a new outreach email campaign
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Campaign Name</Label>
                        <Input
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                          placeholder="Q1 University Outreach"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Campaign Type</Label>
                        <Select
                          value={newCampaign.campaign_type}
                          onValueChange={(v) => setNewCampaign({ ...newCampaign, campaign_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="university">University</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="association">Association</SelectItem>
                            <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        value={newCampaign.email_subject}
                        onChange={(e) => setNewCampaign({ ...newCampaign, email_subject: e.target.value })}
                        placeholder="Partnership Opportunity - UHS Health OS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body (HTML)</Label>
                      <Textarea
                        value={newCampaign.email_body}
                        onChange={(e) => setNewCampaign({ ...newCampaign, email_body: e.target.value })}
                        placeholder="<p>Dear {{name}},</p><p>We would like to introduce...</p>"
                        rows={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available placeholders: {"{{name}}"}, {"{{organization}}"}, {"{{position}}"}, {"{{email}}"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sender Name</Label>
                        <Input
                          value={newCampaign.sender_name}
                          onChange={(e) => setNewCampaign({ ...newCampaign, sender_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sender Email</Label>
                        <Input
                          value={newCampaign.sender_email}
                          onChange={(e) => setNewCampaign({ ...newCampaign, sender_email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <div className="flex flex-wrap gap-2">
                        {ORGANIZATION_TYPES.map(type => (
                          <Badge
                            key={type.value}
                            variant={newCampaign.target_audience.includes(type.value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = newCampaign.target_audience;
                              const updated = current.includes(type.value)
                                ? current.filter(t => t !== type.value)
                                : [...current, type.value];
                              setNewCampaign({ ...newCampaign, target_audience: updated });
                            }}
                          >
                            <type.icon className="h-3 w-3 mr-1" />
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddCampaign(false)}>Cancel</Button>
                    <Button onClick={handleAddCampaign}>Create Campaign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No campaigns yet. Create your first campaign!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map(campaign => {
                  const statusConfig = CAMPAIGN_STATUSES[campaign.status as keyof typeof CAMPAIGN_STATUSES] || CAMPAIGN_STATUSES.draft;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <Card key={campaign.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{campaign.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {campaign.email_subject}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn('gap-1', statusConfig.color)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                <Badge variant="outline">{campaign.campaign_type}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={sending}
                              >
                                {sending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-1" />
                                    Send
                                  </>
                                )}
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ORGANIZATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>
                      Add a new contact to your outreach list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="contact@university.edu"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          placeholder="Dr. John Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={newContact.position}
                          onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                          placeholder="Dean of Medicine"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Organization</Label>
                        <Input
                          value={newContact.organization}
                          onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })}
                          placeholder="Harvard Medical School"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={newContact.organization_type}
                          onValueChange={(v) => setNewContact({ ...newContact, organization_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORGANIZATION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={newContact.country}
                        onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                        placeholder="Brazil"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
                    <Button onClick={handleAddContact}>Add Contact</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No contacts found. Add your first contact!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map(contact => {
                        const typeConfig = ORGANIZATION_TYPES.find(t => t.value === contact.organization_type);
                        const TypeIcon = typeConfig?.icon || Building2;
                        return (
                          <TableRow key={contact.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{contact.name || 'No name'}</p>
                                <p className="text-sm text-muted-foreground">{contact.email}</p>
                                {contact.position && (
                                  <p className="text-xs text-muted-foreground">{contact.position}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{contact.organization || '-'}</TableCell>
                            <TableCell>
                              {typeConfig && (
                                <Badge variant="outline" className="gap-1">
                                  <TypeIcon className="h-3 w-3" />
                                  {typeConfig.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{contact.country || '-'}</TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteContact(contact.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Email Templates</h2>
              <Button className="gap-2" disabled>
                <Plus className="h-4 w-4" />
                New Template
                <Badge variant="secondary" className="ml-1">Coming Soon</Badge>
              </Button>
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Template library coming soon!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pre-built templates for universities, investors, and medical associations
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}