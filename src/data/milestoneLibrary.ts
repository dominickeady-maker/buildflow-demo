export type MilestonePhase = {
  phase: string;
  milestones: string[];
};

export const MILESTONE_LIBRARY: MilestonePhase[] = [
  {
    phase: 'Enabling works',
    milestones: [
      'Site set-up & welfare',
      'Site strip / reduce dig',
      'Setting out',
      'Temporary services',
    ],
  },
  {
    phase: 'Substructure',
    milestones: [
      'Foundations dug',
      'NHBC/BC excavation inspection',
      'Foundations poured',
      'Footings up to DPC',
      'DPC laid (FFL to DPC)',
      'Below-ground drainage',
      'Oversite / ground floor slab',
      'Beam & block floor laid',
    ],
  },
  {
    phase: 'Superstructure',
    milestones: [
      'First lift',
      'Ground floor lintels & frames',
      'Scaffold first lift',
      'First floor joists on (floors on)',
      'Second lift',
      'Gables up',
      'Wall plate on',
      'Steels in (RSJ)',
      'Roof trusses / rafters set',
      'Roof on (felt & batten)',
      'Tiling / slating complete',
      'Fascias, soffits & guttering',
      'Windows & external doors in',
      'Watertight / weathertight',
      'NHBC/BC superstructure inspection',
    ],
  },
  {
    phase: 'First fix',
    milestones: [
      'Internal studwork & partitions',
      '1st fix carpentry',
      '1st fix electrics',
      '1st fix plumbing & heating',
      'Insulation & airtightness',
      'NHBC/BC pre-plaster inspection',
      'Plasterboard / dot & dab',
      'Plastering & skim',
      'Floor screed',
    ],
  },
  {
    phase: 'Second fix',
    milestones: [
      '2nd fix carpentry (doors, skirting, architrave)',
      '2nd fix electrics',
      '2nd fix plumbing & sanitaryware',
      'Kitchen fit',
      'Wall & floor tiling',
      'Decoration',
      'Floor coverings',
    ],
  },
  {
    phase: 'External works & completion',
    milestones: [
      'External render / brick clean',
      'Scaffold struck',
      'Drives, paths & patios',
      'Landscaping & turfing',
      'Fencing & boundaries',
      'Commissioning & testing',
      'Air test / EPC',
      'Building Control sign-off',
      'Pre-handover inspection',
      'Snagging',
      'Practical completion / handover',
    ],
  },
];

export const ALL_MILESTONES = MILESTONE_LIBRARY.flatMap(p => p.milestones);

export const NEW_BUILD_PRESET = ALL_MILESTONES;

export const EXTENSION_PRESET: string[] = [
  'Site set-up & protection',
  'Break out / demolition',
  'Foundations dug',
  'Foundations poured',
  'Footings up to DPC',
  'Drainage & manhole alterations',
  'Oversite / slab',
  'Superstructure blockwork',
  'Steels in (RSJ)',
  'Wall plate on',
  'Roof structure',
  'Roof covering',
  'Windows & external doors in',
  'Watertight',
  'Knock-through / opening formed',
  '1st fix trades',
  'Plastering',
  '2nd fix trades',
  'Kitchen / bathroom fit',
  'Decoration',
  'External works & making good',
  'Snagging',
  'Handover',
];
