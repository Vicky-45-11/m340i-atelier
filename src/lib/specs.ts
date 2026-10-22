// Specifications of the G20 BMW M340i xDrive (2022 Life Cycle Impulse).
// CarWale and other sources could not be reached from the build environment,
// so every figure here comes from general knowledge and is shown with an
// "unverified" label in the UI. Check a current source before relying on it.

export interface Spec {
  label: string
  value: string
  detail?: string
}

export const SPEC_SOURCE_NOTE =
  'Figures are for the 2022+ G20 M340i xDrive (LCI) and come from general knowledge. The CarWale listing could not be reached when this was built, so the India-market figures and price are not verified. Check before relying on them.'

export const SPEC_GROUPS: { title: string; specs: Spec[] }[] = [
  {
    title: 'Powertrain',
    specs: [
      { label: 'Engine', value: '3.0 L inline-six, twin-scroll turbo', detail: 'B58 family, 2,998 cc' },
      { label: 'Power', value: '374 PS (275 kW)', detail: 'European figure. India rating may differ.' },
      { label: 'Torque', value: '500 Nm' },
      { label: 'Transmission', value: '8-speed Steptronic Sport automatic' },
      { label: 'Drivetrain', value: 'xDrive all-wheel drive, rear-biased' },
    ],
  },
  {
    title: 'Performance',
    specs: [
      { label: '0-100 km/h', value: '4.4 s', detail: 'Manufacturer claim' },
      { label: 'Top speed', value: '250 km/h', detail: 'Electronically limited' },
      { label: 'Fuel', value: 'Petrol, 48 V mild hybrid assist', detail: 'Market-dependent' },
    ],
  },
  {
    title: 'Dimensions',
    specs: [
      { label: 'Length', value: '4,713 mm' },
      { label: 'Width', value: '1,827 mm', detail: 'Excluding mirrors' },
      { label: 'Height', value: '1,440 mm' },
      { label: 'Wheelbase', value: '2,851 mm' },
      { label: 'Fuel tank', value: '59 L' },
    ],
  },
]

export const PRICE_NOTE = {
  label: 'Ex-showroom price, India',
  value: 'Around ₹75 lakh',
  detail: 'Approximate and unverified. On-road prices vary by city and are not shown.',
}
