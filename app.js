// ==========================================
// 3D Printing Cost Calculator Engine (Original Master Edition)
// Tailored for Elegoo Neptune 4 Pro — Egyptian Market 🇪🇬
// ==========================================

const DEFAULT_STATE = {
  // Project Info
  projectName: '',
  clientName: '',
  clientPhone: '',
  clientAddress: '',
  selectedGovernorate: 'cairo-giza',
  shippingCost: 0,
  depositPaid: 0,
  deliveryDueDate: '',
  paymentMethod: 'cash',
  notes: '',

  // Material (Filament)
  selectedFilamentPreset: 'patron-pla',
  partWeight: 0.00,
  spoolPrice: 600.00,
  spoolWeight: 1000,
  spoolRemaining: 1000,

  // Electricity
  selectedPowerPreset: 'residential-tier-3',
  printHours: 0.00,
  printerPowerKw: 0.16,
  electricityRate: 1.51,

  // Machine Depreciation
  selectedPrinterPreset: 'neptune-4-pro',
  printerPrice: 26000.00,
  printerLifespanHours: 5000,

  // Labor
  laborHours: 0.00,
  laborRatePerHour: 100.00,

  // Failure & Margins
  failureRatePercent: 10.0,
  profitMarginPercent: 40.0,
  batchQuantity: 1,
  additionalCost: 0.00,
  additionalCostNotes: '',

  // Currency & UI
  selectedCurrency: 'EGP',
  darkMode: true,
  activeTab: 'table'
};

const CURRENCY_RATES = {
  EGP: { symbol: 'ج.م', rate: 1.0 },
  SAR: { symbol: 'ر.س', rate: 0.078 },
  AED: { symbol: 'د.إ', rate: 0.076 },
  USD: { symbol: '$', rate: 0.021 }
};

class CostCalculatorApp {
  constructor() {
    this.state = this.loadState();
    this.savedProjects = this.loadSavedProjects();
    this.threeScene = null;
    this.threeRenderer = null;
    this.threeCamera = null;
    this.threeControls = null;
    this.threeMesh = null;
    this.customSTLLoaded = false;
    this.charts = {};

    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('3d_calc_master_state_v1');
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
    return { ...DEFAULT_STATE };
  }

  saveState() {
    try {
      localStorage.setItem('3d_calc_master_state_v1', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  }

  loadSavedProjects() {
    try {
      const saved = localStorage.getItem('3d_calc_master_saved_projects_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load saved projects:', e);
    }
    return [];
  }

  saveProjectsToStorage() {
    try {
      localStorage.setItem('3d_calc_master_saved_projects_v1', JSON.stringify(this.savedProjects));
    } catch (e) {
      console.warn('Could not save projects list:', e);
    }
  }

  init() {
    this.applyTheme();
    this.populatePresets();
    this.setupEventListeners();
    this.render();
    this.renderSavedProjectsList();
    setTimeout(() => this.init3DScene(), 200);
  }

  // ================= CALCULATION ENGINE (THE EXACT ORIGINAL FORMULAS) =================
  calculate() {
    const s = this.state;

    // 1) Material Cost
    const partWeight = Math.max(0, Number(s.partWeight) || 0);
    const spoolPrice = Math.max(0, Number(s.spoolPrice) || 0);
    const spoolWeight = Math.max(1, Number(s.spoolWeight) || 1000);
    const materialCost = (partWeight * spoolPrice) / spoolWeight;

    // 2) Electricity Cost
    const printHours = Math.max(0, Number(s.printHours) || 0);
    const printerPowerKw = Math.max(0, Number(s.printerPowerKw) || 0);
    const electricityRate = Math.max(0, Number(s.electricityRate) || 0);
    const powerCost = printHours * printerPowerKw * electricityRate;

    // 3) Depreciation Cost
    const printerPrice = Math.max(0, Number(s.printerPrice) || 0);
    const printerLifespanHours = Math.max(1, Number(s.printerLifespanHours) || 5000);
    const depreciationPerHour = printerPrice / printerLifespanHours;
    const depreciationCost = depreciationPerHour * printHours;

    // 4) Labor Cost
    const laborHours = Math.max(0, Number(s.laborHours) || 0);
    const laborRatePerHour = Math.max(0, Number(s.laborRatePerHour) || 0);
    const laborCost = laborHours * laborRatePerHour;

    // 5) Subtotal & Failure
    const additionalCost = Math.max(0, Number(s.additionalCost) || 0);
    const subtotal = materialCost + powerCost + depreciationCost + laborCost + additionalCost;
    const failureRatePercent = Math.max(0, Math.min(100, Number(s.failureRatePercent) || 0));
    const failureCost = subtotal * (failureRatePercent / 100);
    const totalCost = subtotal + failureCost;

    // 6) Selling Price & Profit
    const profitMarginPercent = Math.max(0, Math.min(99, Number(s.profitMarginPercent) || 0));
    const marginFactor = 1 - (profitMarginPercent / 100);
    const finalSellingPrice = marginFactor > 0 ? (totalCost / marginFactor) : totalCost;
    const profitAmount = finalSellingPrice - totalCost;
    const markupPercent = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0;

    // Metrics
    const costPerGram = partWeight > 0 ? (totalCost / partWeight) : 0;
    const costPerHour = printHours > 0 ? ((powerCost + depreciationCost) / printHours) : 0;

    // Batch Totals
    const qty = Math.max(1, parseInt(s.batchQuantity) || 1);
    const batchTotalCost = totalCost * qty;
    const batchTotalPrice = finalSellingPrice * qty;
    const batchTotalProfit = profitAmount * qty;

    // Order Totals with Shipping & Deposit
    const shippingFee = Number(s.shippingCost) || 0;
    const grandOrderTotal = batchTotalPrice + shippingFee;
    const deposit = Number(s.depositPaid) || 0;
    const remainingBalance = Math.max(0, grandOrderTotal - deposit);

    return {
      partWeight, spoolPrice, spoolWeight, materialCost,
      printHours, printerPowerKw, electricityRate, powerCost,
      printerPrice, printerLifespanHours, depreciationPerHour, depreciationCost,
      laborHours, laborRatePerHour, laborCost,
      additionalCost, subtotal, failureRatePercent, failureCost, totalCost,
      profitMarginPercent, finalSellingPrice, profitAmount, markupPercent,
      costPerGram, costPerHour,
      qty, batchTotalCost, batchTotalPrice, batchTotalProfit,
      shippingFee, grandOrderTotal, deposit, remainingBalance
    };
  }

  formatCurrency(val) {
    const cur = CURRENCY_RATES[this.state.selectedCurrency] || CURRENCY_RATES.EGP;
    const converted = (Number(val) || 0) * cur.rate;
    return `${converted.toFixed(2)} ${cur.symbol}`;
  }

  // ================= POPULATE PRESETS =================
  populatePresets() {
    // Filaments
    const fSelect = document.getElementById('filamentPresetSelect');
    const tblFSelect = document.getElementById('tbl_filamentPresetSelect');
    const dashFSelect = document.getElementById('dash_filamentSelect');

    const filamentOptions = `
      <optgroup label="🇪🇬 خامات باترون مصرية (Patron 3D)">
        ${PRESETS.filaments.filter(f => f.isLocal).map(f => `<option value="${f.id}">${f.name} — ${f.price} ج.م</option>`).join('')}
      </optgroup>
      <optgroup label="🌐 خامات مستوردة (eSUN)">
        ${PRESETS.filaments.filter(f => !f.isLocal).map(f => `<option value="${f.id}">${f.name} — ${f.price} ج.م</option>`).join('')}
      </optgroup>
    `;

    if (fSelect) fSelect.innerHTML = filamentOptions;
    if (tblFSelect) tblFSelect.innerHTML = filamentOptions;
    if (dashFSelect) dashFSelect.innerHTML = filamentOptions;

    // Printers
    const pSelect = document.getElementById('printerPresetSelect');
    if (pSelect) {
      pSelect.innerHTML = PRESETS.printers.map(p => `<option value="${p.id}">${p.name} (${p.price} ج.م)</option>`).join('');
    }

    // Electricity Tiers
    const eSelect = document.getElementById('electricityTierSelect');
    if (eSelect) {
      eSelect.innerHTML = PRESETS.electricityTiers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
  }

  // ================= EVENT LISTENERS =================
  setupEventListeners() {
    const handleInput = (key, val, type = 'float') => {
      let parsed = val;
      if (type === 'float') parsed = parseFloat(val) || 0;
      else if (type === 'int') parsed = parseInt(val, 10) || 0;
      this.state[key] = parsed;
      this.render();
    };

    // Table Bindings
    const tableBindings = [
      { id: 'tbl_partWeight', key: 'partWeight' },
      { id: 'tbl_spoolPrice', key: 'spoolPrice' },
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

    // Dashboard Bindings
    const dashBindings = [
      { id: 'dash_projectName', key: 'projectName', type: 'string' },
      { id: 'dash_clientName', key: 'clientName', type: 'string' },
      { id: 'dash_clientPhone', key: 'clientPhone', type: 'string' },
      { id: 'dash_clientAddress', key: 'clientAddress', type: 'string' },
      { id: 'dash_shippingCost', key: 'shippingCost' },
      { id: 'dash_depositPaid', key: 'depositPaid' },
      { id: 'dash_deliveryDueDate', key: 'deliveryDueDate', type: 'string' },
      { id: 'dash_partWeight', key: 'partWeight' },
      { id: 'dash_spoolPrice', key: 'spoolPrice' },
      { id: 'dash_spoolWeight', key: 'spoolWeight' },
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
      { id: 'dash_additionalCostNotes', key: 'additionalCostNotes', type: 'string' }
    ];

    dashBindings.forEach(b => {
      const el = document.getElementById(b.id);
      if (el) el.addEventListener('input', (e) => handleInput(b.key, e.target.value, b.type));
    });

    // Currency Switcher
    const curSelect = document.getElementById('currencySelect');
    if (curSelect) {
      curSelect.addEventListener('change', (e) => {
        this.state.selectedCurrency = e.target.value;
        this.render();
      });
    }

    // Filament Preset Change Handlers
    const handleFilamentChange = (e) => {
      const item = PRESETS.filaments.find(f => f.id === e.target.value);
      if (item) {
        this.state.selectedFilamentPreset = item.id;
        this.state.spoolPrice = item.price;
        this.state.spoolWeight = item.weight;
        this.render();
        this.showToast(`✨ تم اختيار: ${item.name} (${item.price} ج.م)`);
      }
    };

    ['filamentPresetSelect', 'tbl_filamentPresetSelect', 'dash_filamentSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', handleFilamentChange);
    });

    // Printer Preset Change Handler
    const pSelect = document.getElementById('printerPresetSelect');
    if (pSelect) {
      pSelect.addEventListener('change', (e) => {
        const item = PRESETS.printers.find(p => p.id === e.target.value);
        if (item) {
          this.state.selectedPrinterPreset = item.id;
          this.state.printerPrice = item.price;
          this.state.printerLifespanHours = item.lifespanHours;
          this.state.printerPowerKw = item.powerKw;
          this.render();
          this.showToast(`🖨️ تم اختيار طابعة: ${item.name}`);
        }
      });
    }

    // Electricity Tier Change Handler
    const eSelect = document.getElementById('electricityTierSelect');
    if (eSelect) {
      eSelect.addEventListener('change', (e) => {
        const item = PRESETS.electricityTiers.find(t => t.id === e.target.value);
        if (item) {
          this.state.selectedPowerPreset = item.id;
          this.state.electricityRate = item.rate;
          this.render();
          this.showToast(`⚡ تم اختيار شريحة كهرباء: ${item.rate} ج.م/ك.و.س`);
        }
      });
    }
  }

  // ================= RENDER METHOD =================
  render() {
    const res = this.calculate();
    const s = this.state;

    // 1. Synchronize Table View Inputs
    this.updateElementValue('tbl_partWeight', s.partWeight);
    this.updateElementValue('tbl_spoolPrice', s.spoolPrice);
    this.updateElementValue('tbl_printHours', s.printHours);
    this.updateElementValue('tbl_printerPowerKw', s.printerPowerKw);
    this.updateElementValue('tbl_electricityRate', s.electricityRate);
    this.updateElementValue('tbl_printerPrice', s.printerPrice);
    this.updateElementValue('tbl_printerLifespanHours', s.printerLifespanHours);
    this.updateElementValue('tbl_laborHours', s.laborHours);
    this.updateElementValue('tbl_laborRatePerHour', s.laborRatePerHour);
    this.updateElementValue('tbl_failureRatePercent', s.failureRatePercent);
    this.updateElementValue('tbl_profitMarginPercent', s.profitMarginPercent);

    // 2. Synchronize Dashboard Inputs
    this.updateElementValue('dash_projectName', s.projectName || '');
    this.updateElementValue('dash_clientName', s.clientName || '');
    this.updateElementValue('dash_clientPhone', s.clientPhone || '');
    this.updateElementValue('dash_clientAddress', s.clientAddress || '');
    this.updateElementValue('dash_shippingCost', s.shippingCost);
    this.updateElementValue('dash_depositPaid', s.depositPaid);
    this.updateElementValue('dash_deliveryDueDate', s.deliveryDueDate || '');
    this.updateElementValue('dash_partWeight', s.partWeight);
    this.updateElementValue('dash_spoolPrice', s.spoolPrice);
    this.updateElementValue('dash_spoolWeight', s.spoolWeight);
    this.updateElementValue('dash_printHours', s.printHours);
    this.updateElementValue('dash_printerPowerKw', s.printerPowerKw);
    this.updateElementValue('dash_electricityRate', s.electricityRate);
    this.updateElementValue('dash_printerPrice', s.printerPrice);
    this.updateElementValue('dash_printerLifespanHours', s.printerLifespanHours);
    this.updateElementValue('dash_laborHours', s.laborHours);
    this.updateElementValue('dash_laborRatePerHour', s.laborRatePerHour);
    this.updateElementValue('dash_failureRatePercent', s.failureRatePercent);
    this.updateElementValue('dash_profitMarginPercent', s.profitMarginPercent);
    this.updateElementValue('dash_batchQuantity', s.batchQuantity);
    this.updateElementValue('dash_additionalCost', s.additionalCost);
    this.updateElementValue('dash_additionalCostNotes', s.additionalCostNotes || '');

    // 3. Select Dropdowns Values
    this.updateElementValue('filamentPresetSelect', s.selectedFilamentPreset);
    this.updateElementValue('tbl_filamentPresetSelect', s.selectedFilamentPreset);
    this.updateElementValue('dash_filamentSelect', s.selectedFilamentPreset);
    this.updateElementValue('printerPresetSelect', s.selectedPrinterPreset);
    this.updateElementValue('electricityTierSelect', s.selectedPowerPreset);
    this.updateElementValue('currencySelect', s.selectedCurrency);

    // 4. Update Table Calculated Text Cells
    this.updateElementText('tbl_materialCost', this.formatCurrency(res.materialCost));
    this.updateElementText('tbl_powerCost', this.formatCurrency(res.powerCost));
    this.updateElementText('tbl_depreciationPerHour', this.formatCurrency(res.depreciationPerHour) + ' / ساعة');
    this.updateElementText('tbl_depreciationCost', this.formatCurrency(res.depreciationCost));
    this.updateElementText('tbl_laborCost', this.formatCurrency(res.laborCost));
    this.updateElementText('tbl_subtotal', this.formatCurrency(res.subtotal));
    this.updateElementText('tbl_failureCost', this.formatCurrency(res.failureCost));
    this.updateElementText('tbl_totalCost', this.formatCurrency(res.totalCost));
    this.updateElementText('tbl_finalSellingPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('tbl_profitAmount', this.formatCurrency(res.profitAmount));
    this.updateElementText('tbl_markupPercent', res.markupPercent.toFixed(1) + '%');

    // 5. Update Hero Metric Ribbon
    this.updateElementText('hero_totalCost', this.formatCurrency(res.totalCost));
    this.updateElementText('hero_sellingPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('hero_profit', this.formatCurrency(res.profitAmount));
    this.updateElementText('hero_markup', res.markupPercent.toFixed(1) + '%');
    this.updateElementText('hero_costPerGram', this.formatCurrency(res.costPerGram));
    this.updateElementText('hero_costPerHour', this.formatCurrency(res.costPerHour));

    // 6. Update Batch Summary
    this.updateElementText('batchTotalQty', `${res.qty} قطعة`);
    this.updateElementText('batchTotalCost', this.formatCurrency(res.batchTotalCost));
    this.updateElementText('batchTotalPrice', this.formatCurrency(res.batchTotalPrice));
    this.updateElementText('batchTotalProfit', this.formatCurrency(res.batchTotalProfit));

    // 7. Update Spool Roll Balance
    const spoolRem = Math.max(0, (s.spoolRemaining || 1000) - res.partWeight);
    const spoolPrints = res.partWeight > 0 ? Math.floor(spoolRem / res.partWeight) : 0;
    this.updateElementText('spoolRemainingText', `المتبقي بعد الطباعة: ${spoolRem.toFixed(1)} جم`);
    this.updateElementText('spoolPrintsLeftText', `يكفي لـ ${spoolPrints} قطعة إضافية`);
    const spoolPct = Math.min(100, Math.max(0, (spoolRem / (s.spoolWeight || 1000)) * 100));
    const pBar = document.getElementById('spoolProgress');
    if (pBar) pBar.style.width = `${spoolPct}%`;

    // 8. Update Quotation View
    const filamentItem = PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset) || { name: 'PLA' };
    this.updateElementText('quoteClientName', s.clientName || 'عميل تجريبي');
    this.updateElementText('quoteProjectName', s.projectName || 'قطعة نموذجية');
    this.updateElementText('quoteClientPhone', s.clientPhone || 'غير مسجل');
    this.updateElementText('quoteClientAddress', s.clientAddress || 'القاهرة والجيزة');
    this.updateElementText('quoteFilamentType', filamentItem.name);
    this.updateElementText('quoteQty', res.qty);
    this.updateElementText('quoteUnitPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('quotePrintSubtotal', this.formatCurrency(res.batchTotalPrice));
    this.updateElementText('quoteShippingCost', this.formatCurrency(res.shippingFee));
    this.updateElementText('quoteGrandTotal', this.formatCurrency(res.grandOrderTotal));
    this.updateElementText('quoteDepositPaid', this.formatCurrency(res.deposit));
    this.updateElementText('quoteRemainingBalance', this.formatCurrency(res.remainingBalance));
    this.updateElementText('quoteDueDate', s.deliveryDueDate || 'خلال 2-3 أيام عمل');

    // Generate QR Code for WhatsApp
    this.generateQRCode();

    // Render Charts
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

  // ================= RESET TO DEFAULTS (0) =================
  resetToDefaults() {
    if (confirm('هل تريد تصفير جميع القيم والبدء من جديد؟')) {
      this.state = { ...DEFAULT_STATE };
      this.render();
      this.showToast('🔄 تم تصفير جميع المدخلات للبدء من الصفر!');
    }
  }

  // ================= TABS SWITCHER =================
  switchTab(tabName) {
    this.state.activeTab = tabName;
    ['table', 'dashboard', 'quote', 'saved'].forEach(tab => {
      const pane = document.getElementById(`tabPane_${tab}`);
      const btn = document.getElementById(`tabBtn_${tab}`);
      if (pane) {
        if (tab === tabName) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
      if (btn) {
        if (tab === tabName) {
          btn.className = 'nav-tab-btn active font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 bg-blue-600 text-white shadow-sm transition';
        } else {
          btn.className = 'nav-tab-btn font-medium text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition';
        }
      }
    });

    if (tabName === 'dashboard' || tabName === 'table') {
      setTimeout(() => this.renderCharts(this.calculate()), 100);
    }
  }

  // ================= THEME TOGGLE =================
  toggleTheme() {
    this.state.darkMode = !this.state.darkMode;
    this.applyTheme();
    this.saveState();
    this.renderCharts(this.calculate());
  }

  applyTheme() {
    const isDark = this.state.darkMode;
    document.documentElement.classList.toggle('dark', isDark);

    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon) icon.className = isDark ? 'fas fa-sun text-amber-400 text-sm' : 'fas fa-moon text-slate-600 dark:text-slate-300 text-sm';
    if (text) text.textContent = isDark ? 'الوضع النهاري' : 'الوضع الليلي';

    if (this.threeScene && typeof THREE !== 'undefined') {
      this.threeScene.background = new THREE.Color(isDark ? 0x090d16 : 0xf1f5f9);
    }
  }

  // ================= 3D STL & G-CODE HANDLERS =================
  init3DScene() {
    const container = document.getElementById('stlCanvasContainer');
    if (!container || typeof THREE === 'undefined') return;

    if (this.threeRenderer && this.threeScene) return;

    container.innerHTML = '';
    const width = container.clientWidth || 380;
    const height = 260;

    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(this.state.darkMode ? 0x090d16 : 0xf1f5f9);

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

  handleUnifiedFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.stl')) {
      this.loadSTLFile(file);
    } else if (name.endsWith('.gcode') || name.endsWith('.g')) {
      this.parseGCodeFile(file);
    } else {
      alert('يرجى اختيار ملف مجسم بصيغة STL (.stl) أو ملف تقطيع G-Code (.gcode)');
    }
  }

  handleFileInputChange(e) {
    if (e && e.target && e.target.files && e.target.files.length > 0) {
      this.handleUnifiedFile(e.target.files[0]);
    }
  }

  loadSTLFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.stl')) return;
    this.showToast('⏳ جاري قراءة وعرض مجسم الـ STL...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        this.parseAndRenderSTL(buffer, file.name);
      } catch (err) {
        console.error('STL Parse error:', err);
        alert('حدث خطأ أثناء معالجة ملف الـ STL.');
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
      alert('لم يتم العثور على أوجه ثلاثية الأبعاد في الملف.');
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

    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.2 });
    this.threeMesh = new THREE.Mesh(geometry, material);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    this.threeMesh.position.set(-center.x, -box.min.y, -center.z);
    if (this.threeScene) this.threeScene.add(this.threeMesh);
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

    const filamentItem = PRESETS.filaments.find(f => f.id === this.state.selectedFilamentPreset);
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

    this.showToast(`🧊 تم تحميل وعرض المجسم 3D بنجاح (${estimatedGrams} جم مقدر)`);
  }

  applySTLDataToCalculator() {
    if (!this.currentSTLData) {
      alert('يرجى رفع ملف STL أولاً.');
      return;
    }
    if (this.currentSTLData.filename) this.state.projectName = this.currentSTLData.filename;
    if (this.currentSTLData.estimatedGrams) this.state.partWeight = this.currentSTLData.estimatedGrams;
    this.render();
    this.showToast(`✨ تم تطبيق وزن المجسم (${this.currentSTLData.estimatedGrams} جم) واسمه في الحاسبة!`);
  }

  toggleSTLWireframe() {
    if (!this.threeMesh) return;
    this.threeMesh.material.wireframe = !this.threeMesh.material.wireframe;
    this.showToast(this.threeMesh.material.wireframe ? '🌐 تم تفعيل وضع الشبكة (Wireframe)' : '🧊 تم إيقاف وضع الشبكة');
  }

  resetSTLCamera() {
    if (!this.threeCamera) return;
    this.threeCamera.position.set(80, 80, 100);
    this.threeCamera.lookAt(0, 12.5, 0);
    if (this.threeControls) this.threeControls.target.set(0, 12.5, 0);
  }

  parseGCodeFile(file) {
    this.showToast('⏳ جاري قراءة وتحليل ملف الـ G-Code...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let printTimeSeconds = 0;
      let filamentGrams = 0;

      // Cura / Prusa / Bambu GCode metadata regex
      const timeMatch = text.match(/;\s*TIME:\s*(\d+)/i) || text.match(/;\s*estimated printing time[^=]*=\s*([^\n]+)/i);
      const filamentMatch = text.match(/;\s*Filament used:\s*([\d.]+)\s*g/i) || text.match(/;\s*total filament used \[g\]\s*=\s*([\d.]+)/i) || text.match(/;\s*filament_used_g\s*=\s*([\d.]+)/i);

      if (filamentMatch) {
        filamentGrams = parseFloat(filamentMatch[1]);
      }
      if (timeMatch) {
        const rawTime = timeMatch[1];
        if (!isNaN(rawTime)) {
          printTimeSeconds = parseInt(rawTime, 10);
        } else {
          // Parse string like 1h 30m 15s
          let h = 0, m = 0, s = 0;
          const hMatch = rawTime.match(/(\d+)\s*h/i);
          const mMatch = rawTime.match(/(\d+)\s*m/i);
          const sMatch = rawTime.match(/(\d+)\s*s/i);
          if (hMatch) h = parseInt(hMatch[1], 10);
          if (mMatch) m = parseInt(mMatch[1], 10);
          if (sMatch) s = parseInt(sMatch[1], 10);
          printTimeSeconds = h * 3600 + m * 60 + s;
        }
      }

      if (filamentGrams > 0) this.state.partWeight = Number(filamentGrams.toFixed(1));
      if (printTimeSeconds > 0) this.state.printHours = Number((printTimeSeconds / 3600).toFixed(2));
      this.state.projectName = file.name.replace(/\.gcode$/i, '').replace(/\.g$/i, '');

      this.render();
      this.showToast(`⚡ تم استخراج البيانات من الـ G-Code: ${this.state.partWeight} جم • ${this.state.printHours} ساعة`);
    };
    reader.readAsText(file);
  }

  // ================= CHARTS =================
  renderCharts(res) {
    if (!res) res = this.calculate();
    if (!res) return;

    const ctx = document.getElementById('costChart');
    if (ctx && typeof Chart !== 'undefined') {
      const dataValues = [res.materialCost, res.powerCost, res.depreciationCost, res.laborCost, res.failureCost, res.additionalCost].map(v => Number(v.toFixed(2)));
      const labels = ['خامة', 'كهرباء', 'إهلاك', 'عمالة', 'هدر', 'إضافات'];

      if (this.charts.cost) {
        this.charts.cost.data.datasets[0].data = dataValues;
        this.charts.cost.update();
      } else {
        this.charts.cost = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: dataValues,
              backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#ef4444', '#10b981']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    }
  }

  // ================= QR CODE & QUOTE =================
  generateQRCode() {
    const canvas = document.getElementById('quoteQRCode');
    if (!canvas || typeof QRious === 'undefined') return;

    let phoneClean = this.state.clientPhone ? this.state.clientPhone.replace(/[^0-9]/g, '') : '';
    if (phoneClean.startsWith('01')) phoneClean = '2' + phoneClean;
    const url = phoneClean ? `https://wa.me/${phoneClean}` : 'https://wa.me/';

    new QRious({
      element: canvas,
      value: url,
      size: 90,
      level: 'M'
    });
  }

  generateWhatsAppText() {
    const res = this.calculate();
    const s = this.state;
    const filament = PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA';

    let text = `مرحباً ${s.clientName || 'عزيزي العميل'} 👋\n`;
    text += `إليك عرض سعر خدمة الطباعة ثلاثية الأبعاد (Elegoo Neptune 4 Pro):\n\n`;
    text += `📦 *القطعة / المشروع:* ${s.projectName || 'قطعة مخصصة'}\n`;
    text += `🧵 *الخامة:* ${filament}\n`;
    text += `⚖️ *الوزن المقدر:* ${s.partWeight} جرام\n`;
    text += `⏱️ *مدة الطباعة:* ${s.printHours} ساعة\n`;
    text += `🔢 *الكمية:* ${res.qty} قطعة\n`;
    text += `--------------------------\n`;
    text += `💰 *سعر القطعة:* ${this.formatCurrency(res.finalSellingPrice)}\n`;
    text += `💵 *إجمالي الطباعة:* ${this.formatCurrency(res.batchTotalPrice)}\n`;
    if (res.shippingFee > 0) text += `🚚 *الشحن:* ${this.formatCurrency(res.shippingFee)}\n`;
    text += `💳 *الإجمالي الكلي:* ${this.formatCurrency(res.grandOrderTotal)}\n`;
    if (res.deposit > 0) {
      text += `💵 *العربون المدفوع:* ${this.formatCurrency(res.deposit)}\n`;
      text += `✨ *المتبقي عند الاستلام:* ${this.formatCurrency(res.remainingBalance)}\n`;
    }
    text += `--------------------------\n`;
    text += `جاهزون للبدء والتسليم فور التأكيد! 🚀`;

    return encodeURIComponent(text);
  }

  openWhatsApp() {
    const encoded = this.generateWhatsAppText();
    let phoneClean = this.state.clientPhone ? this.state.clientPhone.replace(/[^0-9]/g, '') : '';
    if (phoneClean.startsWith('01')) phoneClean = '2' + phoneClean;
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  }

  copyWhatsAppText() {
    const raw = decodeURIComponent(this.generateWhatsAppText());
    navigator.clipboard.writeText(raw).then(() => {
      this.showToast('📋 تم نسخ نص عرض السعر لواتساب بنجاح!');
    });
  }

  printQuote() {
    window.print();
  }

  downloadPDF() {
    const element = document.querySelector('.quote-page');
    if (!element || typeof html2pdf === 'undefined') {
      window.print();
      return;
    }
    this.showToast('📄 جاري توليد ملف الـ PDF...');
    const opt = {
      margin: 8,
      filename: `عرض_سعر_${this.state.projectName || '3D_Print'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }

  exportCSV() {
    const res = this.calculate();
    const s = this.state;
    const rows = [
      ['البند', 'القيمة', 'الوحدة'],
      ['اسم المشروع', s.projectName || 'غير مسمى', ''],
      ['اسم العميل', s.clientName || 'غير مسجل', ''],
      ['وزن القطعة', s.partWeight, 'جرام'],
      ['سعر بكرة الفيلامنت', s.spoolPrice, 'جنيه'],
      ['تكلفة الخامة', res.materialCost.toFixed(2), 'جنيه'],
      ['ساعات الطباعة', s.printHours, 'ساعة'],
      ['تكلفة الكهرباء', res.powerCost.toFixed(2), 'جنيه'],
      ['تكلفة إهلاك الطابعة', res.depreciationCost.toFixed(2), 'جنيه'],
      ['تكلفة العمالة', res.laborCost.toFixed(2), 'جنيه'],
      ['تكلفة الفشل والهدر', res.failureCost.toFixed(2), 'جنيه'],
      ['إجمالي التكلفة للقطعة', res.totalCost.toFixed(2), 'جنيه'],
      ['سعر البيع المقترح', res.finalSellingPrice.toFixed(2), 'جنيه'],
      ['صافي الربح', res.profitAmount.toFixed(2), 'جنيه'],
      ['الكمية', res.qty, 'قطعة'],
      ['إجمالي بيع الدفعة', res.batchTotalPrice.toFixed(2), 'جنيه']
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `حساب_تكلفة_${s.projectName || '3D'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('📊 تم تصدير ملف CSV بنجاح!');
  }

  // ================= SAVED PROJECTS =================
  saveCurrentProject() {
    const res = this.calculate();
    const s = this.state;
    const project = {
      id: 'proj_' + Date.now(),
      name: s.projectName || 'مشروع بدون اسم',
      client: s.clientName || 'عميل عام',
      date: new Date().toLocaleDateString('ar-EG'),
      sellingPrice: res.finalSellingPrice,
      totalCost: res.totalCost,
      weight: s.partWeight,
      hours: s.printHours,
      state: { ...s }
    };

    this.savedProjects.unshift(project);
    this.saveProjectsToStorage();
    this.renderSavedProjectsList();
    this.showToast(`💾 تم حفظ المشروع: ${project.name}`);
  }

  loadProject(id) {
    const proj = this.savedProjects.find(p => p.id === id);
    if (proj && proj.state) {
      this.state = { ...DEFAULT_STATE, ...proj.state };
      this.render();
      this.switchTab('table');
      this.showToast(`📂 تم استرجاع المشروع: ${proj.name}`);
    }
  }

  deleteProject(id) {
    if (confirm('هل أنت متأكد من حذف هذا المشروع المحفوظ؟')) {
      this.savedProjects = this.savedProjects.filter(p => p.id !== id);
      this.saveProjectsToStorage();
      this.renderSavedProjectsList();
      this.showToast('🗑️ تم حذف المشروع.');
    }
  }

  renderSavedProjectsList() {
    const container = document.getElementById('savedProjectsList');
    if (!container) return;

    if (this.savedProjects.length === 0) {
      container.innerHTML = '<div class="text-xs text-slate-400 text-center py-6">لا توجد مشاريع محفوظة بعد. اضغط على زر "حفظ المشروع" لحفظ الحساب الحالي.</div>';
      return;
    }

    container.innerHTML = this.savedProjects.map(p => `
      <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div>
          <div class="font-bold text-sm text-slate-800 dark:text-slate-100">${p.name}</div>
          <div class="text-slate-500 mt-0.5">${p.client} • ${p.date} • ${p.weight} جم • ${p.hours} ساعة</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-black text-emerald-600 font-mono-nums text-sm">${this.formatCurrency(p.sellingPrice)}</span>
          <button onclick="app.loadProject('${p.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-bold">فتح</button>
          <button onclick="app.deleteProject('${p.id}')" class="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-1.5 rounded-lg font-bold"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  showToast(msg) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform opacity-0 translate-y-4';
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

// Global initialization
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new CostCalculatorApp();
});
