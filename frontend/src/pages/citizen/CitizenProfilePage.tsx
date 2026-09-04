import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTranslation, Language } from '../../i18n';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { User, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const CitizenProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
  const [name, setName] = useState(currentUser?.name || 'Aarav Sharma');
  const [email, setEmail] = useState(currentUser?.email || 'citizen@example.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [preferredLang, setPreferredLang] = useState<Language>(language);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(preferredLang);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name,
        email,
        phone,
      });
    }
    toast.success(preferredLang === 'hi' ? 'प्रोफ़ाइल प्राथमिकताएं सफलतापूर्वक सहेजी गईं।' : 'Profile preferences updated successfully.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Citizen Portal', href: '/citizen' }, { label: 'Profile' }]} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Citizen Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500">
          Manage your contact credentials and notification channels.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-civic space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{email}</p>
            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Verified Citizen Account
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Mobile Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Select
            label="Preferred Portal Language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' },
            ]}
            value={preferredLang}
            onChange={(e) => setPreferredLang(e.target.value as Language)}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {t('btnSave')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
