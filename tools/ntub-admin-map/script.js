const tasks = [
  {
    type: '註冊 / 學籍',
    title: '註冊、學籍、休退學、成績與選課問題',
    desc: '大一新生最常接觸的核心行政事務，通常先找教務處。若是課表、學分、學生證或學籍疑問，這裡是第一站。'
  },
  {
    type: '學務 / 支援',
    title: '獎助學金、就學貸款、請假、生活輔導',
    desc: '和學生生活最相關的行政窗口。新生若遇到助學、住宿、請假、生活協助等問題，通常從學務處開始查。'
  },
  {
    type: '兵役 / 校安',
    title: '兵役相關、校安與緊急協助',
    desc: '男同學常會碰到兵役折抵、緩徵或相關文件問題，可優先查看軍訓室／校安服務組資訊。'
  },
  {
    type: '校園帳號',
    title: '校園網路、系統帳號、密碼與資訊服務',
    desc: '需要登入校內系統、校園網路、電腦資源時，資訊與網路中心是重點單位。'
  },
  {
    type: '系上窗口',
    title: '資管系系辦、課程與系務協助',
    desc: '遇到系上課程安排、導師、選課建議或系務通知，可先找資訊管理系系辦。'
  },
  {
    type: '生活設施',
    title: 'ATM、學餐、影印、圖書館與常用設施',
    desc: '除了行政辦公室，新生最常找的就是生活動線相關設施，先知道大概在哪區會省很多時間。'
  }
];

const places = [
  {
    name: '教務處',
    category: '行政單位',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 行政大樓 3 樓',
    use: '註冊、學籍、選課、成績、學生證等新生常見學務行政',
    url: 'https://acad.ntub.edu.tw/'
  },
  {
    name: '總務處',
    category: '行政單位',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 行政大樓 1 樓',
    use: '校務行政、場地、庶務；部分繳費 / 出納資訊可由此延伸查詢',
    url: 'https://gen.ntub.edu.tw/'
  },
  {
    name: '資訊與網路中心',
    category: '行政單位',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 承曦樓 7 樓',
    use: '校園網路、資訊系統、帳號與數位服務',
    url: 'https://inc.ntub.edu.tw/'
  },
  {
    name: '軍訓室',
    category: '行政單位',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 五育樓 1 樓',
    use: '兵役、校安、緊急協助等',
    url: 'https://meo.ntub.edu.tw/'
  },
  {
    name: '資訊管理系系辦',
    category: '系上窗口',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 行政大樓 4 樓',
    use: '系上課程、系務、導師與資管系新生常見問題',
    url: 'https://imd.ntub.edu.tw/'
  },
  {
    name: '圖書館',
    category: '常用設施',
    status: '已確認',
    statusClass: 'ok',
    location: '臺北校區 圖書館',
    use: '借書、自習、查資料；部分列印與資訊查詢需求也常從這裡開始',
    url: 'https://library.ntub.edu.tw/'
  },
  {
    name: '學務處',
    category: '行政單位',
    status: '待校內地圖校正',
    statusClass: 'pending',
    location: '官方頁面可查處室，但臺北校區精確位置待校正',
    use: '獎助學金、就學貸款、請假、住宿、衛保與學生生活相關資訊',
    url: 'https://stud.ntub.edu.tw/'
  },
  {
    name: '學餐',
    category: '生活設施',
    status: '待校內地圖校正',
    statusClass: 'pending',
    location: '需依校內平面圖或到校後實地確認',
    use: '新生日常最常用的餐飲補給點',
    url: 'https://www.ntub.edu.tw/'
  },
  {
    name: 'ATM / 金融服務',
    category: '生活設施',
    status: '待校內地圖校正',
    statusClass: 'pending',
    location: '需依校內平面圖或到校後實地確認',
    use: '繳費、提款、生活開銷常用',
    url: 'https://www.ntub.edu.tw/'
  },
  {
    name: '影印 / 列印點',
    category: '生活設施',
    status: '待校內地圖校正',
    statusClass: 'pending',
    location: '建議到校後依圖書館或教學大樓公告確認',
    use: '列印講義、報告、文件影印',
    url: 'https://library.ntub.edu.tw/'
  }
];

const qrOffices = [
  ['教務處', 'https://acad.ntub.edu.tw/'],
  ['學務處', 'https://stud.ntub.edu.tw/'],
  ['總務處', 'https://gen.ntub.edu.tw/'],
  ['資訊與網路中心', 'https://inc.ntub.edu.tw/'],
  ['軍訓室', 'https://meo.ntub.edu.tw/'],
  ['圖書館', 'https://library.ntub.edu.tw/'],
  ['資訊管理系', 'https://imd.ntub.edu.tw/'],
  ['學校首頁 / 校區資訊', 'https://www.ntub.edu.tw/']
];

const taskGrid = document.getElementById('taskGrid');
const placeGrid = document.getElementById('placeGrid');
const qrGrid = document.getElementById('qrGrid');

tasks.forEach(t => {
  const div = document.createElement('article');
  div.className = 'card';
  div.innerHTML = `<span class="tag">${t.type}</span><h3>${t.title}</h3><p>${t.desc}</p>`;
  taskGrid.appendChild(div);
});

places.forEach(p => {
  const div = document.createElement('article');
  div.className = 'place-card';
  div.innerHTML = `
    <span class="tag">${p.category}</span>
    <h3>${p.name}</h3>
    <div class="meta"><span class="status ${p.statusClass}">${p.status}</span><br>${p.location}</div>
    <p>${p.use}</p>
    <p style="margin-top:12px"><a href="${p.url}" target="_blank" rel="noopener noreferrer">前往官方網站</a></p>
  `;
  placeGrid.appendChild(div);
});

qrOffices.forEach(([name, url]) => {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  const div = document.createElement('article');
  div.className = 'qr-card';
  div.innerHTML = `
    <h3>${name}</h3>
    <img src="${qr}" alt="${name} QR Code">
    <p class="small"><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>
  `;
  qrGrid.appendChild(div);
});
