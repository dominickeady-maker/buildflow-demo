import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Edit2, Trash2, MapPin, Briefcase, Mail, UserCheck } from 'lucide-react';

interface Worker {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  organization_id: string;
}

interface Site {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  site_id: string;
  status: string;
}

export default function WorkersManager() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [workerTasks, setWorkerTasks] = useState<Record<string, Task[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadWorkers(), loadSites()]);
    setLoading(false);
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
      setWorkers(data || []);
      await loadWorkerTasks(data || []);
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
      setSites(data || []);
    }
  }

  async function loadWorkerTasks(workers: Worker[]) {
    const tasksMap: Record<string, Task[]> = {};

    for (const worker of workers) {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, site_id, status')
        .eq('assigned_to', worker.id)
        .in('status', ['todo', 'in_progress']);

      if (!error && data) {
        tasksMap[worker.id] = data;
      }
    }

    setWorkerTasks(tasksMap);
  }

  async function handleAddWorker(e: React.FormEvent) {
    e.preventDefault();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      alert('Failed to create worker account: ' + authError.message);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'worker',
        });

      if (profileError) {
        alert('Failed to create worker profile: ' + profileError.message);
        return;
      }

      resetForm();
      loadWorkers();
    }
  }

  async function handleDeleteWorker(workerId: string) {
    if (!confirm('Are you sure you want to delete this worker?')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', workerId);

    if (error) {
      alert('Failed to delete worker: ' + error.message);
    } else {
      loadWorkers();
    }
  }

  function resetForm() {
    setFormData({ email: '', password: '', full_name: '' });
    setShowForm(false);
  }

  function getSiteNameById(siteId: string) {
    return sites.find(s => s.id === siteId)?.name || 'Unknown Site';
  }

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Manage Workers</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <h3 className="font-medium text-white mb-4">Add New Worker</h3>
          <form onSubmit={handleAddWorker} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Add Worker
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => {
          const tasks = workerTasks[worker.id] || [];
          const activeSites = [...new Set(tasks.map(t => t.site_id))];

          return (
            <div
              key={worker.id}
              className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-orange-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 rounded-full p-2">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{worker.full_name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {worker.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteWorker(worker.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">
                    {activeSites.length === 0
                      ? 'No active sites'
                      : `${activeSites.length} active site${activeSites.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {activeSites.length > 0 && (
                  <div className="pl-6 space-y-1">
                    {activeSites.slice(0, 3).map(siteId => (
                      <p key={siteId} className="text-xs text-slate-400">
                        • {getSiteNameById(siteId)}
                      </p>
                    ))}
                    {activeSites.length > 3 && (
                      <p className="text-xs text-slate-500">
                        +{activeSites.length - 3} more
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Briefcase className="w-4 h-4 text-green-400" />
                  <span className="font-medium">
                    {tasks.length === 0
                      ? 'No active tasks'
                      : `${tasks.length} active task${tasks.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {tasks.length > 0 && (
                  <div className="pl-6 space-y-1">
                    {tasks.slice(0, 2).map(task => (
                      <p key={task.id} className="text-xs text-slate-400">
                        • {task.title}
                      </p>
                    ))}
                    {tasks.length > 2 && (
                      <p className="text-xs text-slate-500">
                        +{tasks.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {workers.length === 0 && (
        <div className="text-center py-12 bg-slate-700 border border-slate-600 rounded-lg">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No workers yet</p>
        </div>
      )}
    </div>
  );
}
