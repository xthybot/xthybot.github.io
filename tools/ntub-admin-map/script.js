const taskItems = [
  {
    id: 'task-acad',
    type: '註冊 / 學籍',
    title: '註冊、學籍、選課、成績、學生證',
    desc: '大一新生最常接觸的核心行政事務。若是課表、學分、學生證、成績或學籍問題，通常先找教務處。',
    place: '教務處｜行政大樓 3 樓｜已確認',
    url: 'https://acad.ntub.edu.tw/'
  },
  {
    id: 'task-stud',
    type: '學務 / 輔導',
    title: '獎助學金、就學貸款、請假、住宿與生活輔導',
    desc: '和學生生活最相關的行政窗口。若是助學、生活輔導、住宿、請假等，多數資訊從學務處開始查。',
    place: '學務處｜六藝樓 1 樓｜已確認',
    url: 'https://stud.ntub.edu.tw/'
  },
  {
    id: 'task-military',
    type: '兵役 / 校安',
    title: '兵役、緩徵、校安與緊急協助',
    desc: '男同學常會碰到兵役折抵、緩徵等文件需求，也包含校安與緊急支援。',
    place: '軍訓室｜五育樓 1 樓｜已確認',
    url: 'https://meo.ntub.edu.tw/'
  },
  {
    id: 'task-inc',
    type: '校園帳號',
    title: '校園網路、系統登入、帳號密碼',
    desc: '新生需要登入校內系統、無線網路或資訊服務時，資訊與網路中心是重點單位。',
    place: '資訊與網路中心｜承曦樓 7 樓 704｜已確認',
    url: 'https://inc.ntub.edu.tw/'
  },
  {
    id: 'task-imd',
    type: '系上窗口',
    title: '資管系課程、系務與系辦協助',
    desc: '遇到系上課程安排、導師、系務通知與資管系相關問題，可先找系辦。',
    place: '資訊管理系系辦｜行政大樓 4 樓 401｜已確認',
    url: 'https://imd.ntub.edu.tw/'
  },
  {
    id: 'task-life',
    type: '生活設施',
    title: '圖書館、學餐、影印與日常動線',
    desc: '除了行政辦公室，新生日常最常找的就是圖書館、學餐、影印與金融設施。',
    place: '圖書館｜圖書館；學餐 / 影印部｜五育樓 B1｜已確認',
    url: 'https://library.ntub.edu.tw/'
  }
];

const places = [
  { name:'教務處', category:'行政單位', status:'已確認', statusClass:'ok', location:'臺北校區 行政大樓 3 樓', use:'註冊、學籍、選課、成績、學生證', url:'https://acad.ntub.edu.tw/' },
  { name:'總務處', category:'行政單位', status:'已確認', statusClass:'ok', location:'臺北校區 行政大樓 1 樓', use:'校務行政、場地與部分庶務資訊', url:'https://gen.ntub.edu.tw/' },
  { name:'資訊與網路中心', category:'行政單位', status:'已確認', statusClass:'ok', location:'臺北校區 承曦樓 7 樓 704', use:'校園網路、系統帳號、資訊服務', url:'https://inc.ntub.edu.tw/' },
  { name:'軍訓室', category:'行政單位', status:'已確認', statusClass:'ok', location:'臺北校區 五育樓 1 樓', use:'兵役、校安、緊急協助', url:'https://meo.ntub.edu.tw/' },
  { name:'資訊管理系系辦', category:'系上窗口', status:'已確認', statusClass:'ok', location:'臺北校區 行政大樓 4 樓 401', use:'資管系課程、系務、系上行政', url:'https://imd.ntub.edu.tw/' },
  { name:'圖書館', category:'常用設施', status:'已確認', statusClass:'ok', location:'臺北校區 圖書館', use:'這一區主要是圖書館；進入通常需要刷學生證，或以身分證辦理入館。', url:'https://library.ntub.edu.tw/' },
  { name:'學務處', category:'行政單位', status:'已確認', statusClass:'ok', location:'臺北校區 六藝樓 1 樓', use:'獎助學金、就學貸款、請假、住宿與生活輔導', url:'https://stud.ntub.edu.tw/' },
  { name:'學餐 / 影印部', category:'生活設施', status:'已確認', statusClass:'ok', location:'臺北校區 五育樓 B1', use:'日常飲食與列印影印常用動線', url:'https://www.ntub.edu.tw/' }
];

function makeQrPanel(url, name) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  return `
    <div class="qr-panel">
      <img src="${qr}" alt="${name} QR Code">
      <p class="small"><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>
    </div>
  `;
}

const taskGrid = document.getElementById('taskGrid');
const placeGrid = document.getElementById('placeGrid');
const taskOverlay = document.getElementById('taskOverlay');
const closeOverlay = document.getElementById('closeOverlay');

taskItems.forEach(item => {
  const el = document.createElement('article');
  el.className = 'task-card';
  el.id = item.id;
  el.innerHTML = `
    <span class="tag">${item.type}</span>
    <h3>${item.title}</h3>
    <p>${item.desc}</p>
    <div class="meta">${item.place}</div>
    <div class="action-row">
      <a class="link-btn" href="${item.url}" target="_blank" rel="noopener noreferrer">前往官網</a>
    </div>
  `;
  taskGrid.appendChild(el);
});

places.forEach(item => {
  const el = document.createElement('article');
  el.className = 'place-card';
  el.innerHTML = `
    <span class="tag">${item.category}</span>
    <h3>${item.name}</h3>
    <div class="meta"><span class="status ${item.statusClass}">${item.status}</span><br>${item.location}</div>
    <p>${item.use}</p>
    <div class="action-row">
      <button class="toggle-btn">點擊檢視 QR Code</button>
      <a class="link-btn" href="${item.url}" target="_blank" rel="noopener noreferrer">前往官網</a>
    </div>
    ${makeQrPanel(item.url, item.name)}
  `;
  placeGrid.appendChild(el);
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('toggle-btn')) {
    const panel = e.target.closest('.task-card, .place-card').querySelector('.qr-panel');
    panel.classList.toggle('open');
    e.target.textContent = panel.classList.contains('open') ? '收合 QR Code' : '點擊檢視 QR Code';
    return;
  }

  const building = e.target.closest('.clickable-building');
  if (!building) return;

  const targetId = building.dataset.target;
  const card = document.getElementById(targetId);
  if (!card) return;

  taskOverlay.classList.remove('hidden');
  document.querySelectorAll('.task-card').forEach(el => {
    el.style.display = el.id === targetId ? 'block' : 'none';
    el.classList.remove('highlight');
  });
  card.classList.add('highlight');
  // keep overlay in-place above the map without scrolling the page

  const panel = card.querySelector('.qr-panel');
  const btn = card.querySelector('.toggle-btn');
  if (panel && !panel.classList.contains('open')) {
    panel.classList.add('open');
    if (btn) btn.textContent = '收合 QR Code';
  }
});

function closeTaskOverlay() {
  taskOverlay.classList.add('hidden');
  document.querySelectorAll('.task-card').forEach(el => {
    el.style.display = 'block';
    el.classList.remove('highlight');
  });
}

closeOverlay?.addEventListener('click', closeTaskOverlay);

taskOverlay?.addEventListener('click', (e) => {
  if (e.target === taskOverlay) closeTaskOverlay();
});

document.querySelector('#taskOverlay .task-overlay-inner')?.addEventListener('click', (e) => {
  e.stopPropagation();
});
