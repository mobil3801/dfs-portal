import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useUserValidation } from '@/hooks/use-user-validation';
import { useDebounce } from '@/hooks/use-debounce';

interface EmailUniquenessCheckerProps {
  email?: string;
  userId?: number;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  autoCheck?: boolean;
  className?: string;
}

const EmailUniquenessChecker: React.FC<EmailUniquenessCheckerProps> = ({
  email: initialEmail = '',
  userId,
  onValidationChange,
  autoCheck = true,
  className = ""
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    checked: boolean;
  }>({ isValid: false, message: '', checked: false });

  const { validateEmail, isValidating } = useUserValidation({ showToasts: false });
  const debouncedEmail = useDebounce(email, 500);

  const checkEmailUniqueness = async (emailToCheck: string) => {
    if (!emailToCheck || !isValidEmail(emailToCheck)) {
      setValidationResult({
        isValid: false,
        message: 'Please enter a valid email address',
        checked: true
      });
      onValidationChange?.(false, 'Invalid email format');
      return;
    }

    try {
      const isValid = await validateEmail(emailToCheck, userId);
      const message = isValid ?
      'Email is available and unique' :
      'Email is already in use';

      setValidationResult({
        isValid,
        message,
        checked: true
      });

      onValidationChange?.(isValid, message);
    } catch (error) {
      const errorMessage = 'Failed to check email uniqueness';
      setValidationResult({
        isValid: false,
        message: errorMessage,
        checked: true
      });
      onValidationChange?.(false, errorMessage);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (initialEmail !== email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (autoCheck && debouncedEmail) {
      checkEmailUniqueness(debouncedEmail);
    }
  }, [debouncedEmail, userId, autoCheck]);

  const handleManualCheck = () => {
    if (email) {
      checkEmailUniqueness(email);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (!validationResult.checked) {
      return <Mail className="h-4 w-4 text-gray-400" />;
    }
    return validationResult.isValid ?
    <CheckCircle className="h-4 w-4 text-green-500" /> :
    <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getValidationBadge = () => {
    if (isValidating) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    if (!validationResult.checked) {
      return <Badge variant="outline">Not Checked</Badge>;
    }
    return (
      <Badge variant={validationResult.isValid ? "default" : "destructive"}>
        {validationResult.isValid ? "Available" : "Unavailable"}
      </Badge>);

  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Uniqueness Checker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-input">Email Address</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationResult((prev) => ({ ...prev, checked: false }));
                }}
                placeholder="Enter email address"
                className="pr-10" />

              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            
            {!autoCheck &&
            <Button
              onClick={handleManualCheck}
              disabled={!email || isValidating}
              variant="outline">

                <Search className="h-4 w-4" />
              </Button>
            }
          </div>
        </div>

        {/* Validation Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Validation Status:</span>
          {getValidationBadge()}
        </div>

        {/* Validation Result */}
        {validationResult.checked &&
        <Alert className={
        validationResult.isValid ?
        "border-green-200 bg-green-50" :
        "border-red-200 bg-red-50"
        }>
            {validationResult.isValid ?
          <CheckCircle className="h-4 w-4 text-green-600" /> :

          <AlertTriangle className="h-4 w-4 text-red-600" />
          }
            <AlertDescription className={
          validationResult.isValid ?
          "text-green-700" :
          "text-red-700"
          }>
              {validationResult.message}
            </AlertDescription>
          </Alert>
        }

        {/* Additional Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Email addresses must be unique across all user accounts</p>
          <p>• System checks both user and employee tables</p>
          <p>• Admin@dfs-portal.com is protected and cannot be duplicated</p>
          {userId && <p>• Checking for user ID: {userId}</p>}
        </div>
      </CardContent>
    </Card>);

};

export default EmailUniquenessChecker;