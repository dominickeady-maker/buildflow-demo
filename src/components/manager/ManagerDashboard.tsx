import { useState, useEffect } from 'react';
import { supabase, Task, Site, Profile } from '../../lib/supabase';
import { BarChart3, CheckCircle2, Clock, ListTodo } from 'lucide-react';

type SiteStats = {
  site: Site;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
};

export default function ManagerDashboard() {
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboardData() {
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (sitesError) {
      console.error('Error loading sites:', sitesError);
      setLoading(false);
      return;
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (tasksError) {
      console.error('Error loading tasks:', tasksError);
      setLoading(false);
      return;
    }

    const stats: SiteStats[] = sites.map(site => {
      const siteTasks = tasks.filter(t => t.site_id === site.id);
      return {
        site,
        totalTasks: siteTasks.length,
        completedTasks: siteTasks.filter(t => t.status === 'complete').length,
        inProgressTasks: siteTasks.filter(t => t.status === 'in_progress').length,
        todoTasks: siteTasks.filter(t => t.status === 'todo').length,
      };
    });

    setSiteStats(stats);
    setLoading(false);
  }

  const totalTasks = siteStats.reduce((sum, s) => sum + s.totalTasks, 0);
  const totalCompleted = siteStats.reduce((sum, s) => sum + s.completedTasks, 0);
  const totalInProgress = siteStats.reduce((sum, s) => sum + s.inProgressTasks, 0);
  const totalTodo = siteStats.reduce((sum, s) => sum + s.todoTasks, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ListTodo className="w-6 h-6" />}
          label="Total Tasks"
          value={totalTasks}
          color="slate"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="To Do"
          value={totalTodo}
          color="orange"
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="In Progress"
          value={totalInProgress}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="Completed"
          value={totalCompleted}
          color="green"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Site Progress</h2>
        <div className="space-y-4">
          {siteStats.map(stat => (
            <SiteProgressCard key={stat.site.id} stats={stat} />
          ))}
          {siteStats.length === 0 && !loading && (
            <p className="text-slate-400 text-center py-8">No sites found</p>
          )}
        </div>
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
  value: number;
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
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function SiteProgressCard({ stats }: { stats: SiteStats }) {
  const progress = stats.totalTasks > 0
    ? (stats.completedTasks / stats.totalTasks) * 100
    : 0;

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-900/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-white">{stats.site.name}</h3>
          {stats.site.description && (
            <p className="text-sm text-slate-400">{stats.site.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-slate-400">Complete</div>
        </div>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
        <div
          className="bg-gradient-to-r from-orange-600 to-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-slate-300">{stats.todoTasks} To Do</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-300">{stats.inProgressTasks} In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-300">{stats.completedTasks} Complete</span>
        </div>
      </div>
    </div>
  );
}
