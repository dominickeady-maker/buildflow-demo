import { useState, useEffect, useRef } from 'react';
import { supabase, Task, Site, Trade, Drawing, Material } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../hooks/useOrganization';
import { Clock, MapPin, FileText, Package, Camera, Upload, Loader2, CheckCircle2, X, ExternalLink } from 'lucide-react';
import heic2any from 'heic2any';
import { processImageForUpload } from '../../utils/imageResize';

export default function WorkerTaskDetail({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [task, setTask] = useState<(Task & { site?: Site; trade?: Trade }) | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll(taskId);
  }, [taskId]);

  async function loadAll(id: string) {
    const [taskRes] = await Promise.all([
      supabase.from('tasks').select('*, site:sites(*), trade:trades(*)').eq('id', id).maybeSingle(),
    ]);

    if (taskRes.data) {
      setTask(taskRes.data as any);
      const siteId = taskRes.data.site_id;

      const [drawingsRes, materialsRes, photosRes] = await Promise.all([
        supabase.from('drawings').select('*').eq('site_id', siteId).order('created_at', { ascending: false }),
        supabase.from('materials').select('*').eq('site_id', siteId).eq('requested_by', user?.id || '').order('created_at', { ascending: false }),
        supabase.from('construction_photos').select('*').eq('task_id', id).order('created_at', { ascending: false }),
      ]);

      if (drawingsRes.data) setDrawings(drawingsRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
      if (photosRes.data) setPhotos(photosRes.data);
    }
    setLoading(false);
  }

  async function updateStatus(newStatus: 'in_progress' | 'complete') {
    if (!task) return;
    setUpdating(true);
    const updateData: any = { status: newStatus };
    if (newStatus === 'complete') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user?.id;
    }
    const { error } = await supabase.from('tasks').update(updateData).eq('id', task.id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
    } else {
      await loadAll(task.id);
    }
    setUpdating(false);
  }

  async function convertHeicToJpeg(file: File): Promise<File> {
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
  }

  async function handlePhotoSelection(files: FileList | null) {
    if (!files || files.length === 0) return;
    const pending: { file: File; previewUrl: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
      if (isHeic) {
        try { file = await convertHeicToJpeg(file); } catch { continue; }
      }
      pending.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPendingPhotos(pending);
    setShowPhotoModal(true);
    setPhotoDescription('');
  }

  async function uploadPhotos() {
    if (pendingPhotos.length === 0 || !user || !organizationId || !task) return;
    setUploading(true);
    for (let i = 0; i < pendingPhotos.length; i++) {
      const { file, previewUrl } = pendingPhotos[i];
      const { full, thumbnail } = await processImageForUpload(file);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fullFileName = `${user.id}/${timestamp}-${random}.jpg`;
      const thumbFileName = `${user.id}/thumbs/${timestamp}-${random}.jpg`;
      const { error: uploadError } = await supabase.storage.from('construction-photos').upload(fullFileName, full, { cacheControl: '3600', upsert: false });
      if (uploadError) { alert(`Upload failed: ${uploadError.message}`); continue; }
      await supabase.storage.from('construction-photos').upload(thumbFileName, thumbnail, { cacheControl: '3600', upsert: false });
      const { data: { publicUrl: fullUrl } } = supabase.storage.from('construction-photos').getPublicUrl(fullFileName);
      const { data: { publicUrl: thumbUrl } } = supabase.storage.from('construction-photos').getPublicUrl(thumbFileName);
      await supabase.from('construction_photos').insert({
        user_id: user.id, organization_id: organizationId, image_url: fullUrl, thumbnail_url: thumbUrl,
        description: photoDescription || null, task_id: task.id,
        issues: [], ai_processing: false,
        metadata: { filename: file.name, size: full.size, type: 'image/jpeg', uploadedAt: new Date().toISOString() },
      });
      URL.revokeObjectURL(previewUrl);
    }
    setUploading(false);
    setPendingPhotos([]);
    setShowPhotoModal(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    await loadAll(task.id);
  }

  function cancelUpload() {
    pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPendingPhotos([]);
    setShowPhotoModal(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  if (loading || !task) {
    return <div className="flex items-center justify-center h-64"><Clock className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Task header */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {task.trade && (
            <span className="text-xs font-medium text-brand-300 bg-brand-900/30 px-2 py-1 rounded">{task.trade.name}</span>
          )}
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            task.status === 'complete' ? 'bg-green-900/50 text-green-400' :
            task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-600 text-white'
          }`}>{task.status.replace('_', ' ')}</span>
          {task.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        </div>
        <h2 className="text-xl font-bold text-white">{task.title}</h2>
        {task.description && <p className="text-sm text-slate-300 mt-2">{task.description}</p>}
      </div>

      {/* Site info as plain text */}
      {task.site && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Site</h3>
          </div>
          <p className="text-white font-medium">{task.site.name}</p>
          {task.site.description && <p className="text-sm text-slate-400 mt-1">{task.site.description}</p>}
        </div>
      )}

      {/* Action buttons */}
      {task.status !== 'complete' && (
        <div className="flex gap-3">
          {task.status === 'todo' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              {updating ? 'Starting...' : 'Start Task'}
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => updateStatus('complete')}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {updating ? 'Completing...' : 'Mark Complete'}
            </button>
          )}
        </div>
      )}

      {/* Drawings for this site */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-white">Drawings</h3>
          <span className="text-sm text-slate-400">({drawings.length})</span>
        </div>
        {drawings.length > 0 ? (
          <div className="space-y-2">
            {drawings.map(d => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-600/50 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{d.title}</p>
                  <p className="text-xs text-slate-400">{d.category} · v{d.version}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No drawings for this site</p>
        )}
      </div>

      {/* Photo upload */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Photos</h3>
          <span className="text-sm text-slate-400">({photos.length})</span>
        </div>
        <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/heic" capture="environment" className="hidden" onChange={(e) => handlePhotoSelection(e.target.files)} multiple />
        <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/heic" className="hidden" onChange={(e) => handlePhotoSelection(e.target.files)} multiple />
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <button onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 text-sm">
            <Camera className="w-4 h-4" /> Take Photo
          </button>
          <button onClick={() => galleryInputRef.current?.click()} disabled={uploading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
        {uploading && <p className="text-sm text-blue-400 mb-2">Uploading...</p>}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
                <img src={p.thumbnail_url || p.image_url} alt={p.description || ''} className="w-full h-full object-cover" loading="lazy" />
                {p.description && <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1"><p className="text-white text-xs line-clamp-1">{p.description}</p></div>}
              </div>
            ))}
          </div>
        )}
        {photos.length === 0 && !uploading && <p className="text-sm text-slate-400">No photos yet for this task</p>}
      </div>

      {/* Material requests */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-white">My Material Requests</h3>
          <span className="text-sm text-slate-400">({materials.length})</span>
        </div>
        {materials.length > 0 ? (
          <div className="space-y-2">
            {materials.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{m.item_name}</p>
                  <p className="text-xs text-slate-400">Qty: {m.quantity}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ml-2 ${
                  m.status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                  m.status === 'ordered' ? 'bg-purple-900/30 text-purple-400' :
                  m.status === 'approved' ? 'bg-blue-900/30 text-blue-400' : 'bg-brand-900/30 text-brand-400'
                }`}>{m.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No material requests for this site</p>
        )}
      </div>

      {/* Photo upload modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Photo Details</h3>
              <button onClick={cancelUpload} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {pendingPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {pendingPhotos.map((p, i) => <img key={i} src={p.previewUrl} alt="" className="w-full aspect-square object-cover rounded-lg" />)}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Description (optional)</label>
              <textarea value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)} placeholder="Add notes..." className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button onClick={cancelUpload} className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600">Cancel</button>
              <button onClick={uploadPhotos} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
