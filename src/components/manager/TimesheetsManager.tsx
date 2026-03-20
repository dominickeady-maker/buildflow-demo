import { useState, useEffect } from 'react';
import { supabase, Timesheet, Site, Profile } from '../../lib/supabase';
import { Clock, PoundSterling, Filter, Calendar, Download } from 'lucide-react';
import { exportToCSV, formatDataForExport } from '../../utils/exportToCSV';

export default function TimesheetsManager() {
  const [timesheets, setTimesheets] = useState<(Timesheet & { site: Site; worker: Profile })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('timesheets-manager')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timesheets' },
        () => {
          loadTimesheets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    await Promise.all([loadTimesheets(), loadSites(), loadWorkers()]);
    setLoading(false);
  }

  async function loadTimesheets() {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*, site:sites(*), worker:profiles!worker_id(*)')
      .order('date_worked', { ascending: false });

    if (error) {
      console.error('Error loading timesheets:', error);
    } else {
      setTimesheets(data as any);
    }
  }

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

  async function loadWorkers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('full_name');

    if (error) {
      console.error('Error loading workers:', error);
    } else {
      setWorkers(data);
    }
  }

  const filteredTimesheets = timesheets.filter(entry => {
    if (filterWorker && entry.worker_id !== filterWorker) return false;
    if (filterSite && entry.site_id !== filterSite) return false;
    if (filterWorkType && entry.work_type !== filterWorkType) return false;
    if (filterDateFrom && entry.date_worked < filterDateFrom) return false;
    return true;
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const thisWeekEntries = filteredTimesheets.filter(e => {
    const entryDate = new Date(e.date_worked);
    return entryDate >= weekAgo;
  });

  const totalHoursThisWeek = thisWeekEntries
    .filter(e => e.work_type === 'daywork')
    .reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  const totalPriceThisWeek = thisWeekEntries
    .filter(e => e.work_type === 'price')
    .reduce((sum, e) => sum + (e.pricework_amount || 0), 0);

  const totalHoursAll = filteredTimesheets
    .filter(e => e.work_type === 'daywork')
    .reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  const totalPriceAll = filteredTimesheets
    .filter(e => e.work_type === 'price')
    .reduce((sum, e) => sum + (e.pricework_amount || 0), 0);

  const workerSummary = workers.map(worker => {
    const workerEntries = timesheets.filter(e => e.worker_id === worker.id);
    const dayworkHours = workerEntries
      .filter(e => e.work_type === 'daywork')
      .reduce((sum, e) => sum + (e.hours_worked || 0), 0);
    const priceAmount = workerEntries
      .filter(e => e.work_type === 'price')
      .reduce((sum, e) => sum + (e.pricework_amount || 0), 0);
    return { worker, dayworkHours, priceAmount, entriesCount: workerEntries.length };
  }).filter(s => s.entriesCount > 0);

  function handleExport() {
    const exportData = formatDataForExport(filteredTimesheets.map(timesheet => ({
      ...timesheet,
      sites: { name: timesheet.site.name },
      profiles: { full_name: timesheet.worker.full_name },
      date: timesheet.date_worked,
      hours: timesheet.work_type === 'daywork' ? timesheet.hours_worked : 0,
      notes: timesheet.notes || ''
    })), 'timesheets');
    exportToCSV(exportData, 'timesheets');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Timesheets Overview</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Daywork This Week"
          value={`${totalHoursThisWeek.toFixed(1)} hrs`}
          color="blue"
        />
        <StatCard
          icon={<PoundSterling className="w-5 h-5" />}
          label="Price This Week"
          value={`£${totalPriceThisWeek.toFixed(2)}`}
          color="orange"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Daywork"
          value={`${totalHoursAll.toFixed(1)} hrs`}
          color="slate"
        />
        <StatCard
          icon={<PoundSterling className="w-5 h-5" />}
          label="Total Price"
          value={`£${totalPriceAll.toFixed(2)}`}
          color="green"
        />
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">All Workers Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Worker</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Daywork Hours</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Pricework Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Total Entries</th>
              </tr>
            </thead>
            <tbody>
              {workerSummary.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">No timesheet data</td>
                </tr>
              ) : (
                workerSummary.map(({ worker, dayworkHours, priceAmount, entriesCount }) => (
                  <tr key={worker.id} className="border-b border-slate-600/50 hover:bg-slate-600/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{worker.full_name}</td>
                    <td className="py-3 px-4 text-right text-blue-300">{dayworkHours.toFixed(1)} hrs</td>
                    <td className="py-3 px-4 text-right text-orange-300">£{priceAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{entriesCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Workers</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.full_name}</option>
            ))}
          </select>
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          <select
            value={filterWorkType}
            onChange={(e) => setFilterWorkType(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Work Types</option>
            <option value="price">Price Work</option>
            <option value="daywork">Daywork</option>
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="From Date"
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredTimesheets.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-8">No timesheet entries found</p>
        )}

        {filteredTimesheets.map(entry => (
          <div key={entry.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-900/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                    {entry.site.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    Plot {entry.plot_number}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    entry.work_type === 'daywork'
                      ? 'bg-blue-900/30 text-blue-300'
                      : 'bg-orange-900/30 text-orange-300'
                  }`}>
                    {entry.work_type === 'daywork' ? 'Daywork' : 'Price'}
                  </span>
                </div>
                <h3 className="font-medium text-white">{entry.task_description}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                  <span>Worker: {entry.worker.full_name}</span>
                  <span>Date: {new Date(entry.date_worked).toLocaleDateString()}</span>
                </div>
                {entry.notes && (
                  <p className="text-sm text-slate-400 mt-2">Note: {entry.notes}</p>
                )}
              </div>
              <div className="ml-4 text-right">
                {entry.work_type === 'daywork' ? (
                  <>
                    <div className="text-2xl font-bold text-white">{entry.hours_worked}</div>
                    <div className="text-xs text-slate-400">hours</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">£{entry.pricework_amount?.toFixed(2)}</div>
                    <div className="text-xs text-slate-400">price</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    slate: 'bg-slate-700 text-slate-300 border-slate-600',
    orange: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
    green: 'bg-green-900/30 text-green-400 border-green-800/30',
  }[color];

  return (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <div className="inline-flex p-2 rounded-lg mb-2">
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
