/* ============================================================
   panels.js — 抽屉内各模块的渲染（由 app.js 调用）
   所有内容由录入数据生成
   ============================================================ */
(function () {
  'use strict';

  var A;
  function s() { return A.S(); }
  function esc(v) { return A.esc(v); }

  function sec(title, body, note) {
    return '<section class="psec"><div class="psec-h"><h3>' + title + '</h3>' +
      (note ? '<span class="psec-n">' + note + '</span>' : '') + '</div>' + body + '</section>';
  }
  function src(t) { return '<span class="src">' + esc(t) + '</span>'; }
  function empty(text, action) {
    return '<div class="empty-box"><p>' + text + '</p>' + (action || '') + '</div>';
  }
  function pct(v) { return Math.round(v); }

  /* ============ 1. 基本信息 ============ */
  function panelPatient() {
    var st = s(), p = st.patient || {};
    var rows = [
      ['姓名', p.name, p.source || '患者自述'],
      ['性别 / 年龄', p.sex + ' · ' + p.age + ' 岁', p.source || '患者自述'],
      ['分诊级别', p.level, '预检护士'],
      ['联系电话', p.phone || '未填写', '家属提供'],
      ['联系人', p.contact || '未填写', '家属提供'],
      ['到院方式', p.arrive, '120 转运记录'],
      ['发病时间', p.onset || '未填写', '患者自述'],
      ['到院时间', p.arriveTime, '分诊台'],
      ['主诉', p.complaint, p.source || '患者自述'],
      ['既往史', st.history.length ? st.history.join('、') : '未填写', '患者/家属提供'],
      ['伴随症状', st.symptoms.length ? st.symptoms.join('、') : '未填写', '患者自述']
    ];

    var table = '<div class="kv-table">' + rows.map(function (r) {
      return '<div class="kv-row"><span class="kv-k">' + r[0] + '</span>' +
        '<span class="kv-v">' + esc(r[1] || '—') + '</span>' +
        '<span class="kv-s">' + src(r[2]) + '</span></div>';
    }).join('') + '</div>';

    // 既往史随时可改：不依赖弹窗，直接点选即可生效
    var histChips = A.HISTORY.map(function (h) {
      var on = st.history.indexOf(h) >= 0;
      return '<button class="pick' + (on ? ' is-on' : '') + '" type="button" data-act="toggle-history" data-val="' + esc(h) + '">' + esc(h) + '</button>';
    }).join('');
    var histBlock = '<div class="hist-edit">' +
        '<div class="chip-set">' + histChips + '</div>' +
        (p.histNote ? '<p class="hist-note">其他：' + esc(p.histNote) + '</p>' : '') +
        '<p class="hist-note">点选即保存，可反复修改；已录 <b>' + st.history.length + '</b> 项。补充文字描述请点右上角「编辑」。</p>' +
      '</div>';

    var care = A.PRE_CARE.map(function (c) {
      var on = st.preCare.indexOf(c) >= 0;
      return '<button class="pick' + (on ? ' is-on' : '') + '" type="button" data-act="toggle-precare" data-val="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    var auth = '<div class="auth-card">' +
      '<div class="auth-row"><span>信息共享授权</span><b class="ok-text">已授权 · 院内急诊 / 心内科</b></div>' +
      '<div class="auth-row"><span>授权人</span><b>' + esc(p.contact || '本人') + '</b></div>' +
      '<div class="auth-row"><span>授权时间</span><b>' + esc(p.arriveTime) + '</b></div>' +
      '<div class="auth-row"><span>身份证号</span><b>3301**********0027 <button class="mini" type="button" data-act="toast-mask">申请查看</button></b></div>' +
      '</div>';

    return sec('患者信息', table, '<button class="mini" type="button" data-act="edit-patient">编辑</button>') +
      sec('既往史 / 危险因素', histBlock, '可反复编辑') +
      sec('院前处置', '<div class="chip-set">' + care + '</div>', '已处置 ' + st.preCare.length + ' 项') +
      sec('授权与权限', auth, '演示环境');
  }

  /* ============ 2. 生命体征 ============ */
  function panelVitals() {
    var st = s();
    var last = st.vitals.length ? st.vitals[st.vitals.length - 1] : null;

    var form = '<div class="vital-form">' +
      '<div class="vf-grid">' +
        A.VITALS.map(function (d) {
          return '<label class="vf"><span>' + d.name + '<em>' + d.unit + '</em></span>' +
            '<input data-vital="' + d.id + '" type="number" step="any" placeholder="' + d.low + '–' + d.high + '"></label>';
        }).join('') +
      '</div>' +
      '<div class="vf-foot">' +
        '<label class="vf-inline"><span>测量时间</span><input id="vitalTime" type="time" value="' + A.nowHM() + '"></label>' +
        '<label class="vf-inline"><span>来源</span><select id="vitalSource"><option>现场测量</option><option>设备检测</option><option>院内检查</option><option>家属提供</option></select></label>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="add-vital">记录本次体征</button>' +
      '</div>' +
      '<p class="hint-line">输入框内灰字为该指标的参考区间；录入后系统自动判定「正常 / 偏高 / 偏低 / 危急值」，并同步更新院前阶段完成度。</p>' +
    '</div>';

    var cards = '';
    if (last) {
      cards = '<div class="vital-cards">' + A.VITALS.slice(0, 6).map(function (d) {
        var v = A.num(last[d.id]);
        var j = v == null ? null : A.judgeValue(v, d);
        return '<div class="vc ' + (j ? 'is-' + j.cls : 'is-none') + '">' +
          '<span class="vc-name">' + d.name + '</span>' +
          '<span class="vc-val">' + (v == null ? '—' : last[d.id]) + '<em>' + d.unit + '</em></span>' +
          '<span class="vc-judge">' + (j ? j.text : '未记录') + '</span>' +
          '<span class="vc-ref">参考 ' + d.low + '–' + d.high + '</span>' +
        '</div>';
      }).join('') + '</div>';
    } else {
      cards = empty('尚未录入生命体征。录入首次测量后，院前阶段的「首次生命体征」会自动完成。');
    }

    var hist = '';
    if (st.vitals.length) {
      hist = '<div class="table-wrap"><table class="tbl"><thead><tr>' +
        '<th>时间</th><th>血压</th><th>心率</th><th>呼吸</th><th>SpO₂</th><th>体温</th><th>对侧收缩压</th><th>来源</th></tr></thead><tbody>' +
        st.vitals.slice().reverse().map(function (v) {
          return '<tr><td class="mono">' + v.time + '</td><td class="mono">' + (v.sbp || '—') + '/' + (v.dbp || '—') + '</td>' +
            '<td class="mono">' + (v.hr || '—') + '</td><td class="mono">' + (v.rr || '—') + '</td>' +
            '<td class="mono">' + (v.spo2 || '—') + '</td><td class="mono">' + (v.temp || '—') + '</td>' +
            '<td class="mono">' + (v.sbp2 || '—') + '</td><td>' + src(v.source) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    return sec('记录体征', form, '可多次记录') +
      sec('最新一次', cards, last ? last.time + ' · ' + last.source : '') +
      (hist ? sec('测量记录', hist, st.vitals.length + ' 条') : '');
  }

  /* ============ 3. 辅助检查 ============ */
  var UPLOAD_HINT = {
    ecg: '拍照上传 12 导联心电图原图，医生可直接看到 ST 段等真实波形',
    echo: '拍照上传床旁心脏超声报告单 / 图像，保留原始测量值',
    cta: '上传 CTA 报告单或关键层面截图',
    ctpa: '上传肺动脉 CTA 报告单或关键层面截图',
    cxr: '上传胸片原图或报告单'
  };

  function examPhotos(item) {
    return (item && item.photos) || [];
  }

  function panelExams() {
    var st = s();

    var legend = '<div class="tri-legend">' +
      '<span><i class="tri green"></i>已完成 · 结果已复核</span>' +
      '<span><i class="tri amber"></i>已完成 · 待复核</span>' +
      '<span><i class="tri gray"></i>未完成 / 未开展</span>' +
    '</div>';

    var counts = '<div class="exam-counts" id="examCounts"></div>';

    var labRows = A.LABS.map(function (d) {
      var l = st.labs[d.id];
      var val = l ? l.value : '';
      var v = A.num(val);
      var j = v == null ? null : A.judgeValue(v, d);
      var tri = A.triState(val, l && l.reviewed);
      return '<div class="lab-row" data-lab-row="' + d.id + '">' +
        '<i class="tri ' + tri.cls + '"></i>' +
        '<div class="lab-name"><b>' + d.name + '</b><em>' + d.short +
          (l && l.source === '报告单识别' ? '<i class="ocr-mark" title="由报告单识别录入，需核对">识</i>' : '') +
        '</em></div>' +
        '<div class="lab-ref mono">' + d.low + '–' + d.high + '</div>' +
        '<div class="lab-input"><input data-lab="' + d.id + '" type="number" step="any" value="' + esc(val) + '" placeholder="—"><span>' + d.unit + '</span></div>' +
        '<span class="judge ' + (j ? j.cls : '') + '">' + (j ? j.text : '待录入') + '</span>' +
        '<button class="mini" type="button" data-act="review-lab" data-lab="' + d.id + '"' + (val && !(l && l.reviewed) ? '' : ' disabled') + '>复核</button>' +
      '</div>';
    }).join('');

    var examBlocks = A.EXAMS.map(function (d) {
      var e = st.exams[d.id] || {};
      var val = e.value || '未完成';
      var abn = d.abnormal.indexOf(val) >= 0;
      var photos = examPhotos(e);

      var thumbs = photos.map(function (ph, i) {
        return '<div class="thumb-wrap">' +
          '<button class="thumb" type="button" data-act="photo-open" data-exam="' + d.id + '" data-idx="' + i + '" title="' + esc(ph.name) + '">' +
            '<img src="' + esc(ph.src) + '" alt="' + esc(ph.name) + '">' +
            '<span class="thumb-tag">' + esc(ph.time || '') + '</span>' +
          '</button>' +
          '<button class="thumb-del" type="button" data-act="photo-del" data-exam="' + d.id + '" data-idx="' + i + '" aria-label="删除该报告单">×</button>' +
        '</div>';
      }).join('');

      return '<div class="exam-block">' +
        '<div class="exam-row">' +
          '<div class="ex-main"><b>' + d.name + '</b><em>' + d.note + '</em></div>' +
          '<select data-exam="' + d.id + '">' +
            d.options.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
          '</select>' +
          '<span class="judge ' + (val === '未完成' ? '' : (abn ? 'crit' : 'ok')) + '">' +
            (val === '未完成' ? '未开展' : (abn ? '异常' : '正常')) + '</span>' +
          '<button class="mini ex-up" type="button" data-act="pick-photo" data-exam="' + d.id + '">' +
            (photos.length ? '＋ 追加' : '拍照 / 上传') +
          '</button>' +
        '</div>' +
        '<input class="file-input" type="file" accept="image/*" multiple data-photo-input="' + d.id + '">' +
        (photos.length
          ? '<div class="thumb-grid">' + thumbs + '</div>'
          : '<p class="ef-empty"><b>＋</b> ' + UPLOAD_HINT[d.id] + '</p>') +
      '</div>';
    }).join('');

    // 报告单识别入口
    var recognized = A.LABS.filter(function (d) {
      return st.labs[d.id] && st.labs[d.id].source === '报告单识别';
    }).length;
    var ocrBar = '<div class="ocr-bar">' +
        '<div class="ocr-bar-txt">' +
          '<b>报告单自动识别</b>' +
          '<span>拍一张检验单，整张结果一次录入，不用逐项手敲' +
            (recognized ? ' · 已有 <i>' + recognized + '</i> 项来自识别' : '') + '</span>' +
        '</div>' +
        '<div class="ocr-bar-acts">' +
          '<button class="btn btn-primary btn-sm" type="button" data-act="ocr-open">拍照识别</button>' +
          '<button class="mini" type="button" data-act="ocr-open" data-mode="paste">粘贴文本</button>' +
        '</div>' +
      '</div>';

    return sec('三色状态', legend + counts, '只表示结果可核实程度') +
      sec('影像与心电 · 原始报告单', examBlocks, '支持拍照上传') +
      sec('实验室检验', ocrBar + '<div class="lab-head"><span></span><span>项目</span><span>参考区间</span><span>结果</span><span>判定</span><span></span></div>' + labRows,
        recognized ? '识别 ' + recognized + ' 项待复核' : '录入即判定 · 复核后转绿') +
      '<div class="sec-actions"><button class="btn btn-sm" type="button" data-act="review-all-labs">复核全部待复核项</button></div>' +
      '<p class="hint-line">识别结果写入后为「待复核」，必须与纸质报告单核对、医师复核后才转绿；报告单照片只保存在本机浏览器（演示环境不上传服务器）。</p>';
  }

  /* ============ 4. 高危线索 ============ */
  function panelRisk() {
    var st = s();
    var risks = A.computeRisks();
    var sug = A.suggestion();

    var head = '';
    if (sug) {
      head = '<div class="sug-card">' +
        '<div class="sug-top"><span class="sug-tag">系统提示 · 非诊断</span>' +
        '<b>' + esc(sug.title) + '</b></div>' +
        '<p>依据：' + esc(sug.basis.slice(0, 3).join('；')) + '</p>' +
        '<p class="sug-advice">建议：' + esc(sug.advice) + '</p>' +
        '<span class="sug-foot">需医师结合病史与影像人工判断，系统不产生诊断结论</span>' +
      '</div>';
    } else {
      head = empty('尚无足够数据形成线索。录入生命体征、检验或检查结果后，系统会按规则自动生成。');
    }

    var list = risks.map(function (r) {
      var cls = r.level === 'high' ? 'high' : 'mid';
      var stateText = r.state === 'confirmed' ? '已确认' : (r.state === 'excluded' ? '已排除' : '待处置');
      var stateCls = r.state === 'confirmed' ? 'green' : (r.state === 'excluded' ? '' : 'amber');
      return '<div class="risk ' + cls + (r.state !== 'open' ? ' is-settled' : '') + '">' +
        '<div class="risk-top">' +
          '<b>' + esc(r.title) + '</b>' +
          '<span class="tag ' + stateCls + '">' + stateText + '</span>' +
        '</div>' +
        '<ul class="risk-basis">' + r.basis.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
        '<p class="risk-advice">' + esc(r.advice) + '</p>' +
        (r.state === 'open'
          ? '<div class="risk-acts"><button class="btn btn-sm" type="button" data-act="risk-decide" data-key="' + r.key + '" data-state="confirmed">确认线索</button>' +
            '<button class="btn btn-sm" type="button" data-act="risk-decide" data-key="' + r.key + '" data-state="excluded">排除</button></div>'
          : '<div class="risk-settled">已由 李 · 急诊 处置，操作已写入审计</div>') +
      '</div>';
    }).join('');

    return head + (risks.length ? sec('线索清单', list, risks.length + ' 条 · 待处置 ' + risks.filter(function (r) { return r.state === 'open'; }).length + ' 条') : '') +
      '<p class="hint-line">规则命中的是「需要关注」，不是「已经确诊」。每条线索都必须由医师确认或排除，排除也要记录依据。</p>';
  }

  /* ============ 5. 院内接诊（含医患沟通 + 3D） ============ */
  var DISEASE = {
    dissection: {
      name: '主动脉夹层',
      short: '血管壁被血流劈开',
      facts: [
        ['发生了什么', '主动脉内膜撕裂出破口，血液冲进管壁中层，把一根血管劈成真腔和假腔两条路。'],
        ['为什么危险', '假腔膨胀会压瘪真腔，器官供血不足；一旦外膜破裂，会短时间内大出血。'],
        ['怎么处理', '先控制血压和心率、镇痛；A 型多需急诊手术，B 型可评估覆膜支架（TEVAR）。']
      ]
    },
    ami: {
      name: '急性心肌梗死',
      short: '冠脉堵了，心肌在坏死',
      facts: [
        ['发生了什么', '冠状动脉被粥样斑块破裂后的血栓堵住，下游心肌得不到血和氧。'],
        ['为什么危险', '缺血超过 20 分钟心肌开始坏死，范围越大越容易出现心衰、恶性心律失常。'],
        ['怎么处理', '尽快开通血管：急诊 PCI 或溶栓，目标是尽早恢复血流，时间就是心肌。']
      ]
    },
    pe: {
      name: '肺动脉栓塞',
      short: '血栓卡在肺动脉',
      facts: [
        ['发生了什么', '多来自下肢深静脉的血栓脱落，随血流卡在肺动脉分支，肺无法完成换气。'],
        ['为什么危险', '右心要对抗突然升高的阻力，可能出现右心衰、休克，大面积栓塞死亡率高。'],
        ['怎么处理', '抗凝是基础；高危患者考虑溶栓或介入取栓，同时评估下肢静脉血栓来源。']
      ]
    }
  };

  /* ---- 通俗沟通内容：讲解口径 + 生活化比喻 + 家属常问 ---- */
  var COMM = {
    dissection: {
      tag: '当前最需要排除的危重情况',
      plain: '身体里最粗的那根血管（主动脉）内壁撕开了一道口子，高压的血流冲进管壁中间，把一根血管分成了两条道。',
      analogy: '把这根血管想成一根承压的水管：内壁裂了一条缝，水压又很高，水就顺着缝灌进管壁，把管壁撑成两层。外层越撑越薄，一旦撑破，血会瞬间涌进胸腔。',
      steps: [
        ['发生了什么', '疼痛来自血管壁正在被撕开。这种痛往往突然出现、像被撕开或刀割一样，还常往后背、腰部串。'],
        ['为什么危险', '鼓起来的假腔会压扁真正的血管腔，心脏、大脑、肾脏、肠道的供血都会受影响；外膜一旦破裂，几分钟内就可能致命。'],
        ['第一步做什么', '先不急着开刀，而是把血压和心率"压"下来：收缩压目标 100–120 mmHg、心率 60 次/分左右，同时充分止痛，让撕裂不再继续扩大。'],
        ['怎么根治', 'CTA 看清分型后决定：A 型（累及升主动脉）通常需要急诊手术；B 型可以评估微创的覆膜支架（TEVAR）。'],
        ['家属能做什么', '让患者绝对安静、不要自行喂水喂药；如实告知既往病史和正在吃的药（尤其是阿司匹林、华法林等抗凝药）；尽快完成知情同意签字。']
      ],
      qa: [
        ['能不能救？', '能。关键在速度——越早把血压心率控制住、越早明确分型，存活机会越大。'],
        ['要花多长时间？', 'CTA 明确分型一般 20–30 分钟；如果要做手术，术前准备通常还要 1–2 小时。'],
        ['风险有多大？', '夹层本身就是危重疾病，手术和保守治疗都有风险。我们会先把生命体征稳住，再和您详细谈具体方案。']
      ],
      goal: ['100–120', 'mmHg', '收缩压目标 · 心率约 60 次/分']
    },
    ami: {
      tag: '当前最需要排除的危重情况',
      plain: '给心脏供血的一根冠状动脉被血栓堵住了，它负责供血的那一片心肌正在缺血、坏死。',
      analogy: '就像给一栋楼供水的主水管被堵死：楼里的房间（心肌）没有水（血）就撑不了多久。堵得越久，坏掉的房间越多，而且坏掉之后不会重新长回来。',
      steps: [
        ['发生了什么', '血管壁上的斑块突然破裂，血液在破口处凝成血栓，把血管腔堵死，下游心肌拿不到氧。'],
        ['为什么危险', '心肌缺血超过 20 分钟就开始坏死，坏死范围越大，越容易出现心衰、心脏破裂或恶性心律失常。'],
        ['第一步做什么', '立刻抗血小板、抗凝、镇痛、吸氧，同时联系导管室，做急诊冠脉造影。'],
        ['怎么根治', '首选急诊 PCI：用导丝把支架送到堵塞处撑开血管；不能及时做 PCI 时考虑溶栓。目标是 90 分钟内开通血管。'],
        ['家属能做什么', '不要自行给患者吃东西或喝水（可能要急诊手术）；尽快签字同意造影 / PCI；把既往用药和过敏史告诉医生。']
      ],
      qa: [
        ['能不能救？', '能，但时间就是心肌。越早开通血管，保住的心肌越多，后期心功能越好。'],
        ['要花多长时间？', '从进导管室到血管开通通常 30–60 分钟，术后要在监护室观察 1–2 天。'],
        ['放了支架要终身吃药吗？', '需要长期服用抗血小板药和他汀，具体疗程由心内科医生根据支架类型和出血风险评估。']
      ],
      goal: ['＜140/90', 'mmHg', '血压目标 · 90 分钟内开通血管']
    },
    pe: {
      tag: '当前最需要排除的危重情况',
      plain: '腿上的静脉血栓脱落，顺着血流卡在了肺的血管里，肺没办法正常换气，右心也被憋得很吃力。',
      analogy: '像下水道里卡了一块石头：上游的水排不出去，泵（右心）只能拼命加压，时间一长泵自己就累坏了。',
      steps: [
        ['发生了什么', '下肢深静脉形成的血栓脱落，随血流进入肺动脉，堵住分支，肺无法完成氧气交换。'],
        ['为什么危险', '肺动脉阻力突然升高，右心负荷骤增，可能出现右心衰、血压下降甚至休克；大面积栓塞死亡率很高。'],
        ['第一步做什么', '吸氧、监护、建立静脉通路，评估出血风险后尽快开始抗凝；血压不稳的高危患者考虑溶栓。'],
        ['怎么根治', '抗凝是基础治疗；高危患者可溶栓或介入取栓；同时查下肢静脉超声找血栓来源，必要时放滤器。'],
        ['家属能做什么', '不要按摩或热敷患侧下肢（可能把血栓挤下来）；如实说明近期手术、卧床、肿瘤或口服避孕药等情况。']
      ],
      qa: [
        ['能不能救？', '能。大面积栓塞进展快，但及时抗凝、溶栓或取栓多数可以稳定下来。'],
        ['要花多长时间？', '肺动脉 CTA 约 20 分钟出结果；抗凝治疗通常需要持续 3–6 个月，期间要复查。'],
        ['以后会复发吗？', '有复发可能，所以要坚持抗凝、复查，长时间坐车或卧床时要活动下肢。']
      ],
      goal: ['≥95', '%', 'SpO₂ 目标 · 心率 <100 次/分']
    }
  };

  function modelInfo(id) {
    var d = DISEASE[id] || DISEASE.dissection;
    return '<div class="mi-head"><b>' + d.name + '</b><span>' + d.short + '</span></div>' +
      '<div class="mi-facts">' + d.facts.map(function (f) {
        return '<div class="mi-fact"><span>' + f[0] + '</span><p>' + f[1] + '</p></div>';
      }).join('') + '</div>' +
      '<p class="mi-tip">拖动模型可旋转，点击数字查看对应部位。示意模型，非患者本人影像。</p>';
  }

  /* ---- 示意图：用剖面图把病变画出来 ---- */
  function commSvg(id) {
    var head = '<svg viewBox="0 0 360 236" role="img" aria-label="病变示意图">' +
      '<defs>' +
        '<linearGradient id="tubeG" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#E7EEF8"/><stop offset="1" stop-color="#D9E3F1"/>' +
        '</linearGradient>' +
        '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
          '<line x1="0" y1="0" x2="0" y2="6" stroke="#E9A9A9" stroke-width="1.6"/>' +
        '</pattern>' +
        '<marker id="arrS" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">' +
          '<path d="M0 0 L7 3.5 L0 7 z" fill="#C0645A"/>' +
        '</marker>' +
      '</defs>' +
      '<rect width="360" height="236" fill="#FBFDFF"/>';

    var tail = '</svg>';

    if (id === 'ami') {
      return head +
        '<path d="M180 208 C150 188 94 152 94 112 C94 88 112 70 136 70 C156 70 172 84 180 100 C188 84 204 70 224 70 C248 70 266 88 266 112 C266 152 210 188 180 208 Z" fill="#FDEEF0" stroke="#E3B6BE" stroke-width="1.4"/>' +
        '<ellipse cx="196" cy="168" rx="42" ry="30" fill="url(#hatch)" opacity=".75"/>' +
        '<path d="M136 92 C150 112 166 122 190 128" fill="none" stroke="#DFA0A0" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M190 128 C206 134 216 148 214 164" fill="none" stroke="#DFA0A0" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M166 112 C176 106 188 108 196 116" fill="none" stroke="#B9C6D6" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="181" cy="117" r="8" fill="#9B3B3B"/>' +
        '<circle cx="181" cy="117" r="12" fill="none" stroke="#9B3B3B" stroke-width="1" opacity=".35"/>' +
        '<path d="M181 117 L252 78" stroke="#9B3B3B" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<text x="256" y="74" font-size="10.5" fill="#9B3B3B" font-weight="600">血栓堵住血管</text>' +
        '<text x="256" y="88" font-size="9.5" fill="#7A8797">下游心肌缺血</text>' +
        '<path d="M204 174 L112 199" stroke="#C0645A" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<text x="30" y="196" font-size="10.5" fill="#C0645A" font-weight="600">这片心肌正在缺血</text>' +
        '<text x="30" y="209" font-size="9.5" fill="#7A8797">阴影区＝受影响范围</text>' +
        '<text x="180" y="30" font-size="10.5" fill="#5B6675" text-anchor="middle">心脏 · 冠状动脉示意</text>' +
        tail;
    }

    if (id === 'pe') {
      return head +
        '<path d="M104 62 C74 74 60 110 68 148 C74 178 94 196 116 190 C132 186 138 166 136 138 C134 108 126 82 104 62 Z" fill="#EAF3FC" stroke="#C6D8EE" stroke-width="1.3"/>' +
        '<path d="M256 62 C286 74 300 110 292 148 C286 178 266 196 244 190 C228 186 222 166 224 138 C226 108 234 82 256 62 Z" fill="#EAF3FC" stroke="#C6D8EE" stroke-width="1.3"/>' +
        '<path d="M180 200 L180 128" stroke="#AEC4DC" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="M180 130 L146 96" stroke="#AEC4DC" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M180 130 L214 96" stroke="#AEC4DC" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M180 200 L180 128" stroke="#F5FAFF" stroke-width="4" opacity=".8"/>' +
        '<ellipse cx="205" cy="110" rx="9" ry="7" transform="rotate(-40 205 110)" fill="#9B3B3B"/>' +
        '<path d="M207 106 L268 76" stroke="#9B3B3B" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<text x="272" y="72" font-size="10.5" fill="#9B3B3B" font-weight="600">血栓卡在分支</text>' +
        '<text x="272" y="86" font-size="9.5" fill="#7A8797">这一段肺无法换气</text>' +
        '<path d="M168 176 L96 196" stroke="#C0645A" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<text x="30" y="203" font-size="10.5" fill="#C0645A" font-weight="600">右心负荷骤增</text>' +
        '<text x="30" y="216" font-size="9.5" fill="#7A8797">泵不动 → 血压下降</text>' +
        '<text x="180" y="26" font-size="10.5" fill="#5B6675" text-anchor="middle">肺动脉 · 双肺示意</text>' +
        tail;
    }

    // 默认：主动脉夹层
    return head +
      '<rect x="142" y="18" width="76" height="196" rx="38" fill="url(#tubeG)" stroke="#C3CDDC" stroke-width="1.4"/>' +
      '<rect x="150" y="36" width="28" height="164" rx="14" fill="#DCEAFB" stroke="#A9C7EE" stroke-width="1.2"/>' +
      '<rect x="182" y="36" width="28" height="164" rx="14" fill="#FAE0DA" stroke="#E2A99C" stroke-width="1.2"/>' +
      '<path d="M181 78 L172 88 L181 98" fill="none" stroke="#D64545" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M164 58 L164 74 M164 112 L164 132 M164 148 L164 168" stroke="#9DBEE8" stroke-width="1.6" marker-end="url(#arrS)"/>' +
      '<path d="M186 60 C196 74 196 96 186 110" fill="none" stroke="#C0645A" stroke-width="1.6" stroke-dasharray="3 3" marker-end="url(#arrS)"/>' +
      '<path d="M181 88 L246 88" stroke="#D64545" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<text x="250" y="84" font-size="10.5" fill="#D64545" font-weight="600">内膜破口</text>' +
      '<text x="250" y="98" font-size="9.5" fill="#7A8797">血液从这里冲进管壁</text>' +
      '<path d="M150 62 L96 62" stroke="#8FA3BD" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<text x="92" y="58" font-size="10.5" fill="#3E6FB8" font-weight="600" text-anchor="end">真腔</text>' +
      '<text x="92" y="72" font-size="9.5" fill="#7A8797" text-anchor="end">正常血流通道</text>' +
      '<path d="M196 158 L250 168" stroke="#C0645A" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<text x="254" y="165" font-size="10.5" fill="#C0645A" font-weight="600">假腔</text>' +
      '<text x="254" y="179" font-size="9.5" fill="#7A8797">被血撑开的一层</text>' +
      '<text x="180" y="232" font-size="9.5" fill="#9AA5B4" text-anchor="middle">主动脉剖面 · 一根血管被分成两条道</text>' +
      tail;
  }

  function commBlock(st) {
    var id = st.model || 'dissection';
    if (st.diagnosis === '主动脉夹层') id = 'dissection';
    else if (st.diagnosis === '急性冠脉综合征') id = 'ami';
    else if (st.diagnosis === '肺栓塞') id = 'pe';
    var c = COMM[id] || COMM.dissection;
    var d = DISEASE[id] || DISEASE.dissection;
    var v = A.latestVital() || {};
    var nowMain = v.sbp ? (v.sbp + '/' + v.dbp) : '待录入';
    var nowSub = [];
    if (v.hr) nowSub.push('心率 ' + v.hr + ' 次/分');
    if (v.spo2) nowSub.push('SpO₂ ' + v.spo2 + '%');
    var comm = (st.receive && st.receive.comm) || {};

    var tabs = '<div class="m3d-tabs">' + ['dissection', 'ami', 'pe'].map(function (k) {
      return '<button class="dz-tab' + (id === k ? ' is-on' : '') + '" type="button" data-act="comm-model" data-model="' + k + '">' + DISEASE[k].name + '</button>';
    }).join('') + '</div>';

    var steps = c.steps.map(function (x, i) {
      return '<div class="cs-item"><span class="cs-n">' + (i + 1) + '</span>' +
        '<div class="cs-body"><b>' + x[0] + '</b><p>' + x[1] + '</p></div></div>';
    }).join('');

    var qa = c.qa.map(function (q) {
      return '<div class="cqa"><b>' + q[0] + '</b><p>' + q[1] + '</p></div>';
    }).join('');

    return '<div class="comm">' +
      '<div class="comm-head">' +
        tabs +
        '<span class="comm-tag">' + c.tag + '</span>' +
        '<b>' + d.name + ' · 讲给家属听</b>' +
        '<em>' + d.short + '</em>' +
        '<p class="comm-plain">' + c.plain + '</p>' +
      '</div>' +
      '<div class="comm-fig">' + commSvg(id) + '</div>' +
      '<div class="comm-steps">' + steps + '</div>' +
      '<div class="comm-analogy"><b>打个比方</b>' + c.analogy + '</div>' +
      '<div class="comm-goal">' +
        '<div class="cg-cell now"><span>现在的状态</span><b>' + esc(nowMain) + '<em>mmHg</em></b>' +
          '<small>' + (nowSub.length ? esc(nowSub.join(' · ')) : '体征待录入') + '</small></div>' +
        '<span class="cg-arrow">→</span>' +
        '<div class="cg-cell target"><span>我们要达到</span><b>' + c.goal[0] + '<em>' + c.goal[1] + '</em></b>' +
          '<small>' + c.goal[2] + '</small></div>' +
      '</div>' +
      '<div class="comm-qa"><p class="cf-label">家属最常问的三个问题</p>' + qa + '</div>' +
      '<div class="comm-sign">' +
        '<span>' + (comm.done
          ? '已向家属完成病情沟通 · <b>' + esc(comm.time || '') + '</b> · 沟通人 ' + esc(comm.who || '')
          : '沟通后请点击右侧按钮留痕：谁、何时、向谁说明了病情与风险。') + '</span>' +
        (comm.done
          ? '<span class="is-done">✓ 已记录</span>'
          : '<button class="btn btn-sm btn-primary" type="button" data-act="comm-done">记录已完成沟通</button>') +
      '</div>' +
    '</div>';
  }

  function panelReceive() {
    var st = s();
    var r = st.receive;

    var steps = '<div class="rx-steps">' +
      '<div class="rx-step' + (r.notified ? ' is-done' : '') + '">' +
        '<span class="rx-n">1</span><div><b>院前预通知</b><em>' + (r.notified ? '已发送 · 院内已收到' : '未发送') + '</em></div>' +
        (r.notified ? '<span class="tag green">已完成</span>' : '<button class="btn btn-sm" type="button" data-act="notify-hospital">发送预通知</button>') +
      '</div>' +
      '<div class="rx-step' + (r.accepted ? ' is-done' : '') + '">' +
        '<span class="rx-n">2</span><div><b>接收确认</b><em>' + (r.accepted ? '已接收 · 抢救室 3 床' : '待接收') + '</em></div>' +
        (r.accepted ? '<span class="tag green">已完成</span>' : '<button class="btn btn-sm" type="button" data-act="accept-patient">确认接收</button>') +
      '</div>' +
      '<div class="rx-step' + (r.resourced ? ' is-done' : '') + '">' +
        '<span class="rx-n">3</span><div><b>资源准备</b><em>' + (r.resourced ? '关键资源已就绪' : '勾选后自动判定') + '</em></div>' +
        (r.resourced ? '<span class="tag green">已完成</span>' : '<span class="tag amber">进行中</span>') +
      '</div>' +
    '</div>';

    var resources = ['抢救床单元', '心电监护', '除颤仪', '静脉通路', '床旁超声', '导管室待命', '备血'];
    var res = '<div class="chip-set">' + resources.map(function (x) {
      var on = r.resources.indexOf(x) >= 0;
      return '<button class="pick' + (on ? ' is-on' : '') + '" type="button" data-act="toggle-resource" data-val="' + esc(x) + '">' + esc(x) + '</button>';
    }).join('') + '</div><p class="hint-line">抢救床单元、心电监护、除颤仪、静脉通路四项齐备后，自动判定为「资源准备完成」。</p>';

    var dxOptions = ['待明确', '急性冠脉综合征', '主动脉夹层', '肺栓塞', '其他'];
    var dx = '<div class="dx-box">' +
      '<select id="dxSelect">' + dxOptions.map(function (o) { return '<option' + (o === (st.diagnosis || '待明确') ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' +
      '<input id="dxNote" placeholder="补充说明（如分型、部位）">' +
      '<button class="btn btn-primary btn-sm" type="button" data-act="save-diagnosis">保存诊断</button>' +
    '</div>';

    var d3 = '<div class="m3d">' +
      '<div class="m3d-tabs">' +
        ['dissection', 'ami', 'pe'].map(function (k) {
          return '<button class="dz-tab' + (st.model === k ? ' is-on' : '') + '" type="button" data-act="m3d-model" data-model="' + k + '">' + DISEASE[k].name + '</button>';
        }).join('') +
      '</div>' +
      '<p class="m3d-hint" id="m3dHint">拖动可旋转 · 滚轮缩放 · 点击数字看部位</p>' +
      '<div class="m3d-stage">' +
        '<canvas id="m3dCanvas"></canvas>' +
        '<button class="hotspot" type="button" data-act="hotspot" data-title="" data-body="" style="left:0;top:0">1</button>' +
        '<button class="hotspot" type="button" data-act="hotspot" data-title="" data-body="" style="left:0;top:0">2</button>' +
        '<button class="hotspot" type="button" data-act="hotspot" data-title="" data-body="" style="left:0;top:0">3</button>' +
        '<div class="m3d-tools">' +
          '<button class="mini" type="button" data-act="m3d-spin" id="m3dSpin">自动旋转</button>' +
          '<button class="mini" type="button" data-act="m3d-reset">复位视角</button>' +
        '</div>' +
      '</div>' +
      '<div class="m3d-info" id="m3dInfo">' + modelInfo(st.model || 'dissection') + '</div>' +
      '<p class="m3d-note">示意模型用于家属沟通，帮助理解「病变在哪、为什么危险」，不替代影像与诊断。</p>' +
    '</div>';

    return sec('接诊流程', steps, r.accepted ? '院中阶段进行中' : '待接收') +
      sec('资源准备', res, r.resources.length + '/' + resources.length) +
      sec('初步诊断', dx, '写入后将进入转诊摘要') +
      sec('医患沟通 · 病情讲解', commBlock(st), '通俗表达 · 可打印') +
      sec('病灶示意模型', d3, '可旋转 · 可点触');
  }

  /* ============ 6. 转诊交接 ============ */
  function examText(id) {
    var st = s();
    var e = st.exams[id];
    if (!e || !e.value || e.value === '未完成') return '';
    return e.value + (e.time ? '（' + e.time + '）' : '');
  }

  function examHas(id) {
    var st = s();
    var e = st.exams[id];
    return !!((e && e.value && e.value !== '未完成') || (e && e.photos && e.photos.length));
  }

  function photoCount() {
    var st = s(), n = 0;
    A.EXAMS.forEach(function (d) {
      var e = st.exams[d.id];
      if (e && e.photos) n += e.photos.length;
    });
    return n;
  }

  function abnormalLabs() {
    var st = s(), out = [];
    A.LABS.forEach(function (d) {
      var v = A.labVal(d.id);
      if (v == null) return;
      var j = A.judgeValue(v, d);
      if (j && j.cls !== 'ok') {
        out.push({ name: d.name, short: d.short, val: st.labs[d.id].value + ' ' + d.unit, judge: j.text, cls: j.cls, reviewed: !!(st.labs[d.id] && st.labs[d.id].reviewed) });
      }
    });
    return out;
  }

  // 交接单上的「注意事项」：由未复核项、未处置线索、附件缺失自动生成
  function sheetCautions() {
    var st = s(), out = [];
    var pending = [];
    A.LABS.forEach(function (d) {
      var l = st.labs[d.id];
      if (l && l.value && !l.reviewed) pending.push(d.short);
    });
    if (pending.length) out.push('检验结果待复核：' + pending.join('、') + '，接收科室请复核后再作为诊断依据。');
    var open = A.computeRisks().filter(function (r) { return r.state === 'open'; });
    if (open.length) out.push('高危线索尚未处置：' + open.map(function (r) { return r.title; }).join('、') + '。');
    var confirmed = A.computeRisks().filter(function (r) { return r.state === 'confirmed'; });
    if (confirmed.length) out.push('已确认线索：' + confirmed.map(function (r) { return r.title; }).join('、') + '，请接力处置。');
    if (!photoCount()) out.push('尚未上传心电图 / 彩超报告单原图，建议转运前补齐。');
    else out.push('已随单附检查报告单原图 ' + photoCount() + ' 张，可在系统中查看。');
    if (st.receive.comm && st.receive.comm.done) out.push('已完成家属病情沟通并留痕（' + st.receive.comm.time + '）。');
    else out.push('尚未记录家属病情沟通，接收科室需补充沟通。');
    return out;
  }

  function handoverSheet() {
    var st = s(), p = st.patient || {};
    var vital = A.latestVital() || {};
    var risks = A.computeRisks();
    var labsAbn = abnormalLabs();
    var examRows = [];
    A.EXAMS.forEach(function (d) {
      var e = st.exams[d.id] || {};
      var pics = (e.photos || []).length;
      var t = examText(d.id);
      if (!t && !pics) return;
      examRows.push([d.name, t || '结果未填写（仅上传报告单）', pics ? (pics + ' 张原图') : '—']);
    });

    var vitalsCell = vital.sbp
      ? '血压 ' + vital.sbp + '/' + vital.dbp + ' mmHg；心率 ' + (vital.hr || '—') + ' 次/分；呼吸 ' + (vital.rr || '—') +
        ' 次/分；SpO₂ ' + (vital.spo2 || '—') + '%；体温 ' + (vital.temp || '—') + ' ℃' +
        (vital.sbp2 ? '；对侧收缩压 ' + vital.sbp2 + ' mmHg' : '') + '（' + (vital.time || '') + '）'
      : '未记录';

    var labCell = labsAbn.length
      ? labsAbn.map(function (x) { return x.name + ' ' + x.val + '（' + x.judge + (x.reviewed ? '，已复核' : '，待复核') + '）'; }).join('<br>')
      : '未见异常或尚未回报';

    var riskCell = risks.length
      ? '<ul class="sheet-list">' + risks.map(function (r) {
          return '<li><b>' + esc(r.title) + '</b>（' + (r.state === 'confirmed' ? '已确认' : (r.state === 'excluded' ? '已排除' : '待处置')) + '）：' + esc(r.basis.slice(0, 2).join('；')) + '</li>';
        }).join('') + '</ul>'
      : '暂未命中线索';

    var nowStamp = new Date();
    var stamp = nowStamp.getFullYear() + '-' + ('0' + (nowStamp.getMonth() + 1)).slice(-2) + '-' + ('0' + nowStamp.getDate()).slice(-2) +
      ' ' + A.nowHM();
    var mrn = (function () {
      var c = null, list = st.patients || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === st.activeId) c = list[i];
      return c ? c.mrn : '—';
    })();

    return '<div class="sheet">' +
      '<div class="sheet-head"><h1>胸痛患者转诊交接单</h1>' +
        '<p>Chest Pain Patient Transfer &amp; Handover Record</p>' +
        '<div class="sheet-meta"><span>编号：' + esc(mrn) + '-' + A.nowHM().replace(':', '') + '</span>' +
        '<span>打印时间：' + stamp + '</span></div>' +
      '</div>' +

      '<div class="sheet-sec"><h3>一、患者基本信息</h3>' +
        '<table class="sheet-tbl"><tbody>' +
          '<tr><td class="k">姓名</td><td>' + esc(p.name || '—') + '</td><td class="k">性别 / 年龄</td><td>' + esc((p.sex || '—') + ' / ' + (p.age || '—') + ' 岁') + '</td></tr>' +
          '<tr><td class="k">病历号</td><td>' + esc(mrn) + '</td><td class="k">分诊级别</td><td>' + esc(p.level || '—') + '</td></tr>' +
          '<tr><td class="k">到院方式</td><td>' + esc(p.arrive || '—') + '</td><td class="k">到院时间</td><td>' + esc(p.arriveTime || '—') + '</td></tr>' +
          '<tr><td class="k">联系人</td><td>' + esc(p.contact || '—') + '</td><td class="k">联系电话</td><td>' + esc(p.phone || '—') + '</td></tr>' +
        '</tbody></table>' +
      '</div>' +

      '<div class="sheet-sec"><h3>二、主诉与病史</h3>' +
        '<table class="sheet-tbl"><tbody>' +
          '<tr><td class="k" style="width:78px">主诉</td><td>' + esc(p.complaint || '—') + (p.onset ? '<br><span class="sheet-note">发病时间 ' + esc(p.onset) + '</span>' : '') + '</td></tr>' +
          '<tr><td class="k">既往史</td><td>' + esc(st.history.length ? st.history.join('、') : '未填写') + (p.histNote ? '；' + esc(p.histNote) : '') + '</td></tr>' +
          '<tr><td class="k">伴随症状</td><td>' + esc(st.symptoms.length ? st.symptoms.join('、') : '未填写') + '</td></tr>' +
          '<tr><td class="k">院前处置</td><td>' + esc(st.preCare.length ? st.preCare.join('、') : '未记录') + '</td></tr>' +
        '</tbody></table>' +
      '</div>' +

      '<div class="sheet-sec"><h3>三、生命体征（最近一次）</h3>' +
        '<p class="sheet-p">' + esc(vitalsCell) + '</p>' +
      '</div>' +

      '<div class="sheet-sec"><h3>四、辅助检查</h3>' +
        '<table class="sheet-tbl"><thead><tr><th style="width:96px">项目</th><th>结果 / 结论</th><th style="width:74px">原图</th></tr></thead><tbody>' +
          (examRows.length ? examRows.map(function (r) {
            return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
          }).join('') : '<tr><td colspan="3">影像与心电尚未记录</td></tr>') +
          '<tr><td>实验室检验</td><td>' + labCell + '</td><td>—</td></tr>' +
        '</tbody></table>' +
      '</div>' +

      '<div class="sheet-sec"><h3>五、高危线索与评估</h3>' +
        '<p class="sheet-p">' + riskCell + '</p>' +
      '</div>' +

      '<div class="sheet-sec"><h3>六、初步诊断与转诊意见</h3>' +
        '<p class="sheet-p"><b>初步诊断：</b>' + esc(st.diagnosis || '待明确') + '</p>' +
        '<p class="sheet-p"><b>转诊去向：</b>心胸外科 / 血管外科 · 介入中心（会诊）　<b>交接方式：</b>电子摘要 + 口头 SBAR 双确认</p>' +
      '</div>' +

      '<div class="sheet-sec"><h3>七、交接注意事项</h3>' +
        '<ul class="sheet-list">' + sheetCautions().map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
      '</div>' +

      '<div class="sheet-sign">' +
        '<div>转出科室 / 医师签字：<em>　</em></div>' +
        '<div>接收科室 / 医师签字：<em>　</em></div>' +
        '<div>转出时间：' + A.nowHM() + '　日期：' + stamp.slice(0, 10) + '</div>' +
        '<div>患者 / 家属签字：<em>　</em>　关系：<em>　</em></div>' +
      '</div>' +

      '<div class="sheet-foot"><span>本单由系统根据已录入信息自动生成，未录入项以「—」或「未填写」标注。</span><span>' + esc(mrn) + '</span></div>' +
    '</div>';
  }

  function panelReferral() {
    var st = s(), p = st.patient || {};
    var vital = A.latestVital();
    var risks = A.computeRisks().filter(function (r) { return r.state === 'confirmed'; });
    var labs = A.LABS.filter(function (d) {
      var v = A.labVal(d.id);
      return v != null;
    }).map(function (d) {
      var v = A.labVal(d.id);
      var j = A.judgeValue(v, d);
      return d.name + ' ' + st.labs[d.id].value + ' ' + d.unit + (j && j.cls !== 'ok' ? '（' + j.text + '）' : '');
    });

    var sbar = [
      ['S', '现状', p.name + '，' + p.sex + ' ' + p.age + ' 岁，' + (p.complaint || '主诉未填')],
      ['B', '背景', (st.history.length ? st.history.join('、') : '既往史未填') +
        (vital ? '；最近一次血压 ' + (vital.sbp || '—') + '/' + (vital.dbp || '—') + ' mmHg，心率 ' + (vital.hr || '—') + ' 次/分，SpO₂ ' + (vital.spo2 || '—') + '%' : '')],
      ['A', '评估', (labs.length ? '检验：' + labs.join('；') : '检验尚未回报') +
        (risks.length ? '。已确认线索：' + risks.map(function (r) { return r.title; }).join('、') : '')],
      ['R', '建议', st.diagnosis ? '初步诊断「' + st.diagnosis + '」，建议按相应路径处置。' : '初步诊断待明确，建议急诊完善 CTA 与心功能评估。']
    ];

    var sbarHtml = '<div class="sbar">' + sbar.map(function (r) {
      return '<div class="sbar-row"><span class="sbar-k">' + r[0] + '</span>' +
        '<span class="sbar-l">' + r[1] + '</span>' +
        '<span class="sbar-v">' + esc(r[2]) + '</span></div>';
    }).join('') + '</div>';

    var atts = [
      ['12 导联心电图', examHas('ecg') ? '已附' : '未生成', (st.exams.ecg && st.exams.ecg.photos || []).length],
      ['床旁心脏彩超', examHas('echo') ? '已附' : '未生成', (st.exams.echo && st.exams.echo.photos || []).length],
      ['实验室检验报告', A.LABS.some(function (d) { return A.labVal(d.id) != null; }) ? '已附' : '未生成', 0],
      ['影像资料', (examHas('cta') || examHas('ctpa') || examHas('cxr')) ? '已附' : '未生成',
        photoCount() - ((st.exams.ecg && st.exams.ecg.photos || []).length) - ((st.exams.echo && st.exams.echo.photos || []).length)],
      ['用药与处置记录', st.preCare.length ? '已附' : '未生成', 0]
    ];
    var attHtml = '<div class="table-wrap"><table class="tbl"><thead><tr><th>附件</th><th>状态</th><th>报告单原图</th><th>来源</th></tr></thead><tbody>' +
      atts.map(function (a) {
        return '<tr><td>' + a[0] + '</td><td><span class="tag ' + (a[1] === '已附' ? 'green' : '') + '">' + a[1] + '</span></td>' +
          '<td class="mono">' + (a[2] > 0 ? a[2] + ' 张' : '—') + '</td><td>' + src('院内系统') + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    var handover = '<div class="handover">' +
      '<div class="ho-row"><span>交接对象</span><b>心胸外科 · 血管外科（会诊）</b></div>' +
      '<div class="ho-row"><span>交接方式</span><b>电子摘要 + 口头 SBAR 双确认</b></div>' +
      '<div class="ho-row"><span>待核实信息</span><b>' + (st.labs.trop && st.labs.trop.value && !st.labs.trop.reviewed ? '肌钙蛋白待复核' : '无') + '</b></div>' +
      (st.referral.handover
        ? '<div class="ho-done"><i>✓</i> 已完成交接确认 · ' + A.nowHM() + ' · 李 · 急诊</div>'
        : '<button class="btn btn-primary" type="button" data-act="referral-handover">确认交接</button>') +
    '</div>';

    var tools = '<div class="sheet-tools">' +
        '<button class="btn btn-primary" type="button" data-act="preview-handover">预览交接单</button>' +
        '<button class="btn" type="button" data-act="print-handover">打印交接单</button>' +
        '<span class="hint-line" style="margin:0;align-self:center">按已录入信息自动生成，含异常指标与注意事项</span>' +
      '</div>';

    return sec('转诊交接单', tools, '可打印 A4') +
      sec('电子交接摘要 · SBAR', sbarHtml, '自动生成，随患者流转') +
      sec('结果附件', attHtml, atts.filter(function (a) { return a[1] === '已附'; }).length + ' 项') +
      sec('交接确认', handover, st.referral.handover ? '已完成' : '待确认') +
      '<p class="hint-line">摘要中的「待核实」会随附提示接收方：该结果尚未复核，不能作为确诊依据。</p>';
  }

  /* ============ 7. 用药核对 ============ */
  var QUICK_MEDS = [
    ['阿司匹林肠溶片', '100 mg · qd'],
    ['硫酸氢氯吡格雷', '75 mg · qd'],
    ['阿托伐他汀钙', '20 mg · qn'],
    ['美托洛尔缓释片', '47.5 mg · qd'],
    ['培哚普利', '4 mg · qd'],
    ['单硝酸异山梨酯', '20 mg · bid'],
    ['雷贝拉唑', '10 mg · qd']
  ];

  function panelMeds() {
    var st = s();
    var rows = st.meds.map(function (m, i) {
      return '<tr>' +
        '<td><b>' + esc(m.name) + '</b></td>' +
        '<td class="mono">' + esc(m.dose) + '</td>' +
        '<td>' + esc(m.actual) + '</td>' +
        '<td><span class="tag ' + (m.state === 'done' ? 'green' : 'amber') + '">' + (m.state === 'done' ? '已核对' : '待核实') + '</span></td>' +
        '<td class="td-acts">' +
          (m.state === 'done' ? '' : '<button class="mini" type="button" data-act="med-verify" data-idx="' + i + '">核实</button>') +
          '<button class="mini is-quiet" type="button" data-act="med-remove" data-idx="' + i + '">删除</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    var table = st.meds.length
      ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>药物</th><th>医嘱用法</th><th>实际服药（自述）</th><th>状态</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : empty('尚未录入出院用药。添加后逐项核实患者实际服药情况，差异项会保留原因。');

    var form = '<div class="med-form">' +
      '<div class="mf-row">' +
        '<input id="medName" placeholder="药物名称，如 阿司匹林肠溶片">' +
        '<input id="medDose" placeholder="单次剂量，如 100 mg">' +
        '<select id="medFreq">' +
          ['qd 每日 1 次', 'bid 每日 2 次', 'tid 每日 3 次', 'qn 每晚 1 次', 'q8h 每 8 小时', 'prn 必要时', '按医嘱'].map(function (f, i) {
            return '<option' + (i === 0 ? ' selected' : '') + '>' + f + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="mf-row" style="grid-template-columns:1fr auto">' +
        '<input id="medActual" placeholder="实际服药情况（患者/家属自述），如 偶尔漏服、已自行停药">' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="add-med">＋ 添加药物</button>' +
      '</div>' +
      '<div class="mf-foot">' +
        '<div class="mf-quick"><span>常用药物：</span>' + QUICK_MEDS.map(function (q) {
          return '<button class="pick" type="button" data-act="quick-med" data-name="' + esc(q[0]) + '" data-dose="' + esc(q[1]) + '">' + esc(q[0].replace(/(肠溶片|缓释片|钙)$/, '')) + '</button>';
        }).join('') + '</div>' +
        '<span class="hint-line" style="margin:0">可连续添加多种</span>' +
      '</div>' +
    '</div>';

    var pending = st.meds.filter(function (m) { return m.state === 'pending'; }).length;
    var sum = '<div class="med-sum"><span>清单 <b>' + st.meds.length + '</b> 项</span>' +
      '<span>已核对 <b>' + (st.meds.length - pending) + '</b></span>' +
      '<span class="' + (pending ? 'is-warn' : '') + '">待核实 <b>' + pending + '</b></span></div>';

    var addMore = st.meds.length
      ? '<div class="sec-actions" style="margin:10px 0 0"><button class="btn btn-sm" type="button" data-act="focus-med">＋ 再添加一种药物</button></div>'
      : '';

    return sec('录入药物', form, '出院带药清单 · 支持多种') +
      sec('核对清单', st.meds.length ? sum + table + addMore : table, '') +
      '<p class="hint-line">「实际服药」为患者或家属自述，来源需标注；差异项必须由医师或药师核实并记录原因。</p>';
  }

  /* ============ 8. 随访 ============ */
  function panelFollowup() {
    var st = s();
    var f = st.followup;

    var plan = '<div class="fu-plan">' +
      '<div class="fu-plan-head"><b>随访计划</b>' +
        '<button class="btn btn-sm' + (f.plan ? '' : ' btn-primary') + '" type="button" data-act="toggle-followup-plan">' + (f.plan ? '取消计划' : '建立计划') + '</button>' +
      '</div>' +
      (f.plan ? '<div class="fu-nodes">' +
        [['1 周', '出院后首次随访：症状、血压、用药依从性'], ['1 个月', '复查心功能、调整用药'], ['3 个月', '评估远期风险与康复']].map(function (n, i) {
          var done = f.records.length > i;
          return '<div class="fu-node' + (done ? ' is-done' : '') + '"><span class="fu-dot"></span>' +
            '<div><b>' + n[0] + '</b><em>' + n[1] + '</em></div>' +
            '<span class="tag ' + (done ? 'green' : '') + '">' + (done ? '已完成' : '待随访') + '</span></div>';
        }).join('') + '</div>' : '<p class="hint-line">未建立计划。建议按 1 周 / 1 个月 / 3 个月设置随访节点。</p>') +
    '</div>';

    var form = '<div class="fu-form">' +
      '<div class="fu-row"><label>血压<input id="fuSbp" type="number" placeholder="收缩压"> / <input id="fuDbp" type="number" placeholder="舒张压"></label>' +
      '<span class="fu-unit">mmHg</span></div>' +
      '<textarea id="fuNote" rows="2" placeholder="随访情况：症状、服药、复诊安排…"></textarea>' +
      '<div class="fu-acts"><button class="btn btn-sm btn-primary" type="button" data-act="add-followup">保存随访记录</button>' +
      '<button class="btn btn-sm" type="button" data-act="return-records"' + (f.returned ? ' disabled' : '') + '>' + (f.returned ? '已回传' : '回传区域胸痛中心') + '</button></div>' +
    '</div>';

    var list = f.records.length
      ? '<div class="fu-list">' + f.records.slice().reverse().map(function (r) {
          return '<div class="fu-item"><div class="fu-item-top"><b>' + r.date + ' ' + r.time + '</b>' +
            (r.abnormal ? '<span class="tag amber">异常反馈 · 待医生确认</span>' : '<span class="tag green">已确认</span>') + '</div>' +
            '<p>' + esc(r.note) + '</p>' +
            (r.sbp ? '<span class="fu-bp">血压 ' + r.sbp + '/' + r.dbp + ' mmHg</span>' : '') + '</div>';
        }).join('') + '</div>'
      : empty('尚无随访记录。建立计划后，每条记录都会带上来源与医生确认状态。');

    return sec('计划', plan, f.plan ? '3 个节点' : '未建立') +
      sec('记录随访', form, '') +
      sec('随访记录', list, f.records.length + ' 条') +
      '<p class="hint-line">患者自述的异常（如胸闷、漏服药）先进入「待确认」，由医生确认后才计入随访结论。</p>';
  }

  window.PANELS = {
    patient: panelPatient,
    vitals: panelVitals,
    exams: panelExams,
    risk: panelRisk,
    receive: panelReceive,
    referral: panelReferral,
    meds: panelMeds,
    followup: panelFollowup,
    modelInfo: modelInfo,
    handoverSheet: handoverSheet
  };

  window.__initPanels = function (app) { A = app; };

})();
