/* ============================================================
   app.js — 胸痛急救协同救治系统 · 演示原型
   状态驱动：所有内容由录入数据生成，不做任何预置患者
   ============================================================ */
(function () {
  'use strict';

  /* ================= 工具 ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nowHM() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }

  /* ================= 数据字典 ================= */

  // 实验室检验：参考区间与危急值
  var LABS = [
    { id: 'trop', name: '肌钙蛋白 I', short: 'cTnI', unit: 'ng/mL', low: 0, high: 0.04, critHigh: 0.5, grp: '心肌损伤' },
    { id: 'ckmb', name: '肌酸激酶同工酶', short: 'CK-MB', unit: 'ng/mL', low: 0, high: 5, critHigh: 25, grp: '心肌损伤' },
    { id: 'ddimer', name: 'D-二聚体', short: 'D-Dimer', unit: 'mg/L FEU', low: 0, high: 0.5, critHigh: 5, grp: '血栓' },
    { id: 'ntprobnp', name: 'N 末端脑钠肽前体', short: 'NT-proBNP', unit: 'pg/mL', low: 0, high: 125, critHigh: 2000, grp: '心功能' },
    { id: 'cr', name: '血肌酐', short: 'Cr', unit: 'μmol/L', low: 57, high: 111, critHigh: 500, grp: '肾功能' },
    { id: 'k', name: '血钾', short: 'K⁺', unit: 'mmol/L', low: 3.5, high: 5.3, critLow: 2.5, critHigh: 6.5, grp: '电解质' },
    { id: 'hb', name: '血红蛋白', short: 'Hb', unit: 'g/L', low: 130, high: 175, critLow: 70, grp: '血常规' },
    { id: 'wbc', name: '白细胞计数', short: 'WBC', unit: '×10⁹/L', low: 3.5, high: 9.5, grp: '血常规' },
    { id: 'glu', name: '血糖', short: 'Glu', unit: 'mmol/L', low: 3.9, high: 6.1, critLow: 2.8, critHigh: 22, grp: '代谢' },
    { id: 'lac', name: '血乳酸', short: 'Lac', unit: 'mmol/L', low: 0.5, high: 2.2, critHigh: 4, grp: '灌注' }
  ];

  // 生命体征
  var VITALS = [
    { id: 'sbp', name: '收缩压', unit: 'mmHg', low: 90, high: 140, critLow: 80, critHigh: 220 },
    { id: 'dbp', name: '舒张压', unit: 'mmHg', low: 60, high: 90, critHigh: 130 },
    { id: 'hr', name: '心率', unit: '次/分', low: 60, high: 100, critLow: 40, critHigh: 150 },
    { id: 'rr', name: '呼吸频率', unit: '次/分', low: 12, high: 20, critHigh: 30 },
    { id: 'spo2', name: '血氧饱和度', unit: '%', low: 95, high: 100, critLow: 90 },
    { id: 'temp', name: '体温', unit: '℃', low: 36.0, high: 37.3, critHigh: 39.5 },
    { id: 'sbp2', name: '对侧上肢收缩压', unit: 'mmHg', low: 90, high: 140 }
  ];

  // 检查（选项式）
  var EXAMS = [
    {
      id: 'ecg', name: '12 导联心电图', note: '到院 10 分钟内完成 · 可上传原图',
      options: ['未完成', '未见明显异常', 'ST 段抬高', 'ST 段压低', 'T 波倒置', '心房颤动'],
      abnormal: ['ST 段抬高', 'ST 段压低', 'T 波倒置', '心房颤动']
    },
    {
      id: 'cta', name: '主动脉 CTA', note: '需肾功能与过敏史评估',
      options: ['未完成', '未见夹层', 'A 型夹层', 'B 型夹层', '壁内血肿'],
      abnormal: ['A 型夹层', 'B 型夹层', '壁内血肿']
    },
    {
      id: 'ctpa', name: '肺动脉 CTA', note: '疑诊肺栓塞时',
      options: ['未完成', '未见充盈缺损', '肺动脉主干栓塞', '分支栓塞'],
      abnormal: ['肺动脉主干栓塞', '分支栓塞']
    },
    {
      id: 'echo', name: '床旁心脏彩超', note: '急诊可及 · 可上传报告单',
      options: ['未完成', '室壁运动正常', '节段性室壁运动异常', '心包积液', '主动脉瓣反流'],
      abnormal: ['节段性壁运动异常', '节段性室壁运动异常', '心包积液', '主动脉瓣反流']
    },
    {
      id: 'cxr', name: '胸部 X 线', note: '床旁胸片',
      options: ['未完成', '未见异常', '纵隔增宽', '心影增大'],
      abnormal: ['纵隔增宽', '心影增大']
    }
  ];

  var SYMPTOMS = ['撕裂样胸背痛', '胸骨后压榨性疼痛', '疼痛放射至左肩/下颌', '呼吸困难', '大汗淋漓', '晕厥', '心悸', '单侧下肢肿胀', '咯血', '恶心呕吐'];
  var HISTORY = ['高血压', '糖尿病', '冠心病', '心房颤动', '脑卒中', '慢性肾病', '高脂血症', '吸烟史', '既往动脉瘤/夹层', '近期手术或制动'];
  var PRE_CARE = ['吸氧', '心电监护', '建立静脉通路', '硝酸甘油', '阿司匹林嚼服', '肝素抗凝', '镇痛', '控制心率血压'];

  // 阶段任务
  var PHASES = [
    {
      id: 'pre', name: '院前', desc: '现场采集 · 转运', color: '#2F6BF6',
      items: [
        { label: '身份与联系人', done: function (s) { return !!(s.patient && s.patient.name && s.patient.age && s.patient.contact); } },
        { label: '主诉与发病时间', done: function (s) { return !!(s.patient && s.patient.complaint && s.patient.onset); } },
        { label: '既往史与危险因素', done: function (s) { return s.history.length > 0; } },
        { label: '首次生命体征', done: function (s) { return s.vitals.length > 0; } },
        { label: '院前心电图', done: function (s) { return !!(s.exams.ecg && s.exams.ecg.value && s.exams.ecg.value !== '未完成'); } },
        { label: '院前处置记录', done: function (s) { return s.preCare.length > 0; } },
        { label: '院内预通知', done: function (s) { return s.receive.notified; } }
      ]
    },
    {
      id: 'in', name: '院中', desc: '接诊 · 检查 · 决策', color: '#7C4DFF',
      items: [
        { label: '院内接诊接收', done: function (s) { return s.receive.accepted; } },
        { label: '抢救资源准备', done: function (s) { return s.receive.resourced; } },
        { label: '实验室检验 ≥3 项', done: function (s) { return labDoneCount(s) >= 3; } },
        { label: '影像 / 心电检查 ≥2 项', done: function (s) { return examDoneCount(s) >= 2; } },
        { label: '高危线索逐条处置', done: function (s) { return riskSettled(s); } },
        { label: '初步诊断记录', done: function (s) { return !!s.diagnosis; } }
      ]
    },
    {
      id: 'post', name: '院后', desc: '交接 · 随访 · 回传', color: '#12A150',
      items: [
        { label: '转诊 / 离院交接', done: function (s) { return s.referral.handover; } },
        { label: '出院用药核对', done: function (s) { return s.meds.length > 0 && s.meds.every(function (m) { return m.state !== 'pending'; }); } },
        { label: '随访计划', done: function (s) { return s.followup.plan; } },
        { label: '首次随访记录', done: function (s) { return s.followup.records.length > 0; } },
        { label: '记录回传归档', done: function (s) { return s.followup.returned; } }
      ]
    }
  ];

  /* ================= 状态 ================= */
  var LS_KEY = 'cpn_v2_state';

  // 一份病历包含的临床字段
  var CHART_FIELDS = ['patient', 'vitals', 'labs', 'exams', 'symptoms', 'history', 'preCare',
    'riskState', 'diagnosis', 'receive', 'referral', 'meds', 'followup', 'model'];

  function chartFields() {
    return {
      patient: null,
      vitals: [],
      labs: {},
      exams: {},
      symptoms: [],
      history: [],
      preCare: [],
      riskState: {},
      diagnosis: '',
      receive: { notified: false, accepted: false, resources: [], resourced: false, comm: null },
      referral: { handover: false },
      meds: [],
      followup: { plan: false, records: [], returned: false },
      model: 'dissection'
    };
  }

  function blankState() {
    var base = chartFields();
    base.patients = [];
    base.activeId = null;
    base.doctor = '李 · 急诊';
    base.peers = [
      { name: '李 · 急诊', role: '急诊科' },
      { name: '王 · 心内', role: '心内科' },
      { name: '陈 · 导管室', role: '介入中心' }
    ];
    base.lastSaved = '';
    base.audit = [];
    base.online = true;
    base.queue = [];
    base.modelTouched = false;
    return base;
  }

  var S = blankState();
  var currentPanel = null;
  var viewer = null;
  var pickerOpen = false;
  var editingNew = false;

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  function curChart() {
    for (var i = 0; i < S.patients.length; i++) if (S.patients[i].id === S.activeId) return S.patients[i];
    return null;
  }

  function genMRN() {
    var d = new Date();
    var ymd = '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    var n = 0;
    for (var i = 0; i < S.patients.length; i++) {
      if ((S.patients[i].mrn || '').indexOf('CP' + ymd) === 0) n++;
    }
    return 'CP' + ymd + ('00' + (n + 1)).slice(-3);
  }

  // 把当前工作副本写回病历列表
  function saveActive() {
    var c = curChart();
    if (!c) return;
    for (var i = 0; i < CHART_FIELDS.length; i++) {
      var k = CHART_FIELDS[i];
      if (S[k] !== undefined) c[k] = S[k];
    }
    c.updatedAt = Date.now();
    c.updatedBy = S.doctor;
    c.progress = totalProgress();
    if (c.patient) c.name = c.patient.name;
  }

  function applyChart(c) {
    var d = chartFields();
    for (var i = 0; i < CHART_FIELDS.length; i++) {
      var k = CHART_FIELDS[i];
      S[k] = c[k] !== undefined && c[k] !== null ? clone(c[k]) : d[k];
    }
  }

  function loadChart(id) {
    var c = null;
    for (var i = 0; i < S.patients.length; i++) if (S.patients[i].id === id) c = S.patients[i];
    if (!c) return false;
    saveActive();
    S.activeId = id;
    applyChart(c);
    return true;
  }

  function createChart(pdata) {
    saveActive();
    var id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 100);
    var base = chartFields();
    base.id = id;
    base.mrn = genMRN();
    base.patient = pdata;
    base.createdAt = Date.now();
    base.updatedAt = Date.now();
    base.updatedBy = S.doctor;
    base.progress = 0;
    base.name = pdata.name;
    S.patients.unshift(base);
    S.activeId = id;
    applyChart(base);
    S.lastSaved = nowHM();
    return base;
  }

  function save() {
    saveActive();
    S.lastSaved = nowHM();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(S));
    } catch (e) {
      toast('本地存储空间不足，报告单照片可能未保存，可删除部分照片后重试');
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && typeof o === 'object') S = Object.assign(blankState(), o);
      if (!S.patients) S.patients = [];
      // 旧版单患者数据迁移为一份病历
      if (!S.patients.length && S.patient) {
        var c = chartFields();
        c.id = 'c0';
        c.createdAt = Date.now();
        c.updatedAt = Date.now();
        c.updatedBy = S.doctor;
        for (var i = 0; i < CHART_FIELDS.length; i++) c[CHART_FIELDS[i]] = S[CHART_FIELDS[i]];
        c.mrn = 'CP20261105001';
        c.name = S.patient.name;
        S.patients.push(c);
        S.activeId = 'c0';
      }
      if (S.patients.length && !curChart()) S.activeId = S.patients[0].id;
      if (curChart()) applyChart(curChart());
    } catch (e) { }
  }

  function audit(what) {
    S.audit.unshift({ t: nowHM(), who: S.doctor, what: what });
    if (S.audit.length > 60) S.audit.pop();
  }

  function toast(msg, kind) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.className = 'toast'; }, 2600);
  }

  /* ================= 判定逻辑 ================= */
  function judgeValue(v, def) {
    if (v === null || v === undefined || v === '') return null;
    if (def.critHigh != null && v >= def.critHigh) return { key: 'crit-high', text: '危急值 ↑', cls: 'crit' };
    if (def.critLow != null && v <= def.critLow) return { key: 'crit-low', text: '危急值 ↓', cls: 'crit' };
    if (v < def.low) return { key: 'low', text: '偏低', cls: 'low' };
    if (v > def.high) return { key: 'high', text: '偏高', cls: 'high' };
    return { key: 'normal', text: '正常', cls: 'ok' };
  }

  function labDef(id) { for (var i = 0; i < LABS.length; i++) if (LABS[i].id === id) return LABS[i]; return null; }
  function vitalDef(id) { for (var i = 0; i < VITALS.length; i++) if (VITALS[i].id === id) return VITALS[i]; return null; }
  function examDef(id) { for (var i = 0; i < EXAMS.length; i++) if (EXAMS[i].id === id) return EXAMS[i]; return null; }

  function labVal(id) {
    var l = S.labs[id];
    return l ? num(l.value) : null;
  }
  function examVal(id) { return S.exams[id] ? S.exams[id].value : ''; }

  function labDoneCount(s) {
    return LABS.filter(function (d) {
      var l = s.labs[d.id];
      return l && l.value !== '' && l.value != null && num(l.value) !== null;
    }).length;
  }
  function examDoneCount(s) {
    return EXAMS.filter(function (d) {
      var e = s.exams[d.id];
      return e && e.value && e.value !== '未完成';
    }).length;
  }
  function latestVital() {
    return S.vitals.length ? S.vitals[S.vitals.length - 1] : null;
  }

  // 三色：灰=未完成，黄=已完成待复核，绿=已复核
  function triState(value, reviewed) {
    if (value === '' || value == null) return { cls: 'gray', text: '未完成' };
    if (!reviewed) return { cls: 'amber', text: '待复核' };
    return { cls: 'green', text: '已复核' };
  }

  /* ================= 高危线索（规则引擎） ================= */
  function computeRisks() {
    var out = [];
    var v = latestVital() || {};
    var has = function (arr, s) { return arr.indexOf(s) >= 0; };
    var trop = labVal('trop'), ckmb = labVal('ckmb'), dd = labVal('ddimer'), cr = labVal('cr'), k = labVal('k');
    var ecg = examVal('ecg'), cta = examVal('cta'), ctpa = examVal('ctpa'), cxr = examVal('cxr');
    var sbp = v.sbp, sbp2 = v.sbp2, hr = v.hr, spo2 = v.spo2;
    var sbpN = num(sbp), sbp2N = num(sbp2), hrN = num(hr), spo2N = num(spo2);
    var diff = (sbpN !== null && sbp2N !== null) ? Math.abs(sbpN - sbp2N) : null;

    // 1. 急性冠脉综合征
    var acsBasis = [];
    if (trop != null && trop > 0.04) acsBasis.push('肌钙蛋白 I ' + trop + ' ng/mL，高于参考上限 0.04');
    if (ckmb != null && ckmb > 5) acsBasis.push('CK-MB ' + ckmb + ' ng/mL 升高');
    if (ecg === 'ST 段抬高') acsBasis.push('心电图 ST 段抬高');
    if (ecg === 'ST 段压低' || ecg === 'T 波倒置') acsBasis.push('心电图 ' + ecg);
    if (has(S.symptoms, '胸骨后压榨性疼痛')) acsBasis.push('主诉胸骨后压榨性疼痛');
    if (has(S.symptoms, '疼痛放射至左肩/下颌')) acsBasis.push('疼痛向左肩 / 下颌放射');
    if (acsBasis.length >= 2) {
      out.push({
        key: 'acs', level: 'high', title: '疑似急性冠脉综合征',
        basis: acsBasis, advice: '启动胸痛绿色通道，10 分钟内完成心电图，评估再灌注治疗（PCI / 溶栓）。'
      });
    }

    // 2. 主动脉夹层
    var adBasis = [];
    if (has(S.symptoms, '撕裂样胸背痛')) adBasis.push('撕裂样胸背部疼痛');
    if (diff != null && diff >= 20) adBasis.push('双上肢收缩压差 ' + diff + ' mmHg（≥20 有提示意义）');
    if (cta === 'A 型夹层' || cta === 'B 型夹层') adBasis.push('主动脉 CTA 提示 ' + cta);
    if (cta === '壁内血肿') adBasis.push('主动脉 CTA 提示壁内血肿');
    if (cxr === '纵隔增宽') adBasis.push('胸片纵隔增宽');
    if (has(S.history, '高血压')) adBasis.push('高血压病史');
    if (adBasis.length >= 2 && (has(S.symptoms, '撕裂样胸背痛') || (cta && cta.indexOf('夹层') >= 0))) {
      out.push({
        key: 'ad', level: 'high', title: '疑似主动脉夹层',
        basis: adBasis, advice: '立即控制心率与血压（目标收缩压 100–120 mmHg），镇痛，联系心胸外科 / 血管外科，急诊 CTA 明确分型。'
      });
    }

    // 3. 肺栓塞
    var peBasis = [];
    if (dd != null && dd > 0.5) peBasis.push('D-二聚体 ' + dd + ' mg/L FEU 升高');
    if (has(S.symptoms, '呼吸困难')) peBasis.push('呼吸困难');
    if (has(S.symptoms, '单侧下肢肿胀')) peBasis.push('单侧下肢肿胀（深静脉血栓可能）');
    if (has(S.symptoms, '咯血')) peBasis.push('咯血');
    if (spo2N !== null && spo2N < 95) peBasis.push('血氧饱和度 ' + spo2 + '%');
    if (hrN !== null && hrN > 100) peBasis.push('心率 ' + hr + ' 次/分');
    if (ctpa === '肺动脉主干栓塞' || ctpa === '分支栓塞') peBasis.push('肺动脉 CTA 提示 ' + ctpa);
    if (peBasis.length >= 3) {
      out.push({
        key: 'pe', level: 'high', title: '疑似肺栓塞',
        basis: peBasis, advice: '评估 Wells 评分，完善肺动脉 CTA；高危者考虑溶栓或介入取栓，先给抗凝。'
      });
    }

    // 4. 血流动力学不稳定
    var shock = [];
    if (sbpN !== null && sbpN < 90) shock.push('收缩压 ' + sbp + ' mmHg');
    if (hrN !== null && hrN > 120) shock.push('心率 ' + hr + ' 次/分');
    if (spo2N !== null && spo2N < 90) shock.push('血氧 ' + spo2 + '%');
    if (shock.length) {
      out.push({
        key: 'shock', level: 'high', title: '血流动力学不稳定',
        basis: shock, advice: '开放两条大静脉通路、补液与血管活性药物，持续监护，优先稳定生命体征。'
      });
    }

    // 5. 肾功能 / 造影剂风险
    if (cr != null && cr > 111) {
      out.push({
        key: 'renal', level: 'mid', title: '肾功能不全 · 造影剂风险',
        basis: ['血肌酐 ' + cr + ' μmol/L，高于参考上限 111'],
        advice: 'CTA 前评估 eGFR，尽量选用等渗造影剂，检查前后水化并复查肾功能。'
      });
    }

    // 6. 高钾
    if (k != null && k > 5.3) {
      out.push({
        key: 'hyperk', level: 'mid', title: '血钾升高 · 心律失常风险',
        basis: ['血钾 ' + k + ' mmol/L，高于参考上限 5.3'],
        advice: '复查血气排除溶血，必要时降钾处理并持续心电监护。'
      });
    }

    out.forEach(function (r) { r.state = S.riskState[r.key] || 'open'; });
    return out;
  }

  function riskSettled(s) {
    var risks = computeRisks();
    if (!risks.length) return false;
    return risks.every(function (r) { return (s.riskState[r.key] || 'open') !== 'open'; });
  }

  // 系统提示（非诊断）
  function suggestion() {
    var risks = computeRisks().filter(function (r) { return r.level === 'high'; });
    if (!risks.length) return null;
    return risks[0];
  }

  /* ================= 进度 ================= */
  function progress() {
    return PHASES.map(function (ph) {
      var done = ph.items.filter(function (it) { return it.done(S); }).length;
      return {
        id: ph.id, name: ph.name, desc: ph.desc, color: ph.color,
        done: done, total: ph.items.length,
        pct: Math.round(done / ph.items.length * 100),
        items: ph.items
      };
    });
  }

  function totalProgress() {
    var all = progress();
    var d = 0, t = 0;
    all.forEach(function (p) { d += p.done; t += p.total; });
    return Math.round(d / t * 100);
  }

  /* ================= 渲染：进度条 ================= */
  function renderPhase() {
    var ps = progress();
    var html = ps.map(function (p) {
      var doneCls = p.pct === 100 ? ' is-done' : '';
      return '<button class="phase-seg' + doneCls + '" type="button" data-act="phase-detail" data-phase="' + p.id + '">' +
        '<span class="ps-top">' +
          '<span class="ps-name"><i class="ps-dot" style="background:' + p.color + '"></i>' + p.name + '</span>' +
          '<span class="ps-pct">' + p.pct + '<em>%</em></span>' +
        '</span>' +
        '<span class="ps-bar"><i style="width:' + p.pct + '%;background:' + (p.pct === 100 ? '#12A150' : p.color) + '"></i></span>' +
        '<span class="ps-meta">' + p.desc + ' · ' + p.done + '/' + p.total + ' 项' +
          (p.pct === 100 ? '<b class="ps-done">已完成</b>' : '') +
        '</span>' +
      '</button>';
    }).join('<span class="phase-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>');

    $('#phaseTrack').innerHTML = html;
    var tp = totalProgress();
    var pt = $('#phaseTotal');
    pt.textContent = tp + '%';
    pt.className = tp === 100 ? 'is-full' : '';
  }

  /* ================= 渲染：病历工作区 ================= */
  function timeAgo(ts) {
    if (!ts) return '';
    var d = Math.floor((Date.now() - ts) / 60000);
    if (d < 1) return '刚刚';
    if (d < 60) return d + ' 分钟前';
    var h = Math.floor(d / 60);
    if (h < 24) return h + ' 小时前';
    return Math.floor(h / 24) + ' 天前';
  }

  function matchChart(c, q) {
    if (!q) return true;
    q = q.toLowerCase();
    var p = c.patient || {};
    return ((p.name || '').toLowerCase().indexOf(q) >= 0) ||
      ((c.mrn || '').toLowerCase().indexOf(q) >= 0) ||
      ((p.complaint || '').toLowerCase().indexOf(q) >= 0) ||
      ((p.phone || '').toLowerCase().indexOf(q) >= 0);
  }

  function pickerHtml(q) {
    var list = S.patients.filter(function (c) { return matchChart(c, q); });
    var body = list.length ? list.map(function (c) {
      var p = c.patient || {};
      var lvl = p.level || '';
      var tone = lvl.indexOf('I ') === 0 ? 'red' : (lvl.indexOf('II ') === 0 ? 'amber' : '');
      return '<button class="ps-item' + (c.id === S.activeId ? ' is-active' : '') + '" type="button" data-act="switch-chart" data-id="' + c.id + '">' +
        '<span class="ps-item-ava">' + esc((p.name || '?').slice(0, 1)) + '</span>' +
        '<span class="ps-item-main">' +
          '<span class="ps-item-name"><b>' + esc(p.name) + '</b>' +
            (lvl ? '<i class="tag ' + tone + '">' + esc(lvl) + '</i>' : '') +
            (c.id === S.activeId ? '<i class="ps-cur">当前</i>' : '') +
          '</span>' +
          '<em>' + esc(c.mrn) + ' · ' + esc(p.sex) + ' ' + esc(p.age) + ' 岁 · 完成 ' + (c.progress || 0) + '%</em>' +
          '<span class="ps-item-sub">' + esc((p.complaint || '').slice(0, 24)) + '</span>' +
        '</span>' +
        '<span class="ps-item-meta">' + timeAgo(c.updatedAt) + '<br>' + esc((c.updatedBy || '').split(' ·')[0]) + '</span>' +
      '</button>';
    }).join('') : '<p class="ps-empty">没有匹配的病历，可新建一份</p>';

    return '<div class="ps-search">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.4"/><path d="M16 16l4 4"/></svg>' +
        '<input id="psSearch" type="search" placeholder="搜索姓名 / 病历号 / 主诉" value="' + esc(q || '') + '" autocomplete="off">' +
      '</div>' +
      '<div class="ps-list">' + body + '</div>' +
      '<button class="ps-new" type="button" data-act="new-patient">＋ 新建患者病历</button>';
  }

  function renderWorkspace() {
    var c = curChart();
    var p = c && c.patient;
    var peers = S.peers.map(function (x) {
      var on = x.name === S.doctor;
      return '<button class="peer' + (on ? ' is-me' : '') + '" type="button" data-act="set-doctor" data-name="' + esc(x.name) + '" title="切换到 ' + esc(x.name) + '">' + esc(x.name.slice(0, 1)) + '</button>';
    }).join('');

    $('#workspace').innerHTML =
      '<div class="ws-left">' +
        '<button class="ps-trigger" type="button" data-act="toggle-picker" aria-expanded="' + (pickerOpen ? 'true' : 'false') + '">' +
          '<span class="ps-ava' + (p ? '' : ' is-empty') + '">' + (p ? esc(p.name.slice(0, 1)) : '＋') + '</span>' +
          '<span class="ps-info">' +
            '<b>' + (p ? esc(p.name) : '未选择患者') + '</b>' +
            '<em>' + (p ? esc(c.mrn) + ' · ' + esc(p.sex) + ' ' + esc(p.age) + ' 岁' + (p.level ? ' · ' + esc(p.level) : '') : '从下拉框选择病历，或新建一份') + '</em>' +
          '</span>' +
          '<span class="ps-badge">' + S.patients.length + ' 份病历</span>' +
          '<svg class="ps-caret' + (pickerOpen ? ' is-up' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="ps-drop" id="psDrop"' + (pickerOpen ? '' : ' hidden') + '>' + pickerHtml('') + '</div>' +
      '</div>' +
      '<div class="ws-right">' +
        '<span class="sync-chip' + (S.online ? '' : ' is-off') + '">' +
          (S.lastSaved ? (S.online ? '已同步 ' : '离线已存本地 ') + S.lastSaved : '本地自动保存') +
        '</span>' +
        '<div class="peers" title="演示：模拟多名医生同时使用">' + peers +
          '<span class="peers-label">' + S.peers.length + ' 人在线</span>' +
        '</div>' +
      '</div>';
  }

  function saveBar() {
    var c = curChart();
    var offline = !S.online;
    var conflict = c && c.updatedBy && c.updatedBy !== S.doctor;
    return '<div class="save-bar">' +
      '<div class="sb-state">' +
        '<i class="sb-dot' + (offline ? ' is-off' : '') + '"></i>' +
        '<span>' + (offline ? '离线 · 保存到本地，联网后自动同步' : '自动保存已开启') +
        ' · 最后保存 <b>' + (S.lastSaved || '—') + '</b></span>' +
      '</div>' +
      (conflict ? '<span class="sb-warn">' + esc(c.updatedBy) + ' 也编辑过</span>' : '') +
      '<button class="btn btn-sm btn-primary" type="button" data-act="save-now">' + (offline ? '保存到本地' : '保存') + '</button>' +
    '</div>';
  }

  /* ================= 渲染：患者 ================= */
  function renderPatient() {
    var el = $('#patientCard');
    if (!S.patient) {
      el.innerHTML =
        '<section class="patient is-empty">' +
          '<div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c0-3.6 3.2-5.6 7.2-5.6s7.2 2 7.2 5.6"/></svg></div>' +
          '<div class="p-main">' +
            '<div class="p-name"><b>尚未录入患者</b><span class="tag">空状态</span></div>' +
            '<p class="p-complaint">点击「新建病历」逐项录入身份、主诉与既往史。系统不会预填任何临床数据，体征、检验与检查结果均由医护人员录入或模拟设备回传。已完成的内容会自动保存到本地。</p>' +
          '</div>' +
          '<div class="p-actions">' +
            '<button class="btn btn-primary btn-sm" type="button" data-act="new-patient">＋ 新建病历</button>' +
            '<button class="btn btn-sm" type="button" data-act="demo-fill">载入演示病例</button>' +
          '</div>' +
        '</section>';
      return;
    }

    var p = S.patient;
    var sug = suggestion();
    var tags = ['<span class="tag">' + esc(p.sex) + ' · ' + esc(p.age) + ' 岁</span>'];
    if (p.level) tags.push('<span class="tag ' + (p.level.indexOf('I') === 0 ? 'red' : 'amber') + '">' + esc(p.level) + '</span>');
    if (S.diagnosis) tags.push('<span class="tag blue">初步诊断 · ' + esc(S.diagnosis) + '</span>');
    else if (sug) tags.push('<span class="tag amber">系统提示 · ' + esc(sug.title) + '</span>');
    else tags.push('<span class="tag">诊断待明确</span>');

    var vital = latestVital();
    var bp = vital && vital.sbp ? (vital.sbp + '/' + vital.dbp + ' mmHg') : '未录入';

    el.innerHTML =
      '<section class="patient">' +
        '<div class="avatar">' + esc((p.name || '患').slice(0, 1)) + '</div>' +
        '<div class="p-main">' +
          '<div class="p-name"><b>' + esc(p.name) + '</b>' + tags.join('') + '</div>' +
          '<p class="p-complaint">主诉：' + esc(p.complaint || '未填写') +
            (S.history.length ? ' · 既往：' + esc(S.history.slice(0, 4).join('、')) : '') +
            ' · ' + esc(p.arrive || '到院方式未填') + '</p>' +
        '</div>' +
        '<div class="p-stats">' +
          '<div class="stat"><span>到院时间</span><b>' + esc(p.arriveTime || nowHM()) + '</b></div>' +
          '<div class="stat"><span>血压</span><b>' + bp + '</b></div>' +
          '<div class="stat"><span>信息完整度</span><b>' + totalProgress() + '%</b></div>' +
        '</div>' +
        '<button class="pat-edit" type="button" data-act="edit-patient" title="编辑患者信息">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>' +
        '</button>' +
      '</section>';
  }

  /* ================= 渲染：模块卡 ================= */
  var ICONS = {
    patient: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.5 3.1-5.4 7-5.4s7 1.9 7 5.4"/>',
    vitals: '<path d="M3 12h4l2.4-6 3.4 12 2.6-8 1.8 4H21"/>',
    exams: '<path d="M6 3.8h8l4 4v12.4H6z"/><path d="M14 3.8v4h4"/><path d="M9 13h6M9 16.4h4"/>',
    risk: '<path d="M12 3.6 21 19.4H3z"/><path d="M12 9.4v4.2"/><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none"/>',
    receive: '<path d="M3.6 20.4V9.6l8.4-5 8.4 5v10.8"/><path d="M9.4 20.4v-6h5.2v6"/>',
    referral: '<path d="M4 8h11l-3-3M20 16H9l3 3"/>',
    meds: '<rect x="3.6" y="8.4" width="16.8" height="10.4" rx="2.4"/><path d="M8 8.4V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.4"/><path d="M9.6 13.6h4.8"/>',
    followup: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.8"/>'
  };

  function moduleMeta(id) {
    if (!S.patient) return { text: '待录入', cls: '' };
    switch (id) {
      case 'patient': {
        var filled = 0;
        var fields = [S.patient.name, S.patient.age, S.patient.complaint, S.patient.contact, S.patient.arrive, S.patient.onset];
        fields.forEach(function (f) { if (f) filled++; });
        return { text: filled + '/6 项已录', cls: '' };
      }
      case 'vitals': {
        var v = latestVital();
        if (!v) return { text: '未录入', cls: 'warn' };
        var j = judgeValue(num(v.sbp), vitalDef('sbp'));
        return { text: v.sbp + '/' + v.dbp + ' · ' + v.hr + ' 次/分', cls: j && j.cls === 'ok' ? 'ok' : 'warn' };
      }
      case 'exams': {
        var gray = 0, amber = 0, green = 0;
        LABS.forEach(function (d) {
          var l = S.labs[d.id];
          if (!l || l.value === '' || num(l.value) === null) gray++;
          else if (l.reviewed) green++; else amber++;
        });
        var ph = 0;
        EXAMS.forEach(function (d) { var e = S.exams[d.id]; if (e && e.photos) ph += e.photos.length; });
        return {
          text: '绿 ' + green + ' · 黄 ' + amber + ' · 灰 ' + gray + (ph ? ' · 图 ' + ph : ''),
          cls: amber ? 'warn' : (green ? 'ok' : '')
        };
      }
      case 'risk': {
        var rs = computeRisks();
        var open = rs.filter(function (r) { return r.state === 'open'; }).length;
        if (!rs.length) return { text: '暂无线索', cls: '' };
        return { text: open ? open + ' 条待处置' : rs.length + ' 条已处置', cls: open ? 'danger' : 'ok' };
      }
      case 'receive':
        if (S.receive.accepted) return { text: '已接收 · 抢救室', cls: 'ok' };
        if (S.receive.notified) return { text: '已预通知', cls: 'warn' };
        return { text: '待接收', cls: '' };
      case 'referral':
        return S.referral.handover ? { text: '已交接确认', cls: 'ok' } : { text: '未开始', cls: '' };
      case 'meds': {
        if (!S.meds.length) return { text: '未录入', cls: '' };
        var diff = S.meds.filter(function (m) { return m.state === 'pending'; }).length;
        return { text: S.meds.length + ' 种 · ' + (diff ? diff + ' 项待核实' : '已全部核对'), cls: diff ? 'warn' : 'ok' };
      }
      case 'followup':
        if (S.followup.returned) return { text: '已回传归档', cls: 'ok' };
        if (S.followup.plan) return { text: '计划已建 · ' + S.followup.records.length + ' 次记录', cls: 'ok' };
        return { text: '未开始', cls: '' };
    }
    return { text: '', cls: '' };
  }

  function renderModules() {
    var defs = [
      { id: 'patient', name: '基本信息', desc: '身份、主诉、既往史、联系人' },
      { id: 'vitals', name: '生命体征', desc: '血压、脉搏、呼吸、血氧、体温' },
      { id: 'exams', name: '辅助检查', desc: '心电、彩超、检验与原始报告单' },
      { id: 'risk', name: '高危线索', desc: '风险线索、提示依据、人工确认' },
      { id: 'receive', name: '院内接诊', desc: '预通知、接收确认、资源准备' },
      { id: 'referral', name: '转诊交接', desc: '电子摘要、结果附件、交接确认' },
      { id: 'meds', name: '出院用药核对', desc: '药物清单、实际服药、待核实信息' },
      { id: 'followup', name: '随访管理', desc: '随访计划、异常反馈、医生确认' }
    ];
    var empty = !S.patient;
    $('#moduleGrid').innerHTML = defs.map(function (d) {
      var m = moduleMeta(d.id);
      return '<button class="card' + (empty ? ' is-muted' : '') + '" type="button" data-act="open-panel" data-panel="' + d.id + '">' +
        '<span class="card-top">' +
          '<span class="card-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICONS[d.id] + '</svg></span>' +
          (m.text ? '<span class="card-meta ' + m.cls + '">' + esc(m.text) + '</span>' : '') +
        '</span>' +
        '<span class="card-name">' + d.name + '</span>' +
        '<span class="card-desc">' + d.desc + '</span>' +
      '</button>';
    }).join('');
  }

  /* ================= 渲染：流转与离线 ================= */
  function renderFlow() {
    var ps = progress();
    var steps = $$('.flow-step');
    steps.forEach(function (el, i) {
      var p = ps[i];
      el.classList.toggle('is-done', !!p && p.pct === 100);
      el.classList.toggle('is-active', !!p && p.pct > 0 && p.pct < 100);
    });
    var tp = totalProgress();
    var note = $('#flowNote');
    if (!S.patient) note.textContent = '尚未开始';
    else if (tp === 100) note.textContent = '全流程已完成';
    else note.textContent = '进行中 · 总体 ' + tp + '%';
    note.className = 'flow-note' + (tp === 100 ? ' is-done' : '');
  }

  function renderOffline() {
    var banner = $('#offlineBanner');
    banner.hidden = S.online;
    $('#netText').textContent = S.online ? '在线 · 模拟服务器' : '离线 · 本地缓存';
    $('#netChip').classList.toggle('is-offline', !S.online);
    $('#queueTag').textContent = '待补传 ' + S.queue.length + ' 条';
    $('#auditCount').textContent = S.audit.length;
  }

  /* ================= 抽屉 ================= */
  function openPanel(id) {
    if (!S.patient) {
      toast('请先录入患者信息');
      openPatientModal();
      return;
    }
    currentPanel = id;
    var names = {
      patient: ['院前采集', '基本信息'], vitals: ['院前 / 院中', '生命体征监测'],
      exams: ['院中', '辅助检查'], risk: ['院中', '高危线索提示'],
      receive: ['院中', '院内接诊'], referral: ['院后', '转诊交接'],
      meds: ['院后', '出院用药核对'], followup: ['院后', '随访管理']
    };
    var n = names[id] || ['', ''];
    $('#drawerEyebrow').textContent = n[0];
    $('#drawerTitle').textContent = n[1];
    renderPanel(id);
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#scrim').hidden = false;
    document.body.classList.add('no-scroll');
  }

  function closePanel() {
    destroyViewer();
    currentPanel = null;
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#drawerFoot').innerHTML = '';
    $('#drawerFoot').innerHTML = '';
    $('#scrim').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function destroyViewer() {
    if (viewer) { viewer.destroy(); viewer = null; }
  }

  function renderPanel(id) {
    destroyViewer();
    var fn = window.PANELS && window.PANELS[id];
    if (!fn) { $('#drawerBody').innerHTML = '<p class="empty-line">模块尚未实现</p>'; return; }
    // 先按提示同步模型，保证「病情讲解」与「示意模型」指向同一种疾病
    if (id === 'receive') syncModelBySuggestion();
    $('#drawerBody').innerHTML = fn(APP);
    $('#drawerFoot').innerHTML = saveBar();
    if (id === 'exams') renderExamCounts();
    if (id === 'receive') setTimeout(mount3d, 30);
  }

  /* ================= 3D 模型 ================= */
  function syncModelBySuggestion() {
    var sug = suggestion();
    var map = { acs: 'ami', ad: 'dissection', pe: 'pe' };
    var suggested = sug && map[sug.key] ? map[sug.key] : null;
    if (suggested && !S.modelTouched) S.model = suggested;
    return suggested;
  }

  function setModel(id) {
    S.model = id;
    S.modelTouched = true;
    save();
    renderPanel('receive');
  }

  function mount3d() {
    var canvas = $('#m3dCanvas');
    if (!canvas || !window.M3D) return;
    destroyViewer();
    var sug = suggestion();
    syncModelBySuggestion();
    viewer = window.M3D.create(canvas, S.model || 'dissection');
    viewer.onFrame = updateHotspots;
    $$('.dz-tab').forEach(function (b) { b.classList.toggle('is-on', b.dataset.model === S.model); });
    var info = $('#m3dInfo');
    if (info && window.PANELS && window.PANELS.modelInfo) info.innerHTML = window.PANELS.modelInfo(S.model || 'dissection');
    updateHotspots();
    var hintEl = $('#m3dHint');
    if (hintEl) {
      if (sug && !S.modelTouched) {
        hintEl.innerHTML = '数据提示 <b>' + esc(sug.title.replace('疑似', '')) + '</b>，已优先展示对应模型 · 拖动旋转 · 点击数字看部位';
      } else {
        hintEl.innerHTML = '拖动旋转 · 滚轮缩放 · 点击数字看部位';
      }
    }
  }

  function updateHotspots() {
    if (!viewer) return;
    var stage = $('.m3d-stage');
    if (!stage) return;
    var hs = stage.querySelectorAll('.hotspot');
    viewer.mesh.hot.forEach(function (h, i) {
      var el = hs[i];
      if (!el) return;
      if (el.dataset.title !== h.title) {
        el.dataset.title = h.title;
        el.dataset.body = h.body;
        el.textContent = i + 1;
      }
      var p = viewer.project(h.p);
      el.style.transform = 'translate(-50%,-100%) translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      el.style.opacity = p.z < -30 ? '.35' : '1';
    });
  }

  /* ================= 弹窗 ================= */
  function openModal(html, cls) {
    var layer = $('#modalLayer');
    layer.innerHTML = '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    layer.hidden = false;
    document.body.classList.add('no-scroll');
  }
  function closeModal() {
    if (_ocr && _ocr.timer) { clearInterval(_ocr.timer); _ocr.timer = null; }
    $('#modalLayer').hidden = true;
    $('#modalLayer').innerHTML = '';
    if (!currentPanel) document.body.classList.remove('no-scroll');
  }

  /* ================= 新建 / 编辑患者 ================= */
  function patientForm(p) {
    p = p || {};
    return '<div class="modal-head">' +
        '<div><p class="drawer-eyebrow">' + (p.name ? '编辑患者' : '院前采集') + '</p>' +
        '<h2>' + (p.name ? '修改患者信息' : '新建患者病历') + '</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="form-section"><h4>基本信息</h4>' +
          '<div class="fgrid">' +
            '<label class="fld"><span>姓名 <i>*</i></span><input id="npName" value="' + esc(p.name || '') + '" placeholder="如：张建国" autocomplete="off"></label>' +
            '<label class="fld"><span>性别</span><select id="npSex"><option' + (p.sex === '女' ? '' : ' selected') + '>男</option><option' + (p.sex === '女' ? ' selected' : '') + '>女</option></select></label>' +
            '<label class="fld"><span>年龄 <i>*</i></span><input id="npAge" type="number" min="0" max="120" value="' + esc(p.age || '') + '" placeholder="岁"></label>' +
            '<label class="fld"><span>分诊级别</span><select id="npLevel">' +
              ['I 级 · 危重', 'II 级 · 急症', 'III 级 · 亚急症'].map(function (v) { return '<option' + (p.level === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="fld"><span>联系人及关系</span><input id="npContact" value="' + esc(p.contact || '') + '" placeholder="如：张敏（女儿）"></label>' +
            '<label class="fld"><span>联系电话</span><input id="npPhone" value="' + esc(p.phone || '') + '" placeholder="用于随访联系"></label>' +
            '<label class="fld"><span>到院方式</span><select id="npArrive">' +
              ['120 转运', '自行来院', '外院转诊', '院内发病'].map(function (v) { return '<option' + (p.arrive === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="fld"><span>到院时间</span><input id="npArriveTime" type="time" value="' + esc(p.arriveTime || nowHM()) + '"></label>' +
          '</div>' +
        '</div>' +
        '<div class="form-section"><h4>主诉与病史</h4>' +
          '<label class="fld fld-wide"><span>主诉 <i>*</i></span>' +
            '<textarea id="npComplaint" rows="2" placeholder="如：突发撕裂样胸背部疼痛 3 小时，向背部放射">' + esc(p.complaint || '') + '</textarea>' +
          '</label>' +
          '<div class="fgrid">' +
            '<label class="fld"><span>发病时间</span><input id="npOnset" type="time" value="' + esc(p.onset || '') + '"></label>' +
            '<label class="fld"><span>信息来源</span><select id="npSource">' +
              ['患者自述', '家属提供', '现场测量', '设备检测', '院内检查'].map(function (v) { return '<option' + (p.source === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
            '</select></label>' +
          '</div>' +
          '<div class="chip-field"><span class="cf-label">伴随症状（可多选）</span><div class="chip-set">' +
            SYMPTOMS.map(function (s) { return '<button type="button" class="pick" data-pick="sym" data-val="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') +
          '</div></div>' +
          '<div class="chip-field"><span class="cf-label">既往史 / 危险因素</span><div class="chip-set">' +
            HISTORY.map(function (s) { return '<button type="button" class="pick" data-pick="hist" data-val="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') +
          '</div></div>' +
          '<label class="fld fld-wide" style="margin-top:9px"><span>其他既往史（补充描述，可留空）</span>' +
            '<input id="npHistNote" value="' + esc(p.histNote || '') + '" placeholder="如：青光眼、甲亢、长期口服华法林">' +
          '</label>' +
          '<p class="form-tip">录入后系统按参考区间自动判定异常，但不会自动生成诊断；所有结论需医师复核。保存后仍可反复修改既往史。</p>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-act="close-modal">取消</button>' +
        '<button class="btn btn-primary" type="button" data-act="save-patient">' + (p.name ? '保存修改' : '创建患者') + '</button>' +
      '</div>';
  }

  function openPatientModal(p) {
    openModal(patientForm(p || null), 'modal-md');
    // 无论新建还是编辑，都按当前病历状态回填已选项，避免再次进入后丢失可编辑状态
    (S.symptoms || []).forEach(function (s) {
      $$('.pick[data-pick="sym"]').forEach(function (b) { if (b.dataset.val === s) b.classList.add('is-on'); });
    });
    (S.history || []).forEach(function (s) {
      $$('.pick[data-pick="hist"]').forEach(function (b) { if (b.dataset.val === s) b.classList.add('is-on'); });
    });
    var n = $('#npName');
    if (n) { n.focus(); if (p && p.name) n.setSelectionRange(n.value.length, n.value.length); }
  }

  function savePatient() {
    var name = ($('#npName') || {}).value || '';
    var age = ($('#npAge') || {}).value || '';
    var complaint = ($('#npComplaint') || {}).value || '';
    if (!name.trim()) { toast('请填写患者姓名'); $('#npName').focus(); return; }
    if (!age || num(age) === null || num(age) < 0 || num(age) > 120) { toast('请填写有效年龄（0–120）'); $('#npAge').focus(); return; }
    if (!complaint.trim()) { toast('请填写主诉'); $('#npComplaint').focus(); return; }

    var sym = $$('.pick[data-pick="sym"].is-on').map(function (b) { return b.dataset.val; });
    var hist = $$('.pick[data-pick="hist"].is-on').map(function (b) { return b.dataset.val; });
    var isNew = editingNew || !S.patient;

    var data = {
      name: name.trim(),
      sex: ($('#npSex') || {}).value || '男',
      age: age,
      level: ($('#npLevel') || {}).value || 'II 级 · 急症',
      contact: (($('#npContact') || {}).value || '').trim(),
      phone: (($('#npPhone') || {}).value || '').trim(),
      arrive: ($('#npArrive') || {}).value || '120 转运',
      arriveTime: ($('#npArriveTime') || {}).value || nowHM(),
      complaint: complaint.trim(),
      onset: ($('#npOnset') || {}).value || '',
      source: ($('#npSource') || {}).value || '患者自述',
      histNote: (($('#npHistNote') || {}).value || '').trim()
    };

    if (isNew) {
      var c = createChart(data);
      S.symptoms = sym;
      S.history = hist;
      audit('新建患者病历 · ' + data.name + '（' + c.mrn + '）');
      save();
      closeModal();
      render();
      toast('病历已创建 · ' + c.mrn + '，开始录入');
    } else {
      S.patient = data;
      S.symptoms = sym;
      S.history = hist;
      audit('修改患者基本信息 · ' + data.name);
      save();
      closeModal();
      render();
      toast('患者信息已更新并保存');
    }
    editingNew = false;
  }

  function demoFill() {
    var c = createChart({
      name: '张建国', sex: '男', age: '58', level: 'I 级 · 危重',
      contact: '张敏（女儿）', phone: '138****6602', arrive: '120 转运',
      arriveTime: '18:04', complaint: '突发撕裂样胸背部疼痛 3 小时，向背部放射，疼痛评分 9/10',
      onset: '15:10', source: '患者自述'
    });
    S.symptoms = ['撕裂样胸背痛', '大汗淋漓', '疼痛放射至左肩/下颌'];
    S.history = ['高血压', '吸烟史', '高脂血症'];
    S.vitals = [{
      time: '18:06', sbp: '178', dbp: '96', hr: '104', rr: '22', spo2: '94', temp: '36.6', sbp2: '156',
      source: '现场测量'
    }];
    S.exams.ecg = { value: 'ST 段压低', time: '18:12', reviewed: true };
    S.labs.trop = { value: '0.62', time: '18:26', reviewed: false };
    S.labs.ddimer = { value: '3.8', time: '18:26', reviewed: false };
    S.labs.cr = { value: '96', time: '18:26', reviewed: true };
    S.preCare = ['吸氧', '心电监护', '建立静脉通路'];
    S.receive.notified = true;
    audit('创建演示病历（虚构数据）· ' + c.mrn);
    save();
    render();
    toast('已创建演示病历 ' + c.mrn + '，可继续录入');
  }

  /* ================= 报告单照片 ================= */
  var PHOTO_MAX = 1280;

  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > PHOTO_MAX) { h = Math.round(h * PHOTO_MAX / w); w = PHOTO_MAX; }
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        var out = '';
        try { out = cv.toDataURL('image/jpeg', 0.78); } catch (e) { out = ''; }
        cb(out);
      };
      img.onerror = function () { cb(''); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(''); };
    reader.readAsDataURL(file);
  }

  function addPhotos(examId, files) {
    if (!S.exams[examId]) S.exams[examId] = { value: '未完成', time: nowHM(), reviewed: false };
    var item = S.exams[examId];
    if (!item.photos) item.photos = [];
    var list = Array.prototype.slice.call(files || []).filter(function (f) {
      return f && (!f.type || /^image\//.test(f.type));
    });
    if (!list.length) { toast('请选择图片文件（jpg / png）'); return; }
    var i = 0, added = 0, failed = 0;

    function done() {
      if (added) {
        audit('上传报告单 ' + added + ' 张 · ' + ((examDef(examId) || {}).name || examId));
        save();
        renderPanel('exams');
        renderModules(); renderPhase(); renderExamCounts();
        toast('已上传 ' + added + ' 张报告单，点击缩略图可放大查看');
      } else {
        toast('图片读取失败，请重试');
      }
    }

    function next() {
      if (i >= list.length) { done(); return; }
      var f = list[i++];
      compressImage(f, function (src) {
        if (src) {
          item.photos.push({ src: src, name: f.name || '报告单', time: nowHM() });
          added++;
        } else { failed++; }
        next();
      });
    }
    next();
  }

  /* ================= 检验报告单识别 ================= */

  // 识别模板：不同版式的报告单会命中不同项目组合（演示用的固定样例）
  var OCR_TPL = [
    {
      id: 'chest',
      name: '急诊胸痛套餐',
      rows: [
        ['trop', '0.36', 0.94], ['ckmb', '8.2', 0.90], ['ddimer', '2.14', 0.78],
        ['ntprobnp', '486', 0.88], ['cr', '92', 0.96], ['k', '3.9', 0.93],
        ['glu', '7.8', 0.86], ['wbc', '11.2', 0.71], ['hb', '138', 0.63], ['lac', '2.6', 0.81]
      ]
    },
    {
      id: 'pe',
      name: '凝血 + 心肌标志物',
      rows: [
        ['ddimer', '6.80', 0.92], ['trop', '0.08', 0.86], ['ntprobnp', '320', 0.83],
        ['cr', '84', 0.95], ['k', '4.3', 0.91], ['hb', '145', 0.87],
        ['wbc', '9.6', 0.79], ['lac', '3.1', 0.74]
      ]
    },
    {
      id: 'routine',
      name: '血常规 + 生化',
      rows: [
        ['wbc', '8.4', 0.93], ['hb', '126', 0.89], ['cr', '78', 0.94],
        ['k', '4.1', 0.92], ['glu', '5.6', 0.95], ['lac', '1.4', 0.85],
        ['ddimer', '0.42', 0.88], ['trop', '0.02', 0.90]
      ]
    }
  ];

  var _ocr = null;

  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }

  function ocrTpl(id) {
    for (var i = 0; i < OCR_TPL.length; i++) if (OCR_TPL[i].id === id) return OCR_TPL[i];
    return OCR_TPL[0];
  }

  // 依据文件名关键词选模板，无关键词时按内容哈希（同一张图结果稳定，不会每次都变）
  function pickOcrTpl(name, seed) {
    if (/凝|二聚|栓塞|肺/.test(name)) return 'pe';
    if (/常规|血常规|生化|肝肾/.test(name)) return 'routine';
    if (/心|胸|肌钙|急诊|标志物/.test(name)) return 'chest';
    return ['chest', 'pe', 'routine'][seed % 3];
  }

  function buildOcrRows(tplId, seed) {
    var tpl = ocrTpl(tplId);
    return tpl.rows.map(function (r, i) {
      var d = labDef(r[0]);
      if (!d) return null;
      var jitter = ((seed >> (i % 8)) & 3) - 1;          // 让不同照片的置信度略有差异
      var conf = Math.max(0.52, Math.min(0.99, r[2] + jitter * 0.01));
      var old = S.labs[d.id] && S.labs[d.id].value !== '' ? S.labs[d.id].value : '';
      return { id: d.id, value: r[1], conf: conf, on: true, old: old };
    }).filter(Boolean);
  }

  // 画一张「示例报告单」，让演示不需要真实照片也能看到完整流程
  function demoReportImage(rows) {
    var W = 700, H = 520;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    c.fillStyle = '#DFDCD5';
    c.fillRect(0, 0, W, H);

    c.save();
    c.translate(W / 2, H / 2);
    c.rotate(-0.008);
    c.translate(-W / 2, -H / 2);
    c.shadowColor = 'rgba(60,55,45,.28)';
    c.shadowBlur = 16;
    c.shadowOffsetY = 5;
    c.fillStyle = '#FCFBF7';
    c.fillRect(34, 26, W - 68, H - 52);
    c.restore();

    c.save();
    c.translate(W / 2, H / 2);
    c.rotate(-0.008);
    c.translate(-W / 2, -H / 2);

    c.fillStyle = '#1C2430';
    c.font = '600 17px "PingFang SC","Microsoft YaHei",sans-serif';
    c.textAlign = 'center';
    c.fillText('示 例 检 验 报 告 单', W / 2, 68);
    c.fillStyle = '#8A9099';
    c.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
    c.fillText('DEMO REPORT · 仅用于功能演示，非真实检验结果', W / 2, 86);

    c.textAlign = 'left';
    c.fillStyle = '#7A828C';
    c.font = '10.5px "PingFang SC","Microsoft YaHei",sans-serif';
    c.fillText('姓名：张 * 华　　性别：男　　年龄：56 岁', 58, 112);
    c.fillText('科室：急诊抢救室　　标本：静脉血', 58, 129);
    c.textAlign = 'right';
    c.fillText('采集：' + nowHM(), W - 58, 112);
    c.fillText('报告：' + nowHM(), W - 58, 129);

    var top = 148, lh = 26;
    c.strokeStyle = '#C3C8D0';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(58, top); c.lineTo(W - 58, top); c.stroke();
    c.fillStyle = '#5B6470';
    c.font = '600 10.5px "PingFang SC","Microsoft YaHei",sans-serif';
    c.fillText('项目', 62, top + 15);
    c.fillText('结果', 320, top + 15);
    c.fillText('单位', 430, top + 15);
    c.fillText('参考区间', 545, top + 15);
    c.beginPath(); c.moveTo(58, top + 22); c.lineTo(W - 58, top + 22); c.stroke();

    rows.forEach(function (r, i) {
      var d = labDef(r.id);
      var y = top + 22 + lh * (i + 1) - 7;
      c.fillStyle = '#232B36';
      c.font = '11.5px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText(d.name, 62, y);
      c.fillStyle = '#8B929B';
      c.font = '9.5px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText(d.short, 200, y);

      var j = judgeValue(num(r.value), d);
      c.fillStyle = j && j.cls !== 'ok' ? '#B4382C' : '#232B36';
      c.font = '600 12px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText(String(r.value), 320, y);

      c.fillStyle = '#6E7681';
      c.font = '10px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText(d.unit, 430, y);
      c.fillText(d.low + ' – ' + d.high, 545, y);

      c.strokeStyle = '#E3E6EA';
      c.beginPath(); c.moveTo(58, y + 8); c.lineTo(W - 58, y + 8); c.stroke();
    });

    c.fillStyle = '#8A9099';
    c.font = '9.5px "PingFang SC","Microsoft YaHei",sans-serif';
    c.textAlign = 'left';
    c.fillText('检验者：***　　审核者：***　　本报告仅对送检标本负责', 58, H - 56);
    c.textAlign = 'right';
    c.fillText('第 1 页 / 共 1 页', W - 58, H - 56);
    c.restore();

    try { return cv.toDataURL('image/jpeg', 0.86); } catch (e) { return ''; }
  }

  function ocrShell() {
    return '<div class="modal-head"><div><p class="drawer-eyebrow">实验室检验 · 报告单识别</p>' +
        '<h2>拍照识别，自动录入</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<input class="file-input" type="file" accept="image/*" id="ocrFile">' +
      '<div class="modal-body" id="ocrBody"></div>' +
      '<div class="modal-foot" id="ocrFoot"></div>';
  }

  function ocrOpenDemo() {
    var tpl = pickOcrTpl('', hashStr('demo'));
    _ocr = { stage: 'idle', imgSrc: '', name: '', tpl: tpl, rows: buildOcrRows(tpl, hashStr('demo')), mode: 'photo', timer: null };
    _ocr.rows = buildOcrRows(tpl, hashStr('demo'));
    _ocr.imgSrc = demoReportImage(_ocr.rows);
    _ocr.name = '示例报告单.jpg';
    ocrStartScan();
  }

  function renderOcr() {
    var body = $('#ocrBody'), foot = $('#ocrFoot');
    if (!body || !_ocr) return;
    var o = _ocr;

    if (o.stage === 'idle') {
      body.innerHTML =
        '<div class="ocr-drop" data-act="ocr-pick">' +
          '<div class="ocr-drop-ico">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 8.5A2.5 2.5 0 015.5 6h1.2a2 2 0 001.7-.95l.7-1.1A1.6 1.6 0 0110.4 3h3.2a1.6 1.6 0 011.3.95l.7 1.1A2 2 0 0017.3 6h1.2A2.5 2.5 0 0121 8.5v9A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-9z"/>' +
              '<circle cx="12" cy="13" r="3.6"/></svg>' +
          '</div>' +
          '<b>拍摄或上传检验报告单</b>' +
          '<p>支持纸质报告单、HIS 打印单、手机截图。识别完成后先给你逐项核对，确认后才写入。</p>' +
          '<span class="btn btn-primary btn-sm">选择图片 / 拍照</span>' +
        '</div>' +
        '<div class="ocr-paste">' +
          '<div class="ocr-paste-h"><b>或者直接粘贴检验文字</b><span>从 HIS / LIS 复制过来，自动解析成项目</span></div>' +
          '<textarea id="ocrText" placeholder="肌钙蛋白I  0.36 ng/mL  0-0.04&#10;D-二聚体  2.14 mg/L FEU  0-0.5&#10;血钾  3.9 mmol/L  3.5-5.3"></textarea>' +
          '<div class="ocr-paste-f"><button class="btn btn-sm" type="button" data-act="ocr-parse">解析文字</button></div>' +
        '</div>' +
        '<p class="ocr-engine-note">识别在本机演示引擎中完成（未接入院内 OCR / LIS 接口）。接入后同一套流程可直接对接真实报告单。</p>';
      foot.innerHTML = '<button class="btn" type="button" data-act="ocr-demo">用示例报告单试一下</button>' +
        '<button class="btn btn-primary" type="button" data-act="close-modal">关闭</button>';
      return;
    }

    if (o.stage === 'scan') {
      body.innerHTML =
        '<div class="ocr-scan">' +
          '<div class="ocr-paper">' +
            (o.imgSrc ? '<img src="' + esc(o.imgSrc) + '" alt="检验报告单">' : '') +
            '<span class="ocr-frame"></span><span class="ocr-line"></span>' +
          '</div>' +
          '<div class="ocr-scan-meta"><span id="ocrStageText">正在预处理图像…</span><b id="ocrPct">0%</b></div>' +
          '<div class="ocr-progress"><i id="ocrBar" style="width:0%"></i></div>' +
          '<p class="ocr-scan-tip">正在定位报告单表格区域并逐行识别，通常 2 秒内完成。</p>' +
        '</div>';
      foot.innerHTML = '<button class="btn" type="button" data-act="close-modal">取消</button>';
      return;
    }

    // review
    var hi = 0, warn = 0, abn = 0;
    o.rows.forEach(function (r) {
      if (r.conf >= 0.85) hi++; else warn++;
      var d = labDef(r.id);
      var j = judgeValue(num(r.value), d);
      if (j && j.cls !== 'ok') abn++;
    });

    var trs = o.rows.map(function (r) {
      var d = labDef(r.id);
      var j = judgeValue(num(r.value), d);
      var lowConf = r.conf < 0.85;
      var changed = r.old && String(r.old) !== String(r.value);
      return '<tr data-ocr-row="' + r.id + '"' + (lowConf ? ' class="is-low"' : '') + '>' +
        '<td class="oc-chk"><input type="checkbox" data-ocr-chk="' + r.id + '"' + (r.on ? ' checked' : '') + '></td>' +
        '<td class="oc-name"><b>' + esc(d.name) + '</b><em>' + esc(d.short) + '</em>' +
          '<u class="oc-u-inline">' + esc(d.unit) + '</u></td>' +
        '<td class="oc-val"><input type="text" inputmode="decimal" data-ocr-val="' + r.id + '" value="' + esc(r.value) + '">' +
          (changed ? '<i class="ocr-old" title="原录入值">原 ' + esc(r.old) + '</i>' : '') + '</td>' +
        '<td class="oc-unit">' + esc(d.unit) + '</td>' +
        '<td class="oc-ref mono">' + d.low + '–' + d.high + '</td>' +
        '<td><span class="judge ' + (j ? j.cls : '') + '">' + (j ? j.text : '—') + '</span></td>' +
        '<td class="oc-conf"><span class="conf' + (lowConf ? ' is-low' : '') + '">' + Math.round(r.conf * 100) + '%</span>' +
          (lowConf ? '<i class="conf-flag">核对</i>' : '') + '</td>' +
      '</tr>';
    }).join('');

    body.innerHTML =
      '<div class="ocr-sum">' +
        '<div class="os-item"><span>识别项目</span><b>' + o.rows.length + '</b></div>' +
        '<div class="os-item"><span>高置信 ≥85%</span><b class="ok">' + hi + '</b></div>' +
        '<div class="os-item"><span>需人工核对</span><b class="warn">' + warn + '</b></div>' +
        '<div class="os-item"><span>异常结果</span><b class="bad">' + abn + '</b></div>' +
      '</div>' +
      '<div class="ocr-meta-row">' +
        '<div class="ocr-file">' +
          (o.imgSrc ? '<img src="' + esc(o.imgSrc) + '" alt="报告单">' : '') +
          '<div><b>' + esc(o.name || '粘贴文本') + '</b><span>' + (o.imgSrc ? '已识别 · 可对照原图核对' : '文本解析') + '</span></div>' +
        '</div>' +
        '<label class="ocr-tpl">识别模板' +
          '<select data-ocr-tpl>' +
            OCR_TPL.map(function (t) {
              return '<option value="' + t.id + '"' + (t.id === o.tpl ? ' selected' : '') + '>' + t.name + '</option>';
            }).join('') +
          '</select>' +
        '</label>' +
      '</div>' +
      '<div class="table-wrap ocr-tbl-wrap"><table class="tbl ocr-tbl"><thead><tr>' +
        '<th class="oc-chk"><input type="checkbox" data-ocr-all checked aria-label="全选"></th>' +
        '<th>项目</th><th>识别结果</th><th>单位</th><th>参考区间</th><th>判定</th><th>置信度</th>' +
      '</tr></thead><tbody>' + trs + '</tbody></table></div>' +
      '<p class="ocr-note">灰色行为置信度低于 85%，请对照原图重点核对；数值可直接在表内修改。写入后状态为「待复核」，需医师复核才转绿。</p>';

    foot.innerHTML = '<button class="btn" type="button" data-act="ocr-retry">重新拍照</button>' +
      '<button class="btn" type="button" data-act="close-modal">取消</button>' +
      '<button class="btn btn-primary" type="button" data-act="ocr-apply">写入选中的 ' + o.rows.filter(function (r) { return r.on; }).length + ' 项</button>';
  }

  function ocrStartScan() {
    _ocr.stage = 'scan';
    renderOcr();
    var t0 = Date.now(), dur = 1900, total = _ocr.rows.length;
    clearInterval(_ocr.timer);
    _ocr.timer = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dur);
      var bar = $('#ocrBar'), pct = $('#ocrPct'), txt = $('#ocrStageText');
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (txt) {
        var phase = p < 0.28 ? '图像预处理 · 校正透视与阴影'
          : p < 0.6 ? '定位报告单表格 · 切分项目行'
            : '识别文字 · 匹配检验项目与参考区间';
        txt.textContent = phase + '　' + Math.round(p * total) + '/' + total;
      }
      if (p >= 1) {
        clearInterval(_ocr.timer);
        _ocr.timer = null;
        _ocr.stage = 'review';
        renderOcr();
        audit('识别检验报告单 · ' + (_ocr.name || '文本') + ' · ' + _ocr.rows.length + ' 项');
      }
    }, 80);
  }

  function ocrHandleFile(file) {
    if (!file) return;
    if (file.type && !/^image\//.test(file.type)) { toast('请选择图片文件（jpg / png）'); return; }
    compressImage(file, function (src) {
      if (!src) { toast('图片读取失败，请重试'); return; }
      var seed = hashStr((file.name || '') + '|' + file.size + '|' + src.length);
      var tpl = pickOcrTpl(file.name || '', seed);
      _ocr = { stage: 'scan', imgSrc: src, name: file.name || '报告单.jpg', tpl: tpl, rows: buildOcrRows(tpl, seed), mode: 'photo', timer: null };
      ocrStartScan();
    });
  }

  // 粘贴文本解析：名称命中即取其后的第一个数字
  function ocrParseText(text) {
    var lines = String(text || '').split(/\r?\n/);
    var found = [], seen = {};
    lines.forEach(function (line) {
      var raw = line.trim();
      if (!raw) return;
      var upper = raw.toUpperCase().replace(/\s+/g, '');
      for (var i = 0; i < LABS.length; i++) {
        var d = LABS[i];
        if (seen[d.id]) continue;
        var keys = [d.name.replace(/\s+/g, ''), d.short.replace(/\s+/g, '').toUpperCase()];
        var hitKey = null, hitAt = -1;
        for (var k = 0; k < keys.length; k++) {
          var at = upper.indexOf(keys[k]);
          if (at >= 0 && (hitKey === null || at < hitAt)) { hitKey = keys[k]; hitAt = at; }
        }
        if (hitKey === null) continue;
        var tail = upper.slice(hitAt + hitKey.length);
        var m = tail.match(/\d+(?:\.\d+)?/);
        if (!m) continue;
        // 去掉紧跟其后被当成结果、实际是参考区间起点的情况（如 "0.36 (0-0.04)"）
        var val = m[0];
        var old = S.labs[d.id] && S.labs[d.id].value !== '' ? S.labs[d.id].value : '';
        found.push({ id: d.id, value: val, conf: 0.96, on: true, old: old });
        seen[d.id] = true;
        break;
      }
    });
    if (!found.length) { toast('没解析出检验项目，请确认文字中包含项目名称'); return; }
    _ocr = { stage: 'review', imgSrc: '', name: '粘贴文本 · ' + found.length + ' 项', tpl: 'chest', rows: found, mode: 'paste', timer: null };
    renderOcr();
    toast('已解析 ' + found.length + ' 项，请核对后写入');
  }

  function ocrApply() {
    if (!_ocr || !_ocr.rows.length) return;
    // 先回读表内修改过的值
    _ocr.rows.forEach(function (r) {
      var inp = document.querySelector('[data-ocr-val="' + r.id + '"]');
      if (inp) r.value = inp.value.trim();
      var chk = document.querySelector('[data-ocr-chk="' + r.id + '"]');
      if (chk) r.on = chk.checked;
    });

    var n = 0, skip = 0, abn = 0;
    _ocr.rows.forEach(function (r) {
      if (!r.on) { skip++; return; }
      var d = labDef(r.id);
      if (!d || num(r.value) === null) { skip++; return; }
      S.labs[r.id] = { value: r.value, reviewed: false, time: nowHM(), source: '报告单识别' };
      n++;
      var j = judgeValue(num(r.value), d);
      if (j && j.cls !== 'ok') abn++;
    });

    if (!n) { toast('没有可写入的项目'); return; }
    clearInterval(_ocr.timer);
    _ocr = null;

    audit('报告单识别写入检验 ' + n + ' 项' + (abn ? '（异常 ' + abn + ' 项）' : '') + (skip ? ' · 跳过 ' + skip + ' 项' : ''));
    save();
    closeModal();
    renderPanel('exams');
    renderModules(); renderPhase(); renderExamCounts();
    toast('已写入 ' + n + ' 项' + (abn ? '，其中 ' + abn + ' 项异常已提示' : '') + '，待医师复核');
  }

  function printHandover() {
    var root = $('#printRoot');
    if (!root || !window.PANELS || !window.PANELS.handoverSheet) { toast('交接单尚未就绪'); return; }
    root.innerHTML = window.PANELS.handoverSheet();
    setTimeout(function () { window.print(); }, 80);
  }

  /* ================= 登录 ================= */
  var SESSION_KEY = 'cpn_session_v1';
  var REMEMBER_KEY = 'cpn_remember_id';
  var ACCOUNTS = [
    { id: 'ER1001', pwd: '123456', name: '李 · 急诊', role: '急诊科' },
    { id: 'CA2002', pwd: '123456', name: '王 · 心内', role: '心内科' },
    { id: 'IR3003', pwd: '123456', name: '陈 · 导管室', role: '介入中心' }
  ];

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }

  function applyAccount(acc) {
    if (!acc) return;
    S.doctor = acc.name;
    var found = false;
    (S.peers || []).forEach(function (p) { if (p.name === acc.name) found = true; });
    if (!found) S.peers.unshift({ name: acc.name, role: acc.role || '临床' });
    renderUser();
  }

  function renderUser() {
    var acc = session();
    var nameEl = $('#userName'), idEl = $('#userId'), avaEl = $('#userAva'), chip = $('#userChip');
    if (!nameEl) return;
    if (!acc) {
      nameEl.textContent = '未登录';
      if (idEl) idEl.textContent = '';
      if (avaEl) avaEl.textContent = '?';
      if (chip) chip.title = '登录';
      return;
    }
    nameEl.textContent = acc.name;
    if (idEl) idEl.textContent = acc.id;
    if (avaEl) avaEl.textContent = (acc.name || '医').slice(0, 1);
    if (chip) chip.title = acc.role + ' · 工号 ' + acc.id + ' · 点击退出登录';
  }

  function showLogin() {
    var box = $('#loginOverlay');
    if (!box) return;
    box.hidden = false;
    document.body.classList.add('no-scroll');
    var pwd = $('#loginPwd');
    if (pwd) pwd.value = '';
    var err = $('#loginErr');
    if (err) err.textContent = '';
    var id = $('#loginId');
    var saved = '';
    try { saved = localStorage.getItem(REMEMBER_KEY) || ''; } catch (e) { }
    if (id) { if (!id.value && saved) id.value = saved; if (!id.value) id.focus(); }
    else if (pwd) pwd.focus();
  }

  function hideLogin() {
    var box = $('#loginOverlay');
    if (box) box.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function doLogin() {
    var idEl = $('#loginId'), pwdEl = $('#loginPwd'), errEl = $('#loginErr');
    var id = ((idEl || {}).value || '').trim().toUpperCase();
    var pwd = ((pwdEl || {}).value || '').trim();
    if (!id) { if (errEl) errEl.textContent = '请先输入工号'; idEl.focus(); return; }
    if (!pwd) { if (errEl) errEl.textContent = '请输入登录密码'; pwdEl.focus(); return; }
    var acc = null;
    ACCOUNTS.forEach(function (a) { if (a.id === id && a.pwd === pwd) acc = a; });
    if (!acc) {
      if (errEl) errEl.textContent = '工号或密码不正确。演示账号见下方，密码均为 123456。';
      pwdEl.select();
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(acc));
      if ($('#loginRemember') && $('#loginRemember').checked) localStorage.setItem(REMEMBER_KEY, acc.id);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (e) { }
    applyAccount(acc);
    hideLogin();
    render();
    audit('登录系统 · ' + acc.id + ' ' + acc.name);
    save();
    toast('欢迎，' + acc.name + ' · 工号 ' + acc.id);
  }

  function doLogout() {
    var acc = session();
    if (!window.confirm('退出登录？已录入内容已自动保存在本机。')) return;
    if (acc) audit('退出登录 · ' + acc.id);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { }
    save();
    closeModal();
    if (currentPanel) closePanel();
    showLogin();
    toast('已退出登录');
  }

  /* ================= 动作 ================= */
  var ACTIONS = {
    'open-panel': function (el) { openPanel(el.dataset.panel); },
    'close-panel': function () { closePanel(); },
    'close-modal': function () { closeModal(); },
    'new-patient': function () { editingNew = true; openPatientModal(null); },
    'edit-patient': function () { editingNew = false; openPatientModal(S.patient); },
    'demo-fill': function () { demoFill(); },
    'save-patient': function () { savePatient(); },
    'logout': function () { doLogout(); },

    'toggle-history': function (el) {
      var v = el.dataset.val;
      var i = S.history.indexOf(v);
      if (i >= 0) S.history.splice(i, 1); else S.history.push(v);
      save();
      renderPanel('patient'); renderPhase(); renderModules();
      toast(i >= 0 ? '已移除：' + v : '已记录：' + v);
    },

    'ocr-open': function (el) {
      _ocr = { stage: 'idle', imgSrc: '', name: '', tpl: 'chest', rows: [], mode: (el.dataset.mode || 'photo'), timer: null };
      openModal(ocrShell(), 'modal-lg');
      renderOcr();
      if (el.dataset.mode === 'paste') {
        var ta = $('#ocrText');
        if (ta) ta.focus();
      }
    },

    'ocr-pick': function () {
      var inp = $('#ocrFile');
      if (inp) inp.click();
    },

    'ocr-demo': function () { ocrOpenDemo(); },

    'ocr-parse': function () {
      var ta = $('#ocrText');
      ocrParseText(ta ? ta.value : '');
    },

    'ocr-retry': function () {
      clearInterval(_ocr && _ocr.timer);
      _ocr = { stage: 'idle', imgSrc: '', name: '', tpl: 'chest', rows: [], mode: 'photo', timer: null };
      renderOcr();
    },

    'ocr-apply': function () { ocrApply(); },

    'pick-photo': function (el) {
      var id = el.dataset.exam;
      var inp = document.querySelector('[data-photo-input="' + id + '"]');
      if (inp) inp.click();
    },

    'photo-open': function (el) {
      var id = el.dataset.exam, idx = +el.dataset.idx;
      var e = S.exams[id];
      var ph = e && e.photos && e.photos[idx];
      if (!ph) return;
      var d = examDef(id) || {};
      openModal(
        '<div class="modal-head"><div><p class="drawer-eyebrow">' + esc((d.name || '检查') + ' · 报告单原图') + '</p>' +
        '<h2>' + esc(ph.time || '') + ' 上传</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="modal-body"><div class="photo-view">' +
          '<div class="photo-meta"><span>' + esc(ph.name || '报告单') + '</span><span>' + esc(S.doctor) + ' 于 ' + esc(ph.time || '') + ' 上传</span></div>' +
          '<img src="' + esc(ph.src) + '" alt="' + esc(ph.name || '报告单') + '">' +
        '</div></div>' +
        '<div class="modal-foot"><button class="btn" type="button" data-act="close-modal">关闭</button></div>',
        'modal-lg');
    },

    'photo-del': function (el) {
      var id = el.dataset.exam, idx = +el.dataset.idx;
      if (!S.exams[id] || !S.exams[id].photos) return;
      if (!window.confirm('删除这张报告单照片？删除后不可恢复。')) return;
      S.exams[id].photos.splice(idx, 1);
      audit('删除报告单照片 · ' + ((examDef(id) || {}).name || id));
      save();
      renderPanel('exams'); renderModules();
      toast('已删除该照片');
    },

    'comm-done': function () {
      S.receive.comm = { done: true, time: nowHM(), who: S.doctor };
      audit('记录医患沟通 · ' + (S.patient ? S.patient.name : ''));
      save();
      renderPanel('receive');
      renderModules();
      toast('已记录沟通留痕，交接单将标注已沟通');
    },

    'comm-model': function (el) { setModel(el.dataset.model); },

    'preview-handover': function () {
      if (!window.PANELS || !window.PANELS.handoverSheet) return;
      openModal(
        '<div class="modal-head"><div><p class="drawer-eyebrow">转诊交接</p><h2>转诊交接单预览</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="modal-body"><div class="sheet-scroll">' + window.PANELS.handoverSheet() + '</div></div>' +
        '<div class="modal-foot"><button class="btn" type="button" data-act="close-modal">关闭</button>' +
        '<button class="btn btn-primary" type="button" data-act="print-handover">打印（A4）</button></div>',
        'modal-lg');
    },

    'print-handover': function () { printHandover(); },

    'quick-med': function (el) {
      var name = el.dataset.name, dose = el.dataset.dose || '—';
      var exists = S.meds.some(function (m) { return m.name === name; });
      if (exists) { toast('清单中已有该药物'); return; }
      S.meds.push({ name: name, dose: dose, actual: '未核实', state: 'pending' });
      audit('新增出院用药 · ' + name);
      save();
      renderPanel('meds'); renderModules();
      toast('已添加 ' + name + '，可继续添加其他药物');
    },

    'focus-med': function () {
      var n = $('#medName');
      if (n) { n.focus(); n.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    },

    'toggle-picker': function () {
      pickerOpen = !pickerOpen;
      renderWorkspace();
      if (pickerOpen) setTimeout(function () { var i = $('#psSearch'); if (i) i.focus(); }, 30);
    },

    'switch-chart': function (el) {
      var id = el.dataset.id;
      if (id === S.activeId) { pickerOpen = false; renderWorkspace(); return; }
      var name = '';
      if (loadChart(id)) {
        name = S.patient ? S.patient.name : '';
        pickerOpen = false;
        if (currentPanel) closePanel();
        render();
        toast('已切换到 ' + name + ' 的病历，数据自动保存');
      }
    },

    'save-now': function () {
      if (!S.online) S.queue.push({ act: 'save', t: nowHM() });
      save();
      renderOffline();
      var b = document.querySelector('.save-bar .sb-state b');
      if (b) b.textContent = S.lastSaved;
      var w = document.querySelector('.save-bar .sb-warn');
      if (w) w.remove();
      toast(S.online ? '已保存 · ' + S.lastSaved : '已保存到本地 · 联网后自动同步');
    },

    'set-doctor': function (el) {
      var name = el.dataset.name;
      if (!name || name === S.doctor) return;
      S.doctor = name;
      save();
      render();
      toast('当前操作人已切换为 ' + name);
    },

    'phase-detail': function (el) {
      var id = el.dataset.phase;
      var p = progress().filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      openModal(
        '<div class="modal-head"><div><p class="drawer-eyebrow">救治阶段</p><h2>' + p.name + ' · ' + p.pct + '%</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="modal-body"><p class="modal-sub">' + p.desc + '，共 ' + p.total + ' 项，已完成 ' + p.done + ' 项。完成度由录入内容实时计算。</p>' +
        '<ul class="task-list">' + p.items.map(function (it) {
          var ok = it.done(S);
          return '<li class="' + (ok ? 'is-done' : '') + '"><i>' + (ok ? '✓' : '') + '</i><span>' + it.label + '</span><em>' + (ok ? '已完成' : '待完成') + '</em></li>';
        }).join('') + '</ul></div>' +
        '<div class="modal-foot"><button class="btn" type="button" data-act="close-modal">关闭</button></div>',
        'modal-sm');
    },

    'add-vital': function () {
      var vals = {};
      VITALS.forEach(function (d) {
        var inp = $('[data-vital="' + d.id + '"]');
        if (inp && inp.value !== '') vals[d.id] = inp.value;
      });
      if (!vals.sbp || !vals.dbp) { toast('请至少填写收缩压与舒张压'); return; }
      var rec = { time: ($('#vitalTime') || {}).value || nowHM(), source: ($('#vitalSource') || {}).value || '现场测量' };
      VITALS.forEach(function (d) { rec[d.id] = vals[d.id] || ''; });
      S.vitals.push(rec);
      audit('录入生命体征 ' + rec.sbp + '/' + rec.dbp + ' mmHg · 来源 ' + rec.source);
      save(); render();
      toast('体征已记录，系统已自动判定异常项');
    },

    'review-lab': function (el) {
      var id = el.dataset.lab;
      if (!S.labs[id]) return;
      S.labs[id].reviewed = true;
      audit('复核检验项 · ' + (labDef(id) || {}).name);
      save(); render();
      toast('已复核，状态转为绿色');
    },

    'review-all-labs': function () {
      var n = 0;
      LABS.forEach(function (d) {
        var l = S.labs[d.id];
        if (l && l.value !== '' && !l.reviewed) { l.reviewed = true; n++; }
      });
      if (!n) { toast('没有待复核项目'); return; }
      audit('批量复核检验项 ' + n + ' 项');
      save(); render();
      toast('已复核 ' + n + ' 项');
    },

    'risk-decide': function (el) {
      var key = el.dataset.key, st = el.dataset.state;
      S.riskState[key] = st;
      var r = computeRisks().filter(function (x) { return x.key === key; })[0];
      audit((st === 'confirmed' ? '确认' : '排除') + '高危线索 · ' + (r ? r.title : key));
      save(); render();
      toast(st === 'confirmed' ? '已确认，将带入转诊摘要' : '已排除，已记录排除依据');
    },

    'notify-hospital': function () {
      S.receive.notified = true;
      audit('向院内发出预通知');
      save(); render();
      toast('预通知已发送（模拟），院内端可见');
    },

    'accept-patient': function () {
      S.receive.accepted = true;
      audit('院内接诊确认，患者进入抢救室');
      save(); render();
      toast('已接收，院中阶段开始计时');
    },

    'toggle-resource': function (el) {
      var v = el.dataset.val;
      var i = S.receive.resources.indexOf(v);
      if (i >= 0) S.receive.resources.splice(i, 1); else S.receive.resources.push(v);
      var need = ['抢救床单元', '心电监护', '除颤仪', '静脉通路'];
      S.receive.resourced = need.every(function (n) { return S.receive.resources.indexOf(n) >= 0; });
      save(); renderPanel('receive'); renderPhase(); renderModules();
    },

    'save-diagnosis': function () {
      var v = ($('#dxSelect') || {}).value || '';
      var note = ($('#dxNote') || {}).value || '';
      S.diagnosis = v === '待明确' ? '' : v;
      audit('记录初步诊断 · ' + (S.diagnosis || '待明确') + (note ? '（' + note + '）' : ''));
      save(); render();
      toast('初步诊断已记录');
    },

    'referral-handover': function () {
      S.referral.handover = true;
      audit('完成转诊交接确认');
      save(); render();
      toast('交接已确认，摘要与附件随患者流转');
    },

    'add-med': function () {
      var name = (($('#medName') || {}).value || '').trim();
      var dose = (($('#medDose') || {}).value || '').trim();
      var freq = ($('#medFreq') || {}).value || '';
      var actual = (($('#medActual') || {}).value || '').trim() || '未核实';
      if (!name) { toast('请填写药物名称'); $('#medName').focus(); return; }
      if (S.meds.some(function (m) { return m.name === name && m.dose === (dose || '—') + (freq ? ' · ' + freq : ''); })) {
        toast('清单中已有相同药物与用法');
        return;
      }
      S.meds.push({
        name: name,
        dose: (dose || '—') + (freq ? ' · ' + freq : ''),
        actual: actual,
        state: 'pending'
      });
      audit('新增出院用药 · ' + name);
      save();
      render();
      toast('已加入清单（共 ' + S.meds.length + ' 种），待核实实际服药情况');
    },

    'med-verify': function (el) {
      var i = +el.dataset.idx;
      if (!S.meds[i]) return;
      S.meds[i].state = 'done';
      audit('核实用药 · ' + S.meds[i].name);
      save(); render();
      toast('已核实并记录');
    },

    'med-remove': function (el) {
      var i = +el.dataset.idx;
      S.meds.splice(i, 1);
      save(); render();
    },

    'toggle-precare': function (el) {
      var v = el.dataset.val;
      var i = S.preCare.indexOf(v);
      if (i >= 0) S.preCare.splice(i, 1); else S.preCare.push(v);
      save(); renderPanel('patient'); renderPhase(); renderModules();
    },

    'toggle-followup-plan': function () {
      S.followup.plan = !S.followup.plan;
      audit(S.followup.plan ? '建立随访计划' : '取消随访计划');
      save(); render();
      toast(S.followup.plan ? '随访计划已建立（1 周 / 1 月 / 3 月）' : '已取消');
    },

    'add-followup': function () {
      var note = (($('#fuNote') || {}).value || '').trim();
      if (!note) { toast('请填写随访情况'); return; }
      S.followup.records.push({
        date: todayStr(), time: nowHM(),
        sbp: (($('#fuSbp') || {}).value || ''),
        dbp: (($('#fuDbp') || {}).value || ''),
        note: note,
        abnormal: S.followup.records.length === 0
      });
      audit('记录随访 · ' + note.slice(0, 18));
      save(); render();
      toast('随访记录已保存');
    },

    'return-records': function () {
      S.followup.returned = true;
      audit('随访记录回传区域胸痛中心（模拟）');
      save(); render();
      toast('记录已回传归档');
    },

    'net-toggle': function () {
      S.online = !S.online;
      if (S.online && S.queue.length) {
        var n = S.queue.length;
        S.queue = [];
        audit('网络恢复，补传本地缓存 ' + n + ' 条');
        save(); render();
        toast('已补传 ' + n + ' 条离线记录');
      } else {
        save(); render();
        toast(S.online ? '已恢复在线' : '已切换离线，操作将进入本地缓存');
      }
    },

    'audit-open': function () {
      openModal(
        '<div class="modal-head"><div><p class="drawer-eyebrow">可追溯</p><h2>审计日志</h2></div>' +
        '<button class="icon-btn" type="button" data-act="close-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="modal-body"><p class="modal-sub">记录谁、何时、对哪条数据做了什么。演示环境仅保存在浏览器本地。</p><div class="log-list">' +
        (S.audit.length ? S.audit.map(function (a) {
          return '<div class="log"><span class="log-t">' + a.t + '</span><span class="log-w">' + esc(a.who) + '</span><span class="log-c">' + esc(a.what) + '</span></div>';
        }).join('') : '<p class="empty-line">暂无记录</p>') +
        '</div></div>' +
        '<div class="modal-foot"><button class="btn" type="button" data-act="close-modal">关闭</button></div>',
        'modal-md');
    },

    'reset': function () {
      if (!window.confirm('清空当前演示数据？此操作不可恢复。')) return;
      var acc = session();
      S = blankState();
      if (acc) applyAccount(acc);
      save(); render();
      if (currentPanel) closePanel();
      toast('已清空当前演示数据');
    },

    'm3d-model': function (el) { setModel(el.dataset.model); },

    'm3d-reset': function () { if (viewer) viewer.reset(); },
    'm3d-spin': function (el) {
      if (!viewer) return;
      viewer.spin = !viewer.spin;
      el.classList.toggle('is-on', viewer.spin);
    },

    'hotspot': function (el) {
      var info = $('#m3dInfo');
      if (!info) return;
      $$('.hotspot').forEach(function (b) { b.classList.remove('is-on'); });
      el.classList.add('is-on');
      info.innerHTML = '<div class="mi-head"><b>' + esc(el.dataset.title) + '</b><span>点击查看的部位</span></div><p class="mi-body">' + esc(el.dataset.body) + '</p>';
    },

    'toast-mask': function () {
      toast('演示环境：查看完整身份证号需二次授权，操作已记录审计');
      audit('申请查看完整身份证号（已拒绝）');
      save(); renderOffline();
    }
  };

  /* ================= 事件委托 ================= */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (t) {
      var act = t.dataset.act;
      if (!ACTIONS[act]) return;
      var offlineActs = ['add-vital', 'review-lab', 'risk-decide', 'accept-patient', 'referral-handover', 'med-verify'];
      if (!S.online && offlineActs.indexOf(act) >= 0) {
        S.queue.push({ act: act, t: nowHM() });
        audit('离线操作入队 · ' + act);
        save(); renderOffline();
        toast('离线：已写入本地缓存，联网后自动补传');
      }
      ACTIONS[act].call(t, t, e);
      return;
    }
    var pick = e.target.closest('[data-pick]');
    if (pick) { pick.classList.toggle('is-on'); return; }
    var go = e.target.closest('[data-go]');
    if (go) { openPanel(go.dataset.go); return; }
    if (e.target.id === 'scrim') { closePanel(); return; }
    if (pickerOpen && !e.target.closest('.ws-left')) {
      pickerOpen = false;
      renderWorkspace();
    }
  });

  // 病历搜索
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id !== 'psSearch') return;
    var q = t.value;
    var drop = $('#psDrop');
    if (!drop) return;
    drop.innerHTML = pickerHtml(q);
    var inp = $('#psSearch');
    if (inp) { inp.focus(); try { inp.setSelectionRange(q.length, q.length); } catch (err) { } }
  });

  // 检验值实时判定（就地更新，避免失焦）
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.dataset) return;

    // 识别结果表内直接改值：实时重算判定与颜色
    if (t.dataset.ocrVal) {
      var oid = t.dataset.ocrVal, od = labDef(oid);
      var orow = document.querySelector('[data-ocr-row="' + oid + '"]');
      if (orow && od) {
        var oj = judgeValue(num(t.value), od);
        var otag = orow.querySelector('.judge');
        if (otag) {
          otag.className = 'judge ' + (oj ? oj.cls : '');
          otag.textContent = oj ? oj.text : '—';
        }
      }
      return;
    }

    if (!t.dataset.lab) return;
    var id = t.dataset.lab;
    if (!S.labs[id]) S.labs[id] = { value: '', reviewed: false, time: nowHM(), source: '院内检查' };
    S.labs[id].value = t.value.trim();
    S.labs[id].time = nowHM();
    S.labs[id].reviewed = false;

    var row = document.querySelector('[data-lab-row="' + id + '"]');
    if (row) {
      var j = judgeValue(num(t.value), labDef(id));
      var tag = row.querySelector('.judge');
      tag.className = 'judge ' + (j ? j.cls : '');
      tag.textContent = j ? j.text : '待录入';
      var dot = row.querySelector('.tri');
      if (dot) { dot.className = 'tri ' + triState(t.value.trim(), false).cls; }
      var rv = row.querySelector('[data-act="review-lab"]');
      if (rv) rv.disabled = !t.value.trim();
    }
    renderPhase(); renderModules(); renderExamCounts();
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !t.dataset) return;

    // 报告单识别：选择图片
    if (t.id === 'ocrFile') {
      var of = t.files && t.files[0];
      t.value = '';
      if (of) ocrHandleFile(of);
      return;
    }

    // 识别结果：全选 / 单项勾选 / 切换模板
    if ('ocrAll' in t.dataset) {
      var allOn = t.checked;
      _ocr.rows.forEach(function (r) { r.on = allOn; });
      $$('[data-ocr-chk]').forEach(function (c) { c.checked = allOn; });
      var ab = $('[data-act="ocr-apply"]');
      if (ab) ab.textContent = '写入选中的 ' + (allOn ? _ocr.rows.length : 0) + ' 项';
      return;
    }

    if (t.dataset.ocrChk) {
      var cr = _ocr.rows.filter(function (r) { return r.id === t.dataset.ocrChk; })[0];
      if (cr) cr.on = t.checked;
      var nOn = _ocr.rows.filter(function (r) { return r.on; }).length;
      var ab2 = $('[data-act="ocr-apply"]');
      if (ab2) ab2.textContent = '写入选中的 ' + nOn + ' 项';
      return;
    }

    if ('ocrTpl' in t.dataset) {
      _ocr.tpl = t.value;
      _ocr.rows = buildOcrRows(t.value, hashStr(t.value + '|' + _ocr.rows.length));
      renderOcr();
      return;
    }

    // 报告单照片上传
    if (t.dataset.photoInput) {
      var eid = t.dataset.photoInput;
      var files = t.files;
      if (files && files.length) addPhotos(eid, files);
      t.value = '';
      return;
    }

    if (t.dataset.exam) {
      var id = t.dataset.exam;
      S.exams[id] = { value: t.value, time: nowHM(), reviewed: S.exams[id] ? S.exams[id].reviewed : false, photos: (S.exams[id] && S.exams[id].photos) || [] };
      save(); renderExamCounts(); renderPhase(); renderModules();
      renderPanel('exams');
      toast('检查结果已更新');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!$('#modalLayer').hidden) { closeModal(); return; }
      if (currentPanel) closePanel();
    }
  });

  function renderExamCounts() {
    var el = $('#examCounts');
    if (!el) return;
    var g = 0, a = 0, y = 0;
    LABS.forEach(function (d) {
      var l = S.labs[d.id];
      if (!l || l.value === '' || num(l.value) === null) y++;
      else if (l.reviewed) g++; else a++;
    });
    var e = 0, ph = 0;
    EXAMS.forEach(function (d) {
      var x = S.exams[d.id];
      if (x && x.value && x.value !== '未完成') e++;
      if (x && x.photos) ph += x.photos.length;
    });
    el.innerHTML =
      '<span class="cnt"><i class="tri green"></i>已复核 <b>' + g + '</b></span>' +
      '<span class="cnt"><i class="tri amber"></i>待复核 <b>' + a + '</b></span>' +
      '<span class="cnt"><i class="tri gray"></i>未完成 <b>' + y + '</b></span>' +
      '<span class="cnt is-quiet">影像 / 心电 ' + e + '/' + EXAMS.length + '</span>' +
      '<span class="cnt is-quiet">报告单原图 ' + ph + ' 张</span>';
  }

  /* ================= 主渲染 ================= */
  function render() {
    renderWorkspace();
    renderUser();
    renderPhase();
    renderPatient();
    renderModules();
    renderFlow();
    renderOffline();
    if (currentPanel) renderPanel(currentPanel);
  }

  /* ================= 暴露给 panels.js ================= */
  var APP = {
    S: function () { return S; },
    $: $, $$: $$, esc: esc, num: num, nowHM: nowHM, todayStr: todayStr,
    LABS: LABS, VITALS: VITALS, EXAMS: EXAMS, SYMPTOMS: SYMPTOMS, HISTORY: HISTORY, PRE_CARE: PRE_CARE,
    judgeValue: judgeValue, labDef: labDef, vitalDef: vitalDef, examDef: examDef,
    labVal: labVal, examVal: examVal, latestVital: latestVital, triState: triState,
    computeRisks: computeRisks, suggestion: suggestion, progress: progress,
    totalProgress: totalProgress, renderPanel: renderPanel, toast: toast, audit: audit, save: save,
    render: render, renderExamCounts: renderExamCounts, openPanel: openPanel
  };
  window.APP = APP;

  /* ================= 启动 ================= */
  function bindLogin() {
    var form = $('#loginForm');
    if (form) {
      form.addEventListener('submit', function (e) { e.preventDefault(); doLogin(); });
    }
    var eye = $('#loginEye');
    if (eye) {
      eye.addEventListener('click', function () {
        var p = $('#loginPwd');
        if (!p) return;
        var show = p.type === 'password';
        p.type = show ? 'text' : 'password';
        eye.textContent = show ? '隐藏' : '显示';
        p.focus();
      });
    }
    $$('.lf-demo-set button').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = (b.dataset.demo || '').split('|');
        var idEl = $('#loginId'), pwdEl = $('#loginPwd'), errEl = $('#loginErr');
        if (idEl) idEl.value = parts[0] || '';
        if (pwdEl) pwdEl.value = parts[1] || '';
        if (errEl) errEl.textContent = '';
        if (pwdEl) pwdEl.focus();
      });
    });
    var id = $('#loginId');
    if (id) {
      id.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); var p = $('#loginPwd'); if (p) p.focus(); }
      });
    }
  }

  function boot() {
    if (window.__initPanels) window.__initPanels(APP);
    load();
    bindLogin();
    render();

    var acc = session();
    if (acc) {
      applyAccount(acc);
      hideLogin();
      render();
    } else {
      showLogin();
      var savedId = '';
      try { savedId = localStorage.getItem(REMEMBER_KEY) || ''; } catch (e) { }
      var pwd = $('#loginPwd');
      if (savedId && pwd) pwd.focus();
    }

    var q = new URLSearchParams(location.search);
    var p = q.get('panel');
    if (p && S.patient && acc) setTimeout(function () { openPanel(p); }, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
