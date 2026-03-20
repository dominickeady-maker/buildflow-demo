import { useState, useEffect, useRef } from 'react';
import { supabase, Drawing, Site } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../hooks/useOrganization';
import { FileText, Upload, Download, Trash2, Eye, Filter, Loader2 } from 'lucide-react';

export default function DrawingsManager() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [drawings, setDrawings] = useState<(Drawing & { site?: Site; uploader?: any })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'General',
    description: '',
    version: '1.0',
    siteId: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Floor Plans',
    'Elevations',
    'Site Plan',
    'Details',
    'Electrical',
    'Plumbing',
    'Structural',
    'General',
  ];

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  async function loadData() {
    await Promise.all([loadDrawings(), loadSites()]);
    setLoading(false);
  }

  async function loadDrawings() {
    if (!organizationId) return;

    const { data, error } = await supabase
      .from('drawings')
      .select('*, site:sites(*), uploader:profiles!uploaded_by(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading drawings:', error);
    } else {
      setDrawings(data as any);
    }
  }

  async function loadSites() {
    if (!organizationId) return;

    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error loading sites:', error);
    } else {
      setSites(data);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/dwg'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|dwg)$/i)) {
      alert('Please upload a valid file type (PDF, PNG, JPG, or DWG)');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setUploadForm({
      ...uploadForm,
      title: file.name.replace(/\.[^/.]+$/, ''),
    });
    setShowUploadModal(true);
  }

  async function handleUploadSubmit() {
    if (!selectedFile || !user || !organizationId) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drawings')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('drawings')
        .insert({
          organization_id: organizationId,
          site_id: uploadForm.siteId || null,
          title: uploadForm.title,
          description: uploadForm.description || null,
          file_url: publicUrl,
          file_type: fileExt || 'unknown',
          file_size: selectedFile.size,
          category: uploadForm.category,
          uploaded_by: user.id,
          version: uploadForm.version,
        });

      if (dbError) throw dbError;

      alert('Drawing uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({
        title: '',
        category: 'General',
        description: '',
        version: '1.0',
        siteId: '',
      });
      loadDrawings();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload drawing: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(drawing: Drawing) {
    if (!confirm(`Delete drawing "${drawing.title}"?`)) return;

    try {
      // Extract file path from URL
      const urlParts = drawing.file_url.split('/');
      const fileName = urlParts.slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('drawings')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('drawings')
        .delete()
        .eq('id', drawing.id);

      if (dbError) throw dbError;

      alert('Drawing deleted successfully!');
      loadDrawings();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete drawing: ${error.message}`);
    }
  }

  const filteredDrawings = drawings.filter(drawing => {
    if (filterSite && drawing.site_id !== filterSite) return false;
    if (filterCategory && drawing.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Drawings</h2>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Drawing
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.dwg"
          onChange={handleFileSelect}
          className="hidden"
        />
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
            className="bg-slate-600 text-white rounded px-3 py-2 text-sm border border-slate-500"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-600 text-white rounded px-3 py-2 text-sm border border-slate-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Site</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Version</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Uploaded By</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Size</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrawings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No drawings uploaded yet
                  </td>
                </tr>
              ) : (
                filteredDrawings.map(drawing => (
                  <tr key={drawing.id} className="border-t border-slate-600 hover:bg-slate-600/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{drawing.title}</div>
                        {drawing.description && (
                          <div className="text-sm text-slate-400">{drawing.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{drawing.category}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {drawing.site?.name || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{drawing.version}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {drawing.uploader?.full_name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {new Date(drawing.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {(drawing.file_size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(drawing.file_url, '_blank')}
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={drawing.file_url}
                          download
                          className="p-1 text-green-400 hover:text-green-300"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(drawing)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Upload Drawing</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  File: {selectedFile?.name}
                </label>
                <p className="text-xs text-slate-400">
                  Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter drawing title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site (Optional)
                </label>
                <select
                  value={uploadForm.siteId}
                  onChange={(e) => setUploadForm({ ...uploadForm, siteId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General (No specific site)</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={uploadForm.version}
                  onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadForm.title}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
