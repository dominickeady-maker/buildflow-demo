import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Save, Loader2, Camera, Type } from 'lucide-react';
import { processImageForUpload } from '../utils/imageResize';

interface ProfileData {
  full_name: string;
  email: string;
  role: string;
}

type TextSize = 'normal' | 'large' | 'extra_large';

export default function AccountProfile() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    role: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    applyTextSize(textSize);
  }, [textSize]);

  function applyTextSize(size: TextSize) {
    const root = document.documentElement;
    root.classList.remove('text-normal', 'text-large', 'text-extra-large');
    if (size === 'large') root.classList.add('text-large');
    else if (size === 'extra_large') root.classList.add('text-extra-large');
  }

  async function loadProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
    } else {
      setProfileData({
        full_name: data.full_name || '',
        email: data.email || '',
        role: data.role || '',
      });
      setAvatarUrl(data.avatar_url || null);
      const size = (data.text_size as TextSize) || 'normal';
      setTextSize(size);
      applyTextSize(size);
    }
    setLoading(false);
  }

  async function handleSaveProfile() {
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    }

    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  async function handleAvatarUpload(file: File) {
    if (!user || isDemoMode) return;
    setUploadingAvatar(true);
    try {
      const { full } = await processImageForUpload(file);
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, full, { cacheControl: '3600', upsert: true });
      if (uploadError) {
        setMessage({ type: 'error', text: 'Failed to upload photo: ' + uploadError.message });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (updateError) {
        setMessage({ type: 'error', text: 'Failed to save photo' });
      } else {
        setAvatarUrl(publicUrl);
        setMessage({ type: 'success', text: 'Profile photo updated' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  async function handleTextSizeChange(size: TextSize) {
    setTextSize(size);
    applyTextSize(size);
    if (!user) return;
    await supabase.from('profiles').update({ text_size: size }).eq('id', user.id);
  }

  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }

    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-brand-500 p-3 rounded-xl shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Account Profile</h2>
          <p className="text-slate-400 text-sm">Manage your account settings</p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-400'
              : 'bg-red-500/20 border border-red-500 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile photo */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Profile Photo</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-slate-600" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center border-2 border-slate-600">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/heic"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar || isDemoMode}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {isDemoMode && <p className="text-xs text-amber-400 mt-1">Disabled in the demo</p>}
          </div>
        </div>
      </div>

      {/* Text size */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Text Size</h3>
        </div>
        <div className="flex gap-3">
          {([
            { value: 'normal', label: 'Normal', sample: 'text-base' },
            { value: 'large', label: 'Large', sample: 'text-lg' },
            { value: 'extra_large', label: 'Extra Large', sample: 'text-xl' },
          ] as { value: TextSize; label: string; sample: string }[]).map(opt => (
            <button
              key={opt.value}
              onClick={() => handleTextSizeChange(opt.value)}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                textSize === opt.value
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className={`font-semibold ${opt.sample}`}>A</div>
              <div className="text-xs mt-1">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Profile Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData({ ...profileData, full_name: e.target.value })
                }
                disabled={isDemoMode}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {isDemoMode && (
                <p className="text-xs text-amber-400 mt-1">Disabled in the demo</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profileData.role}
                disabled
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed capitalize"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving || isDemoMode}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            {isDemoMode && (
              <p className="text-xs text-amber-400">Disabled in the demo</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Change Password</h3>
          </div>

          <div className="space-y-4">
            {isDemoMode && (
              <p className="text-xs text-amber-400">Disabled in the demo</p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Enter new password"
                disabled={isDemoMode}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
                disabled={isDemoMode}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={saving || !passwordData.newPassword || isDemoMode}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
