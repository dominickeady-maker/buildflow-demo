import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useOrganization() {
  const { user, profile } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
      setLoading(false);
    } else if (user) {
      assignOrganization();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  async function assignOrganization() {
    if (!user) return;

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'demo-construction')
      .maybeSingle();

    if (org) {
      await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);

      setOrganizationId(org.id);
    }
    setLoading(false);
  }

  return { organizationId, loading };
}
