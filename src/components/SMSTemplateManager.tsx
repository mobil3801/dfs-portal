import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Edit, Trash2, Eye, Copy, Loader2, AlertCircle } from 'lucide-react';

interface SMSTemplate {
  ID?: number;
  template_name: string;
  template_type: string;
  message_content: string;
  is_active: boolean;
  priority_level: string;
  character_count: number;
  created_by?: number;
}

interface SMSTemplateManagerProps {
  onTemplateSelected?: (template: SMSTemplate) => void;
}

const TEMPLATE_TYPES = [
  'License Expiry',
  'Inventory Alert',
  'Payment Reminder',
  'Delivery Notification',
  'Emergency Alert',
  'General Notification'
];

const PRIORITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

const PLACEHOLDERS = {
  'License Expiry': [
    '{license_name}',
    '{station}',
    '{expiry_date}',
    '{days_remaining}',
    '{license_number}',
    '{renewal_url}'
  ],
  'Inventory Alert': [
    '{product_name}',
    '{station}',
    '{current_stock}',
    '{minimum_stock}',
    '{reorder_date}'
  ],
  'Payment Reminder': [
    '{vendor_name}',
    '{amount}',
    '{due_date}',
    '{invoice_number}',
    '{days_overdue}'
  ],
  'Delivery Notification': [
    '{delivery_date}',
    '{station}',
    '{product_type}',
    '{quantity}',
    '{bol_number}'
  ],
  'Emergency Alert': [
    '{alert_type}',
    '{station}',
    '{timestamp}',
    '{contact_info}',
    '{action_required}'
  ],
  'General Notification': [
    '{recipient_name}',
    '{station}',
    '{date}',
    '{message_details}',
    '{contact_info}'
  ]
};

const SMSTemplateManager: React.FC<SMSTemplateManagerProps> = ({ onTemplateSelected }) => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SMSTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState<SMSTemplate>({
    template_name: '',
    template_type: 'License Expiry',
    message_content: '',
    is_active: true,
    priority_level: 'Medium',
    character_count: 0
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Update character count when message content changes
    if (editingTemplate) {
      setEditingTemplate(prev => prev ? {
        ...prev,
        character_count: prev.message_content.length
      } : null);
    } else {
      setNewTemplate(prev => ({
        ...prev,
        character_count: prev.message_content.length
      }));
    }
  }, [editingTemplate?.message_content, newTemplate.message_content]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12641, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);
      
      if (data?.List) {
        setTemplates(data.List);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    const template = editingTemplate || newTemplate;
    
    if (!template.template_name || !template.message_content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const templateData = {
        template_name: template.template_name,
        template_type: template.template_type,
        message_content: template.message_content,
        is_active: template.is_active,
        priority_level: template.priority_level,
        character_count: template.message_content.length,
        created_by: 1 // This should be the current user ID
      };

      if (editingTemplate?.ID) {
        const { error } = await window.ezsite.apis.tableUpdate(12641, {
          ID: editingTemplate.ID,
          ...templateData
        });
        if (error) throw new Error(error);
        
        toast({
          title: 'Success',
          description: 'Template updated successfully'
        });
      } else {
        const { error } = await window.ezsite.apis.tableCreate(12641, templateData);
        if (error) throw new Error(error);
        
        toast({
          title: 'Success',
          description: 'Template created successfully'
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setNewTemplate({
        template_name: '',
        template_type: 'License Expiry',
        message_content: '',
        is_active: true,
        priority_level: 'Medium',
        character_count: 0
      });
      
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete(12641, { ID: templateId });
      if (error) throw new Error(error);
      
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
      
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const duplicateTemplate = (template: SMSTemplate) => {
    setNewTemplate({
      template_name: `${template.template_name} (Copy)`,
      template_type: template.template_type,
      message_content: template.message_content,
      is_active: template.is_active,
      priority_level: template.priority_level,
      character_count: template.character_count
    });
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    const template = editingTemplate || newTemplate;
    const newContent = template.message_content + placeholder;
    
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        message_content: newContent
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        message_content: newContent
      });
    }
  };

  const previewTemplateWithSampleData = (template: SMSTemplate): string => {
    let preview = template.message_content;
    const sampleData: Record<string, string> = {
      '{license_name}': 'Business License',
      '{station}': 'MOBIL',
      '{expiry_date}': '2024-12-31',
      '{days_remaining}': '15',
      '{license_number}': 'BL-2024-001',
      '{renewal_url}': 'https://example.com/renew',
      '{product_name}': 'Regular Gas',
      '{current_stock}': '150',
      '{minimum_stock}': '500',
      '{reorder_date}': '2024-03-15',
      '{vendor_name}': 'ABC Suppliers',
      '{amount}': '$1,250.00',
      '{due_date}': '2024-03-20',
      '{invoice_number}': 'INV-2024-001',
      '{days_overdue}': '5',
      '{delivery_date}': '2024-03-10',
      '{product_type}': 'Fuel Delivery',
      '{quantity}': '5000 gallons',
      '{bol_number}': 'BOL-2024-001',
      '{alert_type}': 'Equipment Failure',
      '{timestamp}': '2024-03-10 14:30',
      '{contact_info}': '+1-555-0123',
      '{action_required}': 'Immediate attention required',
      '{recipient_name}': 'John Doe',
      '{date}': '2024-03-10',
      '{message_details}': 'Monthly report available'
    };

    Object.entries(sampleData).forEach(([placeholder, value]) => {
      preview = preview.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  const filteredTemplates = templates.filter(template =>
    template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.message_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Message Templates
              </CardTitle>
              <CardDescription>
                Create and manage customizable SMS templates for different alert types
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({
                    template_name: '',
                    template_type: 'License Expiry',
                    message_content: '',
                    is_active: true,
                    priority_level: 'Medium',
                    character_count: 0
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Design a customizable SMS template with placeholders for dynamic content.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">Template Name *</Label>
                      <Input
                        id="template_name"
                        placeholder="Enter template name"
                        value={editingTemplate?.template_name || newTemplate.template_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingTemplate) {
                            setEditingTemplate({ ...editingTemplate, template_name: value });
                          } else {
                            setNewTemplate({ ...newTemplate, template_name: value });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template_type">Template Type</Label>
                      <Select
                        value={editingTemplate?.template_type || newTemplate.template_type}
                        onValueChange={(value) => {
                          if (editingTemplate) {
                            setEditingTemplate({ ...editingTemplate, template_type: value });
                          } else {
                            setNewTemplate({ ...newTemplate, template_type: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority_level">Priority Level</Label>
                    <Select
                      value={editingTemplate?.priority_level || newTemplate.priority_level}
                      onValueChange={(value) => {
                        if (editingTemplate) {
                          setEditingTemplate({ ...editingTemplate, priority_level: value });
                        } else {
                          setNewTemplate({ ...newTemplate, priority_level: value });
                        }
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message_content">Message Content *</Label>
                      <span className="text-sm text-gray-600">
                        {editingTemplate?.character_count || newTemplate.character_count} characters
                      </span>
                    </div>
                    <Textarea
                      id="message_content"
                      placeholder="Enter your SMS message with placeholders..."
                      rows={4}
                      value={editingTemplate?.message_content || newTemplate.message_content}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (editingTemplate) {
                          setEditingTemplate({ ...editingTemplate, message_content: value });
                        } else {
                          setNewTemplate({ ...newTemplate, message_content: value });
                        }
                      }}
                    />
                    {(editingTemplate?.character_count || newTemplate.character_count) > 160 && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        Message exceeds 160 characters and may be split into multiple SMS
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Available Placeholders</Label>
                    <div className="flex flex-wrap gap-2">
                      {PLACEHOLDERS[editingTemplate?.template_type || newTemplate.template_type]?.map(placeholder => (
                        <Button
                          key={placeholder}
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder(placeholder)}
                        >
                          {placeholder}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editingTemplate?.is_active || newTemplate.is_active}
                      onCheckedChange={(checked) => {
                        if (editingTemplate) {
                          setEditingTemplate({ ...editingTemplate, is_active: checked });
                        } else {
                          setNewTemplate({ ...newTemplate, is_active: checked });
                        }
                      }}
                    />
                    <Label htmlFor="is_active">Active Template</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveTemplate} disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="outline">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Characters</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.ID}>
                      <TableCell className="font-medium">
                        {template.template_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.template_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(template.priority_level)}>
                          {template.priority_level}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.character_count}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? "secondary" : "outline"}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => template.ID && deleteTemplate(template.ID)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm ? 'No templates match your search' : 'No templates created yet'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of "{previewTemplate?.template_name}" with sample data
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Original Template:</div>
                <div className="font-mono text-sm">{previewTemplate.message_content}</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-2">Preview with Sample Data:</div>
                <div className="text-sm">{previewTemplateWithSampleData(previewTemplate)}</div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Character Count: {previewTemplate.character_count}</span>
                <span>SMS Parts: {Math.ceil(previewTemplate.character_count / 160)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMSTemplateManager;
