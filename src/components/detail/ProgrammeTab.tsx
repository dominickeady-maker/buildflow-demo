import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, ProgrammeStage } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoMode } from '../../contexts/DemoModeContext';
import {
  Plus, Trash2, GripVertical, Calendar, Loader2, X, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;
const LABEL_WIDTH = 160;

type StageStatus = 'on_track' | 'at_risk' | 'overdue' | 'complete';

function getStageStatus(stage: ProgrammeStage): StageStatus {
  if (stage.percent_complete >= 100) return 'complete';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(stage.end_date);
  const start = new Date(stage.start_date);

  if (end < today && stage.percent_complete < 100) return 'overdue';

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const elapsedDays = Math.round((today.getTime() - start.getTime()) / 86400000);
  const expectedPct = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));

  if (stage.percent_complete < expectedPct - 10) return 'at_risk';
  return 'on_track';
}

const STATUS_COLORS: Record<StageStatus, { bar: string; bg: string; text: string; label: string }> = {
  on_track: { bar: 'bg-blue-600', bg: 'bg-blue-600', text: 'text-blue-400', label: 'On Track' },
  at_risk: { bar: 'bg-amber-500', bg: 'bg-amber-500', text: 'text-amber-400', label: 'At Risk' },
  overdue: { bar: 'bg-red-600', bg: 'bg-red-600', text: 'text-red-400', label: 'Overdue' },
  complete: { bar: 'bg-green-600', bg: 'bg-green-600', text: 'text-green-400', label: 'Complete' },
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'short', month: 'short' });
}

function dateToPixel(date: Date, chartStart: Date): number {
  return daysBetween(chartStart, date) * DAY_WIDTH;
}

function pixelToDate(pixel: number, chartStart: Date): Date {
  return addDays(chartStart, Math.round(pixel / DAY_WIDTH));
}

export default function ProgrammeTab({ siteId, organizationId }: { siteId: string; organizationId: string }) {
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const isManager = profile?.role === 'manager';
  const canEdit = isManager && !isDemoMode;

  const [stages, setStages] = useState<ProgrammeStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<ProgrammeStage | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end'>('move');
  const dragStartRef = useRef<{ x: number; origStart: Date; origEnd: Date } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    percent_complete: 0,
  });

  const loadStages = useCallback(async () => {
    const { data, error } = await supabase
      .from('programme_stages')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error loading programme stages:', error);
    } else {
      setStages((data || []) as ProgrammeStage[]);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (!loading && scrollRef.current && stages.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chartStart = getChartStart(stages);
      const todayPixel = dateToPixel(today, chartStart);
      scrollRef.current.scrollLeft = Math.max(0, todayPixel - 200);
    }
  }, [loading, stages]);

  function resetForm() {
    setFormData({ name: '', start_date: '', end_date: '', percent_complete: 0 });
    setEditingStage(null);
    setShowForm(false);
  }

  function startEdit(stage: ProgrammeStage) {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      start_date: stage.start_date,
      end_date: stage.end_date,
      percent_complete: stage.percent_complete,
    });
    setShowForm(true);
  }

  function startAdd() {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ name: '', start_date: today, end_date: today, percent_complete: 0 });
    setEditingStage(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editingStage) {
      const { error } = await supabase
        .from('programme_stages')
        .update({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          percent_complete: formData.percent_complete,
        })
        .eq('id', editingStage.id);
      if (error) console.error('Error updating stage:', error);
    } else {
      const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.sort_order)) : -1;
      const { error } = await supabase
        .from('programme_stages')
        .insert({
          organization_id: organizationId,
          site_id: siteId,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          percent_complete: formData.percent_complete,
          sort_order: maxOrder + 1,
        });
      if (error) console.error('Error inserting stage:', error);
    }

    setSaving(false);
    resetForm();
    await loadStages();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('programme_stages').delete().eq('id', id);
    if (error) console.error('Error deleting stage:', error);
    await loadStages();
  }

  async function reorderStage(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const stageA = stages[index];
    const stageB = stages[swapIndex];

    await Promise.all([
      supabase.from('programme_stages').update({ sort_order: stageB.sort_order }).eq('id', stageA.id),
      supabase.from('programme_stages').update({ sort_order: stageA.sort_order }).eq('id', stageB.id),
    ]);
    await loadStages();
  }

  // --- Bar drag handling ---
  function onBarPointerDown(e: React.PointerEvent, stage: ProgrammeStage, mode: 'move' | 'resize-start' | 'resize-end') {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(stage.id);
    setDragMode(mode);
    dragStartRef.current = {
      x: e.clientX,
      origStart: new Date(stage.start_date),
      origEnd: new Date(stage.end_date),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onBarPointerMove(e: React.PointerEvent) {
    if (!draggingId || !dragStartRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaDays = Math.round(deltaX / DAY_WIDTH);
    const { origStart, origEnd } = dragStartRef.current;

    let newStart = new Date(origStart);
    let newEnd = new Date(origEnd);

    if (dragMode === 'move') {
      newStart = addDays(origStart, deltaDays);
      newEnd = addDays(origEnd, deltaDays);
    } else if (dragMode === 'resize-start') {
      newStart = addDays(origStart, deltaDays);
      if (newStart >= newEnd) newStart = addDays(newEnd, -1);
    } else if (dragMode === 'resize-end') {
      newEnd = addDays(origEnd, deltaDays);
      if (newEnd <= newStart) newEnd = addDays(newStart, 1);
    }

    // Optimistic local update
    setStages(prev =>
      prev.map(s =>
        s.id === draggingId
          ? { ...s, start_date: newStart.toISOString().split('T')[0], end_date: newEnd.toISOString().split('T')[0] }
          : s
      )
    );
  }

  async function onBarPointerUp(e: React.PointerEvent) {
    if (!draggingId) return;
    const stage = stages.find(s => s.id === draggingId);
    if (stage) {
      const { error } = await supabase
        .from('programme_stages')
        .update({ start_date: stage.start_date, end_date: stage.end_date })
        .eq('id', draggingId);
      if (error) console.error('Error updating stage dates:', error);
    }
    setDraggingId(null);
    setDragMode('move');
    dragStartRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }

  async function updatePercent(stage: ProgrammeStage, pct: number) {
    const clamped = Math.max(0, Math.min(100, pct));
    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, percent_complete: clamped } : s));
    const { error } = await supabase
      .from('programme_stages')
      .update({ percent_complete: clamped })
      .eq('id', stage.id);
    if (error) console.error('Error updating percent:', error);
  }

  // --- Chart geometry ---
  const chartStart = getChartStart(stages);
  const chartEnd = getChartEnd(stages);
  const totalDays = Math.max(1, daysBetween(chartStart, chartEnd));
  const chartWidth = totalDays * DAY_WIDTH;

  // Month markers
  const months: { label: string; pixel: number }[] = [];
  const cursor = new Date(chartStart);
  cursor.setDate(1);
  while (cursor <= chartEnd) {
    months.push({
      label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      pixel: dateToPixel(cursor, chartStart),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Week markers
  const weeks: { label: string; pixel: number; isWeekend?: boolean }[] = [];
  const weekCursor = new Date(chartStart);
  while (weekCursor <= chartEnd) {
    weeks.push({
      label: weekCursor.getDate().toString(),
      pixel: dateToPixel(weekCursor, chartStart),
      isWeekend: weekCursor.getDay() === 0 || weekCursor.getDay() === 6,
    });
    weekCursor.setDate(weekCursor.getDate() + 7);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPixel = dateToPixel(today, chartStart);
  const showTodayLine = today >= chartStart && today <= chartEnd;

  // Overall completion
  const overallPct = stages.length > 0
    ? Math.round(stages.reduce((sum, s) => sum + s.percent_complete, 0) / stages.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall completion */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Programme</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{overallPct}%</div>
            <div className="text-xs text-slate-400">Overall Complete</div>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-brand-600 to-brand-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-blue-600" /> On Track
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-amber-500" /> At Risk
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-red-600" /> Overdue
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-green-600" /> Complete
          </span>
        </div>
      </div>

      {/* Add button */}
      {canEdit && !showForm && (
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stage
        </button>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">{editingStage ? 'Edit Stage' : 'Add New Stage'}</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Stage Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Groundworks, Foundations, Superstructure..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Percent Complete: {formData.percent_complete}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.percent_complete}
                onChange={(e) => setFormData({ ...formData, percent_complete: parseInt(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingStage ? 'Update Stage' : 'Add Stage'}
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

      {/* Gantt chart or empty state */}
      {stages.length === 0 && !showForm ? (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No programme stages yet</p>
          <p className="text-slate-500 text-sm mt-1">
            {canEdit ? 'Add stages to build the project timeline.' : 'The manager hasn\'t added any stages yet.'}
          </p>
        </div>
      ) : stages.length > 0 ? (
        <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
          {/* Scroll container */}
          <div ref={scrollRef} className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: LABEL_WIDTH + chartWidth + 20 }}>
              {/* Month header */}
              <div className="flex border-b border-slate-600 sticky top-0 bg-slate-700 z-10">
                <div
                  className="flex-shrink-0 border-r border-slate-600 flex items-center px-3"
                  style={{ width: LABEL_WIDTH, height: 28 }}
                >
                  <span className="text-xs font-medium text-slate-400">Stage</span>
                </div>
                <div className="relative flex-1" style={{ width: chartWidth, height: 28 }}>
                  {months.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 flex items-center px-1 border-l border-slate-600"
                      style={{ left: m.pixel, height: 28 }}
                    >
                      <span className="text-xs font-medium text-slate-300">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Week header */}
              <div className="flex border-b border-slate-600">
                <div
                  className="flex-shrink-0 border-r border-slate-600"
                  style={{ width: LABEL_WIDTH, height: 24 }}
                />
                <div className="relative flex-1" style={{ width: chartWidth, height: 24 }}>
                  {weeks.map((w, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 flex items-center justify-center border-l border-slate-700 ${w.isWeekend ? 'bg-slate-800/40' : ''}`}
                      style={{ left: w.pixel, width: DAY_WIDTH, height: 24 }}
                    >
                      <span className="text-[10px] text-slate-500">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {stages.map((stage, index) => {
                const status = getStageStatus(stage);
                const colors = STATUS_COLORS[status];
                const barStart = dateToPixel(new Date(stage.start_date), chartStart);
                const barEnd = dateToPixel(new Date(stage.end_date), chartStart);
                const barWidth = Math.max(DAY_WIDTH, barEnd - barStart + DAY_WIDTH);

                return (
                  <div key={stage.id} className="flex border-b border-slate-700/50 group hover:bg-slate-600/20">
                    {/* Label column */}
                    <div
                      className="flex-shrink-0 border-r border-slate-600 flex items-center gap-1 px-2"
                      style={{ width: LABEL_WIDTH, height: ROW_HEIGHT }}
                    >
                      {canEdit && (
                        <div className="flex flex-col">
                          <button
                            onClick={() => reorderStage(index, 'up')}
                            disabled={index === 0}
                            className="text-slate-500 hover:text-brand-400 disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => reorderStage(index, 'down')}
                            disabled={index === stages.length - 1}
                            className="text-slate-500 hover:text-brand-400 disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => canEdit && startEdit(stage)}
                        className="flex-1 text-left text-sm text-white font-medium truncate hover:text-brand-400 transition-colors"
                        title={stage.name}
                      >
                        {stage.name}
                      </button>
                    </div>

                    {/* Chart column */}
                    <div className="relative flex-1" style={{ width: chartWidth, height: ROW_HEIGHT }}>
                      {/* Today line */}
                      {showTodayLine && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-brand-400/60 z-10 pointer-events-none"
                          style={{ left: todayPixel + DAY_WIDTH / 2 }}
                        >
                          <div className="absolute -top-0 -left-1 w-2 h-2 rounded-full bg-brand-400" />
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`absolute rounded-md ${colors.bar} ${draggingId === stage.id ? 'opacity-80 cursor-grabbing' : canEdit ? 'cursor-grab' : ''} transition-opacity hover:opacity-90`}
                        style={{
                          left: barStart,
                          width: barWidth,
                          top: 8,
                          height: ROW_HEIGHT - 16,
                        }}
                        onPointerDown={canEdit ? (e) => onBarPointerDown(e, stage, 'move') : undefined}
                        onPointerMove={onBarPointerMove}
                        onPointerUp={onBarPointerUp}
                      >
                        {/* Resize handle left */}
                        {canEdit && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l-md"
                            onPointerDown={(e) => onBarPointerDown(e, stage, 'resize-start')}
                          />
                        )}

                        {/* Bar content */}
                        <div className="flex items-center justify-between h-full px-2 min-w-0">
                          <span className="text-xs text-white font-medium truncate">
                            {formatDate(stage.start_date)} – {formatDate(stage.end_date)}
                          </span>
                          <span className="text-xs text-white/90 font-bold ml-1 flex-shrink-0">
                            {stage.percent_complete}%
                          </span>
                        </div>

                        {/* Progress overlay */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-black/25 rounded-l-md pointer-events-none"
                          style={{ width: `${stage.percent_complete}%` }}
                        />

                        {/* Resize handle right */}
                        {canEdit && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r-md"
                            onPointerDown={(e) => onBarPointerDown(e, stage, 'resize-end')}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage detail / controls below chart */}
          <div className="border-t border-slate-600 p-4 space-y-3">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage);
              const colors = STATUS_COLORS[status];
              return (
                <div key={stage.id} className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-sm ${colors.bg}`} />
                    <span className="text-sm text-white font-medium truncate">{stage.name}</span>
                    <span className={`text-xs ${colors.text} font-medium`}>{colors.label}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatDate(stage.start_date)} – {formatDate(stage.end_date)}</span>
                  </div>

                  {/* Percent slider (managers only) */}
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stage.percent_complete}
                        onChange={(e) => updatePercent(stage, parseInt(e.target.value))}
                        className="w-20 accent-brand-500"
                      />
                      <span className="text-xs text-white font-medium w-9 text-right">{stage.percent_complete}%</span>
                    </div>
                  ) : (
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors.bg}`} style={{ width: `${stage.percent_complete}%` }} />
                    </div>
                  )}

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => startEdit(stage)}
                        className="p-1.5 text-slate-300 hover:text-brand-400 hover:bg-brand-700/30 rounded transition-colors"
                        title="Edit"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(stage.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Demo notice */}
      {isDemoMode && stages.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Viewing in demo mode — editing and dragging are disabled.</span>
        </div>
      )}

      {/* Mobile scroll hint */}
      {stages.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Swipe horizontally to scroll the timeline
        </p>
      )}
    </div>
  );
}

// --- Helpers for chart bounds ---
function getChartStart(stages: ProgrammeStage[]): Date {
  if (stages.length === 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const earliest = stages.reduce((min, s) => {
    const d = new Date(s.start_date);
    return d < min ? d : min;
  }, new Date(stages[0].start_date));

  // Pad by 7 days before the earliest start
  earliest.setDate(earliest.getDate() - 7);
  // Align to start of week (Monday)
  const day = earliest.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  earliest.setDate(earliest.getDate() + diff);
  earliest.setHours(0, 0, 0, 0);
  return earliest;
}

function getChartEnd(stages: ProgrammeStage[]): Date {
  if (stages.length === 0) {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const latest = stages.reduce((max, s) => {
    const d = new Date(s.end_date);
    return d > max ? d : max;
  }, new Date(stages[0].end_date));

  // Pad by 7 days after the latest end
  latest.setDate(latest.getDate() + 7);
  latest.setHours(0, 0, 0, 0);
  return latest;
}
