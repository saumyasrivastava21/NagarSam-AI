import React from 'react';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Mail, Phone, MapPin, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your message has been logged with the civic support desk.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumbs items={[{ label: 'Contact & Civic Support' }]} />

      <div className="max-w-3xl space-y-2">
        <Badge variant="primary" size="md">Civic Support Helpdesk</Badge>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Civic Support & Municipal Operations Contact
        </h1>
        <p className="text-sm text-slate-600">
          Get in touch with the NagarSam AI platform team or reach emergency road response coordination.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-3 shadow-civic">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Municipal Operations Desk</h4>
                <p className="text-xs text-slate-500">Hazratganj Zone, Lucknow, UP 226001</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 shadow-civic">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary-50 text-secondary-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Emergency Road Dispatch</h4>
                <p className="text-xs text-slate-500">+91 522 2621004 (24x7 Control Room)</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 shadow-civic">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-50 text-accent-700">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Platform Support Email</h4>
                <p className="text-xs text-slate-500">support.nagarsam@example.com</p>
              </div>
            </div>
          </Card>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Demonstration Notice</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              This contact information is simulated for Phase 1 architectural validation. No real emergency calls will be routed.
            </p>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 shadow-civic space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Send an Operational Inquiry</h3>
              <p className="text-xs text-slate-500">We typically review civic queries within 2 operational hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Your Name" required placeholder="Aarav Sharma" />
                <Input label="Email Address" type="email" required placeholder="aarav@example.com" />
              </div>
              <Input label="Subject / Ward Reference" placeholder="Inquiry regarding Gomti Nagar Road Drive" />
              <Textarea label="Message" rows={4} required placeholder="Describe your query or feedback..." />
              <Button type="submit" variant="primary" leftIcon={<Send className="w-4 h-4" />}>
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
