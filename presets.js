// Presets Data for Egyptian 3D Printing Market
const PRESETS = {
  filaments: [
    { id: 'esun-pla', name: 'eSUN PLA (1 كجم)', price: 700, weight: 1000, type: 'PLA', brand: 'eSUN', notes: 'متوسط سعر أمازون مصر / المتاجر المحلية' },
    { id: 'esun-pla-plus', name: 'eSUN PLA+ (1 كجم)', price: 800, weight: 1000, type: 'PLA+', brand: 'eSUN', notes: 'خامة صلبة ومقاومة للصدمات' },
    { id: 'kingroon-pla', name: 'Kingroon PLA (1 كجم)', price: 650, weight: 1000, type: 'PLA', brand: 'Kingroon', notes: 'خامة اقتصادية ممتازة' },
    { id: 'sunlu-petg', name: 'SUNLU / eSUN PETG (1 كجم)', price: 750, weight: 1000, type: 'PETG', brand: 'SUNLU', notes: 'مقاوم للحرارة والرطوبة' },
    { id: 'esun-abs', name: 'eSUN ABS+ (1 كجم)', price: 850, weight: 1000, type: 'ABS+', brand: 'eSUN', notes: 'يحتاج صندوق مغلق (Enclosure)' },
    { id: 'esun-tpu', name: 'eSUN TPU 95A مرن (1 كجم)', price: 1100, weight: 1000, type: 'TPU', brand: 'eSUN', notes: 'خامة مطاطية مرنة للمنتجات الميكانيكية' },
    { id: 'polymaker-pla', name: 'Polymaker PolyLite PLA (1 كجم)', price: 950, weight: 1000, type: 'PLA', brand: 'Polymaker', notes: 'جودة فائقة وتشطيب احترافي' },
    { id: 'creality-pla', name: 'Creality Ender PLA (1 كجم)', price: 680, weight: 1000, type: 'PLA', brand: 'Creality', notes: 'خامة قياسية متوفرة بكثرة' },
    { id: 'elegoo-resin-standard', name: 'Elegoo Standard Resin (1 كجم)', price: 1250, weight: 1000, type: 'Resin', brand: 'Elegoo', notes: 'لطابعات الراتنج ثلاثية الأبعاد' }
  ],
  
  printers: [
    {
      id: 'neptune-4-pro',
      name: 'Elegoo Neptune 4 Pro (الافتراضية)',
      price: 26000,
      lifespanHours: 5000,
      powerKw: 0.16,
      powerRange: '0.12 - 0.19 kW (سرير مقسم 100W+150W)',
      notes: 'سعر متجر 3D Smart بمصر (26,000 - 27,500 ج.م)',
      maxBedTemp: '110°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'neptune-4-plus',
      name: 'Elegoo Neptune 4 Plus',
      price: 32000,
      lifespanHours: 5000,
      powerKw: 0.22,
      powerRange: '0.18 - 0.25 kW',
      notes: 'حجم طباعة أكبر 320×320×385 مم',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'bambu-a1',
      name: 'Bambu Lab A1 Combo (مع AMS)',
      price: 38000,
      lifespanHours: 6000,
      powerKw: 0.18,
      powerRange: '0.14 - 0.22 kW',
      notes: 'طباعة متعددة الألوان ومعايرة ذاتية',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'bambu-p1s',
      name: 'Bambu Lab P1S',
      price: 52000,
      lifespanHours: 8000,
      powerKw: 0.25,
      powerRange: '0.20 - 0.35 kW (صندوق مغلق)',
      notes: 'طابعة صناعية مغلقة عالية الاعتمادية',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'bambu-a1-mini',
      name: 'Bambu Lab A1 Mini',
      price: 22000,
      lifespanHours: 5000,
      powerKw: 0.12,
      powerRange: '0.08 - 0.15 kW',
      notes: 'صغيرة الحجم 180×180×180 مم وسريعة للغاية',
      maxBedTemp: '80°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'ender-3-v3-ke',
      name: 'Creality Ender 3 V3 KE',
      price: 21500,
      lifespanHours: 4000,
      powerKw: 0.15,
      powerRange: '0.12 - 0.18 kW',
      notes: 'سرعة 500 مم/ث ونظام Klipper مبسط',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'creality-k1-max',
      name: 'Creality K1 Max',
      price: 54000,
      lifespanHours: 7000,
      powerKw: 0.35,
      powerRange: '0.25 - 0.45 kW',
      notes: 'حجم 300×300×300 مم مزودة بكاميرا ذكية',
      maxBedTemp: '120°C',
      printSpeed: 'حتى 600 مم/ث'
    }
  ],

  electricityTiers: [
    { id: 'tier-custom', name: 'الافتراضية الحالية (1.51 ج.م)', rate: 1.51, desc: 'متوسط الاستهلاك المنزلي المحسوب (1.51 ج.م/ك.و.س)' },
    { id: 'tier-1', name: 'الشريحة 1 (0 إلى 50 ك.و.س)', rate: 0.68, desc: 'الاستهلاك الخفيف جداً (0.68 ج.م)' },
    { id: 'tier-2', name: 'الشريحة 2 (51 إلى 100 ك.و.س)', rate: 0.78, desc: 'استهلاك منزلي منخفض (0.78 ج.م)' },
    { id: 'tier-3', name: 'الشريحة 3 (0 إلى 200 ك.و.س)', rate: 0.95, desc: 'استهلاك منزلي متوسط منخفض (0.95 ج.م)' },
    { id: 'tier-4', name: 'الشريحة 4 (201 إلى 350 ك.و.س)', rate: 1.55, desc: 'الشريحة الأكثر شيوعاً في المنازل (1.55 ج.م)' },
    { id: 'tier-5', name: 'الشريحة 5 (351 إلى 650 ك.و.س)', rate: 1.95, desc: 'استهلاك منزلي مرتفع (1.95 ج.م)' },
    { id: 'tier-6', name: 'الشريحة 6 (651 إلى 1000 ك.و.س)', rate: 2.10, desc: 'استهلاك منزلي عالي (2.10 ج.م)' },
    { id: 'tier-7', name: 'الشريحة 7 (أكثر من 1000 ك.و.س)', rate: 2.23, desc: 'استهلاك منزلي كثيف بدون دعم (2.23 ج.م)' },
    { id: 'tier-comm-1', name: 'النشاط التجاري (حتى 100 ك.و.س)', rate: 0.85, desc: 'شريحة المحلات والورش الصغيرة (0.85 ج.م)' },
    { id: 'tier-comm-2', name: 'النشاط التجاري (حتى 250 ك.و.س)', rate: 1.68, desc: 'شريحة تجارية متوسطة (1.68 ج.م)' },
    { id: 'tier-comm-3', name: 'النشاط التجاري (حتى 600 ك.و.س)', rate: 2.20, desc: 'شريحة تجارية عالية (2.20 ج.م)' },
    { id: 'tier-comm-4', name: 'النشاط التجاري (أكثر من 1000 ك.و.س)', rate: 2.33, desc: 'شريحة تجارية عليا (2.33 ج.م)' }
  ]
};
