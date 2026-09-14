// © 2026 Cornerstone Developments Ltd. All rights reserved. Unauthorised copying prohibited.
import { X, Shield, FileText, AlertTriangle, Scale } from 'lucide-react';

export default function TermsOfService({ onClose }: { onClose: () => void }) {
  const year = new Date().getFullYear();

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full my-8 p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-500 p-2.5 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
            <p className="text-sm text-slate-400">BuildFlow — Software License Agreement</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">Last updated: {year}</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">1. Ownership</h2>
            </div>
            <p>
              BuildFlow and its source code, design, content, and all associated materials are the
              exclusive property of Cornerstone Developments Ltd. All intellectual property rights,
              including but not limited to copyright, trade marks, and database rights, are retained
              by Cornerstone Developments Ltd.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">2. Permitted Use</h2>
            </div>
            <p>
              Users are granted a limited, non-exclusive, non-transferable licence to access and use
              BuildFlow for the purposes of construction project management within their organisation.
              Users may not copy, modify, reverse-engineer, decompile, resell, sublicense, rent, lease,
              or redistribute the software, in whole or in part, without prior written consent from
              Cornerstone Developments Ltd.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">3. Demo Environment</h2>
            </div>
            <p>
              The demo version of BuildFlow is provided for evaluation purposes only and is not
              licensed for commercial use. Demo data is synthetic and periodically reset. The demo
              environment must not be used for real business operations or relied upon for
              decision-making.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">4. No Warranty</h2>
            </div>
            <p>
              BuildFlow is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
              warranties of any kind, whether express or implied, including but not limited to
              implied warranties of merchantability, fitness for a particular purpose, or
              non-infringement. Cornerstone Developments Ltd does not warrant that the software
              will be error-free, uninterrupted, or that data will not be lost.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">5. Limitation of Liability</h2>
            </div>
            <p>
              To the maximum extent permitted by law, Cornerstone Developments Ltd shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages,
              including loss of profits, data, or business interruption, arising out of or in
              connection with the use of or inability to use BuildFlow.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of
              England and Wales. Any disputes shall be subject to the exclusive jurisdiction of
              the courts of England and Wales.
            </p>
          </section>
        </div>

        <div className="border-t border-slate-700 mt-6 pt-4">
          <p className="text-xs text-slate-500 text-center">
            &copy; {year} Cornerstone Developments Ltd. All rights reserved.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
