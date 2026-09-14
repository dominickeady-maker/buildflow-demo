// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { useState, useCallback, useEffect } from 'react';
import { supabase, ProgrammeMilestone } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoMode } from '../../contexts/DemoModeContext';
import {
  Plus, Trash2, Calendar, Loader2, X, ChevronUp, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, Circle, GripVertical, FileDown,
} from 'lucide-react';
import {
  MILESTONE_LIBRARY, NEW_BUILD_PRESET, EXTENSION_PRESET,
} from '../../data/milestoneLibrary';

type MilestoneStatus = 'not_started' | 'due' | 'overdue' | 'complete';

function getMilestoneStatus(target: string | null, actual: string | null): MilestoneStatus {
  if (actual) return 'complete';
  if (!target) return 'not_started';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(target);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'due';
  return 'not_started';
}

const STATUS_CONFIG: Record<MilestoneStatus, {
  label: string;
  chip: string;
  text: string;
  dot: string;
  icon: typeof Circle;
}> = {
  not_started: {
    label: 'Not started',
    chip: 'bg-slate-700/50 text-slate-300 border-slate-600',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
    icon: Circle,
  },
  due: {
    label: 'Due',
    chip: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    chip: 'bg-red-900/40 text-red-300 border-red-700/50',
    text: 'text-red-400',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
  complete: {
    label: 'Complete',
    chip: 'bg-green-900/40 text-green-300 border-green-700/50',
    text: 'text-green-400',
    dot: 'bg-green-500',
    icon: CheckCircle2,
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBC';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateInputValue(dateStr: string | null): string {
  if (!dateStr) return '';
  return dateStr;
}

export default function ProgrammeTab({ siteId, organizationId }: { siteId: string; organizationId: string | null }) {
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const isManager = profile?.role === 'manager';
  const canEdit = isManager && !isDemoMode;
  const orgId = organizationId || profile?.organization_id || null;

  const [milestones, setMilestones] = useState<ProgrammeMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneIsCustom, setNewMilestoneIsCustom] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const loadMilestones = useCallback(async () => {
    const { data, error } = await supabase
      .from('programme_milestones')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error loading programme milestones:', error);
    } else {
      setMilestones((data || []) as ProgrammeMilestone[]);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  async function addMilestone(name: string) {
    const maxOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.sort_order)) : -1;
    const { data, error } = await supabase
      .from('programme_milestones')
      .insert({
        organization_id: orgId,
        site_id: siteId,
        milestone_name: name,
        sort_order: maxOrder + 1,
        target_date: null,
        actual_date: null,
        notes: '',
      })
      .select()
      .single();
    if (error) {
      console.error('Error adding milestone:', error);
    } else {
      setMilestones(prev => [...prev, data as ProgrammeMilestone]);
    }
  }

  async function updateMilestone(id: string, updates: Partial<ProgrammeMilestone>) {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const { error } = await supabase
      .from('programme_milestones')
      .update(updates)
      .eq('id', id);
    if (error) console.error('Error updating milestone:', error);
  }

  async function deleteMilestone(id: string) {
    setMilestones(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase
      .from('programme_milestones')
      .delete()
      .eq('id', id);
    if (error) console.error('Error deleting milestone:', error);
  }

  async function reorderMilestone(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === milestones.length - 1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const a = milestones[index];
    const b = milestones[swapIndex];

    setMilestones(prev => {
      const next = [...prev];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next.map((m, i) => ({ ...m, sort_order: i }));
    });

    await Promise.all([
      supabase.from('programme_milestones').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('programme_milestones').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
  }

  async function handleDragEnd() {
    if (dragIndex === null) return;
    // Persist new sort_order for all milestones
    const updates = milestones.map((m, i) => ({
      id: m.id,
      sort_order: i,
    }));
    await Promise.all(
      updates.map(u => supabase.from('programme_milestones').update({ sort_order: u.sort_order }).eq('id', u.id))
    );
    setDragIndex(null);
  }

  async function loadPreset(preset: 'new_build' | 'extension') {
    setPresetLoading(true);
    const names = preset === 'new_build' ? NEW_BUILD_PRESET : EXTENSION_PRESET;
    const startOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.sort_order)) + 1 : 0;

    const rows = names.map((name, i) => ({
      organization_id: orgId,
      site_id: siteId,
      milestone_name: name,
      sort_order: startOrder + i,
      target_date: null,
      actual_date: null,
      notes: '',
    }));

    const { data, error } = await supabase
      .from('programme_milestones')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error loading preset:', error);
    } else if (data) {
      setMilestones(prev => [...prev, ...(data as ProgrammeMilestone[])]);
    }
    setPresetLoading(false);
    setShowPresetMenu(false);
  }

  // Summary
  const total = milestones.length;
  const complete = milestones.filter(m => m.actual_date).length;
  const overdue = milestones.filter(m => getMilestoneStatus(m.target_date, m.actual_date) === 'overdue').length;
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Programme of Works</h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white font-medium">{complete} of {total} complete</span>
            {overdue > 0 && (
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <AlertTriangle className="w-4 h-4" />
                {overdue} overdue
              </span>
            )}
          </div>
        </div>
        {total > 0 && (
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-brand-600 to-brand-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions bar */}
      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          {!showAddRow && !showPresetMenu && (
            <>
              <button
                onClick={() => { setShowAddRow(true); setNewMilestoneName(''); setNewMilestoneIsCustom(false); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
              <button
                onClick={() => setShowPresetMenu(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors border border-slate-600"
              >
                <FileDown className="w-4 h-4" />
                Load standard programme
              </button>
            </>
          )}
        </div>
      )}

      {/* Preset menu */}
      {showPresetMenu && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Load a standard programme</h3>
            <button onClick={() => setShowPresetMenu(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Adds all milestones with dates left as TBC. Delete what doesn't apply, then add dates.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => loadPreset('new_build')}
              disabled={presetLoading}
              className="flex flex-col items-start gap-1 p-4 bg-slate-800 hover:bg-slate-600 border border-slate-600 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-white">New build</span>
              <span className="text-xs text-slate-400">{NEW_BUILD_PRESET.length} milestones — full build from enabling works to handover</span>
            </button>
            <button
              onClick={() => loadPreset('extension')}
              disabled={presetLoading}
              className="flex flex-col items-start gap-1 p-4 bg-slate-800 hover:bg-slate-600 border border-slate-600 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-white">Extension / renovation</span>
              <span className="text-xs text-slate-400">{EXTENSION_PRESET.length} milestones — from break-out to making good</span>
            </button>
          </div>
          {presetLoading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading milestones...
            </div>
          )}
        </div>
      )}

      {/* Add row form */}
      {showAddRow && canEdit && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">Add a milestone</h3>
            <button onClick={() => setShowAddRow(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          {!newMilestoneIsCustom ? (
            <div className="space-y-3">
              <select
                value={newMilestoneName}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setNewMilestoneIsCustom(true);
                    setNewMilestoneName('');
                  } else {
                    setNewMilestoneName(e.target.value);
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              >
                <option value="">Select a milestone...</option>
                {MILESTONE_LIBRARY.map(phase => (
                  <optgroup key={phase.phase} label={phase.phase}>
                    {phase.milestones.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newMilestoneName) { addMilestone(newMilestoneName); setShowAddRow(false); }
                  }}
                  disabled={!newMilestoneName}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddRow(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                placeholder="Type custom milestone name..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newMilestoneName) { addMilestone(newMilestoneName); setShowAddRow(false); setNewMilestoneIsCustom(false); }
                  }}
                  disabled={!newMilestoneName}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => { setNewMilestoneIsCustom(false); setNewMilestoneName(''); }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  Back to list
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {milestones.length === 0 && !showAddRow && !showPresetMenu && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No programme milestones yet</p>
          <p className="text-slate-500 text-sm mt-1">
            {canEdit
              ? 'Load a standard programme or add milestones one at a time.'
              : "The manager hasn't added a programme yet."}
          </p>
        </div>
      )}

      {/* Desktop table */}
      {milestones.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600 bg-slate-700">
                  {canEdit && <th className="w-10 px-2 py-3" />}
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-3">Milestone</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-3 w-36">Target</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-3 w-36">Actual</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-3 w-28">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-3">Notes</th>
                  {canEdit && <th className="w-20 px-2 py-3" />}
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, index) => {
                  const status = getMilestoneStatus(m.target_date, m.actual_date);
                  const cfg = STATUS_CONFIG[status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-slate-700/50 hover:bg-slate-600/20 ${dragIndex === index ? 'opacity-50' : ''}`}
                      draggable={canEdit}
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== index) {
                        setMilestones(prev => {
                          const next = [...prev];
                          const [moved] = next.splice(dragIndex, 1);
                          next.splice(index, 0, moved);
                          return next.map((mm, i) => ({ ...mm, sort_order: i }));
                        });
                        setDragIndex(index);
                      }}}
                      onDragEnd={handleDragEnd}
                    >
                      {canEdit && (
                        <td className="px-2 py-3 align-middle">
                          <div className="flex flex-col items-center gap-0.5">
                            <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3">
                        {canEdit ? (
                          <InlineEdit
                            value={m.milestone_name}
                            onSave={(v) => updateMilestone(m.id, { milestone_name: v })}
                            displayClass="text-sm text-white font-medium"
                          />
                        ) : (
                          <span className="text-sm text-white font-medium">{m.milestone_name}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {canEdit ? (
                          <input
                            type="date"
                            value={dateInputValue(m.target_date)}
                            onChange={(e) => updateMilestone(m.id, { target_date: e.target.value || null })}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                          />
                        ) : (
                          <span className="text-sm text-slate-300">{formatDate(m.target_date)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {canEdit ? (
                          <input
                            type="date"
                            value={dateInputValue(m.actual_date)}
                            onChange={(e) => updateMilestone(m.id, { actual_date: e.target.value || null })}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                          />
                        ) : (
                          <span className="text-sm text-slate-300">{formatDate(m.actual_date)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${cfg.chip}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {canEdit ? (
                          <input
                            type="text"
                            value={m.notes}
                            onChange={(e) => updateMilestone(m.id, { notes: e.target.value })}
                            placeholder="—"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                          />
                        ) : (
                          <span className="text-sm text-slate-400">{m.notes || '—'}</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => reorderMilestone(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-500 hover:text-brand-400 disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => reorderMilestone(index, 'down')}
                              disabled={index === milestones.length - 1}
                              className="p-1 text-slate-500 hover:text-brand-400 disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMilestone(m.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {milestones.map((m, index) => {
              const status = getMilestoneStatus(m.target_date, m.actual_date);
              const cfg = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              return (
                <div key={m.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                  {/* Milestone name + status chip */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {canEdit && (
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => reorderMilestone(index, 'up')}
                            disabled={index === 0}
                            className="text-slate-500 hover:text-brand-400 disabled:opacity-20"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => reorderMilestone(index, 'down')}
                            disabled={index === milestones.length - 1}
                            className="text-slate-500 hover:text-brand-400 disabled:opacity-20"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {canEdit ? (
                        <InlineEdit
                          value={m.milestone_name}
                          onSave={(v) => updateMilestone(m.id, { milestone_name: v })}
                          displayClass="text-sm text-white font-bold flex-1"
                        />
                      ) : (
                        <span className="text-sm text-white font-bold flex-1">{m.milestone_name}</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.chip} flex-shrink-0`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Target</div>
                      {canEdit ? (
                        <input
                          type="date"
                          value={dateInputValue(m.target_date)}
                          onChange={(e) => updateMilestone(m.id, { target_date: e.target.value || null })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">{formatDate(m.target_date)}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Actual</div>
                      {canEdit ? (
                        <input
                          type="date"
                          value={dateInputValue(m.actual_date)}
                          onChange={(e) => updateMilestone(m.id, { actual_date: e.target.value || null })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">{formatDate(m.actual_date)}</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    {canEdit ? (
                      <input
                        type="text"
                        value={m.notes}
                        onChange={(e) => updateMilestone(m.id, { notes: e.target.value })}
                        placeholder="Notes..."
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                      />
                    ) : (
                      m.notes && <p className="text-xs text-slate-400">{m.notes}</p>
                    )}
                  </div>

                  {/* Delete on mobile */}
                  {canEdit && (
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Demo notice */}
      {isDemoMode && milestones.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Viewing in demo mode — editing is disabled.</span>
        </div>
      )}
    </div>
  );
}

// --- Inline text edit for milestone names ---
function InlineEdit({ value, onSave, displayClass }: { value: string; onSave: (v: string) => void; displayClass: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft.trim()) onSave(draft.trim()); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { if (draft.trim()) onSave(draft.trim()); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="w-full px-2 py-1 bg-slate-900 border border-brand-500 rounded text-sm text-white focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`${displayClass} cursor-text hover:text-brand-400 transition-colors block`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}
