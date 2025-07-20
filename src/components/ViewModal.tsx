import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import {
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  Hash,
  Clock } from
'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ViewModalField {
  key: string;
  label: string;
  value: any;
  type?: 'text' | 'date' | 'currency' | 'badge' | 'email' | 'phone' | 'boolean' | 'number' | 'custom';
  icon?: React.ComponentType<{className?: string;}>;
  badgeColor?: string;
  hidden?: boolean;
  customComponent?: React.ReactNode;
}

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  fields: ViewModalField[];
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  loading?: boolean;
  subtitle?: string;
}

const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  fields,
  onEdit,
  onDelete,
  onExport,
  canEdit = true,
  canDelete = true,
  canExport = true,
  loading = false,
  subtitle
}) => {
  const formatValue = (field: ViewModalField) => {
    const { value, type, customComponent } = field;

    // Handle custom components first
    if (type === 'custom' && customComponent) {
      return customComponent;
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">N/A</span>;
    }

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);

      case 'badge':
        return (
          <Badge
            className={`${field.badgeColor || 'bg-gray-500'} text-white`}>

            {value}
          </Badge>);


      case 'email':
        return (
          <a
            href={`mailto:${value}`}
            className="text-blue-600 hover:underline flex items-center space-x-1">

            <Mail className="w-3 h-3" />
            <span>{value}</span>
          </a>);


      case 'phone':
        return (
          <a
            href={`tel:${value}`}
            className="text-blue-600 hover:underline flex items-center space-x-1">

            <Phone className="w-3 h-3" />
            <span>{value}</span>
          </a>);


      case 'boolean':
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? 'Yes' : 'No'}
          </Badge>);


      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;

      default:
        return String(value);
    }
  };

  const getFieldIcon = (field: ViewModalField) => {
    if (field.icon) {
      const IconComponent = field.icon;
      return <IconComponent className="w-4 h-4 text-gray-500" />;
    }

    // Default icons based on field type
    switch (field.type) {
      case 'date':
        return <Calendar className="w-4 h-4 text-gray-500" />;
      case 'currency':
        return <DollarSign className="w-4 h-4 text-gray-500" />;
      case 'email':
        return <Mail className="w-4 h-4 text-gray-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-gray-500" />;
      case 'custom':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const visibleFields = fields.filter((field) => !field.hidden);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <AnimatePresence>
          {isOpen &&
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}>

              <DialogHeader className="border-b pb-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                  <div>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    {subtitle &&
                  <DialogDescription className="mt-1">
                        {subtitle}
                      </DialogDescription>
                  }
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto flex-1 modal-scrollbar">
                <div className="space-y-6 py-6 pr-6 min-h-0">
                  {loading ?
                <div className="space-y-4">
                      {[...Array(6)].map((_, i) =>
                  <div key={i} className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
                          </div>
                        </div>
                  )}
                    </div> :

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {visibleFields.map((field, index) => {
                    // Special handling for custom components that should span full width
                    const isFullWidth = field.type === 'custom' && field.key === 'profile_picture';

                    return (
                      <motion.div
                        key={field.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`space-y-2 ${isFullWidth ? 'md:col-span-2' : ''}`}>

                            <div className="flex items-center space-x-2">
                              {getFieldIcon(field)}
                              <span className="text-sm font-medium text-gray-700">
                                {field.label}
                              </span>
                            </div>
                            <div className={`${isFullWidth ? 'flex justify-center' : 'pl-6'}`}>
                              <div className="text-sm text-gray-900 font-medium">
                                {formatValue(field)}
                              </div>
                            </div>
                          </motion.div>);

                  })}
                    </div>
                }
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  
                </div>
                
                <div className="flex items-center space-x-2">
                  {canExport && onExport &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="flex items-center space-x-1">

                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </Button>
                }
                  
                  {canDelete && onDelete &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 flex items-center space-x-1">

                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                }
                  
                  {canEdit && onEdit &&
                <Button
                  size="sm"
                  onClick={onEdit}
                  className="flex items-center space-x-1">

                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                }
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </DialogContent>
    </Dialog>);

};

export default ViewModal;