import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Simulated verification code sent to your email (Mock OTP: 123456)');
    setStep('OTP');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password updated successfully! You can now sign in.');
    setStep('SUCCESS');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto border border-primary-100">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            Recover your civic platform credentials via secure email OTP.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-civic space-y-4">
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Button type="submit" variant="primary" className="w-full">
                Send Verification Code
              </Button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Demo Code: <strong className="font-mono font-bold">123456</strong>
              </div>
              <Input
                label="Enter 6-Digit OTP"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button type="submit" variant="primary" className="w-full">
                Confirm New Password
              </Button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Password Reset Complete</h4>
                <p className="text-xs text-slate-500 mt-1">Your password has been successfully updated.</p>
              </div>
              <Link to="/login" className="block w-full">
                <Button variant="primary" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-danger-600 border border-red-200 flex items-center justify-center mx-auto text-2xl font-black">
          403
        </div>
        <h1 className="text-2xl font-black text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          You do not have administrative or operational credentials to access this workspace. Use the demo role switcher in the bottom-right corner to change your persona.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm">Home Page</Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" size="sm">Switch Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mx-auto text-2xl font-black">
          404
        </div>
        <h1 className="text-2xl font-black text-slate-900">This Civic Road Leads Nowhere</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          The requested page or record could not be found on the NagarSam AI platform. It may have been moved or the URL contains a typo.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm">Return to Safe Roads (Home)</Button>
          </Link>
          <Link to="/map">
            <Button variant="outline" size="sm">Explore Map</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
