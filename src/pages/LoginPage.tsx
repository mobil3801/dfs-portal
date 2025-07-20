import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'register' | 'forgot-password';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [lastSubmitTime, setLastSubmitTime] = useState(0); // Debounce rapid submissions

  const { login, register, clearError, authError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear error when switching auth modes or on component mount
  useEffect(() => {
    clearError();
    setMessage('');
  }, [authMode, clearError]);

  // Display auth errors from context
  useEffect(() => {
    if (authError) {
      setMessage(authError);
      setMessageType('error');
    }
  }, [authError]);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
    clearError();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage(''); // Clear previous messages

    try {
      const { error } = await window.ezsite.apis.sendResetPwdEmail({ email });
      if (error) {
        setMessage(error);
        setMessageType('error');
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
      } else {
        setMessage('Password reset link has been sent to your email address');
        setMessageType('success');
        toast({
          title: "Success",
          description: "Password reset link sent to your email"
        });
        setTimeout(() => {
          setAuthMode('login');
          clearForm();
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setMessage(errorMessage);
      setMessageType('error');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid successive submissions (debounce)
    const now = Date.now();
    if (now - lastSubmitTime < 1000) {
      console.log('⏳ Ignoring rapid submission attempt');
      return;
    }
    setLastSubmitTime(now);

    // Clear previous messages and errors
    setMessage('');
    clearError();

    if (authMode === 'forgot-password') {
      return handleForgotPassword(e);
    }

    if (authMode === 'register' && password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        console.log('🔑 Initiating login attempt for:', email);
        const success = await login(email, password);
        if (success) {
          console.log('✅ Login successful, navigating to dashboard');
          toast({
            title: "Welcome back!",
            description: "Successfully logged in"
          });
          navigate('/dashboard');
        } else {
          console.log('❌ Login failed - check authError state');
          // Error will be handled by useEffect watching authError
        }
      } else if (authMode === 'register') {
        const success = await register(email, password, email.split('@')[0]);
        if (success) {
          setMessage('Account created successfully! Please check your email for verification.');
          setMessageType('success');
          toast({
            title: "Account Created",
            description: "Please check your email for verification"
          });
          setTimeout(() => {
            setAuthMode('login');
            clearForm();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setMessage(errorMessage);
      setMessageType('error');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFormTitle = () => {
    switch (authMode) {
      case 'login':return 'Welcome Back';
      case 'register':return 'Create Account';
      case 'forgot-password':return 'Reset Password';
      default:return 'Sign In';
    }
  };

  const getFormDescription = () => {
    switch (authMode) {
      case 'login':return 'Enter your credentials to access the portal';
      case 'register':return 'Create a new account to get started';
      case 'forgot-password':return 'Enter your email to receive a password reset link';
      default:return '';
    }
  };

  const getSubmitButtonText = () => {
    if (isLoading) return 'Please wait...';
    switch (authMode) {
      case 'login':return 'Sign In';
      case 'register':return 'Create Account';
      case 'forgot-password':return 'Send Reset Link';
      default:return 'Submit';
    }
  };

  const getSubmitButtonIcon = () => {
    if (isLoading) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    switch (authMode) {
      case 'login':return <LogIn className="mr-2 h-4 w-4" />;
      case 'register':return <UserPlus className="mr-2 h-4 w-4" />;
      case 'forgot-password':return <Mail className="mr-2 h-4 w-4" />;
      default:return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo and Company Name */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="mb-4 transform hover:scale-105 transition-transform duration-200">
                <Logo className="mb-4" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                DFS Manager Portal
              </h1>
              <p className="text-slate-600 font-medium">Gas Station Management System</p>
            </div>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-slate-800">
                {getFormTitle()}
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                {getFormDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {message &&
              <Alert className={`mb-4 ${messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  {messageType === 'success' ?
                <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                <AlertCircle className="h-4 w-4 text-red-600" />
                }
                  <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message}
                  </AlertDescription>
                </Alert>
              }

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Password Field */}
                {authMode !== 'forgot-password' &&
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                      <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                }

                {/* Confirm Password Field */}
                {authMode === 'register' &&
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                      <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                }

                {/* Forgot Password Link */}
                {authMode === 'login' &&
                <div className="text-right">
                    <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 text-sm"
                    disabled={isLoading}
                    onClick={() => {
                      setAuthMode('forgot-password');
                      setPassword('');
                      setMessage('');
                      clearError();
                    }}>
                      Forgot password?
                    </Button>
                  </div>
                }

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}>
                  {getSubmitButtonIcon()}
                  {getSubmitButtonText()}
                </Button>
              </form>

              {/* Auth Mode Switcher */}
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="text-center space-y-2">
                  {authMode === 'login'













                  }

                  {authMode === 'register' &&
                  <div>
                      <span className="text-sm text-slate-600">Already have an account? </span>
                      <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                      disabled={isLoading}
                      onClick={() => {
                        setAuthMode('login');
                        clearForm();
                      }}>
                        Sign in
                      </Button>
                    </div>
                  }

                  {authMode === 'forgot-password' &&
                  <div>
                      <span className="text-sm text-slate-600">Remember your password? </span>
                      <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                      disabled={isLoading}
                      onClick={() => {
                        setAuthMode('login');
                        clearForm();
                      }}>
                        Sign in
                      </Button>
                    </div>
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-slate-500">
            <p>&copy; 2024 DFS Management Systems. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>);

};

export default LoginPage;