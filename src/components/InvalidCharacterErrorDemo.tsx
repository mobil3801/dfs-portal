import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
  Shield,
  FileText,
  Clipboard } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SafeText, SafeInput, withSafeRendering } from '@/components/SafeRenderer';
import useSafeForm from '@/hooks/use-safe-form';
import {
  sanitizeTextContent,
  sanitizeElementId,
  isValidAttributeValue,
  removeBOM } from
'@/utils/sanitizeHelper';
import {
  safeJSONParse,
  safeClipboard,
  safeFileReader } from
'@/utils/errorPreventionHelper';

const InvalidCharacterErrorDemo: React.FC = () => {
  const { toast } = useToast();
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    passed: boolean;
    message: string;
  }>>([]);

  // Safe form demonstration
  const { formData, updateField, handleSubmit, getFieldProps, hasErrors } = useSafeForm({
    name: '',
    email: '',
    message: ''
  }, {
    onSubmit: async (data) => {
      toast({
        title: 'Form Submitted Safely',
        description: 'All data was sanitized and validated successfully.'
      });
    }
  });

  const problemCharacterExamples = [
  { name: 'Zero Width Space', char: '\u200B', description: 'Invisible character that can break rendering' },
  { name: 'BOM (Byte Order Mark)', char: '\uFEFF', description: 'Can appear at start of files' },
  { name: 'Null Character', char: '\u0000', description: 'Control character that breaks DOM' },
  { name: 'Form Feed', char: '\f', description: 'Control character' },
  { name: 'Vertical Tab', char: '\v', description: 'Control character' },
  { name: 'Delete Character', char: '\u007F', description: 'Control character' }];


  const runCharacterTests = () => {
    const results: Array<{test: string;passed: boolean;message: string;}> = [];

    // Test 1: Basic sanitization
    try {
      const problematicString = 'Hello\u0000World\uFEFF\u200B';
      const sanitized = sanitizeTextContent(problematicString);
      const isClean = !sanitized.includes('\u0000') && !sanitized.includes('\uFEFF');
      results.push({
        test: 'Basic Sanitization',
        passed: isClean,
        message: isClean ? 'Problematic characters removed successfully' : 'Failed to remove problematic characters'
      });
    } catch (error) {
      results.push({
        test: 'Basic Sanitization',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 2: Element ID sanitization
    try {
      const problematicId = 'my-id\u0000with\u200Bproblems';
      const sanitizedId = sanitizeElementId(problematicId);
      const isValidId = /^[a-zA-Z][a-zA-Z0-9\-_]*$/.test(sanitizedId);
      results.push({
        test: 'Element ID Sanitization',
        passed: isValidId,
        message: isValidId ? `Created valid ID: ${sanitizedId}` : `Invalid ID created: ${sanitizedId}`
      });
    } catch (error) {
      results.push({
        test: 'Element ID Sanitization',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 3: Attribute validation
    try {
      const goodAttribute = 'normal-value';
      const badAttribute = 'value\u0000with\u007Fproblems';
      const goodResult = isValidAttributeValue(goodAttribute);
      const badResult = !isValidAttributeValue(badAttribute);
      results.push({
        test: 'Attribute Validation',
        passed: goodResult && badResult,
        message: goodResult && badResult ? 'Correctly identified valid and invalid attributes' : 'Failed to properly validate attributes'
      });
    } catch (error) {
      results.push({
        test: 'Attribute Validation',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 4: BOM removal
    try {
      const bomString = '\uFEFFHello World';
      const cleaned = removeBOM(bomString);
      const bomRemoved = !cleaned.startsWith('\uFEFF');
      results.push({
        test: 'BOM Removal',
        passed: bomRemoved,
        message: bomRemoved ? 'BOM successfully removed' : 'Failed to remove BOM'
      });
    } catch (error) {
      results.push({
        test: 'BOM Removal',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: JSON parsing safety
    try {
      const problematicJSON = '\uFEFF{"key": "value\u0000"}';
      const parsed = safeJSONParse(problematicJSON);
      const success = parsed && typeof parsed === 'object';
      results.push({
        test: 'Safe JSON Parsing',
        passed: success,
        message: success ? 'JSON parsed safely' : 'Failed to parse problematic JSON'
      });
    } catch (error) {
      results.push({
        test: 'Safe JSON Parsing',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setTestResults(results);

    const passedCount = results.filter((r) => r.passed).length;
    toast({
      title: 'Character Safety Tests Complete',
      description: `${passedCount}/${results.length} tests passed`,
      variant: passedCount === results.length ? 'default' : 'destructive'
    });
  };

  const insertProblematicCharacter = (char: string) => {
    setTestInput((prev) => prev + char);
  };

  const testClipboardSafety = async () => {
    try {
      // Test writing potentially problematic content
      const problematicText = 'Test\u0000with\uFEFFproblems\u200B';
      await safeClipboard.write(problematicText);

      // Test reading it back
      const readText = await safeClipboard.read();

      toast({
        title: 'Clipboard Test',
        description: `Successfully wrote and read text. Cleaned: ${readText.length < problematicText.length ? 'Yes' : 'No'}`
      });
    } catch (error) {
      toast({
        title: 'Clipboard Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const testFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    safeFileReader(file).
    then((content) => {
      toast({
        title: 'File Read Successfully',
        description: `Read ${content.length} characters safely`
      });
      setTestInput(content.substring(0, 500)); // Show first 500 chars
    }).
    catch((error) => {
      toast({
        title: 'File Read Failed',
        description: error.message,
        variant: 'destructive'
      });
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>InvalidCharacterError Prevention & Testing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="safe-form">Safe Form</TabsTrigger>
              <TabsTrigger value="utilities">Utilities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  InvalidCharacterError occurs when React tries to create DOM elements with invalid characters.
                  This usually happens with control characters, BOM, or zero-width characters in text content or attributes.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Common Causes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-sm space-y-1">
                      <li>• Copy-pasted text with hidden characters</li>
                      <li>• File content with BOM (Byte Order Mark)</li>
                      <li>• Control characters in form inputs</li>
                      <li>• Invalid characters in element IDs or classes</li>
                      <li>• Corrupted localStorage data</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Solutions Implemented</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-sm space-y-1">
                      <li>• <Badge variant="outline">Sanitization utilities</Badge></li>
                      <li>• <Badge variant="outline">Safe form handling</Badge></li>
                      <li>• <Badge variant="outline">Error boundary protection</Badge></li>
                      <li>• <Badge variant="outline">Input validation</Badge></li>
                      <li>• <Badge variant="outline">Storage cleanup</Badge></li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Problematic Characters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {problemCharacterExamples.map((example, index) =>
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium text-sm">{example.name}</div>
                          <div className="text-xs text-gray-600">{example.description}</div>
                        </div>
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => insertProblematicCharacter(example.char)}>

                          Insert
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Character Safety Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={runCharacterTests} className="w-full">
                    <Code className="w-4 h-4 mr-2" />
                    Run Safety Tests
                  </Button>

                  {testResults.length > 0 &&
                  <div className="space-y-2">
                      {testResults.map((result, index) =>
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`
                      }>

                          {result.passed ?
                      <CheckCircle className="w-5 h-5 text-green-600" /> :

                      <XCircle className="w-5 h-5 text-red-600" />
                      }
                          <div className="flex-1">
                            <div className="font-medium text-sm">{result.test}</div>
                            <div className="text-xs text-gray-600">{result.message}</div>
                          </div>
                        </div>
                    )}
                    </div>
                  }
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Input Area</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="test-input">Test problematic characters here:</Label>
                    <Textarea
                      id="test-input"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Paste or type text with potential problematic characters..."
                      rows={4} />

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Original (may contain problems):</Label>
                      <div className="p-2 bg-red-50 border rounded text-sm font-mono break-all">
                        {testInput || 'No input'}
                      </div>
                    </div>
                    <div>
                      <Label>Sanitized (safe for DOM):</Label>
                      <div className="p-2 bg-green-50 border rounded text-sm font-mono break-all">
                        {sanitizeTextContent(testInput) || 'No input'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safe-form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Safe Form Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="safe-name">Name:</Label>
                      <SafeInput
                        {...getFieldProps('name')}
                        placeholder="Enter your name (will be automatically sanitized)" />

                    </div>

                    <div>
                      <Label htmlFor="safe-email">Email:</Label>
                      <SafeInput
                        {...getFieldProps('email')}
                        type="email"
                        placeholder="Enter your email" />

                    </div>

                    <div>
                      <Label htmlFor="safe-message">Message:</Label>
                      <Textarea
                        {...getFieldProps('message')}
                        placeholder="Enter a message (special characters will be sanitized)"
                        rows={4} />

                    </div>

                    <Button type="submit" disabled={hasErrors}>
                      Submit Safe Form
                    </Button>

                    {hasErrors &&
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Form contains errors. Please check your input.
                        </AlertDescription>
                      </Alert>
                    }
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="utilities" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Clipboard Safety</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={testClipboardSafety} className="w-full">
                      <Clipboard className="w-4 h-4 mr-2" />
                      Test Safe Clipboard Operations
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">File Safety</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="file-test">Test file reading:</Label>
                      <Input
                        id="file-test"
                        type="file"
                        accept=".txt,.json,.csv"
                        onChange={testFileUpload} />

                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Safe Text Rendering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Test safe text rendering:</Label>
                    <Input
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter text to test safe rendering" />

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Regular rendering:</Label>
                      <div className="p-2 border rounded bg-red-50">
                        <span>{testInput}</span>
                      </div>
                    </div>
                    <div>
                      <Label>Safe rendering:</Label>
                      <div className="p-2 border rounded bg-green-50">
                        <SafeText>{testInput}</SafeText>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);

};

export default withSafeRendering(InvalidCharacterErrorDemo);