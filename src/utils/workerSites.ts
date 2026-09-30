import { supabase, Site } from '../lib/supabase';

/**
 * Loads sites a worker can see: sites they're directly assigned to via
 * site_workers, plus sites where they have tasks assigned.
 */
export async function loadWorkerSites(workerId: string): Promise<Site[]> {
  const [assignedResult, taskSitesResult] = await Promise.all([
    supabase
      .from('site_workers')
      .select('site:sites(*)')
      .eq('worker_id', workerId),
    supabase
      .from('tasks')
      .select('site:sites(*)')
      .eq('assigned_to', workerId),
  ]);

  const assignedSites = (assignedResult.data || [])
    .map((row: any) => row.site)
    .filter(Boolean) as Site[];

  const taskSites = (taskSitesResult.data || [])
    .map((row: any) => row.site)
    .filter(Boolean) as Site[];

  // Deduplicate by site id
  const seen = new Set<string>();
  const all: Site[] = [];
  for (const site of [...assignedSites, ...taskSites]) {
    if (!seen.has(site.id)) {
      seen.add(site.id);
      all.push(site);
    }
  }

  all.sort((a, b) => a.name.localeCompare(b.name));
  return all;
}
