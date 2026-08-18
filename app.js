// 3D Printing Cost Calculator Core Logic & UI Controller
// Developed for Elegoo Neptune 4 Pro & Egyptian 3D Printing Market

const DEFAULT_STATE = {
  projectName: 'قطعة نموذجية — Elegoo Neptune 4 Pro',
  clientName: '',
  notes: '',
  // 1) Material
  partWeight: 165.00,       // grams
  spoolPrice: 700.00,       // EGP
  spoolWeight: 1000,        // grams
  selectedFilamentPreset: 'esun-pla',

  // 2) Power
  printHours: 7.50,         // hours
  printerPowerKw: 0.16,     // kW
  electricityRate: 1.5100,  // EGP/kWh
  selectedPowerPreset: 'tier-custom',
  selectedPrinterPreset: 'neptune-4-pro',

  // 3) Depreciation & Maintenance
  printerPrice: 26000.00,   // EGP
  printerLifespanHours: 5000, // hours

  // 4) Labor & Post-Processing
  laborHours: 0.50,         // hours
  laborRatePerHour: 100.00, // EGP/hour

  // 5) Subtotal & Failure Rate
  failureRatePercent: 10.0, // %

  // 6) Final Pricing
  profitMarginPercent: 40.0, // %
  
  // Extra / Batch Options
  batchQuantity: 1,
  additionalCost: 0,
  additionalCostNotes: '',

  // UI state
  activeTab: 'table', // 'table' | 'dashboard' | 'quote' | 'saved'
  darkMode: false
};

class CostCalculatorApp {
  constructor() {
    this.state = this.loadState();
    this.chart = null;
    this.profitChart = null;
    this.savedProjects = this.loadSavedProjects();
    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('3d_calc_current_state');
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load saved state', e);
    }
    return { ...DEFAULT_STATE };
  }

  saveState() {
    try {
      localStorage.setItem('3d_calc_current_state', JSON.stringify(this.state));
    } catch (e) {}
  }

  loadSavedProjects() {
    try {
      const projects = localStorage.getItem('3d_calc_saved_projects');
      return projects ? JSON.parse(projects) : [];
    } catch (e) {
      return [];
    }
  }

  saveProjectsList() {
    try {
      localStorage.setItem('3d_calc_saved_projects', JSON.stringify(this.savedProjects));
    } catch (e) {}
  }

  init() {
    this.populatePresets();
    this.setupEventListeners();
    this.applyTheme();
    this.render();
  }

  populatePresets() {
    // Populate Filaments
    const filamentSelect = document.getElementById('filamentPresetSelect');
    if (filamentSelect) {
      filamentSelect.innerHTML = '<option value="">-- اختر خامة من السوق المصري --</option>' + 
        PRESETS.filaments.map(f => `<option value="${f.id}" ${f.id === this.state.selectedFilamentPreset ? 'selected' : ''}>${f.name} — ${f.price} ج.م</option>`).join('');
    }

    // Populate Printers
    const printerSelect = document.getElementById('printerPresetSelect');
    if (printerSelect) {
      printerSelect.innerHTML = '<option value="">-- اختر طابعة ثلاثية الأبعاد --</option>' + 
        PRESETS.printers.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPrinterPreset ? 'selected' : ''}>${p.name} — ${p.price.toLocaleString('ar-EG')} ج.م</option>`).join('');
    }

    // Populate Electricity Tiers
    const powerSelect = document.getElementById('electricityTierSelect');
    if (powerSelect) {
      powerSelect.innerHTML = '<option value="">-- اختر شريحة الكهرباء في مصر --</option>' + 
        PRESETS.electricityTiers.map(t => `<option value="${t.id}" ${t.id === this.state.selectedPowerPreset ? 'selected' : ''}>${t.name} (${t.rate} ج.م/ك.و.س)</option>`).join('');
    }
  }

  calculate() {
    const s = this.state;

    // 1) Material
    const materialCost = s.spoolWeight > 0 ? (s.partWeight * s.spoolPrice) / s.spoolWeight : 0;

    // 2) Power
    const powerCost = s.printHours * s.printerPowerKw * s.electricityRate;

    // 3) Depreciation
    const depreciationPerHour = s.printerLifespanHours > 0 ? s.printerPrice / s.printerLifespanHours : 0;
    const depreciationCost = depreciationPerHour * s.printHours;

    // 4) Labor
    const laborCost = s.laborHours * s.laborRatePerHour;

    // 5) Subtotal & Failure
    const additionalCost = Number(s.additionalCost) || 0;
    const subtotal = materialCost + powerCost + depreciationCost + laborCost + additionalCost;
    const failureCost = subtotal * (s.failureRatePercent / 100);
    const totalCost = subtotal + failureCost;

    // 6) Final Selling Price & Profit
    const marginFraction = s.profitMarginPercent / 100;
    // Price = Cost / (1 - Margin)
    const finalSellingPrice = marginFraction < 1 ? totalCost / (1 - marginFraction) : 0;
    const profitAmount = finalSellingPrice - totalCost;
    const markupPercent = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0;

    // Batch calculations
    const qty = Math.max(1, parseInt(s.batchQuantity) || 1);
    const batchTotalCost = totalCost * qty;
    const batchTotalPrice = finalSellingPrice * qty;
    const batchTotalProfit = profitAmount * qty;
    const costPerGram = s.partWeight > 0 ? totalCost / s.partWeight : 0;
    const costPerHour = s.printHours > 0 ? totalCost / s.printHours : 0;

    return {
      materialCost,
      powerCost,
      depreciationPerHour,
      depreciationCost,
      laborCost,
      additionalCost,
      subtotal,
      failureCost,
      totalCost,
      finalSellingPrice,
      profitAmount,
      markupPercent,
      qty,
      batchTotalCost,
      batchTotalPrice,
      batchTotalProfit,
      costPerGram,
      costPerHour
    };
  }

  formatCurrency(val, decimals = 2) {
    if (isNaN(val)) return '0.00 ج.م';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' ج.م';
  }

  formatNumber(val, decimals = 2) {
    if (isNaN(val)) return '0';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  render() {
    const res = this.calculate();

    // Update table view inputs & outputs
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

    // Batch & Quotation elements
    this.updateElementText('batchSingleCost', this.formatCurrency(res.totalCost));
    this.updateElementText('batchSinglePrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('batchSingleProfit', this.formatCurrency(res.profitAmount));
    this.updateElementText('batchTotalQty', res.qty);
    this.updateElementText('batchTotalCost', this.formatCurrency(res.batchTotalCost));
    this.updateElementText('batchTotalPrice', this.formatCurrency(res.batchTotalPrice));
    this.updateElementText('batchTotalProfit', this.formatCurrency(res.batchTotalProfit));

    // Update Quotation preview
    this.renderQuotationPreview(res);

    // Update Saved Projects List
    this.renderSavedProjects();

    // Update Charts
    this.renderCharts(res);

    // Persist
    this.saveState();
  }

  updateElementValue(id, val) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = val;
    }
  }

  updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  renderCharts(res) {
    // 1) Cost Breakdown Donut Chart
    const ctx = document.getElementById('costChart');
    if (ctx) {
      const dataValues = [
        res.materialCost,
        res.powerCost,
        res.depreciationCost,
        res.laborCost,
        res.failureCost,
        res.additionalCost
      ].map(v => Number(v.toFixed(2)));

      const labels = [
        `خامة (${((res.materialCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `كهرباء (${((res.powerCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `إهلاك وصيانة (${((res.depreciationCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `عمالة ومعالجة (${((res.laborCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `هدر وفشل (${((res.failureCost / res.totalCost) * 100 || 0).toFixed(1)}%)`,
        `إضافات (${((res.additionalCost / res.totalCost) * 100 || 0).toFixed(1)}%)`
      ];

      if (this.chart) {
        this.chart.data.datasets[0].data = dataValues;
        this.chart.data.labels = labels;
        this.chart.update();
      } else if (typeof Chart !== 'undefined') {
        this.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: dataValues,
              backgroundColor: [
                '#3B82F6', // Blue - Material
                '#F59E0B', // Amber - Power
                '#8B5CF6', // Purple - Depreciation
                '#EC4899', // Pink - Labor
                '#EF4444', // Red - Failure
                '#10B981'  // Emerald - Additions
              ],
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
                labels: {
                  font: { family: 'Tajawal, Cairo, sans-serif', size: 12 },
                  color: this.state.darkMode ? '#CBD5E1' : '#475569',
                  padding: 12
                }
              },
              tooltip: {
                rtl: true,
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.raw} ج.م`
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    }

    // 2) Profit vs Cost Stacked Bar
    const ctxProfit = document.getElementById('profitChart');
    if (ctxProfit) {
      if (this.profitChart) {
        this.profitChart.data.datasets[0].data = [res.totalCost];
        this.profitChart.data.datasets[1].data = [res.profitAmount];
        this.profitChart.update();
      } else if (typeof Chart !== 'undefined') {
        this.profitChart = new Chart(ctxProfit, {
          type: 'bar',
          data: {
            labels: ['توزيع سعر البيع للقطعة'],
            datasets: [
              {
                label: 'إجمالي التكلفة الحقيقية',
                data: [res.totalCost],
                backgroundColor: '#64748B',
                borderRadius: 6
              },
              {
                label: 'صافي الربح المستهدف',
                data: [res.profitAmount],
                backgroundColor: '#10B981',
                borderRadius: 6
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                grid: { color: this.state.darkMode ? '#334155' : '#E2E8F0' },
                ticks: { color: this.state.darkMode ? '#94A3B8' : '#64748B' }
              },
              y: {
                stacked: true,
                display: false
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                rtl: true,
                labels: {
                  font: { family: 'Tajawal, Cairo, sans-serif', size: 12 },
                  color: this.state.darkMode ? '#CBD5E1' : '#475569'
                }
              },
              tooltip: {
                rtl: true,
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)} ج.م`
                }
              }
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
    this.updateElementText('quoteWeight', `${s.partWeight} جرام`);
    this.updateElementText('quotePrintTime', `${s.printHours} ساعة`);
    this.updateElementText('quoteFilamentType', s.selectedFilamentPreset ? (PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA') : 'PLA قياسي');
    this.updateElementText('quotePrinterModel', s.selectedPrinterPreset ? (PRESETS.printers.find(p => p.id === s.selectedPrinterPreset)?.name || 'Elegoo Neptune 4 Pro') : 'Elegoo Neptune 4 Pro');
    this.updateElementText('quoteUnitPrice', this.formatCurrency(res.finalSellingPrice));
    this.updateElementText('quoteQuantity', `${res.qty} قطعة`);
    this.updateElementText('quoteTotalPrice', this.formatCurrency(res.batchTotalPrice));
    this.updateElementText('quoteNotes', s.notes || 'الطباعة بدقة عالية وجودة ممتازة شاملة إزالة الدعامات والتشطيب الأولي.');
  }

  renderSavedProjects() {
    const list = document.getElementById('savedProjectsList');
    if (!list) return;

    if (this.savedProjects.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i class="fas fa-folder-open text-4xl mb-3 text-slate-300 dark:text-slate-600 block"></i>
          لا توجد حسابات محفوظة بعد. اضغط على "حفظ المشروع الحالي" بالأسفل لحفظ حساباتك والرجوع إليها لاحقاً.
        </div>
      `;
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
            <span><i class="fas fa-calendar-alt ml-1"></i> ${p.savedAt || ''}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <button onclick="app.loadProject(${idx})" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-upload"></i> فتح وتعديل
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

    // Replace if exists with same name, or prepend
    const existingIndex = this.savedProjects.findIndex(p => p.projectName === project.projectName && p.clientName === project.clientName);
    if (existingIndex >= 0) {
      this.savedProjects[existingIndex] = project;
    } else {
      this.savedProjects.unshift(project);
    }

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
      this.showToast('تمت استعادة القيم الافتراضية للنموذج.');
    }
  }

  setupEventListeners() {
    // Universal input handler
    const handleInput = (key, val, type = 'float') => {
      let parsed = type === 'int' ? parseInt(val) : parseFloat(val);
      if (type === 'string') parsed = val;
      if (isNaN(parsed) && type !== 'string') parsed = 0;
      this.state[key] = parsed;
      this.render();
    };

    // Table inputs
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
      if (el) {
        el.addEventListener('input', (e) => handleInput(b.key, e.target.value));
      }
    });

    // Dashboard inputs
    const dashBindings = [
      { id: 'dash_projectName', key: 'projectName', type: 'string' },
      { id: 'dash_clientName', key: 'clientName', type: 'string' },
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
      if (el) {
        el.addEventListener('input', (e) => handleInput(b.key, e.target.value, b.type));
      }
    });

    // Presets Selects
    const fSelect = document.getElementById('filamentPresetSelect');
    if (fSelect) {
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
    if (pSelect) {
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
    if (eSelect) {
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
  }

  switchTab(tabName) {
    this.state.activeTab = tabName;
    ['table', 'dashboard', 'quote', 'saved'].forEach(tab => {
      const pane = document.getElementById(`tabPane_${tab}`);
      const btn = document.getElementById(`tabBtn_${tab}`);
      if (pane) {
        if (tab === tabName) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      }
      if (btn) {
        if (tab === tabName) {
          btn.className = 'tab-btn active px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-blue-600 text-white shadow-md transition';
        } else {
          btn.className = 'tab-btn px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition';
        }
      }
    });

    if (tabName === 'dashboard' || tabName === 'table') {
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
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.profitChart) {
      this.profitChart.destroy();
      this.profitChart = null;
    }
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
    const filament = PRESETS.filaments.find(f => f.id === s.selectedFilamentPreset)?.name || 'PLA';
    
    let text = `مرحباً ${s.clientName || 'عزيزي العميل'} 👋\n`;
    text += `إليك عرض سعر لخدمة الطباعة ثلاثية الأبعاد:\n\n`;
    text += `📦 *القطعة / المشروع:* ${s.projectName || 'قطعة مخصصة'}\n`;
    text += `⚖️ *الوزن المقدر:* ${s.partWeight} جرام\n`;
    text += `🧵 *الخامة:* ${filament}\n`;
    text += `⏱️ *مدة الطباعة:* ${s.printHours} ساعة تقريباً\n`;
    text += `🔢 *الكمية:* ${res.qty} قطعة\n`;
    text += `--------------------------\n`;
    text += `💰 *سعر القطعة:* ${this.formatCurrency(res.finalSellingPrice)}\n`;
    if (res.qty > 1) {
      text += `💵 *الإجمالي للكمية (${res.qty} قطع):* ${this.formatCurrency(res.batchTotalPrice)}\n`;
    }
    text += `--------------------------\n`;
    text += `✨ *ملاحظات:* ${s.notes || 'السعر يشمل الطباعة بدقة عالية وتنظيف القطعة والمعالجة الأولية.'}\n\n`;
    text += `جاهزون للبدء فور تأكيد الطلب! 🚀`;

    return encodeURIComponent(text);
  }

  openWhatsApp() {
    const encoded = this.generateWhatsAppText();
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  copyWhatsAppText() {
    const raw = decodeURIComponent(this.generateWhatsAppText());
    navigator.clipboard.writeText(raw).then(() => {
      this.showToast('تم نسخ نص عرض السعر لواتساب بنجاح!');
    }).catch(() => {
      alert(raw);
    });
  }

  printQuote() {
    window.print();
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

// Initialize on window load
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new CostCalculatorApp();
});
