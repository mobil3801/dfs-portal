import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Edit3,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Settings,
  Info,
  X,
  MousePointer,
  Keyboard,
  Zap } from
'lucide-react';

interface VisualEditGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const VisualEditGuide: React.FC<VisualEditGuideProps> = ({
  isOpen = false,
  onClose
}) => {
  const [currentTab, setCurrentTab] = useState<'features' | 'permissions' | 'tips'>('features');

  if (!isOpen) return null;

  const features = [
  {
    icon: <Plus className="w-5 h-5 text-blue-600" />,
    title: "Create New Records",
    description: "Add new products, employees, sales reports, and more with comprehensive forms",
    examples: ["Add Product", "Create Employee", "New Sales Report", "Register Vendor"]
  },
  {
    icon: <Pencil className="w-5 h-5 text-yellow-600" />,
    title: "Edit Existing Data",
    description: "Modify any existing records with full field editing capabilities",
    examples: ["Update product prices", "Edit employee details", "Modify sales data", "Change order status"]
  },
  {
    icon: <Trash2 className="w-5 h-5 text-red-600" />,
    title: "Delete Records",
    description: "Remove outdated or incorrect records with confirmation prompts",
    examples: ["Remove old products", "Delete inactive employees", "Archive old reports"]
  },
  {
    icon: <Eye className="w-5 h-5 text-green-600" />,
    title: "View & Search",
    description: "Browse all data with advanced search and filtering options",
    examples: ["Search products by barcode", "Filter employees by station", "Sort sales by date"]
  },
  {
    icon: <FileText className="w-5 h-5 text-purple-600" />,
    title: "Generate Reports",
    description: "Create and print detailed reports for various business needs",
    examples: ["Sales summary reports", "Employee lists", "License status reports"]
  }];


  const permissions = [
  { feature: "Products", create: true, edit: true, delete: true, view: true },
  { feature: "Employees", create: true, edit: true, delete: true, view: true },
  { feature: "Sales Reports", create: true, edit: true, delete: true, view: true },
  { feature: "Vendors", create: true, edit: true, delete: true, view: true },
  { feature: "Orders", create: true, edit: true, delete: true, view: true },
  { feature: "Licenses", create: true, edit: true, delete: true, view: true },
  { feature: "Salary Records", create: true, edit: true, delete: true, view: true },
  { feature: "Inventory Alerts", create: true, edit: true, delete: true, view: true }];


  const tips = [
  {
    icon: <MousePointer className="w-5 h-5 text-blue-600" />,
    title: "Quick Actions",
    tip: "Click any row in tables to quickly access edit options. Look for edit and delete buttons in the Actions column."
  },
  {
    icon: <Keyboard className="w-5 h-5 text-green-600" />,
    title: "Search Shortcuts",
    tip: "Use the search boxes to quickly find specific records. Search works across multiple fields for comprehensive results."
  },
  {
    icon: <Zap className="w-5 h-5 text-yellow-600" />,
    title: "Real-time Updates",
    tip: "All changes are saved immediately and reflected across the system. No need to refresh pages to see updates."
  },
  {
    icon: <Settings className="w-5 h-5 text-purple-600" />,
    title: "Form Validation",
    tip: "All forms include validation to ensure data integrity. Required fields are clearly marked with indicators."
  }];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 border-b">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Visual Editing Guide</span>
            </CardTitle>
            <CardDescription>
              Complete overview of all visual editing capabilities in DFS Manager Portal
            </CardDescription>
          </div>
          {onClose &&
          <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          }
        </CardHeader>

        <div className="flex border-b">
          {[
          { key: 'features', label: 'Features', icon: <Edit3 className="w-4 h-4" /> },
          { key: 'permissions', label: 'Permissions', icon: <Settings className="w-4 h-4" /> },
          { key: 'tips', label: 'Tips', icon: <Info className="w-4 h-4" /> }].
          map((tab) =>
          <Button
            key={tab.key}
            variant={currentTab === tab.key ? "default" : "ghost"}
            className="rounded-none flex-1"
            onClick={() => setCurrentTab(tab.key as any)}>

              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          )}
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {currentTab === 'features' &&
          <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Visual Editing Capabilities</h3>
                <p className="text-gray-600">All features are enabled with complete CRUD operations</p>
              </div>
              
              <div className="grid gap-4">
                {features.map((feature, index) =>
              <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {feature.examples.map((example, idx) =>
                        <Badge key={idx} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                        )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            </div>
          }

          {currentTab === 'permissions' &&
          <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Permission Matrix</h3>
                <p className="text-gray-600">All users have full access to all features</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left font-semibold">Feature</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">Create</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">Edit</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">Delete</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((permission, index) =>
                  <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3 font-medium">{permission.feature}</td>
                        <td className="border border-gray-200 p-3 text-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          }

          {currentTab === 'tips' &&
          <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Tips for Visual Editing</h3>
                <p className="text-gray-600">Make the most of your editing experience</p>
              </div>

              <div className="grid gap-4">
                {tips.map((tip, index) =>
              <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {tip.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                          <p className="text-gray-600 text-sm">{tip.tip}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Info className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Support & Documentation</h4>
                      <p className="text-blue-700 text-sm">
                        Visual editing is fully enabled across all modules. All changes are automatically saved 
                        and synchronized across the system. For advanced features or support, refer to the 
                        built-in help sections in each module.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        </CardContent>

        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Visual Editing Fully Enabled</span>
          </div>
          {onClose &&
          <Button onClick={onClose}>
              Got it
            </Button>
          }
        </div>
      </Card>
    </div>);

};

export default VisualEditGuide;