// 3D Printing Cost Calculator - Advanced Business & Maker Engine
// Designed for Elegoo Neptune 4 Pro & Egyptian 3D Printing Market

const DEFAULT_STATE = {
  // Basic Info
  projectName: 'مشروع جديد',
  clientName: '',
  clientPhone: '',
  clientAddress: '',
  notes: '',

  // 1) Material (Starts at 0)
  partWeight: 0.00,
  spoolPrice: 0.00,
  spoolWeight: 1000,
  selectedFilamentPreset: '',
  spoolRemainingGrams: 1000,

  // 2) Power (Starts at 0 hours)
  printHours: 0.00,
  printerPowerKw: 0.16,
  electricityRate: 1.5100,
  selectedPowerPreset: 'tier-custom',
  selectedPrinterPreset: 'neptune-4-pro',

  // 3) Printer Depreciation
  printerPrice: 26000.00,
  printerLifespanHours: 5000,

  // 4) Labor (Starts at 0 hours)
  laborHours: 0.00,
  laborRatePerHour: 100.00,

  // 5) Margins & Failure
  failureRatePercent: 10.0,
  profitMarginPercent: 40.0,
  
  // 6) Order & Batch Details
  batchQuantity: 1,
  volumeDiscountPercent: 0,
  additionalCost: 0,
  additionalCostNotes: '',
  shippingCost: 0,
  depositPaid: 0,
  deliveryDueDate: '',
  orderStatus: 'ready_print',
  paymentMethod: 'cash',
  partImageUrl: '',

  // Part Specifications
  partColor: 'أسود (Black)',
  layerHeight: '0.20 مم (قياسي)',
  infillPercent: 20,
  supportsType: 'شجرية (Tree Supports)',

  // CAD Service
  cadDesignHours: 0,
  cadDesignRatePerHour: 150.00,

  // Multi-Part Assembly
  partsList: [],
  isMultiPartMode: false,
  printsPerMonth: 20,

  // UI state
  activeTab: 'table',
  darkMode: false,
  currency: 'EGP'
};

const CURRENCY_RATES = {
  EGP: { symbol: 'ج.م', rate: 1, name: 'جنيه مصري 🇪🇬' },
  SAR: { symbol: 'ر.س', rate: 0.077, name: 'ريال سعودي 🇸🇦' },
  AED: { symbol: 'د.إ', rate: 0.075, name: 'درهم إماراتي 🇦🇪' },
  USD: { symbol: '$', rate: 0.0205, name: 'دولار أمريكي 🇺🇸' }
};

const PRICING_TEMPLATES = {
  'economy': {
    name: 'اقتصادي — Economy',
    profitMarginPercent: 25,
    layerHeight: '0.28 مم (سريع)',
    infillPercent: 15,
    failureRatePercent: 12
  },
  'standard': {
    name: 'قياسي — Standard',
    profitMarginPercent: 40,
    layerHeight: '0.20 مم (قياسي)',
    infillPercent: 20,
    failureRatePercent: 10
  },
  'professional': {
    name: 'احترافي — Professional',
    profitMarginPercent: 55,
    layerHeight: '0.12 مم (تفاصيل دقيقة جداً)',
    infillPercent: 40,
    failureRatePercent: 8
  },
  'industrial': {
    name: 'صناعي — Industrial',
    profitMarginPercent: 50,
    layerHeight: '0.20 مم (قياسي)',
    infillPercent: 60,
    failureRatePercent: 5
  }
};

class CostCalculatorApp {
  constructor() {
    this.state = this.loadState();
    this.charts = {};
    this.savedProjects = this.loadSavedProjects();
    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('3d_calc_current_state_v3');
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...DEFAULT_STATE };
  }

  saveState() {
    try {
      localStorage.setItem('3d_calc_current_state_v3', JSON.stringify(this.state));
    } catch (e) {}
  }

  loadSavedProjects() {
    try {
      const projects = localStorage.getItem('3d_calc_saved_projects_v3');
      return projects ? JSON.parse(projects) : [];
    } catch (e) {
      return [];
    }
  }

  saveProjectsList() {
    try {
      localStorage.setItem('3d_calc_saved_projects_v3', JSON.stringify(this.savedProjects));
    } catch (e) {}
  }

  init() {
    this.populatePresets();
    this.setupEventListeners();
    this.setupGCodeDropZone();
    this.applyTheme();
    this.render();
    this.checkDeadlineAlerts();
  }

      populatePresets() {
    if (typeof PRESETS === 'undefined') return;

    // Build grouped filament options with 🇪🇬 Egyptian filaments prominently at the top
    const egyptianFilaments = PRESETS.filaments.filter(f => f.isEgyptian);
    const importedFilaments = PRESETS.filaments.filter(f => !f.isEgyptian);

    let filamentHtml = '<option value="">-- اختر خامة (مثال: باترون 🇪🇬 / eSUN) --</option>';
    if (egyptianFilaments.length > 0) {
      filamentHtml += '<optgroup label="🇪🇬 خامات باترون مصرية (Patron 3D)">';
      filamentHtml += egyptianFilaments.map(f => `<option value="${f.id}" ${f.id === this.state.selectedFilamentPreset ? 'selected' : ''}>${f.name} — ${f.price} ج.م</option>`).join('');
      filamentHtml += '</optgroup>';
    }
    if (importedFilaments.length > 0) {
      filamentHtml += '<optgroup label="🌐 خامات مستوردة">';
      filamentHtml += importedFilaments.map(f => `<option value="${f.id}" ${f.id === this.state.selectedFilamentPreset ? 'selected' : ''}>${f.name} — ${f.price} ج.م</option>`).join('');
      filamentHtml += '</optgroup>';
    }

    ['filamentPresetSelect', 'dash_filamentSelect', 'tbl_filamentPresetSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = filamentHtml;
    });

    const pSelect = document.getElementById('printerPresetSelect');
    if (pSelect && PRESETS.printers) {
      pSelect.innerHTML = '<option value="">-- اختر طابعة ثلاثية الأبعاد --</option>' + 
        PRESETS.printers.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPrinterPreset ? 'selected' : ''}>${p.name} — ${p.price.toLocaleString('ar-EG')} ج.م</option>`).join('');
    }

    const powerSelect = document.getElementById('electricityTierSelect');
    if (powerSelect && PRESETS.electricityTiers) {
      powerSelect.innerHTML = '<option value="">-- اختر شريحة الكهرباء في مصر --</option>' + 
        PRESETS.electricityTiers.map(t => `<option value="${t.id}" ${t.id === this.state.selectedPowerPreset ? 'selected' : ''}>${t.name} (${t.rate} ج.م/ك.و.س)</option>`).join('');
    }

        const currSelect = document.getElementById('currencySelect');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        this.setCurrency(e.target.value);
      });
    }
    const hwSelect = document.getElementById('hardwareQuickAddSelect');
    if (hwSelect && PRESETS.hardwareAccessories) {
      hwSelect.innerHTML = '<option value="">+ إضافة مستلزمات تجميع جاهزة</option>' + 
        PRESETS.hardwareAccessories.map((h, i) => `<option value="${i}">${h.name} (${h.unitCost} ج.م/${h.unit})</option>`).join('');
    }

    const shipSelect = document.getElementById('dash_shippingGovSelect');
    if (shipSelect && PRESETS.shippingGovernorates) {
      shipSelect.innerHTML = '<option value="local-pickup">استلام من المقر (0 ج.م)</option>' + 
        PRESETS.shippingGovernorates.map(g => `<option value="${g.id}" ${g.id === this.state.selectedGovernorate ? 'selected' : ''}>${g.name} — ${g.cost} ج.م</option>`).join('');
    }

    const colorSelect = document.getElementById('dash_partColorSelect');
    if (colorSelect && PRESETS.colors) {
      colorSelect.innerHTML = '<option value="">-- اختر اللون --</option>' + 
        PRESETS.colors.map(c => `<option value="${c}" ${c === this.state.partColor ? 'selected' : ''}>${c}</option>`).join('');
    }
  }

  calculate() {
    const s = this.state;
    let effectiveWeight = s.partWeight;
    let effectiveHours = s.printHours;

    if (s.isMultiPartMode && s.partsList && s.partsList.length > 0) {
      effectiveWeight = s.partsList.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
      effectiveHours = s.partsList.reduce((acc, p) => acc + (Number(p.time) || 0), 0);
    }

    const materialCost = s.spoolWeight > 0 ? (effectiveWeight * s.spoolPrice) / s.spoolWeight : 0;
    const powerCost = effectiveHours * s.printerPowerKw * s.electricityRate;
    const depreciationPerHour = s.printerLifespanHours > 0 ? s.printerPrice / s.printerLifespanHours : 0;
    const depreciationCost = depreciationPerHour * effectiveHours;
    const laborCost = s.laborHours * s.laborRatePerHour;
    const additionalCost = Number(s.additionalCost) || 0;
    const subtotal = materialCost + powerCost + depreciationCost + laborCost + additionalCost;
    const failureCost = subtotal * (s.failureRatePercent / 100);
    const totalCost = subtotal + failureCost;

    const marginFraction = s.profitMarginPercent / 100;
    const baseSellingPrice = marginFraction < 1 ? totalCost / (1 - marginFraction) : 0;
    
    const qty = Math.max(1, parseInt(s.batchQuantity) || 1);
    let autoDiscount = 0;
    if (qty >= 20) autoDiscount = 15;
    else if (qty >= 10) autoDiscount = 10;
    else if (qty >= 5) autoDiscount = 5;

    const discountRate = (s.volumeDiscountPercent > 0 ? s.volumeDiscountPercent : autoDiscount) / 100;
    const finalSellingPrice = baseSellingPrice * (1 - discountRate);

    const profitAmount = finalSellingPrice - totalCost;
    const markupPercent = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0;

    const batchTotalCost = totalCost * qty;
    const batchTotalPrice = finalSellingPrice * qty;
    const batchTotalProfit = profitAmount * qty;
    const costPerGram = effectiveWeight > 0 ? totalCost / effectiveWeight : 0;
    const costPerHour = effectiveHours > 0 ? totalCost / effectiveHours : 0;

    const remainingAfterPrint = Math.max(0, s.spoolRemainingGrams - effectiveWeight * qty);
    const printsLeftInSpool = effectiveWeight > 0 ? Math.floor(s.spoolRemainingGrams / effectiveWeight) : 0;

    const piecesToBreakEven = profitAmount > 0 ? Math.ceil(s.printerPrice / profitAmount) : 0;
    const hoursToBreakEven = piecesToBreakEven * effectiveHours;
    const monthlyPrints = Math.max(1, Number(s.printsPerMonth) || 20);
    const monthlyProfit = profitAmount * monthlyPrints;
    const monthsToBreakEven = monthlyProfit > 0 ? (s.printerPrice / monthlyProfit).toFixed(1) : '∞';

    const cadFee = (Number(s.cadDesignHours) || 0) * (Number(s.cadDesignRatePerHour) || 0);
    const shippingFee = Number(s.shippingCost) || 0;
    const grandOrderTotal = (finalSellingPrice * qty) + shippingFee + cadFee;
    const deposit = Number(s.depositPaid) || 0;
    const remainingBalance = Math.max(0, grandOrderTotal - deposit);

    return {
      effectiveWeight, effectiveHours, materialCost, powerCost,
      depreciationPerHour, depreciationCost, laborCost, additionalCost,
      subtotal, failureCost, totalCost, baseSellingPrice, discountRate,
      finalSellingPrice, profitAmount, markupPercent, qty,
      batchTotalCost, batchTotalPrice, batchTotalProfit,
      costPerGram, costPerHour, remainingAfterPrint, printsLeftInSpool,
      piecesToBreakEven, hoursToBreakEven, monthlyPrints, monthlyProfit, monthsToBreakEven,
      cadFee, shippingFee, grandOrderTotal, deposit, remainingBalance
    };
  }

  formatCurrency(val, decimals = 2) {
    if (isNaN(val)) return '0.00 ج.م';
    const curr = CURRENCY_RATES[this.state.currency] || CURRENCY_RATES.EGP;
    const converted = val * curr.rate;
    return Number(converted).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' ' + curr.symbol;
  }

  formatNumber(val, decimals = 2) {
    if (isNaN(val)) return '0';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  render() {
    const res = this.calculate();

    this.updateElementValue('tbl_partWeight', this.state.partWeight);
    this.updateElementValue('tbl_spoolPrice', this.state.spoolPrice);
    this.updateElementValue('tbl_spoolWeight', this.state.spoolWeight);
    this.updateElementText('tbl_materialCost', this.formatCurrency(res.materialCost));

    this.updateElementValue('tbl_printHours', this.state.printHours);
    this.updateElementValue('tbl_printerPowerKw', this.state.printerPowerKw);
    this.updateElementValue('tbl_electricityRate', this.state.electricityRate);
    this.updateElementText('tbl_powerCost', this.formatCurrency(res.powerCost));

    this.updateElementValue('tbl_printerPrice', this.state.printerPrice);
    this.updateElementValue('tbl_printerLifespanHours', this.state.printerLifespanHours);
    this.updateElementText('tbl_depreciationPerHour', this.formatCurrency(res.depreciationPerHour, 4) + '/ساعة');
    this.updateElementText('tbl_depreciationCost', this.formatCurrency(res.depreciationCost));

    this.updateElementValue('tbl_laborHours', this.state.laborHours);
    this.updateElementValue('tbl_laborRatePerHour', this.state.laborRatePerHour);
    this.updateElementText('tbl_laborCost', this.formatCurrency(res.laborCost));

    this.updateElementText('tbl_subtotal', this.formatCurrency(res.subtotal));
    this.updateElementValue('tbl_failureRatePercent', this.state.failureRatePercent);
    this.updateElementText('tbl_failureCost', this.formatCurrency(res.failureCost));
    this.updateElementText('tbl_totalCost', this.formatCurrency(res.totalCost));

    this.updateElementValue('tbl_profitMarginPercent', this.state.profitMarginPercent);
    this.updateElementText('tbl_finalSellingPrice', this.formatCurrency(res.finalSellingPrice));

    // Summary Hero Cards
    this.updateElementText('heroTotalCost', this.formatCurrency(res.totalCost));
    this.updateElementText('heroSellingPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('heroProfitAmount', this.formatCurrency(res.profitAmount));
    this.updateElementText('heroMarkupPercent', `${this.formatNumber(res.markupPercent, 1)}%`);
    this.updateElementText('heroCostPerGram', `${this.formatNumber(res.costPerGram, 2)} ج.م/جم`);
    this.updateElementText('heroCostPerHour', `${this.formatNumber(res.costPerHour, 2)} ج.م/ساعة`);

    // Dashboard Inputs
    this.updateElementValue('dash_projectName', this.state.projectName);
    this.updateElementValue('dash_clientName', this.state.clientName);
    this.updateElementValue('dash_partWeight', this.state.partWeight);
    this.updateElementValue('dash_spoolPrice', this.state.spoolPrice);
    this.updateElementValue('dash_spoolWeight', this.state.spoolWeight);
    this.updateElementValue('dash_spoolRemaining', this.state.spoolRemainingGrams);
    this.updateElementValue('dash_printHours', this.state.printHours);
    this.updateElementValue('dash_printerPowerKw', this.state.printerPowerKw);
    this.updateElementValue('dash_electricityRate', this.state.electricityRate);
    this.updateElementValue('dash_printerPrice', this.state.printerPrice);
    this.updateElementValue('dash_printerLifespanHours', this.state.printerLifespanHours);
    this.updateElementValue('dash_laborHours', this.state.laborHours);
    this.updateElementValue('dash_laborRatePerHour', this.state.laborRatePerHour);
    this.updateElementValue('dash_failureRatePercent', this.state.failureRatePercent);
    this.updateElementValue('dash_profitMarginPercent', this.state.profitMarginPercent);
    this.updateElementValue('dash_batchQuantity', this.state.batchQuantity);
    this.updateElementValue('dash_additionalCost', this.state.additionalCost);
    this.updateElementValue('dash_additionalCostNotes', this.state.additionalCostNotes || '');
    this.updateElementValue('dash_printsPerMonth', this.state.printsPerMonth);

    this.updateElementValue('dash_clientPhone', this.state.clientPhone || '');
    this.updateElementValue('dash_clientAddress', this.state.clientAddress || '');
    this.updateElementValue('dash_shippingCost', this.state.shippingCost);
    this.updateElementValue('dash_depositPaid', this.state.depositPaid);
    this.updateElementValue('dash_deliveryDueDate', this.state.deliveryDueDate || '');
    this.updateElementValue('dash_cadDesignHours', this.state.cadDesignHours);
    this.updateElementValue('dash_cadDesignRatePerHour', this.state.cadDesignRatePerHour);

    // Spool Roll Tracker UI
    const spoolBar = document.getElementById('spoolProgress');
    if (spoolBar) {
      const pct = Math.min(100, Math.max(0, (res.remainingAfterPrint / this.state.spoolWeight) * 100));
      spoolBar.style.width = `${pct}%`;
      spoolBar.className = pct < 15 ? 'h-full rounded-full transition-all bg-rose-500' : (pct < 35 ? 'h-full rounded-full transition-all bg-amber-500' : 'h-full rounded-full transition-all bg-emerald-500');
    }
    this.updateElementText('spoolRemainingText', `${res.remainingAfterPrint.toFixed(0)} جم متبقية (${res.printsLeftInSpool} قطع إضافية)`);

    // Batch & Quotation elements
    this.updateElementText('batchSingleCost', this.formatCurrency(res.totalCost));
    this.updateElementText('batchSinglePrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('batchSingleProfit', this.formatCurrency(res.profitAmount));
    this.updateElementText('batchTotalQty', res.qty);
    this.updateElementText('batchTotalCost', this.formatCurrency(res.batchTotalCost));
    this.updateElementText('batchTotalPrice', this.formatCurrency(res.batchTotalPrice));
    this.updateElementText('batchTotalProfit', this.formatCurrency(res.batchTotalProfit));

    // ROI & Break Even UI
    this.updateElementText('roiBreakEvenPieces', `${res.piecesToBreakEven} قطعة`);
    this.updateElementText('roiBreakEvenHours', `${res.hoursToBreakEven.toFixed(0)} ساعة`);
    this.updateElementText('roiMonthlyProfit', this.formatCurrency(res.monthlyProfit));
    this.updateElementText('roiMonthsToPayoff', `${res.monthsToBreakEven} شهر`);

    this.renderPartsList();
    this.renderQuotationPreview(res);
    this.renderSavedProjects();
    this.renderCharts(res);
    this.showMaterialComparison();
    this.saveState();
  }

  updateElementValue(id, val) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = val;
  }

  updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  renderPartsList() {
    const container = document.getElementById('partsListContainer');
    if (!container) return;

    if (!this.state.partsList || this.state.partsList.length === 0) {
      container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">لا توجد قطع مضافة في التجميعة بعد.</div>';
      return;
    }

    container.innerHTML = this.state.partsList.map((p, idx) => `
      <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold font-mono">${idx + 1}</span>
          <div>
            <div class="font-bold text-slate-800 dark:text-slate-100">${p.name}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">${p.weight} جم • ${p.time} ساعة • ${p.filament || 'PLA'}</div>
          </div>
        </div>
        <button onclick="app.removePart(${idx})" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');
  }

  addPart() {
    const nameInput = document.getElementById('newPartName');
    const weightInput = document.getElementById('newPartWeight');
    const timeInput = document.getElementById('newPartTime');

    const name = nameInput?.value?.trim() || `قطعة ${this.state.partsList.length + 1}`;
    const weight = parseFloat(weightInput?.value) || 50;
    const time = parseFloat(timeInput?.value) || 2.5;

    this.state.partsList.push({ name, weight, time, filament: 'PLA' });
    if (nameInput) nameInput.value = '';
    if (weightInput) weightInput.value = '';
    if (timeInput) timeInput.value = '';

    this.render();
    this.showToast('تمت إضافة القطعة للتجميعة!');
  }

  removePart(idx) {
    this.state.partsList.splice(idx, 1);
    this.render();
  }

  toggleMultiPartMode() {
    this.state.isMultiPartMode = !this.state.isMultiPartMode;
    const btn = document.getElementById('multiPartToggleBtn');
    const badge = document.getElementById('multiPartBadge');
    if (btn) {
      if (this.state.isMultiPartMode) {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-blue-600 text-white';
        if (badge) badge.textContent = 'مفعل (تجميعة)';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
        if (badge) badge.textContent = 'قطعة مفردة';
      }
    }
    this.render();
  }

  setupGCodeDropZone() {
    const dropZone = document.getElementById('gcodeDropZone');
    const fileInput = document.getElementById('gcodeFileInput');

    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/30');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/30');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files.length > 0) this.parseGCodeFile(dt.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.parseGCodeFile(e.target.files[0]);
    });
  }

  parseGCodeFile(file) {
    if (!file.name.toLowerCase().endsWith('.gcode') && !file.name.toLowerCase().endsWith('.g')) {
      alert('يرجى اختيار ملف G-Code صالح (.gcode)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsed = this.extractGCodeMetadata(content, file.name);
      
      if (parsed.weight > 0 || parsed.hours > 0) {
        this.state.partWeight = parsed.weight > 0 ? parsed.weight : this.state.partWeight;
        this.state.printHours = parsed.hours > 0 ? parsed.hours : this.state.printHours;
        this.state.projectName = parsed.cleanName || file.name.replace(/\.gcode$/i, '');
        this.render();
        this.showToast(`✨ تم استخراج البيانات: ${parsed.weight} جم • ${parsed.hours} ساعة`);
      } else {
        this.showToast('⚠️ تم قراءة الملف بنجاح.');
      }
    };
    reader.readAsText(file.slice(0, 1024 * 500));
  }

  extractGCodeMetadata(text, filename) {
    let weight = 0, hours = 0;
    let cleanName = filename.replace(/\.gcode$/i, '');

    const curaTimeMatch = text.match(/;TIME:(\d+)/i);
    if (curaTimeMatch) hours = Number((parseInt(curaTimeMatch[1]) / 3600).toFixed(2));

    const curaWeightMatch = text.match(/;Filament used:.*?([0-9.]+)\s*g/i) || text.match(/;Filament used =.*?([0-9.]+)\s*g/i);
    if (curaWeightMatch) weight = parseFloat(curaWeightMatch[1]);

    const prusaTimeMatch = text.match(/; estimated printing time.*?=\s*(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i);
    if (prusaTimeMatch) {
      const d = parseInt(prusaTimeMatch[1]) || 0;
      const h = parseInt(prusaTimeMatch[2]) || 0;
      const m = parseInt(prusaTimeMatch[3]) || 0;
      hours = Number((d * 24 + h + m / 60).toFixed(2));
    }

    const prusaWeightMatch = text.match(/; (?:total )?filament used \[(?:g|gram)\]\s*=\s*([0-9.]+)/i);
    if (prusaWeightMatch) weight = parseFloat(prusaWeightMatch[1]);

    const bambuTimeMatch = text.match(/; (?:model|total) printing time:\s*(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i);
    if (!hours && bambuTimeMatch) {
      const h = parseInt(bambuTimeMatch[1]) || 0;
      const m = parseInt(bambuTimeMatch[2]) || 0;
      hours = Number((h + m / 60).toFixed(2));
    }

    const bambuWeightMatch = text.match(/; total filament weight \[g\]\s*:\s*([0-9.]+)/i) || text.match(/; filament used \[g\]\s*=\s*([0-9.]+)/i);
    if (!weight && bambuWeightMatch) weight = parseFloat(bambuWeightMatch[1]);

    return { weight, hours, cleanName };
  }

  renderCharts(res) {
    const ctx = document.getElementById('costChart');
    if (ctx) {
      const dataValues = [res.materialCost, res.powerCost, res.depreciationCost, res.laborCost, res.failureCost, res.additionalCost].map(v => Number(v.toFixed(2)));
      const labels = [
        `خامة (${((res.materialCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `كهرباء (${((res.powerCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `إهلاك وصيانة (${((res.depreciationCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `عمالة ومعالجة (${((res.laborCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `هدر وفشل (${((res.failureCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `إضافات (${((res.additionalCost / res.totalCost) * 100 || 0).toFixed(1)}%)`
      ];

      if (this.charts.cost) {
        this.charts.cost.data.datasets[0].data = dataValues;
        this.charts.cost.data.labels = labels;
        this.charts.cost.update();
      } else if (typeof Chart !== 'undefined') {
        this.charts.cost = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: dataValues,
              backgroundColor: ['#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#10B981'],
              borderWidth: 2,
              borderColor: this.state.darkMode ? '#1E293B' : '#FFFFFF'
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal, Cairo, sans-serif', size: 12 }, color: this.state.darkMode ? '#CBD5E1' : '#475569', padding: 10 } },
              tooltip: { rtl: true, callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} ج.م` } }
            },
            cutout: '65%'
          }
        });
      }
    }

    const ctxProfit = document.getElementById('profitChart');
    if (ctxProfit) {
      if (this.charts.profit) {
        this.charts.profit.data.datasets[0].data = [res.totalCost];
        this.charts.profit.data.datasets[1].data = [res.profitAmount];
        this.charts.profit.update();
      } else if (typeof Chart !== 'undefined') {
        this.charts.profit = new Chart(ctxProfit, {
          type: 'bar',
          data: {
            labels: ['سعر البيع'],
            datasets: [
              { label: 'التكلفة الحقيقية', data: [res.totalCost], backgroundColor: '#64748B', borderRadius: 6 },
              { label: 'صافي الربح المستهدف', data: [res.profitAmount], backgroundColor: '#10B981', borderRadius: 6 }
            ]
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { color: this.state.darkMode ? '#334155' : '#E2E8F0' }, ticks: { color: this.state.darkMode ? '#94A3B8' : '#64748B' } },
              y: { stacked: true, display: false }
            },
            plugins: {
              legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal, Cairo, sans-serif', size: 12 }, color: this.state.darkMode ? '#CBD5E1' : '#475569' } },
              tooltip: { rtl: true, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)} ج.م` } }
            }
          }
        });
      }
    }
  }

  renderQuotationPreview(res) {
    const s = this.state;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    this.updateElementText('quoteDate', dateStr);
    this.updateElementText('quoteProjectTitle', s.projectName || 'قطعة طباعة ثلاثية الأبعاد');
    this.updateElementText('quoteClientName', s.clientName ? `العميل: ${s.clientName}` : 'عرض سعر عام');
    this.updateElementText('quoteWeight', `${res.effectiveWeight} جرام`);
    this.updateElementText('quotePrintTime', `${res.effectiveHours} ساعة`);
    this.updateElementText('quoteFilamentType', s.selectedFilamentPreset && typeof PRESETS !== 'undefined' ? (PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA') : 'PLA قياسي');
    this.updateElementText('quotePrinterModel', s.selectedPrinterPreset && typeof PRESETS !== 'undefined' ? (PRESETS.printers.find(p => p.id === s.selectedPrinterPreset)?.name || 'Elegoo Neptune 4 Pro') : 'Elegoo Neptune 4 Pro');
    this.updateElementText('quoteUnitPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('quoteQuantity', `${res.qty} قطعة`);
    this.updateElementText('quoteTotalPrice', this.formatCurrency(res.batchTotalPrice));
    
    // Render dynamic QR code for WhatsApp Quote
    const qrCanvas = document.getElementById('quoteQRCode');
    if (qrCanvas && typeof QRious !== 'undefined') {
      const waUrl = decodeURIComponent(this.generateWhatsAppText());
      let phoneClean = s.clientPhone ? s.clientPhone.replace(/[^0-9]/g, '') : '';
      if (phoneClean.startsWith('01')) phoneClean = '2' + phoneClean;
      const directUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(waUrl)}` : `https://wa.me/?text=${encodeURIComponent(waUrl)}`;
      new QRious({
        element: qrCanvas,
        value: directUrl,
        size: 120,
        level: 'M'
      });
    }

    // Payment method & Part Image in Quote
    const payLabels = {
      'cash': '💵 كاش عند الاستلام',
      'instapay': '⚡ إنستاباي InstaPay',
      'vodafone_cash': '📱 فودافون كاش (Vodafone Cash)',
      'bank_transfer': '🏦 تحويل بنكي'
    };
    this.updateElementText('quotePaymentMethod', payLabels[s.paymentMethod] || 'كاش عند الاستلام');

    const imgContainer = document.getElementById('quotePartImageContainer');
    const quoteImg = document.getElementById('quotePartImage');
    if (imgContainer && quoteImg) {
      if (s.partImageUrl) {
        quoteImg.src = s.partImageUrl;
        imgContainer.classList.remove('hidden');
      } else {
        imgContainer.classList.add('hidden');
      }
    }

    this.updateElementText('quoteNotes', s.notes || 'الطباعة بدقة عالية وجودة ممتازة شاملة إزالة الدعامات والتشطيب الأولي.');

    this.updateElementText('quoteDueDate', s.deliveryDueDate || 'خلال 2-3 أيام عمل');
    this.updateElementText('quoteClientPhone', s.clientPhone || 'غير مسجل');
    this.updateElementText('quoteClientAddress', s.clientAddress || (s.selectedGovernorate !== 'local-pickup' ? s.selectedGovernorate : 'استلام من المقر'));
    this.updateElementText('quoteColor', s.partColor);
    this.updateElementText('quoteLayerHeight', s.layerHeight);
    this.updateElementText('quoteInfill', s.infillPercent + '%');
    this.updateElementText('quotePrintSubtotal', this.formatCurrency(res.finalSellingPrice * res.qty));
    this.updateElementText('quoteShippingCost', this.formatCurrency(res.shippingFee));
    this.updateElementText('quoteCadFee', this.formatCurrency(res.cadFee));
    this.updateElementText('quoteDepositPaid', this.formatCurrency(res.deposit));
    this.updateElementText('quoteRemainingBalance', this.formatCurrency(res.remainingBalance));
  }

  renderSavedProjects() {
    const list = document.getElementById('savedProjectsList');
    if (!list) return;

    if (this.savedProjects.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-slate-400"><i class="fas fa-folder-open text-4xl mb-3 text-slate-300 dark:text-slate-600 block"></i>لا توجد حسابات محفوظة بعد.</div>';
      return;
    }

    
    let filtered = this.savedProjects;
    if (this.currentSavedFilter && this.currentSavedFilter !== 'all') {
      filtered = filtered.filter(p => (p.orderStatus || 'ready_print') === this.currentSavedFilter);
    }

    const statusBadges = {
      'pending_design': '<span class="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">✏️ قيد التصميم</span>',
      'ready_print': '<span class="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold">⏳ جاهز للطباعة</span>',
      'printing': '<span class="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">🖨️ جاري الطباعة</span>',
      'post_processing': '<span class="bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-xs px-2.5 py-0.5 rounded-full font-bold">🔧 تشطيب ومعالجة</span>',
      'ready_ship': '<span class="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold">📦 جاهز للشحن</span>',
      'delivered': '<span class="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">✅ تم التسليم</span>'
    };

    list.innerHTML = filtered.map((p, idx) => `
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-blue-400">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-slate-800 dark:text-slate-100 text-lg">${p.projectName || 'مشروع بدون اسم'}</span>
            ${p.clientName ? `<span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-2.5 py-0.5 rounded-full font-medium">${p.clientName}</span>` : ''}
            ${statusBadges[p.orderStatus || 'ready_print'] || ''}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
            <span><i class="fas fa-weight-hanging ml-1"></i> ${p.partWeight} جم</span>
            <span><i class="fas fa-clock ml-1"></i> ${p.printHours} ساعة</span>
            <span><i class="fas fa-palette ml-1"></i> ${p.partColor || 'أسود'}</span>
            <span><i class="fas fa-tag ml-1 text-emerald-600"></i> الإجمالي: ${p.calcSummary?.sellingPrice || '-'}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <button onclick="app.loadProject(${idx})" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-upload"></i> فتح
          </button>
          <button onclick="app.deleteProject(${idx})" class="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5">
            <i class="fas fa-trash-alt"></i> حذف
          </button>
        </div>
      </div>
    `).join('');
;
  }

  saveCurrentProject() {
    const res = this.calculate();
    const project = {
      ...this.state,
      savedAt: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
      calcSummary: {
        totalCost: this.formatCurrency(res.totalCost),
        sellingPrice: this.formatCurrency(res.finalSellingPrice),
        profit: this.formatCurrency(res.profitAmount),
        grandOrderTotal: this.formatCurrency(res.grandOrderTotal)
      }
    };

    const existingIndex = this.savedProjects.findIndex(p => p.projectName === project.projectName && p.clientName === project.clientName);
    if (existingIndex >= 0) this.savedProjects[existingIndex] = project;
    else this.savedProjects.unshift(project);

    this.saveProjectsList();
    this.renderSavedProjects();
    this.showToast('تم حفظ المشروع بنجاح!');
  }

  loadProject(idx) {
    if (this.savedProjects[idx]) {
      this.state = { ...DEFAULT_STATE, ...this.savedProjects[idx] };
      this.populatePresets();
      this.render();
      this.switchTab('table');
      this.showToast('تم استعادة المشروع بنجاح!');
    }
  }

  deleteProject(idx) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع المحفوظ؟')) {
      this.savedProjects.splice(idx, 1);
      this.saveProjectsList();
      this.renderSavedProjects();
      this.showToast('تم حذف المشروع.');
    }
  }

  resetToDefaults() {
    if (confirm('هل تريد إعادة تعيين جميع القيم إلى الإعدادات الافتراضية لطابعة Elegoo Neptune 4 Pro؟')) {
      this.state = { ...DEFAULT_STATE };
      this.populatePresets();
      this.render();
      this.showToast('تمت استعادة القيم الافتراضية.');
    }
  }

  setupEventListeners() {
    const handleInput = (key, val, type = 'float') => {
      let parsed = type === 'int' ? parseInt(val) : parseFloat(val);
      if (type === 'string') parsed = val;
      if (isNaN(parsed) && type !== 'string') parsed = 0;
      this.state[key] = parsed;
      this.render();
    };

    const tableBindings = [
      { id: 'tbl_partWeight', key: 'partWeight' },
      { id: 'tbl_spoolPrice', key: 'spoolPrice' },
      { id: 'tbl_spoolWeight', key: 'spoolWeight' },
      { id: 'tbl_printHours', key: 'printHours' },
      { id: 'tbl_printerPowerKw', key: 'printerPowerKw' },
      { id: 'tbl_electricityRate', key: 'electricityRate' },
      { id: 'tbl_printerPrice', key: 'printerPrice' },
      { id: 'tbl_printerLifespanHours', key: 'printerLifespanHours' },
      { id: 'tbl_laborHours', key: 'laborHours' },
      { id: 'tbl_laborRatePerHour', key: 'laborRatePerHour' },
      { id: 'tbl_failureRatePercent', key: 'failureRatePercent' },
      { id: 'tbl_profitMarginPercent', key: 'profitMarginPercent' }
    ];

    tableBindings.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) el.addEventListener('input', (e) => handleInput(b.key, e.target.value));
    });

    const dashBindings = [
      { id: 'dash_projectName', key: 'projectName', type: 'string' },
      { id: 'dash_clientName', key: 'clientName', type: 'string' },
      { id: 'dash_partWeight', key: 'partWeight' },
      { id: 'dash_spoolPrice', key: 'spoolPrice' },
      { id: 'dash_spoolWeight', key: 'spoolWeight' },
      { id: 'dash_spoolRemaining', key: 'spoolRemainingGrams' },
      { id: 'dash_printHours', key: 'printHours' },
      { id: 'dash_printerPowerKw', key: 'printerPowerKw' },
      { id: 'dash_electricityRate', key: 'electricityRate' },
      { id: 'dash_printerPrice', key: 'printerPrice' },
      { id: 'dash_printerLifespanHours', key: 'printerLifespanHours' },
      { id: 'dash_laborHours', key: 'laborHours' },
      { id: 'dash_laborRatePerHour', key: 'laborRatePerHour' },
      { id: 'dash_failureRatePercent', key: 'failureRatePercent' },
      { id: 'dash_profitMarginPercent', key: 'profitMarginPercent' },
      { id: 'dash_batchQuantity', key: 'batchQuantity', type: 'int' },
      { id: 'dash_additionalCost', key: 'additionalCost' },
      { id: 'dash_additionalCostNotes', key: 'additionalCostNotes', type: 'string' },
      { id: 'dash_printsPerMonth', key: 'printsPerMonth', type: 'int' },
      { id: 'dash_clientPhone', key: 'clientPhone', type: 'string' },
      { id: 'dash_clientAddress', key: 'clientAddress', type: 'string' },
      { id: 'dash_shippingCost', key: 'shippingCost' },
      { id: 'dash_depositPaid', key: 'depositPaid' },
      { id: 'dash_deliveryDueDate', key: 'deliveryDueDate', type: 'string' },
      { id: 'dash_cadDesignHours', key: 'cadDesignHours' },
      { id: 'dash_cadDesignRatePerHour', key: 'cadDesignRatePerHour' },
      { id: 'dash_infillPercent', key: 'infillPercent', type: 'int' }
    ];

    dashBindings.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) el.addEventListener('input', (e) => handleInput(b.key, e.target.value, b.type));
    });

        const handleFilamentChange = (e) => {
      if (typeof PRESETS === 'undefined' || !PRESETS.filaments) return;
      const item = PRESETS.filaments.find(f => f.id === e.target.value);
      if (item) {
        this.state.selectedFilamentPreset = item.id;
        this.state.spoolPrice = item.price;
        this.state.spoolWeight = item.weight;
        
        // Sync all 3 selects
        ['filamentPresetSelect', 'dash_filamentSelect', 'tbl_filamentPresetSelect'].forEach(id => {
          const el = document.getElementById(id);
          if (el && el.value !== item.id) el.value = item.id;
        });

        this.render();
        this.showToast(`✨ تم اختيار: ${item.name} (${item.price} ج.م)`);
      }
    };

    ['filamentPresetSelect', 'dash_filamentSelect', 'tbl_filamentPresetSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', handleFilamentChange);
    });
    const fSelect = null; // replaced by handleFilamentChange
    if (fSelect && typeof PRESETS !== 'undefined') {
      fSelect.addEventListener('change', (e) => {
        const item = PRESETS.filaments.find(f => f.id === e.target.value);
        if (item) {
          this.state.selectedFilamentPreset = item.id;
          this.state.spoolPrice = item.price;
          this.state.spoolWeight = item.weight;
          this.render();
          this.showToast(`تم تطبيق خامة: ${item.name}`);
        }
      });
    }

    const pSelect = document.getElementById('printerPresetSelect');
    if (pSelect && typeof PRESETS !== 'undefined') {
      pSelect.addEventListener('change', (e) => {
        const item = PRESETS.printers.find(p => p.id === e.target.value);
        if (item) {
          this.state.selectedPrinterPreset = item.id;
          this.state.printerPrice = item.price;
          this.state.printerLifespanHours = item.lifespanHours;
          this.state.printerPowerKw = item.powerKw;
          this.render();
          this.showToast(`تم تطبيق طابعة: ${item.name}`);
        }
      });
    }

    const eSelect = document.getElementById('electricityTierSelect');
    if (eSelect && typeof PRESETS !== 'undefined') {
      eSelect.addEventListener('change', (e) => {
        const item = PRESETS.electricityTiers.find(t => t.id === e.target.value);
        if (item) {
          this.state.selectedPowerPreset = item.id;
          this.state.electricityRate = item.rate;
          this.render();
          this.showToast(`تم تطبيق شريحة: ${item.name}`);
        }
      });
    }

    
    const imgInput = document.getElementById('dash_partImageInput');
    if (imgInput) {
      imgInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.state.partImageUrl = ev.target.result;
            this.render();
            this.showToast('تم إرفاق صورة القطعة بنجاح!');
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    const paySelect = document.getElementById('dash_paymentMethodSelect');
    if (paySelect) {
      paySelect.addEventListener('change', (e) => {
        this.state.paymentMethod = e.target.value;
        this.render();
      });
    }

    const statusSelect = document.getElementById('dash_orderStatusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.state.orderStatus = e.target.value;
        this.render();
      });
    }

    const clientInput = document.getElementById('dash_clientName');
    if (clientInput) {
      clientInput.addEventListener('change', (e) => {
        const found = this.savedProjects.find(p => p.clientName === e.target.value);
        if (found) {
          if (found.clientPhone && !this.state.clientPhone) this.state.clientPhone = found.clientPhone;
          if (found.clientAddress && !this.state.clientAddress) this.state.clientAddress = found.clientAddress;
          this.render();
          this.showToast(`✨ تم استرجاع بيانات العميل: ${found.clientName}`);
        }
      });
    }

        const currSelect = document.getElementById('currencySelect');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        this.setCurrency(e.target.value);
      });
    }
    const hwSelect = document.getElementById('hardwareQuickAddSelect');
    if (hwSelect && typeof PRESETS !== 'undefined') {
      hwSelect.addEventListener('change', (e) => {
        const item = PRESETS.hardwareAccessories[parseInt(e.target.value)];
        if (item) {
          this.state.additionalCost = (Number(this.state.additionalCost) || 0) + item.unitCost;
          this.state.additionalCostNotes = (this.state.additionalCostNotes ? this.state.additionalCostNotes + ' + ' : '') + item.name;
          this.render();
          this.showToast(`تمت إضافة: ${item.name}`);
          hwSelect.value = '';
        }
      });
    }

    const shipSelect = document.getElementById('dash_shippingGovSelect');
    if (shipSelect && typeof PRESETS !== 'undefined' && PRESETS.shippingGovernorates) {
      shipSelect.addEventListener('change', (e) => {
        if (e.target.value === 'local-pickup') {
          this.state.selectedGovernorate = 'local-pickup';
          this.state.shippingCost = 0;
        } else {
          const item = PRESETS.shippingGovernorates.find(g => g.id === e.target.value);
          if (item) {
            this.state.selectedGovernorate = item.id;
            this.state.shippingCost = item.cost;
          }
        }
        this.render();
      });
    }

    const colorSelect = document.getElementById('dash_partColorSelect');
    if (colorSelect) {
      colorSelect.addEventListener('change', (e) => {
        this.state.partColor = e.target.value;
        this.render();
      });
    }

    const lhSelect = document.getElementById('dash_layerHeightSelect');
    if (lhSelect) {
      lhSelect.addEventListener('change', (e) => {
        this.state.layerHeight = e.target.value;
        this.render();
      });
    }

    const suppSelect = document.getElementById('dash_supportsTypeSelect');
    if (suppSelect) {
      suppSelect.addEventListener('change', (e) => {
        this.state.supportsType = e.target.value;
        this.render();
      });
    }
  }

  switchTab(tabName) {
    this.state.activeTab = tabName;
    ['table', 'dashboard', 'assembly', 'roi', 'quote', 'troubleshoot', 'analytics', 'saved'].forEach(tab => {
      const pane = document.getElementById(`tabPane_${tab}`);
      const btn = document.getElementById(`tabBtn_${tab}`);
      if (pane) {
        if (tab === tabName) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
      if (btn) {
        if (tab === tabName) btn.className = 'tab-btn active px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-blue-600 text-white shadow-md transition';
        else btn.className = 'tab-btn px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition';
      }
    });

    if (tabName === 'analytics') {
      setTimeout(() => this.renderAnalytics(), 100);
    }
    if (tabName === 'dashboard' || tabName === 'table' || tabName === 'roi') {
      setTimeout(() => {
        const res = this.calculate();
        this.renderCharts(res);
      }, 100);
    }
  }

  toggleTheme() {
    this.state.darkMode = !this.state.darkMode;
    this.applyTheme();
    this.saveState();
    if (this.charts.cost) { this.charts.cost.destroy(); this.charts.cost = null; }
    if (this.charts.profit) { this.charts.profit.destroy(); this.charts.profit = null; }
    this.render();
  }

    applyTheme() {
    const isDark = this.state.darkMode;
    document.documentElement.classList.toggle('dark', isDark);

    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon) icon.className = isDark ? 'fas fa-sun text-amber-400 text-sm' : 'fas fa-moon text-slate-600 dark:text-slate-300 text-sm';
    if (text) text.textContent = isDark ? 'الوضع النهاري ☀️' : 'الوضع الليلي 🌙';

    if (this.threeScene && typeof THREE !== 'undefined') {
      this.threeScene.background = new THREE.Color(isDark ? 0x0a0f1d : 0xf1f5f9);
    }

    if (this.charts) {
      this.renderCharts();
    }
  }

  generateWhatsAppText() {
    const s = this.state;
    const res = this.calculate();
    const filament = typeof PRESETS !== 'undefined' ? (PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA') : 'PLA';
    
    let text = `مرحباً ${s.clientName || 'عزيزي العميل'} 👋\n`;
    text += `إليك عرض سعر لخدمة الطباعة ثلاثية الأبعاد:\n\n`;
    text += `📦 *القطعة / المشروع:* ${s.projectName || 'قطعة مخصصة'}\n`;
    text += `🎨 *اللون:* ${s.partColor}\n`;
    text += `🧵 *الخامة:* ${filament}\n`;
    text += `📏 *دقة الطباعة (Layer):* ${s.layerHeight}\n`;
    text += `🧱 *نسبة التعبئة (Infill):* ${s.infillPercent}%\n`;
    text += `⚖️ *الوزن الإجمالي:* ${res.effectiveWeight} جرام\n`;
    text += `⏱️ *مدة الطباعة المقدرة:* ${res.effectiveHours} ساعة\n`;
    text += `🔢 *الكمية:* ${res.qty} قطعة\n`;
    text += `--------------------------\n`;
    text += `💰 *سعر القطعة:* ${this.formatCurrency(res.finalSellingPrice)}\n`;
    text += `💵 *إجمالي الطباعة:* ${this.formatCurrency(res.finalSellingPrice * res.qty)}\n`;
    
    if (res.cadFee > 0) {
      text += `✏️ *تكلفة التصميم:* ${this.formatCurrency(res.cadFee)}\n`;
    }
    
    if (res.shippingFee > 0) {
      text += `🚚 *تكلفة الشحن:* ${this.formatCurrency(res.shippingFee)}\n`;
    }
    
    text += `💳 *الإجمالي الكلي:* ${this.formatCurrency(res.grandOrderTotal)}\n`;

    if (res.deposit > 0) {
      text += `💵 *المدفوع مقدماً:* ${this.formatCurrency(res.deposit)}\n`;
      text += `💰 *المبلغ المتبقي:* ${this.formatCurrency(res.remainingBalance)}\n`;
    }
    text += `--------------------------\n`;
    text += `📅 *موعد التسليم المتوقع:* ${s.deliveryDueDate || 'خلال 2-3 أيام عمل'}\n`;
    text += `✨ *ملاحظات:* ${s.notes || 'الطباعة بأعلى دقة ومعايرة وتشطيب أولي.'}\n\n`;
    text += `جاهزون للبدء فور تأكيد الطلب! 🚀`;

    return encodeURIComponent(text);
  }

  openWhatsApp() {
    const s = this.state;
    let phoneClean = s.clientPhone ? s.clientPhone.replace(/[^0-9]/g, '') : '';
    if (phoneClean.startsWith('01')) phoneClean = '2' + phoneClean;
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${this.generateWhatsAppText()}` : `https://wa.me/?text=${this.generateWhatsAppText()}`;
    window.open(url, '_blank');
  }

  copyWhatsAppText() {
    const raw = decodeURIComponent(this.generateWhatsAppText());
    navigator.clipboard.writeText(raw).then(() => {
      this.showToast('تم نسخ نص عرض السعر لواتساب بنجاح!');
    }).catch(() => alert(raw));
  }

  exportCSV() {
    const res = this.calculate();
    const rows = [
      ['البند', 'القيمة', 'الوحدة'],
      ['العميل', this.state.clientName || 'غير مسجل', ''],
      ['رقم الهاتف', this.state.clientPhone || 'غير مسجل', ''],
      ['اللون', this.state.partColor, ''],
      ['دقة الطباعة', this.state.layerHeight, ''],
      ['نسبة التعبئة', this.state.infillPercent + '%', '%'],
      ['وزن القطعة', res.effectiveWeight, 'جرام'],
      ['سعر البكرة', this.state.spoolPrice, 'ج.م'],
      ['تكلفة المادة الخام', res.materialCost.toFixed(2), 'ج.م'],
      ['ساعات الطباعة', res.effectiveHours, 'ساعة'],
      ['استهلاك الكهرباء', this.state.printerPowerKw, 'kW'],
      ['تكلفة الكهرباء', res.powerCost.toFixed(2), 'ج.م'],
      ['إهلاك الطابعة بالساعة', res.depreciationPerHour.toFixed(4), 'ج.م/ساعة'],
      ['إجمالي إهلاك الطابعة للقطعة', res.depreciationCost.toFixed(2), 'ج.م'],
      ['وقت العمل والتشطيب', this.state.laborHours, 'ساعة'],
      ['أجر الساعة', this.state.laborRatePerHour, 'ج.م'],
      ['تكلفة العمالة', res.laborCost.toFixed(2), 'ج.م'],
      ['المجموع الفرعي', res.subtotal.toFixed(2), 'ج.م'],
      ['نسبة الهدر وفشل الطباعة', this.state.failureRatePercent + '%', '%'],
      ['قيمة الهدر', res.failureCost.toFixed(2), 'ج.م'],
      ['إجمالي تكلفة القطعة', res.totalCost.toFixed(2), 'ج.م'],
      ['صافي هامش الربح', this.state.profitMarginPercent + '%', '%'],
      ['سعر البيع النهائي', res.finalSellingPrice.toFixed(2), 'ج.م'],
      ['صافي مبلغ الربح', res.profitAmount.toFixed(2), 'ج.م'],
      ['الكمية المطلوبة', res.qty, 'قطعة'],
      ['إجمالي الطباعة', (res.finalSellingPrice * res.qty).toFixed(2), 'ج.م'],
      ['تكلفة التصميم', res.cadFee.toFixed(2), 'ج.م'],
      ['تكلفة الشحن', res.shippingFee.toFixed(2), 'ج.م'],
      ['الإجمالي الكلي', res.grandOrderTotal.toFixed(2), 'ج.م'],
      ['المدفوع مقدماً', res.deposit.toFixed(2), 'ج.م'],
      ['المبلغ المتبقي', res.remainingBalance.toFixed(2), 'ج.م']
    ];

    const csvContent = '\\uFEFF' + rows.map(e => e.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `3D_Print_Cost_${this.state.projectName || 'Estimate'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('تم تصدير ملف CSV بنجاح!');
  }

  printQuote() {
    window.print();
  }


  applyPricingTemplate(templateId) {
    const template = PRICING_TEMPLATES[templateId];
    if (template) {
      this.state.profitMarginPercent = template.profitMarginPercent;
      this.state.layerHeight = template.layerHeight;
      this.state.infillPercent = template.infillPercent;
      this.state.failureRatePercent = template.failureRatePercent;
      this.render();
      this.showToast(`تم تطبيق قالب: ${template.name}`);
    }
  }

  checkDeadlineAlerts() {
    let overdue = 0, urgent = 0, soon = 0;
    const now = new Date();
    this.savedProjects.forEach(p => {
      if (p.deliveryDueDate) {
        const dueDate = new Date(p.deliveryDueDate);
        const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24); 
        if (diffDays < 0) overdue++;
        else if (diffDays <= 2) urgent++;
        else if (diffDays <= 5) soon++;
      }
    });

    if (overdue > 0 || urgent > 0 || soon > 0) {
      let banner = document.getElementById('deadlineAlertBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'deadlineAlertBanner';
        const header = document.querySelector('header');
        if (header) {
          header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
          document.body.prepend(banner);
        }
      }
      
      let html = '';
      if (overdue > 0) html += `<div style="background-color: #fee2e2; color: #991b1b; padding: 10px; margin-bottom: 5px;"><i class="fas fa-exclamation-triangle"></i> متأخر: ${overdue} مشروع</div>`;
      if (urgent > 0) html += `<div style="background-color: #fef3c7; color: #92400e; padding: 10px; margin-bottom: 5px;">عاجل: ${urgent} مشروع</div>`;
      if (soon > 0) html += `<div style="background-color: #dbeafe; color: #1e40af; padding: 10px; margin-bottom: 5px;">قريباً: ${soon} مشروع</div>`;
      
      banner.innerHTML = html;
    }
  }

  showMaterialComparison() {
    const container = document.getElementById('materialComparisonContainer');
    if (!container || typeof PRESETS === 'undefined' || !PRESETS.filaments) return;

    const res = this.calculate();
    const comparisons = PRESETS.filaments.map(f => {
      const materialCost = f.weight > 0 ? (res.effectiveWeight * f.price) / f.weight : 0;
      const subtotal = materialCost + res.powerCost + res.depreciationCost + res.laborCost + res.additionalCost;
      const failureCost = subtotal * (this.state.failureRatePercent / 100);
      const totalCost = subtotal + failureCost;
      
      const marginFraction = this.state.profitMarginPercent / 100;
      const baseSellingPrice = marginFraction < 1 ? totalCost / (1 - marginFraction) : 0;
      const finalSellingPrice = baseSellingPrice * (1 - res.discountRate);
      
      return {
        name: f.name,
        price: f.price,
        materialCost: materialCost,
        totalCost: totalCost,
        sellingPrice: finalSellingPrice,
        savings: res.totalCost - totalCost
      };
    }).sort((a, b) => a.totalCost - b.totalCost);

    let tableHtml = `<table class="w-full text-sm text-right">
      <thead class="bg-slate-50 dark:bg-slate-800">
        <tr>
          <th class="p-2">الخامة</th>
          <th class="p-2">تكلفة المادة</th>
          <th class="p-2">التكلفة الإجمالية</th>
          <th class="p-2">سعر البيع</th>
          <th class="p-2">التوفير</th>
        </tr>
      </thead>
      <tbody>`;
      
    comparisons.forEach(c => {
      const savingsColor = c.savings > 0 ? 'text-emerald-600' : (c.savings < 0 ? 'text-rose-600' : '');
      const sign = c.savings > 0 ? '+' : '';
      tableHtml += `<tr class="border-b dark:border-slate-700">
        <td class="p-2">${c.name}</td>
        <td class="p-2">${this.formatCurrency(c.materialCost)}</td>
        <td class="p-2">${this.formatCurrency(c.totalCost)}</td>
        <td class="p-2">${this.formatCurrency(c.sellingPrice)}</td>
        <td class="p-2 ${savingsColor}" dir="ltr">${sign}${this.formatCurrency(c.savings)}</td>
      </tr>`;
    });
    
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
  }

  
  populateClientCRM() {
    const datalist = document.getElementById('savedClientsList');
    if (!datalist) return;
    const clientMap = new Map();
    this.savedProjects.forEach(p => {
      if (p.clientName && !clientMap.has(p.clientName)) {
        clientMap.set(p.clientName, { phone: p.clientPhone || '', address: p.clientAddress || '' });
      }
    });
    datalist.innerHTML = Array.from(clientMap.keys()).map(name => `<option value="${name}"></option>`).join('');
  }

  filterSavedProjects(status = 'all') {
    this.currentSavedFilter = status;
    this.renderSavedProjects();
  }

  renderAnalytics() {
    const projects = this.savedProjects;
    
    // KPIs
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalFilamentGrams = 0;
    let totalHours = 0;
    const statusCounts = { pending_design: 0, ready_print: 0, printing: 0, post_processing: 0, ready_ship: 0, delivered: 0 };
    const clientSpent = {};

    projects.forEach(p => {
      const price = parseFloat(String(p.calcSummary?.sellingPrice || '0').replace(/[^0-9.]/g, '')) || 0;
      const profit = parseFloat(String(p.calcSummary?.profit || '0').replace(/[^0-9.]/g, '')) || 0;
      const weight = (parseFloat(p.partWeight) || 0) * (parseInt(p.batchQuantity) || 1);
      const hours = (parseFloat(p.printHours) || 0) * (parseInt(p.batchQuantity) || 1);

      totalRevenue += price;
      totalProfit += profit;
      totalFilamentGrams += weight;
      totalHours += hours;

      const st = p.orderStatus || 'ready_print';
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      else statusCounts['ready_print']++;

      if (p.clientName) {
        clientSpent[p.clientName] = (clientSpent[p.clientName] || 0) + price;
      }
    });

    this.updateElementText('kpiTotalRevenue', this.formatCurrency(totalRevenue));
    this.updateElementText('kpiTotalProfit', this.formatCurrency(totalProfit));
    this.updateElementText('kpiTotalFilamentKg', `${(totalFilamentGrams / 1000).toFixed(2)} كجم`);
    this.updateElementText('kpiTotalHours', `${totalHours.toFixed(1)} ساعة`);

    // Top clients list
    const topClientsContainer = document.getElementById('topClientsContainer');
    if (topClientsContainer) {
      const sortedClients = Object.entries(clientSpent).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sortedClients.length === 0) {
        topClientsContainer.innerHTML = '<div class="text-slate-400 py-3 text-center">لا توجد سجلات كافية بعد.</div>';
      } else {
        topClientsContainer.innerHTML = sortedClients.map(([name, total], idx) => `
          <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span class="font-bold text-slate-800 dark:text-slate-200">${idx + 1}. ${name}</span>
            <span class="font-mono-nums font-bold text-emerald-600">${this.formatCurrency(total)}</span>
          </div>
        `).join('');
      }
    }

    // Status Chart
    const statusCtx = document.getElementById('orderStatusChart');
    if (statusCtx && typeof Chart !== 'undefined') {
      const labels = ['قيد التصميم', 'جاهز للطباعة', 'جاري الطباعة', 'تشطيب ومعالجة', 'جاهز للشحن', 'تم التسليم'];
      const data = [
        statusCounts.pending_design,
        statusCounts.ready_print,
        statusCounts.printing,
        statusCounts.post_processing,
        statusCounts.ready_ship,
        statusCounts.delivered
      ];

      if (this.charts.status) {
        this.charts.status.data.datasets[0].data = data;
        this.charts.status.update();
      } else {
        this.charts.status = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: ['#6366F1', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981'],
              borderWidth: 2,
              borderColor: this.state.darkMode ? '#1E293B' : '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                rtl: true,
                labels: { font: { family: 'Tajawal, Cairo, sans-serif', size: 11 }, color: this.state.darkMode ? '#CBD5E1' : '#475569' }
              }
            }
          }
        });
      }
    }
  }

  
    // ================= 3D STL VIEWER ENGINE (STANDALONE) =================
  setupSTLViewer() {
    const dropZone = document.getElementById('stlDropZone');
    const fileInput = document.getElementById('stlFileInput');
    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/40');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/40');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.loadSTLFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.loadSTLFile(e.target.files[0]);
      }
    });

    // Initialize 3D scene immediately
    setTimeout(() => this.init3DScene(), 150);
  }

    init3DScene() {
    const container = document.getElementById('stlCanvasContainer');
    if (!container || typeof THREE === 'undefined') return;

    if (this.threeRenderer && this.threeScene) return;

    container.innerHTML = '';
    const width = container.clientWidth || 380;
    const height = 300;

    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(this.state.darkMode ? 0x0f172a : 0x0a0f1d);

    this.threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.threeCamera.position.set(80, 80, 100);

    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.shadowMap.enabled = true;
    container.appendChild(this.threeRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.threeScene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(100, 150, 100);
    this.threeScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x3b82f6, 0.6);
    dir2.position.set(-100, -50, -100);
    this.threeScene.add(dir2);

    const grid = new THREE.GridHelper(160, 16, 0x3b82f6, 0x475569);
    grid.position.y = 0;
    this.threeScene.add(grid);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.threeControls = new THREE.OrbitControls(this.threeCamera, this.threeRenderer.domElement);
      this.threeControls.enableDamping = true;
      this.threeControls.dampingFactor = 0.05;
    }

    const sampleGeom = new THREE.BoxGeometry(25, 25, 25);
    const sampleMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.15 });
    this.threeMesh = new THREE.Mesh(sampleGeom, sampleMat);
    this.threeMesh.position.set(0, 12.5, 0);
    this.threeScene.add(this.threeMesh);

    const animate = () => {
      this.threeAnimId = requestAnimationFrame(animate);
      if (this.threeControls) this.threeControls.update();
      else if (this.threeMesh && !this.customSTLLoaded) {
        this.threeMesh.rotation.y += 0.008;
      }
      this.threeRenderer.render(this.threeScene, this.threeCamera);
    };
    animate();
  }

    // Unified File Handlers (STL & GCode)
  handleUnifiedFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();

    if (name.endsWith('.stl')) {
      this.loadSTLFile(file);
    } else if (name.endsWith('.gcode') || name.endsWith('.g')) {
      this.parseGCodeFile(file);
    } else {
      alert('يرجى اختيار ملف مجسم STL (.stl) أو ملف تقطيع G-Code (.gcode)');
    }
  }

  handleFileInputChange(e) {
    if (e && e.target && e.target.files && e.target.files.length > 0) {
      this.handleUnifiedFile(e.target.files[0]);
    }
  }

  loadSTLFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.stl')) {
      alert('يرجى اختيار ملف مجسم بصيغة STL (.stl)');
      return;
    }

    this.showToast('⏳ جاري معالجة وتحليل مجسم الـ STL...');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        this.parseAndRenderSTL(buffer, file.name);
      } catch (err) {
        console.error('STL Parse error:', err);
        alert('حدث خطأ أثناء معالجة ملف الـ STL. تأكد من سلامة الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  parseAndRenderSTL(buffer, filename) {
    if (!this.threeScene || !this.threeRenderer) {
      this.init3DScene();
    }

    const isBinary = () => {
      if (buffer.byteLength < 84) return false;
      const reader = new DataView(buffer);
      const numTriangles = reader.getUint32(80, true);
      return buffer.byteLength === 84 + numTriangles * 50;
    };

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];

    if (isBinary()) {
      const view = new DataView(buffer);
      const numTriangles = view.getUint32(80, true);
      let offset = 84;
      for (let i = 0; i < numTriangles; i++) {
        const nx = view.getFloat32(offset, true);
        const ny = view.getFloat32(offset + 4, true);
        const nz = view.getFloat32(offset + 8, true);
        offset += 12;
        for (let j = 0; j < 3; j++) {
          positions.push(
            view.getFloat32(offset, true),
            view.getFloat32(offset + 4, true),
            view.getFloat32(offset + 8, true)
          );
          normals.push(nx, ny, nz);
          offset += 12;
        }
        offset += 2;
      }
    } else {
      const text = new TextDecoder().decode(buffer);
      const normalMatches = [...text.matchAll(/facet\s+normal\s+([\s\S]*?)endfacet/gi)];
      for (const match of normalMatches) {
        const block = match[0];
        const nMatch = block.match(/facet\s+normal\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/i);
        const nx = nMatch ? parseFloat(nMatch[1]) : 0;
        const ny = nMatch ? parseFloat(nMatch[2]) : 0;
        const nz = nMatch ? parseFloat(nMatch[3]) : 0;
        const vMatches = [...block.matchAll(/vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/gi)];
        if (vMatches.length === 3) {
          for (let j = 0; j < 3; j++) {
            positions.push(parseFloat(vMatches[j][1]), parseFloat(vMatches[j][2]), parseFloat(vMatches[j][3]));
            normals.push(nx, ny, nz);
          }
        }
      }
    }

    if (positions.length === 0) {
      alert('لم يتم العثور على أوجه ثلاثية الأبعاد في ملف الـ STL.');
      return;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length === positions.length) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    } else {
      geometry.computeVertexNormals();
    }

    if (this.threeMesh && this.threeScene) {
      this.threeScene.remove(this.threeMesh);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.2
    });

    this.threeMesh = new THREE.Mesh(geometry, material);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    this.threeMesh.position.set(-center.x, -box.min.y, -center.z);
    if (this.threeScene) {
      this.threeScene.add(this.threeMesh);
    }
    this.customSTLLoaded = true;

    const maxDim = Math.max(size.x, size.y, size.z);
    if (this.threeCamera) {
      this.threeCamera.position.set(maxDim * 1.5, maxDim * 1.3, maxDim * 1.8);
      this.threeCamera.lookAt(0, size.y / 2, 0);
      if (this.threeControls) this.threeControls.target.set(0, size.y / 2, 0);
    }

    let volumeCm3 = 0;
    const posAttr = geometry.attributes.position;
    if (posAttr) {
      const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i += 3) {
        p1.fromBufferAttribute(posAttr, i);
        p2.fromBufferAttribute(posAttr, i + 1);
        p3.fromBufferAttribute(posAttr, i + 2);
        volumeCm3 += p1.dot(p2.cross(p3)) / 6.0;
      }
      volumeCm3 = Math.abs(volumeCm3) / 1000.0;
    }

    const filamentItem = typeof PRESETS !== 'undefined' ? PRESETS.filaments.find(f => f.id === this.state.selectedFilamentPreset) : null;
    const density = filamentItem?.density || 1.24;
    const infillRatio = ((this.state.infillPercent || 20) / 100) * 0.45 + 0.25;
    const estimatedGrams = Math.max(1, Math.round(volumeCm3 * density * infillRatio));

    this.currentSTLData = {
      filename: filename.replace(/\.stl$/i, ''),
      dimensions: `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} مم`,
      volume: `${volumeCm3.toFixed(1)} سم³`,
      estimatedGrams: estimatedGrams
    };

    const infoBox = document.getElementById('stlInfoBox');
    if (infoBox) infoBox.classList.remove('hidden');

    this.updateElementText('stlDimsText', this.currentSTLData.dimensions);
    this.updateElementText('stlVolumeText', this.currentSTLData.volume);
    this.updateElementText('stlWeightText', `${estimatedGrams} جرام تقريباً`);

    this.showToast(`🧊 تم تحميل وعرض المجسم 3D بنجاح: ${estimatedGrams} جم مقدر`);
  }

    applySTLDataToCalculator() {
    if (!this.currentSTLData) {
      alert('يرجى رفع ملف STL أولاً لحساب الوزن والأبعاد.');
      return;
    }
    if (this.currentSTLData.filename) {
      this.state.projectName = this.currentSTLData.filename;
    }
    if (this.currentSTLData.estimatedGrams) {
      this.state.partWeight = this.currentSTLData.estimatedGrams;
    }
    this.render();
    this.showToast(`✨ تم تطبيق وزن المجسم (${this.currentSTLData.estimatedGrams} جم) في الحاسبة بنجاح!`);
  }

  toggleSTLWireframe() {
    if (this.threeMesh && this.threeMesh.material) {
      this.threeMesh.material.wireframe = !this.threeMesh.material.wireframe;
      this.showToast(this.threeMesh.material.wireframe ? 'تم تفعيل وضع الشبكة (Wireframe)' : 'تم تفعيل وضع المجسم المصمت');
    }
  }

  resetSTLCamera() {
    if (this.threeCamera) {
      this.threeCamera.position.set(80, 80, 100);
      this.threeCamera.lookAt(0, 10, 0);
      if (this.threeControls) {
        this.threeControls.target.set(0, 10, 0);
        this.threeControls.update();
      }
    }
  }


  // ================= DIRECT PDF EXPORT =================
  downloadPDF() {
    const quoteElement = document.querySelector('.quote-page');
    if (!quoteElement || typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    const clientTitle = this.state.clientName ? `_${this.state.clientName}` : '';
    const filename = `عرض_سعر_${this.state.projectName || 'طباعة_3D'}${clientTitle}.pdf`;

    this.showToast('⏳ جاري تجهيز وتحميل ملف الـ PDF...');

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(quoteElement).save().then(() => {
      this.showToast('✅ تم تحميل ملف الـ PDF بنجاح!');
    });
  }

  setCurrency(currCode) {
    if (CURRENCY_RATES[currCode]) {
      this.state.currency = currCode;
      this.render();
      this.showToast(`💱 تم تحويل العملة إلى: ${CURRENCY_RATES[currCode].name}`);
    }
  }

  showToast(msg) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform opacity-0 translate-y-4 text-xs sm:text-sm font-semibold';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle text-emerald-400 text-lg"></i> <span>${msg}</span>`;
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 2800);
  }
}

let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new CostCalculatorApp();
});
