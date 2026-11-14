import imageManifest from './imageManifest.json'

// Generated from verified file uploads. Public CDN URLs contain no API credentials.
const image = (filename) => imageManifest[filename]
const logo = image('Gym Logo.jpeg')
const interiorOne = image('Overall Gym Setup.jpeg')
const interiorTwo = image('Overall Gym setup 2.jpeg')
const armMachine = image('Gym Equipment 1.jpeg')
const cableMachine = image('Gym Equipment 2.jpeg')
const pecDeck = image('Gym Equipment 3.jpeg')
const pulley = image('Gym Equipment 4.jpeg')
const smithMachine = image('Gym Equipment 5.jpeg')
const bench = image('Gym Equipment 6.jpeg')
const legPress = image('Gym Equipment 7.jpeg')
const stabilityBall = image('Cardio Equipment 1.jpeg')
const exerciseBike = image('Cardio Equipment 2.jpeg')
const jersey = image('Gym Jersey.jpeg')

export const gymImages = { logo, jersey }

export const jerseyProduct = {
  name: 'Globus Fitness Club jersey',
  price: 1600,
  image: jersey,
  // Illustrative garment measurements only, in centimetres.
  // Replace every row with supplier measurements before setting verified to true.
  // These size labels do not indicate stock availability.
  sizeChart: {
    verified: false,
    rows: [
      { size: 'S', chestWidth: 48, length: 68 },
      { size: 'M', chestWidth: 51, length: 70 },
      { size: 'L', chestWidth: 54, length: 72 },
      { size: 'XL', chestWidth: 57, length: 74 },
      { size: 'XXL', chestWidth: 60, length: 76 },
    ],
  },
}

export const gymSlides = [
  { src: interiorOne, alt: 'Strength machines and benches inside Globus Fitness', title: 'A space to put in the work', label: 'The training floor' },
  { src: interiorTwo, alt: 'Cable station, free weights and mirrors at Globus Fitness', title: 'Find your training rhythm', label: 'Inside Globus' },
  { src: cableMachine, alt: 'Dual cable crossover machine on the gym floor', title: 'Every session starts here', label: 'Strength training' },
  { src: legPress, alt: 'Plate-loaded leg press with strength equipment in the background', title: 'Build from the ground up', label: 'Lower-body training' },
]

export const equipment = [
  { id: 'cables', name: 'Cable crossover', category: 'Strength', image: cableMachine, alt: 'Dual adjustable cable crossover machine', description: 'Adjustable pulleys and cable attachments for a variety of upper-body movements.', featured: true },
  { id: 'leg-press', name: 'Leg press', category: 'Strength', image: legPress, alt: 'Inclined plate-loaded leg press', description: 'A plate-loaded station for focused lower-body resistance training.', featured: true },
  { id: 'bike', name: 'Exercise bike', category: 'Cardio & core', image: exerciseBike, alt: 'Upright stationary exercise bike', description: 'A stationary cycle for warm-ups, steady-paced sessions, and cardio training.', featured: true },
  { id: 'arms', name: 'Arm training station', category: 'Strength', image: armMachine, alt: 'Yellow strength machine with a padded arm support', description: 'Padded support and a weight stack for controlled, focused arm movements.' },
  { id: 'pec-deck', name: 'Pec deck', category: 'Strength', image: pecDeck, alt: 'Seated pec deck machine with adjustable arms', description: 'A seated machine with adjustable arms for chest and rear-shoulder movements.' },
  { id: 'pulley', name: 'Cable pulley station', category: 'Strength', image: pulley, alt: 'Red cable pulley station beside a rack of dumbbells', description: 'High and low cable positions bring pulling movements into your strength routine.' },
  { id: 'smith', name: 'Smith machine', category: 'Strength', image: smithMachine, alt: 'Smith machine with a barbell on vertical guide rails', description: 'A guided barbell station for a range of controlled pressing and lower-body movements.' },
  { id: 'bench', name: 'Barbell bench', category: 'Strength', image: bench, alt: 'Flat bench with a barbell and red rack', description: 'A flat bench and barbell rack for classic free-weight pressing movements.' },
  { id: 'core', name: 'Stability ball', category: 'Cardio & core', image: stabilityBall, alt: 'Purple stability ball on the gym floor', description: 'A versatile addition to core work, balance exercises, and mobility sessions.' },
]

// Owner-provided prices. Keep plan terms here for the future membership phase.
export const admissionFee = 2500
export const membershipPlans = [
  { id: 'monthly', title: 'Monthly', price: 2500, period: '1 month', description: 'Start with a month. Build your routine one session at a time.' },
  { id: 'quarterly', title: '3 months', price: 7000, period: '3 months', description: 'Give yourself time to settle in and keep showing up.' },
  { id: 'half-year', title: '6 months', price: 12000, period: '6 months', description: 'Make training a regular part of the months ahead.' },
  { id: 'annual', title: '1 year', price: 25000, period: '12 months', description: 'Set your sights on a full year of consistent training.' },
]

export function formatPrice(value) {
  return `Rs. ${new Intl.NumberFormat('en-LK').format(value)}`
}
