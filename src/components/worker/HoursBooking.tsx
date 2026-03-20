import { useState, useEffect } from 'react';
import { supabase, Site, Timesheet } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, PoundSterling, Calendar } from 'lucide-react';

export default function HoursBooking() {
  const { profile } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [recentEntries, setRecentEntries] = useState<(Timesheet & { site: Site })[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site_id: '',
    plot_number: '',
    work_type: 'price' as 'price' | 'daywork',
    task_description: '',
    hours_worked: '',
    pricework_amount: '',
    date_worked: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadSites();
    loadRecentEntries();
  }, [profile?.id]);

  async function loadSites() {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading sites:', error);
    } else {
      setSites(data);
    }
  }

  async function loadRecentEntries() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('timesheets')
      .select('*, site:sites(*)')
      .eq('worker_id', profile.id)
      .order('date_worked', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading recent entries:', error);
    } else {
      setRecentEntries(data as any);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    const entryData: any = {
      worker_id: profile.id,
      site_id: formData.site_id,
      plot_number: formData.plot_number,
      work_type: formData.work_type,
      task_description: formData.task_description,
      date_worked: formData.date_worked,
      notes: formData.notes,
    };

    if (formData.work_type === 'daywork') {
      entryData.hours_worked = parseFloat(formData.hours_worked);
      entryData.pricework_amount = null;
    } else {
      entryData.pricework_amount = parseFloat(formData.pricework_amount);
      entryData.hours_worked = null;
    }

    const { error } = await supabase.from('timesheets').insert(entryData);

    if (error) {
      console.error('Error logging hours:', error);
      alert('Failed to log hours');
    } else {
      setFormData({
        site_id: '',
        plot_number: '',
        work_type: 'price',
        task_description: '',
        hours_worked: '',
        pricework_amount: '',
        date_worked: new Date().toISOString().split('T')[0],
        notes: '',
      });
      alert('Hours successfully logged!');
      loadRecentEntries();
    }

    setLoading(false);
  }

  const totalHoursThisWeek = recentEntries
    .filter(e => {
      const entryDate = new Date(e.date_worked);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo && e.work_type === 'daywork';
    })
    .reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  const totalPriceThisWeek = recentEntries
    .filter(e => {
      const entryDate = new Date(e.date_worked);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo && e.work_type === 'price';
    })
    .reduce((sum, e) => sum + (e.pricework_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-900/30 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">This Week</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalHoursThisWeek.toFixed(1)} hrs</div>
          <div className="text-xs text-slate-400">Daywork Hours</div>
        </div>

        <div className="bg-orange-900/30 border border-orange-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-slate-400">This Week</span>
          </div>
          <div className="text-2xl font-bold text-white">£{totalPriceThisWeek.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Price Work</div>
        </div>
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
        <h3 className="font-medium text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Book Price or Daywork
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Site
              </label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
                required
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Plot Number
              </label>
              <input
                type="text"
                value={formData.plot_number}
                onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                placeholder="e.g., Plot 12"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Type of Work
            </label>
            <select
              value={formData.work_type}
              onChange={(e) => setFormData({ ...formData, work_type: e.target.value as 'price' | 'daywork' })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
            >
              <option value="price">Price Work</option>
              <option value="daywork">Daywork</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={formData.task_description}
              onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
              placeholder="e.g., Brickwork foundation"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.work_type === 'daywork' ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Hours (Daywork)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                  placeholder="e.g., 8"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Price Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricework_amount}
                  onChange={(e) => setFormData({ ...formData, pricework_amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                  placeholder="e.g., 450.00"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date Worked
              </label>
              <input
                type="date"
                value={formData.date_worked}
                onChange={(e) => setFormData({ ...formData, date_worked: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
              rows={2}
              placeholder="Any additional information"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Submitting...' : 'Log Hours'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Entries</h3>
        {recentEntries.length === 0 ? (
          <p className="text-slate-400 text-sm">No entries yet</p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div key={entry.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                        {entry.site.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        Plot {entry.plot_number}
                      </span>
                    </div>
                    <h4 className="font-medium text-white">{entry.task_description}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(entry.date_worked).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {entry.work_type === 'daywork' ? (
                      <>
                        <div className="text-lg font-bold text-white">{entry.hours_worked} hrs</div>
                        <div className="text-xs text-slate-400">Daywork</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-white">£{entry.pricework_amount?.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">Price</div>
                      </>
                    )}
                  </div>
                </div>
                {entry.notes && (
                  <p className="text-sm text-slate-400 mt-2">Note: {entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
