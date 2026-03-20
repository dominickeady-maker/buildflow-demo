import { useState, useEffect } from 'react';
import { supabase, Site } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Plus, Search } from 'lucide-react';

const COMMON_MATERIALS = [
  // Aggregates
  'Sharp Sand',
  'Building Sand',
  'Gravel 10mm',
  'Gravel 20mm',
  'Ballast',
  'MOT Type 1 Hardcore',
  'Pea Gravel',
  'Limestone Chippings',
  'Rock Salt',

  // Bricks Blocks & Stone
  'Facing Bricks',
  'Engineering Bricks',
  'Concrete Blocks (7N/10N)',
  'Thermalite Blocks',
  'Aircrete Blocks',
  'Block Lintels',
  'Brick Lintels',
  'Stone (Yorkstone/Sandstone/Limestone)',
  'Stone Blocks',
  'Stone Walling',

  // Timber & Sheet Materials
  'C16 Timber',
  'C24 Timber',
  'CLS Timber',
  'Plywood (9/12/18mm)',
  'OSB Board',
  'MDF Sheets',
  'Plasterboard',
  'Moisture-Resistant Plasterboard',
  'Fire-Rated Plasterboard',
  'Skirting Boards',
  'Architrave',
  'Decking Boards',
  'Fence Posts',
  'Fence Panels',

  // Cement & Bagged Materials
  'Portland Cement',
  'Postcrete',
  'Ready-Mix Concrete (bags)',
  'Rapid-Set Cement',
  'Mortar Mix',
  'Plaster',
  'Floor Levelling Compound',

  // Roofing Materials
  'Concrete Tiles',
  'Clay Tiles',
  'Roofing Felt',
  'Roofing Battens',
  'Lead Flashing',
  'Roof Membrane',
  'Ridge Tiles',
  'Guttering',
  'Downpipes',
  'Fascia Boards',
  'Soffit Boards',

  // Insulation
  'Loft Roll Insulation',
  'PIR Boards',
  'Cavity Wall Insulation',
  'Acoustic Insulation',

  // Drainage & Groundworks
  '110mm Drainage Pipe',
  '110mm Drainage Fittings',
  'Manhole Covers',
  'Aco Drains',
  'Land Drainage Pipe',
  'Inspection Chambers',

  // Landscaping
  'Paving Slabs',
  'Block Paving',
  'Decorative Aggregates',
  'Topsoil',
  'Sleepers',
  'Artificial Grass',
  'Jointing Compound',
  'Weed Membrane',

  // Doors Windows & Joinery
  'Internal Doors',
  'External Doors',
  'Door Linings',
  'Window Boards',
  'Loft Ladders',
  'Ironmongery',

  // Plumbing
  'Copper Pipe',
  'Speedfit Pipe',
  'Push-Fit Fittings',
  'Compression Fittings',
  'Soil Pipe 110mm',
  'Soil Pipe Fittings',
  'Waste Pipe (32/40mm)',
  'Radiators',
  'Radiator Valves',
  'Cylinder Tanks',

  // Electrical
  'Twin & Earth Cable',
  'Consumer Units',
  'Sockets',
  'Switches',
  'Spotlights',
  'LED Battens',
  'Junction Boxes',
  'Conduit',
  'Smoke Alarms',
  'Extractor Fans',

  // Paint & Decorating
  'Emulsion',
  'Gloss',
  'Undercoat',
  'Primer',
  'Caulk',
  'Fillers',
  'Masking Tape',
  'Dust Sheets',
  'Sandpaper',

  // Fixings & Fasteners
  'Wood Screws',
  'Drywall Screws',
  'Concrete Screws',
  'Nails',
  'Bolts & Nuts',
  'Washers',
  'Wall Plugs',
  'Anchors',
  'Brackets',

  // Tools & PPE
  'Gloves',
  'Masks',
  'Goggles',
  'Hard Hats',
  'Hammers',
  'Saws',
  'Levels',
  'Drill Bits',
  'Blades',
  'Buckets',
  'Tarpaulins',

  // Sealants & Adhesives
  'Silicone',
  'Grab Adhesive',
  'Wood Glue',
  'Expanding Foam',
  'Bitumen',
  'Roof Sealant',

  // Heavy Building Materials
  'Concrete Lintels',
  'Steel Lintels',
  'Reinforcing Mesh',
  'DPM',
  'DPC',
  'Scaffold Boards',
  'Kerbs',
  'Edgings',
  'Concrete Posts',
  'Gravel Boards',

  'Custom/Other',
];

export default function MaterialsRequest() {
  const { profile } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [formData, setFormData] = useState({
    site_id: '',
    item_name: '',
    quantity: '',
    unit: 'kg',
    comment: '',
  });

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.material-dropdown-container')) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadSites() {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading sites:', error);
    } else {
      setSites(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    const { error } = await supabase.from('materials').insert({
      site_id: formData.site_id,
      item_name: formData.item_name,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      comment: formData.comment,
      requested_by: profile.id,
      status: 'new',
    });

    if (error) {
      console.error('Error creating material request:', error);
      alert('Failed to submit request');
    } else {
      setFormData({ site_id: '', item_name: '', quantity: '', unit: 'kg', comment: '' });
      setSearchTerm('');
      setIsCustom(false);
      setShowForm(false);
      alert('Material request submitted successfully!');
    }

    setLoading(false);
  }

  function handleMaterialSelect(material: string) {
    if (material === 'Custom/Other') {
      setIsCustom(true);
      setFormData({ ...formData, item_name: '' });
      setSearchTerm('Custom/Other');
    } else {
      setIsCustom(false);
      setFormData({ ...formData, item_name: material });
      setSearchTerm(material);
    }
    setShowDropdown(false);
  }

  const filteredMaterials = COMMON_MATERIALS.filter(material =>
    material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Request Materials</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
          <h3 className="font-medium text-white mb-4">Submit Material Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Site
              </label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
                required
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="material-dropdown-container">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Material
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                    placeholder="Search materials..."
                    required={!isCustom}
                  />
                </div>

                {showDropdown && filteredMaterials.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredMaterials.map((material) => (
                      <button
                        key={material}
                        type="button"
                        onClick={() => handleMaterialSelect(material)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isCustom && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Custom Material Name
                </label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                  placeholder="Enter custom material name"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                  placeholder="e.g., 100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
                  required
                >
                  <option value="kg">kg (kilogram)</option>
                  <option value="ton">ton</option>
                  <option value="m">m (meter)</option>
                  <option value="m2">m² (square meter)</option>
                  <option value="m3">m³ (cubic meter)</option>
                  <option value="L">L (liter)</option>
                  <option value="pcs">pcs (pieces)</option>
                  <option value="bag">bag</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Notes {isCustom && <span className="text-orange-400">(Required for custom materials)</span>}
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 transition-all"
                rows={3}
                placeholder={isCustom ? "Describe the material specifications, brand, size, etc." : "Additional notes or specifications (optional)"}
                required={isCustom}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          Use this form to request materials needed at your site. Your manager will be notified
          and can approve or order the items.
        </p>
      </div>
    </div>
  );
}
