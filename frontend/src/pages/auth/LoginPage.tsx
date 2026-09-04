import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { APP_NAME } from '../../constants';
import { Lock, Mail, LogIn, Sparkles, Shield, UserCheck, Wrench, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      redirectRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass2026!');
    setError(null);
    try {
      const user = await login(demoEmail, 'DemoPass2026!');
      toast.success(`Logged in as ${user.role} (${user.name})`);
      redirectRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    }
  };

  const redirectRole = (role: string) => {
    switch (role) {
      case 'OFFICER':
        navigate('/officer');
        break;
      case 'FIELD_WORKER':
        navigate('/worker');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      default:
        navigate('/citizen');
        break;
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            N
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to {APP_NAME}
          </h2>
          <p className="text-xs text-slate-500">
            Access your civic reporting, operational dispatch, or field repair console.
          </p>
        </div>

        {/* Demo Roles Quick-Fill Card */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>1-Click Demo Login</span>
            </span>
            <Badge variant="accent" size="sm">Evaluation Mode</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen@example.com')}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">Citizen</span>
                <span className="block text-[10px] text-slate-400 font-normal">Aarav Sharma</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('officer@example.com')}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:border-primary-400 hover:bg-primary-50/40 text-left transition flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs"
            >
              <Shield className="w-4 h-4 text-primary-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">Officer</span>
                <span className="block text-[10px] text-slate-400 font-normal">Vikramaditya</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('worker@example.com')}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs"
            >
              <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">Field Worker</span>
                <span className="block text-[10px] text-slate-400 font-normal">Rameshwar</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin@example.com')}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs"
            >
              <Settings className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">System Admin</span>
                <span className="block text-[10px] text-slate-400 font-normal">Dr. Priya</span>
              </div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <Card className="p-6 sm:p-8 shadow-civic space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-bold text-primary-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-danger-700 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold shadow-sm"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have a citizen account?{' '}
            <Link to="/register" className="font-bold text-primary-700 hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
