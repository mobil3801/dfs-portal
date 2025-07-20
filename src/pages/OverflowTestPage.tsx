
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  ArrowRight,
  Menu,
  MoreHorizontal,
  Info,
  ChevronLeft,
  ChevronRight } from
'lucide-react';

const OverflowTestPage = () => {
  const [selectedViewport, setSelectedViewport] = useState('desktop');
  const [contentLength, setContentLength] = useState('medium');
  const [tableColumns, setTableColumns] = useState('normal');

  const viewports = {
    mobile: { width: '375px', label: 'Mobile (375px)', icon: Smartphone },
    tablet: { width: '768px', label: 'Tablet (768px)', icon: Tablet },
    laptop: { width: '1024px', label: 'Laptop (1024px)', icon: Laptop },
    desktop: { width: '100%', label: 'Desktop (Full)', icon: Monitor }
  };

  const generateLongText = (length: string) => {
    const texts = {
      short: 'This is a short text example.',
      medium: 'This is a medium length text example that should demonstrate how content flows and potentially overflows on different screen sizes. It includes enough content to show wrapping behavior.',
      long: 'This is a very long text example that should definitely demonstrate how content flows and potentially overflows on different screen sizes. It includes a substantial amount of content to show wrapping behavior, line breaks, and how the layout adapts to different viewport sizes. This text is intentionally verbose to test overflow scenarios in various components and layouts. It should help identify potential issues with text overflow, container sizing, and responsive design implementations across different screen sizes and device types.'
    };
    return texts[length as keyof typeof texts] || texts.medium;
  };

  const generateTableData = (columnCount: string) => {
    const baseColumns = ['ID', 'Name', 'Email', 'Status'];
    const extraColumns = ['Department', 'Role', 'Location', 'Phone', 'Manager', 'Start Date', 'Salary', 'Projects'];

    const columns = columnCount === 'many' ?
    [...baseColumns, ...extraColumns] :
    columnCount === 'extra' ?
    [...baseColumns, ...extraColumns.slice(0, 4)] :
    baseColumns;

    const data = Array.from({ length: 10 }, (_, i) => {
      const row: Record<string, string> = {};
      columns.forEach((col) => {
        row[col] = col === 'ID' ? `${i + 1}` : `${col} ${i + 1}`;
      });
      return row;
    });

    return { columns, data };
  };

  const navigationItems = [
  'Dashboard', 'Products', 'Orders', 'Customers', 'Analytics',
  'Reports', 'Settings', 'Users', 'Billing', 'Support',
  'Documentation', 'API', 'Integrations', 'Webhooks', 'Monitoring'];


  const { columns, data } = generateTableData(tableColumns);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Overflow Behavior Test</h1>
            <Badge variant="outline">Screen Size Testing</Badge>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This page tests overflow behavior across different screen sizes and content scenarios. 
              Use the controls below to simulate different viewports and content lengths.
            </AlertDescription>
          </Alert>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Viewport Size</label>
                <Select value={selectedViewport} onValueChange={setSelectedViewport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(viewports).map(([key, viewport]) => {
                      const Icon = viewport.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {viewport.label}
                          </div>
                        </SelectItem>);

                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content Length</label>
                <Select value={contentLength} onValueChange={setContentLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Table Columns</label>
                <Select value={tableColumns} onValueChange={setTableColumns}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (4 cols)</SelectItem>
                    <SelectItem value="extra">Extra (8 cols)</SelectItem>
                    <SelectItem value="many">Many (12 cols)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Container */}
        <div
          className="border-2 border-dashed border-gray-300 bg-white rounded-lg p-4 transition-all duration-300"
          style={{
            maxWidth: viewports[selectedViewport as keyof typeof viewports].width,
            margin: '0 auto'
          }}>

          <div className="text-center mb-4">
            <Badge variant="secondary">
              Current Viewport: {viewports[selectedViewport as keyof typeof viewports].label}
            </Badge>
          </div>

          <Tabs defaultValue="navigation" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
            </TabsList>

            {/* Navigation Overflow Test */}
            <TabsContent value="navigation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Standard Navigation Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {navigationItems.map((item, index) =>
                      <Button key={index} variant="outline" size="sm" className="whitespace-nowrap">
                          {item}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Standard horizontal scrolling navigation
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Breadcrumb Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {['Home', 'Products', 'Electronics', 'Laptops', 'Gaming Laptops', 'High Performance', 'Current Item'].map((item, index, array) =>
                    <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-sm">{item}</span>
                        {index < array.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Breadcrumb navigation with overflow
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Overflow Test */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Text Content Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{generateLongText(contentLength)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-sm">{generateLongText('long')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Code Block Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32 w-full rounded-md border">
                    <pre className="p-4 text-sm">
                      {`const veryLongVariableName = 'This is a very long line of code that should demonstrate horizontal overflow behavior';
const anotherLongLine = functionWithVeryLongName(parameterWithVeryLongName, anotherParameterWithVeryLongName);
const result = someObject.someProperty.someNestedProperty.someVeryLongMethodName();`}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop"
                        alt="Wide image"
                        className="w-full h-auto" />

                    </div>
                    <div className="overflow-x-auto">
                      <img
                        src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=300&fit=crop"
                        alt="Very wide image"
                        className="h-32 w-auto" />

                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Table Overflow Test */}
            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Table Overflow Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((col) =>
                          <TableHead key={col} className="whitespace-nowrap">
                              {col}
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((row, index) =>
                        <TableRow key={index}>
                            {columns.map((col) =>
                          <TableCell key={col} className="whitespace-nowrap">
                                {row[col]}
                              </TableCell>
                          )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fixed Height Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 w-full rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((col) =>
                          <TableHead key={col} className="whitespace-nowrap">
                              {col}
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, index) =>
                        <TableRow key={index}>
                            {columns.map((col) =>
                          <TableCell key={col} className="whitespace-nowrap">
                                {row[col]}
                              </TableCell>
                          )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cards Overflow Test */}
            <TabsContent value="cards" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Grid Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, i) =>
                    <Card key={i} className="min-w-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base truncate">
                            Card with Very Long Title {i + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {generateLongText('short')}
                          </p>
                          <div className="flex gap-1 mt-2 overflow-x-auto">
                            <Badge variant="secondary">Tag 1</Badge>
                            <Badge variant="secondary">Very Long Tag Name</Badge>
                            <Badge variant="secondary">Tag 3</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Horizontal Card Scroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {Array.from({ length: 10 }, (_, i) =>
                    <Card key={i} className="min-w-[250px] flex-shrink-0">
                        <CardHeader>
                          <CardTitle className="text-base">Card {i + 1}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            This is a fixed-width card in a horizontal scroll container.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forms Overflow Test */}
            <TabsContent value="forms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Form Layout Overflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Very Long Field Label Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter very long placeholder text here" />

                      </div>
                      <div>
                        <label className="text-sm font-medium">Another Long Field</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          placeholder="Short placeholder" />

                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button>Submit</Button>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="outline">Save as Draft</Button>
                      <Button variant="outline">Save and Continue</Button>
                      <Button variant="outline">Reset Form</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Overflow Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Viewport:</span>
                <Badge>{viewports[selectedViewport as keyof typeof viewports].label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Length:</span>
                <Badge variant="outline">{contentLength}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Table Columns:</span>
                <Badge variant="outline">{tableColumns} ({columns.length} columns)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default OverflowTestPage;