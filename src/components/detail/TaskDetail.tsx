import { useState, useEffect } from 'react';
import { supabase, Task, Site, Profile, Trade, Material } from '../../lib/supabase';
import { useNav } from '../../contexts/NavContext';
import { Clock, Package, MapPin, UserCheck, ArrowRight } from 'lucide-react';

export default function TaskDetail({ taskId }: { taskId: string }) {
  const { pushView } = useNav();
  const [task, setTask] = useState<(Task & { site?: Site; assignee?: Profile; trade?: Trade }) | null>(null);
  const [materials, setMaterials] = useState<(Material & { site: Site })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData(taskId);
  }, [taskId]);

  async function loadAllData(id: string) {
    const [taskRes] = await Promise.all([
      supabase.from('tasks').select('*, site:sites(*), assignee:profiles!assigned_to(*), trade:trades(*)').eq('id', id).maybeSingle(),
    ]);

    if (taskRes.data) setTask(taskRes.data as any);

    // Try to find materials linked to this task's site
    if (taskRes.data) {
      const { data: siteMaterials } = await supabase
        .from('materials')
        .select('*, site:sites(*)')
        .eq('site_id', taskRes.data.site_id)
        .order('created_at', { ascending: false });
      if (siteMaterials) setMaterials(siteMaterials as any);
    }

    setLoading(false);
  }

  if (loading || !task) {
    return <div className="flex items-center justify-center h-64"><Clock className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          {task.trade && (
            <span className="text-xs font-medium text-brand-300 bg-brand-900/30 px-2 py-1 rounded">{task.trade.name}</span>
          )}
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            task.status === 'complete' ? 'bg-green-900/50 text-green-400' :
            task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' :
            'bg-slate-600 text-white'
          }`}>{task.status.replace('_', ' ')}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{task.title}</h2>
        {task.description && <p className="text-sm text-slate-300 mt-2">{task.description}</p>}
      </div>

      {/* Linked entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Site */}
        {task.site && (
          <button
            onClick={() => pushView({ type: 'site', id: task.site!.id, label: task.site!.name, subTab: 'overview' })}
            className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-left hover:border-brand-500/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Site</h3>
            </div>
            <p className="text-sm text-slate-300">{task.site.name}</p>
            {task.site.description && <p className="text-xs text-slate-500 mt-1">{task.site.description}</p>}
            <div className="flex items-center gap-1 mt-2 text-xs text-brand-400">
              Open site <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        )}

        {/* Assignee */}
        {task.assignee && (
          <button
            onClick={() => pushView({ type: 'worker', id: task.assignee!.id, label: task.assignee!.full_name })}
            className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-left hover:border-brand-500/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold text-white">Assigned To</h3>
            </div>
            <p className="text-sm text-slate-300">{task.assignee.full_name}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{task.assignee.role}</p>
            {task.trade && <p className="text-xs text-slate-500">{task.trade.name}</p>}
            <div className="flex items-center gap-1 mt-2 text-xs text-brand-400">
              Open worker <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        )}
      </div>

      {/* Related materials */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-white">Related Material Requests</h3>
          <span className="text-sm text-slate-400">({materials.length})</span>
        </div>
        <div className="space-y-2">
          {materials.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors">
              <div className="flex-1">
                <span className="text-sm text-slate-300">{m.item_name}</span>
                <span className="text-xs text-slate-500 ml-2">Qty: {m.quantity}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                m.status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                m.status === 'ordered' ? 'bg-purple-900/30 text-purple-400' :
                m.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                'bg-brand-900/30 text-brand-400'
              }`}>{m.status}</span>
            </div>
          ))}
          {materials.length === 0 && <p className="text-sm text-slate-400">No material requests for this site</p>}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Details</h3>
        <div className="space-y-2 text-sm">
          {task.trade && (
            <div className="flex justify-between">
              <span className="text-slate-400">Trade</span>
              <span className="text-white">{task.trade.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="text-white capitalize">{task.status.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Created</span>
            <span className="text-white">{new Date(task.created_at).toLocaleDateString()}</span>
          </div>
          {task.completed_at && (
            <div className="flex justify-between">
              <span className="text-slate-400">Completed</span>
              <span className="text-white">{new Date(task.completed_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
