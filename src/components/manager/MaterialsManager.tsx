import { useState, useEffect } from 'react';
import { supabase, Material, Site, Profile } from '../../lib/supabase';
import { Package, Filter, Download } from 'lucide-react';
import { exportToCSV, formatDataForExport } from '../../utils/exportToCSV';

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<(Material & { site: Site; requester: Profile })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('materials-manager')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => {
          loadMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    await Promise.all([loadMaterials(), loadSites()]);
    setLoading(false);
  }

  async function loadMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*, site:sites(*), requester:profiles!requested_by(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading materials:', error);
    } else {
      setMaterials(data as any);
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

  async function updateStatus(materialId: string, newStatus: 'new' | 'approved' | 'ordered' | 'delivered') {
    const { error } = await supabase
      .from('materials')
      .update({ status: newStatus })
      .eq('id', materialId);

    if (error) {
      console.error('Error updating material status:', error);
      alert(`Failed to update status: ${error.message}`);
    } else {
      await loadMaterials();
    }
  }

  const filteredMaterials = materials.filter(material => {
    if (filterSite && material.site_id !== filterSite) return false;
    if (filterStatus && material.status !== filterStatus) return false;
    return true;
  });

  const statusCounts = {
    new: materials.filter(m => m.status === 'new').length,
    approved: materials.filter(m => m.status === 'approved').length,
    ordered: materials.filter(m => m.status === 'ordered').length,
    delivered: materials.filter(m => m.status === 'delivered').length,
  };

  function handleExport() {
    const exportData = formatDataForExport(filteredMaterials.map(material => ({
      ...material,
      sites: { name: material.site.name },
      profiles: { full_name: material.requester.full_name }
    })), 'materials');
    exportToCSV(exportData, 'materials');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Material Requests</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard label="New" count={statusCounts.new} color="yellow" />
        <StatusCard label="Approved" count={statusCounts.approved} color="blue" />
        <StatusCard label="Ordered" count={statusCounts.ordered} color="purple" />
        <StatusCard label="Delivered" count={statusCounts.delivered} color="green" />
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredMaterials.map(material => (
          <div key={material.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400 bg-slate-600 px-2 py-1 rounded">
                    {material.site.name}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    material.status === 'ordered' ? 'bg-purple-100 text-purple-700' :
                    material.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-300'
                  }`}>
                    {material.status}
                  </span>
                </div>
                <h3 className="font-medium text-white">{material.item_name}</h3>
                <p className="text-sm text-slate-300">
                  Quantity: {material.quantity} {(material as any).unit || ''}
                </p>
                {material.comment && (
                  <p className="text-sm text-slate-300 mt-1">{material.comment}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Requested by: {material.requester.full_name}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(material.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {material.status === 'new' && (
                <>
                  <button
                    onClick={() => updateStatus(material.id, 'approved')}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
              {material.status === 'approved' && (
                <button
                  onClick={() => updateStatus(material.id, 'ordered')}
                  className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                >
                  Mark as Ordered
                </button>
              )}
              {material.status === 'ordered' && (
                <button
                  onClick={() => updateStatus(material.id, 'delivered')}
                  className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredMaterials.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-8">No material requests found</p>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses = {
    yellow: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
    purple: 'bg-purple-900/30 text-purple-400 border-purple-800/30',
    green: 'bg-green-900/30 text-green-400 border-green-800/30',
  }[color];

  return (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <div className="text-2xl font-bold text-white">{count}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}
