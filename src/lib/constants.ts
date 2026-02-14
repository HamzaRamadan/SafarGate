'use client';

/**
 * @file src/lib/constants.ts
 * "The Constants Vault" - Sovereign Version
 * Geographic Order: Jordan > Lebanon > KSA > Syria > Iraq > GCC > Yemen > Iran > Turkey.
 * Egypt is EXCLUDED.
 */

export const CITIES: { [key: string]: { name: string; cities: string[] } } = {
  // 1. الأردن (المقر الرئيسي - أولوية قصوى)
  jordan: {
    name: 'الأردن',
    cities: ['amman', 'zarqa', 'irbid', 'aqaba', 'tafilah', 'maan', 'salt', 'karak', 'jerash', 'mafraq', 'ajloun', 'balqa', 'madaba']
  },
  // 2. لبنان
  lebanon: { name: 'لبنان', cities: ['beirut', 'tripoli', 'sidon'] },
  // 3. السعودية
  ksa: { name: 'السعودية', cities: ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'tabuk', 'hail'] },
  // 4. سوريا
  syria: { name: 'سوريا', cities: ['damascus', 'aleppo', 'homs', 'latakia', 'tartus', 'hama', 'daraa', 'suwayda'] },
  // 5. العراق
  iraq: { name: 'العراق', cities: ['baghdad', 'basra', 'erbil', 'najaf', 'karbala', 'mosul'] },
  // 6. دول الخليج (الكويت، البحرين، قطر، الإمارات، عمان)
  kuwait: { name: 'الكويت', cities: ['kuwait'] },
  bahrain: { name: 'البحرين', cities: ['manama'] },
  qatar: { name: 'قطر', cities: ['doha'] },
  uae: { name: 'الإمارات', cities: ['dubai', 'abudhabi', 'sharjah'] },
  oman: { name: 'عُمان', cities: ['muscat', 'salalah', 'sohar'] },
  // 7. اليمن
  yemen: { name: 'اليمن', cities: ['sanaa', 'aden', 'taiz'] },
  // 8. الجوار (إيران ثم تركيا)
  iran: { name: 'إيران', cities: ['tehran', 'mashhad', 'isfahan', 'shiraz'] },
  turkey: { name: 'تركيا', cities: ['istanbul', 'ankara', 'izmir', 'antalya'] },
};

const CITY_NAMES: { [key: string]: string } = {
  // الأردن
  amman: 'عمّان', zarqa: 'الزرقاء', irbid: 'إربد', aqaba: 'العقبة', tafilah: 'الطفيلة', maan: 'معان', salt: 'السلط', karak: 'الكرك', jerash: 'جرش', mafraq: 'المفرق', ajloun: 'عجلون', balqa: 'البلقاء', madaba: 'مأدبا',
  // لبنان
  beirut: 'بيروت', tripoli: 'طرابلس (لبنان)', sidon: 'صيدا',
  // السعودية
  riyadh: 'الرياض', jeddah: 'جدة', dammam: 'الدمام', mecca: 'مكة المكرمة', medina: 'المدينة المنورة', tabuk: 'تبوك', hail: 'حائل',
  // سوريا
  damascus: 'دمشق', aleppo: 'حلب', homs: 'حمص', latakia: 'اللاذقية', tartus: 'طرطوس', hama: 'حماة', daraa: 'درعا', suwayda: 'السويداء',
  // العراق
  baghdad: 'بغداد', basra: 'البصرة', erbil: 'أربيل', najaf: 'النجف', karbala: 'كربلاء', mosul: 'الموصل',
  // الخليج
  kuwait: 'الكويت', manama: 'المنامة', doha: 'الدوحة', dubai: 'دبي', abudhabi: 'أبو ظبي', sharjah: 'الشارقة', muscat: 'مسقط', salalah: 'صلالة', sohar: 'صحار',
  // اليمن وإيران وتركيا
  sanaa: 'صنعاء', aden: 'عدن', taiz: 'تعز',
  tehran: 'طهران', mashhad: 'مشهد', isfahan: 'أصفهان', shiraz: 'شيراز',
  istanbul: 'إسطنبول', ankara: 'أنقرة', izmir: 'إزمير', antalya: 'أنطاليا',
};

export function getCityName(cityKey: string): string {
  if (!cityKey) return 'غير محدد';
  const lowerKey = cityKey.toLowerCase().trim();
  return CITY_NAMES[lowerKey] || cityKey;
}
