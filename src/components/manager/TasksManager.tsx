import { useState, useEffect } from 'react';
import { supabase, Task, Site, Profile, Trade } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Filter, Download } from 'lucide-react';
import { exportToCSV, formatDataForExport } from '../../utils/exportToCSV';

export default function TasksManager() {
  const [tasks, setTasks] = useState<(Task & { site: Site; trade?: Trade; assignee?: Profile })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterSite, setFilterSite] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    site_id: '',
    trade_id: '',
    title: '',
    description: '',
    assigned_to: '',
    status: 'todo' as 'todo' | 'in_progress' | 'complete',
  });

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('tasks-manager')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    await Promise.all([loadTasks(), loadSites(), loadTrades(), loadWorkers()]);
    setLoading(false);
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, site:sites(*), trade:trades(*), assignee:profiles!assigned_to(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data as any);
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

  async function loadTrades() {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading trades:', error);
    } else {
      setTrades(data);
    }
  }

  async function loadWorkers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error loading workers:', error);
    } else {
      setWorkers(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const taskData = {
      ...formData,
      trade_id: formData.trade_id || null,
      assigned_to: formData.assigned_to || null,
    };

    if (editingTask) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task');
        return;
      }
    } else {
      const { error } = await supabase.from('tasks').insert(taskData);

      if (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task');
        return;
      }
    }

    resetForm();
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  }

  async function handleDeleteCompleted() {
    const completedTasks = filteredTasks.filter(task => task.status === 'complete');

    if (completedTasks.length === 0) {
      alert('No completed tasks to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${completedTasks.length} completed task(s)?`)) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('status', 'complete')
      .in('id', completedTasks.map(t => t.id));

    if (error) {
      console.error('Error deleting completed tasks:', error);
      alert('Failed to delete completed tasks');
    }
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    setFormData({
      site_id: task.site_id,
      trade_id: task.trade_id || '',
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to || '',
      status: task.status,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      site_id: '',
      trade_id: '',
      title: '',
      description: '',
      assigned_to: '',
      status: 'todo',
    });
    setEditingTask(null);
    setShowForm(false);
  }

  const filteredTasks = tasks.filter(task => {
    if (filterSite && task.site_id !== filterSite) return false;
    if (filterTrade && task.trade_id !== filterTrade) return false;
    if (filterStatus && task.status !== filterStatus) return false;
    return true;
  });

  function handleExport() {
    const exportData = formatDataForExport(filteredTasks.map(task => ({
      ...task,
      sites: { name: task.site.name },
      profiles: { full_name: task.assignee?.full_name }
    })), 'tasks');
    exportToCSV(exportData, 'tasks');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Manage Tasks</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteCompleted}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Completed
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            value={filterTrade}
            onChange={(e) => setFilterTrade(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Trades</option>
            {trades.map(trade => (
              <option key={trade.id} value={trade.id}>{trade.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <h3 className="font-medium text-white mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Site
                </label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Trade
                </label>
                <select
                  value={formData.trade_id}
                  onChange={(e) => setFormData({ ...formData, trade_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                >
                  <option value="">Select a trade (optional)</option>
                  {trades.map(trade => (
                    <option key={trade.id} value={trade.id}>{trade.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Assigned To
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                >
                  <option value="">Unassigned</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name} ({worker.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
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
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
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

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400 bg-slate-600 px-2 py-1 rounded">
                    {task.site.name}
                  </span>
                  {task.trade && (
                    <span className="text-xs font-medium text-orange-300 bg-orange-900/30 px-2 py-1 rounded">
                      {task.trade.name}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    task.status === 'complete' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-600 text-white'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-medium text-white">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-slate-300 mt-1">{task.description}</p>
                )}
                {task.assignee && (
                  <p className="text-xs text-slate-400 mt-2">
                    Assigned to: {task.assignee.full_name}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => startEdit(task)}
                  className="p-2 text-slate-300 hover:text-orange-400 hover:bg-orange-900/30 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-8">No tasks found</p>
        )}
      </div>
    </div>
  );
}
