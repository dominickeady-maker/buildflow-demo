import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../hooks/useOrganization';
import { supabase } from '../../lib/supabase';
import { Photo, Task } from '../../types/photo';
import { Camera, Upload, Settings, FileText, Image as ImageIcon, Loader2, X, Check, Trash2, Download } from 'lucide-react';
import heic2any from 'heic2any';
import { exportToCSV, formatDataForExport } from '../../utils/exportToCSV';

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

export default function PhotoManager() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
    loadTasks();
  }, [user, organizationId]);

  async function loadPhotos() {
    if (!user || !organizationId) return;

    const { data, error } = await supabase
      .from('construction_photos')
      .select(`
        *,
        tasks:task_id (
          id,
          title,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading photos:', error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }

  async function loadTasks() {
    if (!user || !organizationId) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, site_id, assigned_to')
      .eq('organization_id', organizationId)
      .eq('assigned_to', user.id)
      .in('status', ['todo', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
  }

  async function convertHeicToJpeg(file: File): Promise<File> {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });

      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

      const newFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      return newFile;
    } catch (error) {
      console.error('HEIC conversion error:', error);
      throw new Error('Could not convert HEIC file');
    }
  }

  async function handlePhotoSelection(files: FileList | null) {
    if (!files || files.length === 0) return;

    const pending: PendingPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      let file = files[i];

      // Convert HEIC to JPEG if needed
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
      if (isHeic) {
        try {
          file = await convertHeicToJpeg(file);
        } catch (error) {
          console.error('Error converting HEIC:', error);
          alert(`Could not convert ${file.name}. Please use JPG or PNG format.`);
          continue;
        }
      }

      const previewUrl = URL.createObjectURL(file);
      pending.push({ file, previewUrl });
    }

    setPendingPhotos(pending);
    setShowUploadModal(true);
    setPhotoDescription('');
    setSelectedTaskId('');
  }

  async function uploadPhotos() {
    if (pendingPhotos.length === 0 || !user || !organizationId) return;

    setUploading(true);
    setShowUploadModal(false);
    setUploadProgress(`Uploading ${pendingPhotos.length} photo${pendingPhotos.length > 1 ? 's' : ''}...`);

    try {
      for (let i = 0; i < pendingPhotos.length; i++) {
        const { file, previewUrl } = pendingPhotos[i];
        setUploadProgress(`Uploading photo ${i + 1} of ${pendingPhotos.length}...`);
        setPreviewImage(previewUrl);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('construction-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('construction-photos')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('construction_photos')
          .insert({
            user_id: user.id,
            organization_id: organizationId,
            image_url: publicUrl,
            thumbnail_url: publicUrl,
            description: photoDescription || null,
            task_id: selectedTaskId || null,
            issues: [],
            ai_processing: false,
            metadata: {
              filename: file.name,
              size: file.size,
              type: file.type,
              device: navigator.userAgent,
              uploadedAt: new Date().toISOString(),
            },
          });

        if (dbError) {
          console.error('Database error:', dbError);
          alert(`Failed to save photo: ${dbError.message}`);
        }

        URL.revokeObjectURL(previewUrl);
      }

      setUploadProgress('Upload complete!');
      await loadPhotos();

      setTimeout(() => {
        setPreviewImage(null);
        setUploadProgress('');
      }, 2000);

    } catch (error) {
      console.error('Error handling photos:', error);
      alert('An error occurred while processing photos');
    } finally {
      setUploading(false);
      setPendingPhotos([]);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }

  function cancelUpload() {
    pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPendingPhotos([]);
    setShowUploadModal(false);
    setPhotoDescription('');
    setSelectedTaskId('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  function togglePhotoSelection(photoId: string) {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  async function deleteSelectedPhotos() {
    if (selectedPhotos.size === 0 || !user || !organizationId) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''}? This cannot be undone.`
    );

    if (!confirmDelete) return;

    setUploading(true);
    setUploadProgress(`Deleting ${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''}...`);

    try {
      const photoIds = Array.from(selectedPhotos);

      // Get the storage paths for all selected photos
      const photosToDelete = photos.filter(p => photoIds.includes(p.id));
      const storagePaths = photosToDelete.map(p => {
        const url = new URL(p.image_url);
        const path = url.pathname.split('/storage/v1/object/public/construction-photos/')[1];
        return path;
      });

      // Delete from storage
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('construction-photos')
          .remove(storagePaths);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('construction_photos')
        .delete()
        .in('id', photoIds);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        alert(`Failed to delete photos: ${dbError.message}`);
      } else {
        setSelectedPhotos(new Set());
        await loadPhotos();
        setUploadProgress('');
      }
    } catch (error) {
      console.error('Error deleting photos:', error);
      alert('An error occurred while deleting photos');
    } finally {
      setUploading(false);
    }
  }

  async function generateReport() {
    if (selectedPhotos.size === 0 || !organizationId) return;

    const selectedPhotoArray = Array.from(selectedPhotos);
    const reportTitle = `Construction Report - ${new Date().toLocaleDateString()}`;

    const { error } = await supabase
      .from('photo_reports')
      .insert({
        user_id: user!.id,
        organization_id: organizationId,
        title: reportTitle,
        photo_ids: selectedPhotoArray,
        report_data: {
          summary: `Report containing ${selectedPhotoArray.length} photos`,
          sections: [],
        },
      });

    if (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error.message}`);
    } else {
      alert('Report generated successfully!');
      setSelectedPhotos(new Set());
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Photo Manager</h2>
            <p className="text-slate-400 text-sm">Capture and manage construction photos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const exportData = formatDataForExport(photos.map(photo => ({
                ...photo,
                tasks: (photo as any).tasks,
                profiles: { full_name: 'User' }
              })), 'photos');
              exportToCSV(exportData, 'photos');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload Preview Area */}
      {previewImage && (
        <div className="bg-slate-700/50 rounded-xl p-4 border-2 border-blue-500 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-white font-semibold">{uploadProgress}</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: uploading ? '75%' : '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/heic"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotoSelection(e.target.files)}
          multiple
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/heic"
          className="hidden"
          onChange={(e) => handlePhotoSelection(e.target.files)}
          multiple
        />

        <button
          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Take Photo
            </>
          )}
        </button>

        <button
          className="flex-1 flex items-center justify-center gap-3 bg-slate-700 text-white px-6 py-4 rounded-xl font-semibold border border-slate-600 hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-5 h-5" />
          Upload from Gallery
        </button>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
          <div className="bg-slate-700 rounded-full p-6 mb-4">
            <ImageIcon className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No photos yet</h3>
          <p className="text-slate-400">Tap "Take Photo" to capture your first construction photo</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} total
              {selectedPhotos.size > 0 && ` • ${selectedPhotos.size} selected`}
            </p>
            {selectedPhotos.size > 0 && (
              <button
                onClick={() => setSelectedPhotos(new Set())}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl ${
                  selectedPhotos.has(photo.id) ? 'ring-4 ring-orange-500 scale-95' : ''
                }`}
                onClick={() => togglePhotoSelection(photo.id)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.description || 'Construction photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {photo.ai_processing && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                    AI Processing...
                  </div>
                )}

                {photo.task_id && (photo as any).tasks && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                    Task Linked
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                  {photo.description && (
                    <p className="text-white text-xs mb-1 line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  {photo.task_id && (photo as any).tasks && (
                    <p className="text-blue-300 text-xs mb-1 font-semibold">
                      📋 {(photo as any).tasks.title}
                    </p>
                  )}
                  <p className="text-slate-300 text-xs font-medium">
                    {formatTimestamp(photo.created_at)}
                  </p>
                </div>

                {selectedPhotos.has(photo.id) && (
                  <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-orange-500 rounded-full p-2 shadow-lg">
                      <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Action Buttons */}
      {selectedPhotos.size > 0 && (
        <div className="sticky bottom-0 -mx-6 -mb-6 p-6 bg-gradient-to-t from-slate-900 to-transparent backdrop-blur-md border-t border-slate-700">
          <div className="flex gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-bold shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all"
              onClick={generateReport}
            >
              <FileText className="w-5 h-5" />
              Generate Report ({selectedPhotos.size})
            </button>
            <button
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 transition-all"
              onClick={deleteSelectedPhotos}
              disabled={uploading}
            >
              <Trash2 className="w-5 h-5" />
              Delete ({selectedPhotos.size})
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Photo Details</h3>
              <button
                onClick={cancelUpload}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {pendingPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {pendingPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="Add notes about this photo..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Link to Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No task selected</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                {tasks.length === 0 && (
                  <p className="text-slate-400 text-sm mt-2">
                    No active tasks assigned to you
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelUpload}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={uploadPhotos}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Upload {pendingPhotos.length > 1 ? `${pendingPhotos.length} Photos` : 'Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Photo Quality</h4>
                <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>High Quality (Recommended)</option>
                  <option>Medium Quality</option>
                  <option>Low Quality (Faster uploads)</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">AI Processing</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-slate-700 border-slate-600" />
                  <span className="text-slate-300">Enable automatic AI analysis</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-2">Storage</h4>
                <p className="text-slate-400 text-sm">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} • Unlimited storage
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
