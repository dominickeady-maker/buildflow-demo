import { useNav } from '../contexts/NavContext';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  rootLabel: string;
}

export default function Breadcrumbs({ rootLabel }: BreadcrumbsProps) {
  const { views, goToLevel, popView } = useNav();

  if (views.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <button
        onClick={popView}
        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-600 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => goToLevel(-1)}
          className="text-slate-400 hover:text-brand-400 transition-colors text-sm font-medium"
        >
          {rootLabel}
        </button>

        {views.map((view, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <button
              onClick={() => goToLevel(index)}
              className={`text-sm font-medium transition-colors ${
                index === views.length - 1
                  ? 'text-white'
                  : 'text-slate-400 hover:text-brand-400'
              }`}
            >
              {view.label}
              {view.subTab && index === views.length - 1 ? ` · ${view.subTab.charAt(0).toUpperCase() + view.subTab.slice(1)}` : ''}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
