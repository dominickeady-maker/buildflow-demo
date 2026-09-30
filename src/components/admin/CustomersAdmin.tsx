// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { useState, useEffect } from 'react';
import { supabase, Organization } from '../../lib/supabase';
import { Building2, Plus, Users, Edit2, Upload, X, Loader2, Check } from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';

interface CustomerWithCount extends Organization {
  user_count: number;
}

export default function CustomersAdmin() {
  const { branding: _branding } = useBranding();
  const [customers, setCustomers] = useState<CustomerWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    subdomain: '',
    manager_name: '',
    manager_email: '',
    primary_color: '#ff7a2e',
    plan: 'starter',
  });
  const [editData, setEditData] = useState({
    display_name: '',
    subdomain: '',
    primary_color: '#ff7a2e',
    plan: 'starter',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading customers:', error);
      setLoading(false);
      return;
    }

    const orgs = data || [];
    const enriched: CustomerWithCount[] = [];

    for (const org of orgs) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      enriched.push({ ...org, user_count: count || 0 });
    }

    setCustomers(enriched);
    setLoading(false);
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const { data, error } = await supabase.rpc('create_customer', {
        p_company_name: formData.company_name,
        p_subdomain: formData.subdomain,
        p_manager_name: formData.manager_name,
        p_manager_email: formData.manager_email,
        p_primary_color: formData.primary_color,
        p_plan: formData.plan,
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result) throw new Error('No result returned');

      const redirectUrl = `https://${formData.subdomain.replace(/[^a-z0-9]/gi, '').toLowerCase()}.banksman.app/auth/confirm`;

      const inviteResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: formData.manager_email,
          redirect_url: redirectUrl,
        }),
      });

      if (!inviteResponse.ok) {
        const inviteErr = await inviteResponse.json();
        setFormSuccess(`Customer created (account ${result.account_number}). Invite email could not be sent: ${inviteErr.error}. Ask the manager to use "Forgot password" at ${formData.subdomain}.banksman.app.`);
      } else {
        setFormSuccess(`Customer created successfully. Account number: ${result.account_number}. An invite email has been sent to ${formData.manager_email}.`);
      }

      setFormData({
        company_name: '',
        subdomain: '',
        manager_name: '',
        manager_email: '',
        primary_color: '#ff7a2e',
        plan: 'starter',
      });
      setShowForm(false);
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateBranding(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setFormError('');

    try {
      const { error } = await supabase.rpc('update_org_branding', {
        p_org_id: editing.id,
        p_display_name: editData.display_name,
        p_primary_color: editData.primary_color,
        p_subdomain: editData.subdomain,
        p_plan: editData.plan,
      });

      if (error) throw error;

      setEditing(null);
      setFormSuccess('Branding updated successfully.');
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update branding');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogoUpload(file: File, orgId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orgId}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('branding')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setFormError('Logo upload failed: ' + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('branding')
      .getPublicUrl(filePath);

    const { error: rpcError } = await supabase.rpc('update_org_branding', {
      p_org_id: orgId,
      p_logo_url: urlData.publicUrl,
    });

    if (rpcError) {
      setFormError('Failed to save logo URL: ' + rpcError.message);
      return;
    }

    loadCustomers();
  }

  function openEdit(customer: Organization) {
    setEditData({
      display_name: customer.display_name || customer.name,
      subdomain: customer.subdomain || '',
      primary_color: customer.primary_color || '#ff7a2e',
      plan: customer.plan || 'starter',
    });
    setEditing(customer);
    setFormError('');
    setFormSuccess('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Customers</h2>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormSuccess(''); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {formSuccess && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
          {formSuccess}
        </div>
      )}

      {formError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {formError}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Create New Customer</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Subdomain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-l-lg text-white focus:ring-2 focus:ring-brand-500"
                    placeholder="pennine"
                    required
                  />
                  <span className="px-3 py-2 bg-slate-600 border border-l-0 border-slate-600 rounded-r-lg text-slate-300 text-sm whitespace-nowrap">
                    .banksman.app
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Manager Name</label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Manager Email</label>
                <input
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Brand Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-600 bg-slate-900 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Plan</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="starter">Starter (10 users)</option>
                  <option value="growth">Growth (25 users)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Create Customer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Edit Branding — {editing.name}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleUpdateBranding} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {editing.logo_url && (
                  <img src={editing.logo_url} alt="Logo" className="h-12 w-auto rounded border border-slate-600" />
                )}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file, editing.id);
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editData.display_name}
                  onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Subdomain</label>
                <input
                  type="text"
                  value={editData.subdomain}
                  onChange={(e) => setEditData({ ...editData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Brand Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editData.primary_color}
                    onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-600 bg-slate-900 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editData.primary_color}
                    onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Plan</label>
                <select
                  value={editData.plan}
                  onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="starter">Starter (10 users)</option>
                  <option value="growth">Growth (25 users)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Company</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Account</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Subdomain</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Plan</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">Users</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Created</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-600 hover:bg-slate-600/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {customer.logo_url && (
                        <img src={customer.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                      )}
                      <div>
                        <div className="text-white font-medium">{customer.display_name || customer.name}</div>
                        {customer.primary_color && customer.primary_color !== '#ff7a2e' && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: customer.primary_color }} />
                            <span className="text-xs text-slate-400">{customer.primary_color}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-sm">{customer.account_number || '—'}</td>
                  <td className="py-3 px-4 text-slate-300 text-sm">
                    {customer.subdomain ? `${customer.subdomain}.banksman.app` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      customer.plan === 'growth'
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {customer.plan === 'growth' ? 'Growth (25)' : 'Starter (10)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm font-medium ${
                      customer.user_count >= customer.max_users ? 'text-red-400' : 'text-slate-300'
                    }`}>
                      {customer.user_count} / {customer.max_users}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-sm">
                    {new Date(customer.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEdit(customer)}
                      className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No customers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
