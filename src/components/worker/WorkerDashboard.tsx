import { useState, useEffect } from 'react';
import { supabase, Task, Site, Trade } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<(Task & { site: Site; trade?: Trade })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('worker-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${profile?.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function loadTasks() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*, site:sites(*), trade:trades(*)')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data as any);
    }
    setLoading(false);
  }

  async function updateTaskStatus(taskId: string, newStatus: 'in_progress' | 'complete') {
    setUpdatingTaskId(taskId);

    const updateData: any = { status: newStatus };
    if (newStatus === 'complete') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = profile?.id;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error.message}`);
    } else {
      await loadTasks();
    }

    setUpdatingTaskId(null);
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'complete');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">To Do</h2>
        {todoTasks.length === 0 ? (
          <p className="text-slate-400 text-sm">No pending tasks</p>
        ) : (
          <div className="space-y-3">
            {todoTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                updating={updatingTaskId === task.id}
                onStatusChange={updateTaskStatus}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">In Progress</h2>
        {inProgressTasks.length === 0 ? (
          <p className="text-slate-400 text-sm">No tasks in progress</p>
        ) : (
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                updating={updatingTaskId === task.id}
                onStatusChange={updateTaskStatus}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Completed</h2>
        {completedTasks.length === 0 ? (
          <p className="text-slate-400 text-sm">No completed tasks</p>
        ) : (
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} updating={false} onStatusChange={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  updating,
  onStatusChange,
}: {
  task: Task & { site: Site; trade?: Trade };
  updating: boolean;
  onStatusChange: (taskId: string, status: 'in_progress' | 'complete') => void;
}) {
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-900/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
              {task.site.name}
            </span>
            {task.trade && (
              <span className="text-xs font-medium text-orange-300 bg-orange-900/30 px-2 py-1 rounded">
                {task.trade.name}
              </span>
            )}
            {task.status === 'complete' && (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            )}
          </div>
          <h3 className="font-medium text-white">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-slate-300 mt-1">{task.description}</p>
          )}
        </div>

        {task.status !== 'complete' && (
          <div className="ml-4 flex gap-2">
            {task.status === 'todo' && (
              <button
                onClick={() => onStatusChange(task.id, 'in_progress')}
                disabled={updating}
                className="px-3 py-1 text-xs font-medium text-blue-200 bg-blue-600/30 hover:bg-blue-600/50 rounded transition-all disabled:opacity-50"
              >
                {updating ? 'Starting...' : 'Start'}
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={() => onStatusChange(task.id, 'complete')}
                disabled={updating}
                className="px-3 py-1 text-xs font-medium text-green-200 bg-green-600/30 hover:bg-green-600/50 rounded transition-all disabled:opacity-50"
              >
                {updating ? 'Completing...' : 'Complete'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
