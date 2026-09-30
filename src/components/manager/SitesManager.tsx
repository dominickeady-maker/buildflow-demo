import { useState, useEffect } from 'react';
import { supabase, Site } from '../../lib/supabase';
import { useSiteLink } from '../../contexts/NavContext';
import { MapPin, Plus, Edit2, Trash2, Download, Users, Briefcase, ChevronDown, ChevronUp, UserPlus, X, Check } from 'lucide-react';
import { exportToCSV, formatDataForExport } from '../../utils/exportToCSV';
import { formatDateUK } from '../../utils/dateFormat';

interface SiteWithDetails extends Site {
  workers?: Array<{ id: string; full_name: string }>;
  tasks?: Array<{ id: string; title: string; status: string; assigned_to: string | null }>;
}

interface OrgWorker {
  id: string;
  full_name: string;
  email: string;
}

export default function SitesManager({ isDemoMode = false }: { isDemoMode?: boolean }) {
  const openSite = useSiteLink();
  const [sites, setSites] = useState<SiteWithDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [orgWorkers, setOrgWorkers] = useState<OrgWorker[]>([]);
  const [assigningSiteId, setAssigningSiteId] = useState<string | null>(null);
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadSites();
    loadOrgWorkers();
  }, []);

  async function loadOrgWorkers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'worker')
      .order('full_name');

    if (error) {
      console.error('Error loading org workers:', error);
    } else {
      setOrgWorkers(data || []);
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
      const sitesWithDetails = await Promise.all(
        (data || []).map(async (site) => {
          const tasks = await loadSiteTasks(site.id);
          const taskWorkerIds = new Set(tasks.map(t => t.assigned_to).filter(Boolean) as string[]);

          // Load directly-assigned workers from site_workers
          const { data: swData } = await supabase
            .from('site_workers')
            .select('worker_id')
            .eq('site_id', site.id);
          const assignedIds = new Set((swData || []).map(sw => sw.worker_id));

          // Combine: workers from tasks + workers from site_workers
          const allWorkerIds = [...new Set([...taskWorkerIds, ...assignedIds])];
          const workers = await loadWorkers(allWorkerIds);

          return {
            ...site,
            tasks,
            workers,
          };
        })
      );
      setSites(sitesWithDetails);
    }
    setLoading(false);
  }

  async function loadSiteTasks(siteId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, assigned_to')
      .eq('site_id', siteId);

    if (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
    return data || [];
  }

  async function loadWorkers(workerIds: string[]) {
    if (workerIds.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', workerIds);

    if (error) {
      console.error('Error loading workers:', error);
      return [];
    }
    return data || [];
  }

  function toggleSiteExpanded(siteId: string) {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
    }
    setExpandedSites(newExpanded);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingSite) {
      const { error } = await supabase
        .from('sites')
        .update(formData)
        .eq('id', editingSite.id);

      if (error) {
        console.error('Error updating site:', error);
        alert('Failed to update site');
        return;
      }
    } else {
      const { error } = await supabase.from('sites').insert(formData);

      if (error) {
        console.error('Error creating site:', error);
        alert('Failed to create site');
        return;
      }
    }

    resetForm();
    loadSites();
  }

  async function openAssignWorkers(siteId: string) {
    setAssigningSiteId(siteId);
    const { data } = await supabase
      .from('site_workers')
      .select('worker_id')
      .eq('site_id', siteId);
    setAssignedWorkerIds(new Set((data || []).map(sw => sw.worker_id)));
  }

  async function toggleWorkerAssignment(siteId: string, workerId: string, isAssigned: boolean) {
    if (isAssigned) {
      await supabase
        .from('site_workers')
        .delete()
        .eq('site_id', siteId)
        .eq('worker_id', workerId);
      setAssignedWorkerIds(prev => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
    } else {
      await supabase
        .from('site_workers')
        .insert({ site_id: siteId, worker_id: workerId });
      setAssignedWorkerIds(prev => {
        const next = new Set(prev);
        next.add(workerId);
        return next;
      });
    }
  }

  function closeAssignWorkers() {
    setAssigningSiteId(null);
    setAssignedWorkerIds(new Set());
    loadSites();
  }

  async function handleDelete(siteId: string) {
    if (!confirm('Are you sure you want to delete this site? This will also delete all associated tasks and materials.')) return;

    const { error } = await supabase.from('sites').delete().eq('id', siteId);

    if (error) {
      console.error('Error deleting site:', error);
      alert('Failed to delete site');
    } else {
      loadSites();
    }
  }

  function startEdit(site: Site) {
    setEditingSite(site);
    setFormData({
      name: site.name,
      description: site.description,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ name: '', description: '' });
    setEditingSite(null);
    setShowForm(false);
  }

  function handleExport() {
    const exportData = formatDataForExport(sites, 'sites');
    exportToCSV(exportData, 'sites');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Manage Sites</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Site
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <h3 className="font-medium text-white mb-4">
            {editingSite ? 'Edit Site' : 'Create New Site'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
                placeholder="e.g., Plot 12, Site A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
                rows={3}
                placeholder="Brief description of the site"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {editingSite ? 'Update Site' : 'Create Site'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {sites.map(site => {
          const isExpanded = expandedSites.has(site.id);
          const activeTasks = site.tasks?.filter(t => t.status !== 'complete') || [];
          const completedTasks = site.tasks?.filter(t => t.status === 'complete') || [];

          return (
            <div key={site.id} className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <button onClick={() => openSite(site.id, site.name)} className="text-left">
                      <h3 className="font-semibold text-white text-lg hover:text-brand-400 transition-colors">{site.name}</h3>
                    </button>
                    {site.description && (
                      <p className="text-sm text-slate-300 mt-1">{site.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => startEdit(site)}
                      className="p-1.5 text-slate-300 hover:text-brand-400 hover:bg-brand-700/30 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!isDemoMode && (
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>{site.workers?.length || 0} worker{site.workers?.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Briefcase className="w-4 h-4 text-green-400" />
                    <span>{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Created {formatDateUK(site.created_at)}
                  </div>
                </div>

                <button
                  onClick={() => toggleSiteExpanded(site.id)}
                  className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-600 bg-slate-800/50 p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        Workers on Site
                      </h4>
                      {!isDemoMode && (
                        <button
                          onClick={() => openAssignWorkers(site.id)}
                          className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Assign Workers
                        </button>
                      )}
                    </div>
                    {site.workers && site.workers.length > 0 ? (
                      <div className="space-y-1">
                        {site.workers.map(worker => (
                          <div key={worker.id} className="text-sm text-slate-300 pl-6">
                            • {worker.full_name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 pl-6">No workers assigned</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-400" />
                      Active Tasks
                    </h4>
                    {activeTasks.length > 0 ? (
                      <div className="space-y-1">
                        {activeTasks.map(task => (
                          <div key={task.id} className="text-sm text-slate-300 pl-6 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              task.status === 'todo' ? 'bg-yellow-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`} />
                            {task.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 pl-6">No active tasks</p>
                    )}
                  </div>

                  {completedTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        Completed Tasks ({completedTasks.length})
                      </h4>
                      <div className="space-y-1">
                        {completedTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="text-sm text-slate-400 pl-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {task.title}
                          </div>
                        ))}
                        {completedTasks.length > 3 && (
                          <p className="text-xs text-slate-500 pl-6">
                            +{completedTasks.length - 3} more completed
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sites.length === 0 && !loading && (
          <div className="col-span-full text-slate-400 text-center py-8">
            No sites found. Create your first site to get started.
          </div>
        )}
      </div>

      {assigningSiteId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAssignWorkers}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Assign Workers</h3>
              <button onClick={closeAssignWorkers} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {orgWorkers.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No workers in your organisation yet. Add workers from the Workers page first.</p>
            ) : (
              <div className="space-y-2">
                {orgWorkers.map(worker => {
                  const isAssigned = assignedWorkerIds.has(worker.id);
                  return (
                    <label
                      key={worker.id}
                      className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleWorkerAssignment(assigningSiteId, worker.id, isAssigned)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isAssigned ? 'bg-brand-500 border-brand-500' : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {isAssigned && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{worker.full_name}</div>
                        <div className="text-xs text-slate-400">{worker.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeAssignWorkers}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
