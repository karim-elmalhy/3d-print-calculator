// Presets Data for Egyptian 3D Printing Market - Expanded & Grouped
const PRESETS = {
  filaments: [
    // 🇪🇬 Egyptian Made (Patron 3D)
    { id: 'patron-pla', name: '🇪🇬 Patron PLA باترون مصري (1 كجم)', price: 600, weight: 1000, type: 'PLA', brand: 'Patron 3D', density: 1.24, isEgyptian: true, notes: 'فيلامنت باترون مصري الصنع — جودة عالية وسعر اقتصادي منافس' },
    { id: 'patron-pla-plus', name: '🇪🇬 Patron PLA+ باترون بلس (1 كجم)', price: 700, weight: 1000, type: 'PLA+', brand: 'Patron 3D', density: 1.25, isEgyptian: true, notes: 'باترون بلس بقوة وصلابة أعلى ومقاومة للصدمات' },
    { id: 'patron-petg', name: '🇪🇬 Patron PETG باترون (1 كجم)', price: 650, weight: 1000, type: 'PETG', brand: 'Patron 3D', density: 1.27, isEgyptian: true, notes: 'مقاوم للحرارة والرطوبة — مصري الصنع' },
    { id: 'patron-abs', name: '🇪🇬 Patron ABS باترون (1 كجم)', price: 750, weight: 1000, type: 'ABS', brand: 'Patron 3D', density: 1.06, isEgyptian: true, notes: 'باترون ABS للقطع الميكانيكية والهندسية' },
    { id: 'patron-tpu', name: '🇪🇬 Patron TPU باترون مرن (1 كجم)', price: 950, weight: 1000, type: 'TPU', brand: 'Patron 3D', density: 1.21, isEgyptian: true, notes: 'خامة مطاطية مرنة مصرية الصنع' },
    
    // 🌐 Imported Filaments
    { id: 'esun-pla', name: 'eSUN PLA (1 كجم)', price: 700, weight: 1000, type: 'PLA', brand: 'eSUN', density: 1.24, notes: 'متوسط سعر أمازون مصر / المتاجر المحلية' },
    { id: 'esun-pla-plus', name: 'eSUN PLA+ (1 كجم)', price: 800, weight: 1000, type: 'PLA+', brand: 'eSUN', density: 1.25, notes: 'صلابة أعلى ومقاومة للصدمات' },
    { id: 'kingroon-pla', name: 'Kingroon PLA (1 كجم)', price: 650, weight: 1000, type: 'PLA', brand: 'Kingroon', density: 1.24, notes: 'خامة اقتصادية ممتازة' },
    { id: 'sunlu-pla-matte', name: 'SUNLU Matte PLA مطفي (1 كجم)', price: 820, weight: 1000, type: 'PLA Matte', brand: 'SUNLU', density: 1.24, notes: 'ملمس مطفي يخفي خطوط الطباعة' },
    { id: 'sunlu-petg', name: 'SUNLU / eSUN PETG (1 كجم)', price: 750, weight: 1000, type: 'PETG', brand: 'SUNLU', density: 1.27, notes: 'مقاوم للحرارة والرطوبة والأشعة' },
    { id: 'esun-abs', name: 'eSUN ABS+ (1 كجم)', price: 850, weight: 1000, type: 'ABS+', brand: 'eSUN', density: 1.06, notes: 'يحتاج صندوق مغلق (Enclosure)' },
    { id: 'esun-asa', name: 'eSUN ASA خارجي (1 كجم)', price: 950, weight: 1000, type: 'ASA', brand: 'eSUN', density: 1.07, notes: 'مقاوم للشمس وظروف الجو الخارجية' },
    { id: 'esun-tpu', name: 'eSUN TPU 95A مرن (1 كجم)', price: 1100, weight: 1000, type: 'TPU', brand: 'eSUN', density: 1.21, notes: 'خامة مطاطية مرنة للمنتجات الميكانيكية' },
    { id: 'polymaker-pla', name: 'Polymaker PolyLite PLA (1 كجم)', price: 950, weight: 1000, type: 'PLA', brand: 'Polymaker', density: 1.24, notes: 'جودة فائقة وتشطيب احترافي عالي الدقة' },
    { id: 'creality-pla', name: 'Creality Ender PLA (1 كجم)', price: 680, weight: 1000, type: 'PLA', brand: 'Creality', density: 1.24, notes: 'خامة قياسية متوفرة بكثرة' },
    { id: 'carbon-fiber-pla', name: 'PLA Carbon Fiber ألياف كربون (1 كجم)', price: 1400, weight: 1000, type: 'PLA-CF', brand: 'eSUN / Eryone', density: 1.28, notes: 'صلابة هيكلية فائقة ومظهر غير لامع' },
    { id: 'elegoo-resin-standard', name: 'Elegoo Standard Resin راتنج (1 كجم)', price: 1250, weight: 1000, type: 'Resin', brand: 'Elegoo', density: 1.10, notes: 'لطابعات الراتنج MSLA ثلاثية الأبعاد' },
    { id: 'elegoo-resin-abs-like', name: 'Elegoo ABS-Like Resin (1 كجم)', price: 1550, weight: 1000, type: 'Resin ABS-Like', brand: 'Elegoo', density: 1.12, notes: 'راتنج عالي المتانة ومقاوم للكسر' }
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
      notes: 'حجم طباعة كبير 320×320×385 مم',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'neptune-4-max',
      name: 'Elegoo Neptune 4 Max',
      price: 38500,
      lifespanHours: 5000,
      powerKw: 0.28,
      powerRange: '0.22 - 0.35 kW',
      notes: 'حجم طباعة ضخم 420×420×480 مم',
      maxBedTemp: '85°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'bambu-a1',
      name: 'Bambu Lab A1 Combo (مع AMS)',
      price: 38000,
      lifespanHours: 6000,
      powerKw: 0.18,
      powerRange: '0.14 - 0.22 kW',
      notes: 'طباعة متعددة الألوان 4 ألوان ومعايرة ذاتية',
      maxBedTemp: '100°C',
      printSpeed: 'حتى 500 مم/ث'
    },
    {
      id: 'bambu-p1s',
      name: 'Bambu Lab P1S Combo',
      price: 52000,
      lifespanHours: 8000,
      powerKw: 0.25,
      powerRange: '0.20 - 0.35 kW (صندوق مغلق)',
      notes: 'طابعة صناعية مغلقة للـ ABS / ASA / PETG-CF',
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
      notes: 'حجم 300×300×300 مم مزودة بكاميرا ذكية AI',
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
  ],

  shippingGovernorates: [
    { id: 'local-pickup', name: 'استلام من مقر الورشة / المعمل (مجاناً)', cost: 0 },
    { id: 'cairo-giza', name: 'القاهرة والجيزة (50 ج.م)', cost: 50 },
    { id: 'alexandria', name: 'الإسكندرية (65 ج.م)', cost: 65 },
    { id: 'delta', name: 'محافظات الدلتا والقناة (70 ج.م)', cost: 70 },
    { id: 'upper-egypt', name: 'محافظات الصعيد (85 ج.م)', cost: 85 },
    { id: 'redsea-sinai', name: 'البحر الأحمر وشمال/جنوب سيناء ومطروح (100 ج.م)', cost: 100 }
  ],

  colors: [
    'أسود (Black)', 'أبيض (White)', 'رمادي (Grey)', 'فضي (Silver)',
    'أزرق (Blue)', 'أحمر (Red)', 'أصفر (Yellow)', 'أخضر (Green)',
    'برتقالي (Orange)', 'بنفسجي (Purple)', 'شفاف (Transparent)',
    'خشب (Wood PLA)', 'حريري ذهبي (Silk Gold)'
  ],

  hardwareAccessories: [
    { name: 'صمولة نحاسية حرارية (M3 Heat-Set Brass Insert)', unitCost: 3.50, unit: 'قطعة' },
    { name: 'صمولة نحاسية حرارية (M4 Heat-Set Brass Insert)', unitCost: 4.50, unit: 'قطعة' },
    { name: 'مسمار ألين صلب (M3×10mm Screw)', unitCost: 1.50, unit: 'قطعة' },
    { name: 'مسمار ألين صلب (M4×16mm Screw)', unitCost: 2.00, unit: 'قطعة' },
    { name: 'مغناطيس نيوديميوم قوي (Neodymium Magnet 6×3mm)', unitCost: 6.00, unit: 'قطعة' },
    { name: 'رمان بلي معدني (608ZZ Bearing)', unitCost: 15.00, unit: 'قطعة' },
    { name: 'كرتونة شحن وتغليف فقاعي (Packaging Box & Bubble Wrap)', unitCost: 25.00, unit: 'طرد' },
    { name: 'علبة هدايا مخصصة (Custom Gift Box)', unitCost: 35.00, unit: 'علبة' }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRESETS;
}
