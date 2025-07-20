
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [token, setToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage('Invalid or missing reset token');
      setMessageType('error');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('Invalid reset token');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await window.ezsite.apis.resetPassword({
        token,
        password
      });

      if (error) {
        setMessage(error);
        setMessageType('error');
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
      } else {
        setMessage('Password has been reset successfully! Redirecting to login...');
        setMessageType('success');
        toast({
          title: "Success",
          description: "Password reset successfully"
        });

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
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
              <p className="text-slate-600 font-medium">Reset Your Password</p>
            </div>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-slate-800">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                Enter your new password below
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

              {token ?
              <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" />

                      <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">

                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" />

                      <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">

                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}>

                    {isLoading ?
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :

                  <Lock className="mr-2 h-4 w-4" />
                  }
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </form> :

              <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">Invalid or missing reset token</p>
                </div>
              }

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                  onClick={() => navigate('/login')}>

                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
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

export default ResetPasswordPage;