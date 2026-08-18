// 3D Printing Cost Calculator - Advanced Business & Maker Engine
// Designed for Elegoo Neptune 4 Pro & Egyptian 3D Printing Market

const DEFAULT_STATE = {
  projectName: 'قطعة نموذجية — Elegoo Neptune 4 Pro',
  clientName: '',
  notes: '',
  partWeight: 165.00,
  spoolPrice: 700.00,
  spoolWeight: 1000,
  selectedFilamentPreset: 'esun-pla',
  spoolRemainingGrams: 835,

  printHours: 7.50,
  printerPowerKw: 0.16,
  electricityRate: 1.5100,
  selectedPowerPreset: 'tier-custom',
  selectedPrinterPreset: 'neptune-4-pro',

  printerPrice: 26000.00,
  printerLifespanHours: 5000,

  laborHours: 0.50,
  laborRatePerHour: 100.00,

  failureRatePercent: 10.0,
  profitMarginPercent: 40.0,
  
  batchQuantity: 1,
  volumeDiscountPercent: 0,
  additionalCost: 0,
  additionalCostNotes: '',

  partsList: [
    { name: 'الجسم الأساسي (Main Body)', weight: 120, time: 5.5, filament: 'eSUN PLA' },
    { name: 'الغطاء العلوي (Top Cover)', weight: 45, time: 2.0, filament: 'eSUN PLA' }
  ],
  isMultiPartMode: false,
  printsPerMonth: 20,

  activeTab: 'table',
  darkMode: false,
  currency: 'EGP'
};

const CURRENCY_RATES = {
  EGP: { symbol: 'ج.م', rate: 1 },
  USD: { symbol: '$', rate: 0.0205 },
  SAR: { symbol: 'ر.س', rate: 0.077 }
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
      const saved = localStorage.getItem('3d_calc_current_state_v2');
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...DEFAULT_STATE };
  }

  saveState() {
    try {
      localStorage.setItem('3d_calc_current_state_v2', JSON.stringify(this.state));
    } catch (e) {}
  }

  loadSavedProjects() {
    try {
      const projects = localStorage.getItem('3d_calc_saved_projects_v2');
      return projects ? JSON.parse(projects) : [];
    } catch (e) {
      return [];
    }
  }

  saveProjectsList() {
    try {
      localStorage.setItem('3d_calc_saved_projects_v2', JSON.stringify(this.savedProjects));
    } catch (e) {}
  }

  init() {
    this.populatePresets();
    this.setupEventListeners();
    this.setupGCodeDropZone();
    this.applyTheme();
    this.render();
  }

  populatePresets() {
    const fSelect = document.getElementById('filamentPresetSelect');
    if (fSelect && typeof PRESETS !== 'undefined') {
      fSelect.innerHTML = '<option value="">-- اختر خامة من السوق المصري --</option>' + 
        PRESETS.filaments.map(f => `<option value="${f.id}" ${f.id === this.state.selectedFilamentPreset ? 'selected' : ''}>${f.name} — ${f.price} ج.م</option>`).join('');
    }

    const pSelect = document.getElementById('printerPresetSelect');
    if (pSelect && typeof PRESETS !== 'undefined') {
      pSelect.innerHTML = '<option value="">-- اختر طابعة ثلاثية الأبعاد --</option>' + 
        PRESETS.printers.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPrinterPreset ? 'selected' : ''}>${p.name} — ${p.price.toLocaleString('ar-EG')} ج.م</option>`).join('');
    }

    const powerSelect = document.getElementById('electricityTierSelect');
    if (powerSelect && typeof PRESETS !== 'undefined') {
      powerSelect.innerHTML = '<option value="">-- اختر شريحة الكهرباء في مصر --</option>' + 
        PRESETS.electricityTiers.map(t => `<option value="${t.id}" ${t.id === this.state.selectedPowerPreset ? 'selected' : ''}>${t.name} (${t.rate} ج.م/ك.و.س)</option>`).join('');
    }

    const hwSelect = document.getElementById('hardwareQuickAddSelect');
    if (hwSelect && typeof PRESETS !== 'undefined' && PRESETS.hardwareAccessories) {
      hwSelect.innerHTML = '<option value="">+ إضافة مستلزمات تجميع جاهزة</option>' + 
        PRESETS.hardwareAccessories.map((h, i) => `<option value="${i}">${h.name} (${h.unitCost} ج.م/${h.unit})</option>`).join('');
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

    return {
      effectiveWeight, effectiveHours, materialCost, powerCost,
      depreciationPerHour, depreciationCost, laborCost, additionalCost,
      subtotal, failureCost, totalCost, baseSellingPrice, discountRate,
      finalSellingPrice, profitAmount, markupPercent, qty,
      batchTotalCost, batchTotalPrice, batchTotalProfit,
      costPerGram, costPerHour, remainingAfterPrint, printsLeftInSpool,
      piecesToBreakEven, hoursToBreakEven, monthlyPrints, monthlyProfit, monthsToBreakEven
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
    this.updateElementText('quoteNotes', s.notes || 'الطباعة بدقة عالية وجودة ممتازة شاملة إزالة الدعامات والتشطيب الأولي.');
  }

  renderSavedProjects() {
    const list = document.getElementById('savedProjectsList');
    if (!list) return;

    if (this.savedProjects.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-slate-400"><i class="fas fa-folder-open text-4xl mb-3 text-slate-300 dark:text-slate-600 block"></i>لا توجد حسابات محفوظة بعد.</div>';
      return;
    }

    list.innerHTML = this.savedProjects.map((p, idx) => `
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-blue-400">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-100 text-lg">${p.projectName || 'مشروع بدون اسم'}</span>
            ${p.clientName ? `<span class="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium">${p.clientName}</span>` : ''}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
            <span><i class="fas fa-weight-hanging ml-1"></i> ${p.partWeight} جم</span>
            <span><i class="fas fa-clock ml-1"></i> ${p.printHours} ساعة</span>
            <span><i class="fas fa-coins ml-1"></i> التكلفة: ${p.calcSummary?.totalCost || '-'}</span>
            <span><i class="fas fa-tag ml-1 text-emerald-600"></i> سعر البيع: ${p.calcSummary?.sellingPrice || '-'}</span>
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
  }

  saveCurrentProject() {
    const res = this.calculate();
    const project = {
      ...this.state,
      savedAt: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
      calcSummary: {
        totalCost: this.formatCurrency(res.totalCost),
        sellingPrice: this.formatCurrency(res.finalSellingPrice),
        profit: this.formatCurrency(res.profitAmount)
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
      { id: 'dash_printsPerMonth', key: 'printsPerMonth', type: 'int' }
    ];

    dashBindings.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) el.addEventListener('input', (e) => handleInput(b.key, e.target.value, b.type));
    });

    const fSelect = document.getElementById('filamentPresetSelect');
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
  }

  switchTab(tabName) {
    this.state.activeTab = tabName;
    ['table', 'dashboard', 'assembly', 'roi', 'quote', 'saved'].forEach(tab => {
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
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (this.state.darkMode) {
      html.classList.add('dark');
      if (themeIcon) themeIcon.className = 'fas fa-sun text-amber-400';
      if (themeText) themeText.textContent = 'الوضع النهاري';
    } else {
      html.classList.remove('dark');
      if (themeIcon) themeIcon.className = 'fas fa-moon text-slate-600';
      if (themeText) themeText.textContent = 'الوضع الليلي';
    }
  }

  generateWhatsAppText() {
    const res = this.calculate();
    const s = this.state;
    const filament = typeof PRESETS !== 'undefined' ? (PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA') : 'PLA';
    
    let text = `مرحباً ${s.clientName || 'عزيزي العميل'} 👋
`;
    text += `إليك عرض سعر لخدمة الطباعة ثلاثية الأبعاد:

`;
    text += `📦 *القطعة / المشروع:* ${s.projectName || 'قطعة مخصصة'}
`;
    text += `⚖️ *الوزن الإجمالي:* ${res.effectiveWeight} جرام
`;
    text += `🧵 *الخامة:* ${filament}
`;
    text += `⏱️ *مدة الطباعة المقدرة:* ${res.effectiveHours} ساعة
`;
    text += `🔢 *الكمية:* ${res.qty} قطعة
`;
    text += `--------------------------
`;
    text += `💰 *سعر القطعة:* ${this.formatCurrency(res.finalSellingPrice)}
`;
    if (res.qty > 1) {
      text += `💵 *الإجمالي للكمية (${res.qty} قطع):* ${this.formatCurrency(res.batchTotalPrice)}
`;
    }
    text += `--------------------------
`;
    text += `✨ *ملاحظات:* ${s.notes || 'الطباعة بأعلى دقة ومعايرة وتشطيب أولي.'}

`;
    text += `جاهزون للبدء فور تأكيد الطلب! 🚀`;

    return encodeURIComponent(text);
  }

  openWhatsApp() {
    window.open(`https://wa.me/?text=${this.generateWhatsAppText()}`, '_blank');
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
      ['إجمالي الطلبية', res.batchTotalPrice.toFixed(2), 'ج.م']
    ];

    const csvContent = '﻿' + rows.map(e => e.join(',')).join('
');
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
