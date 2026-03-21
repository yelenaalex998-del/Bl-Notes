let currentUser = null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;

// CONFIGURAÇÃO DE ARRASTAR (DRAG & DROP) ULTRA ESTÁVEL
const gridElement = document.getElementById('mangaGrid');
if (gridElement) {
    new Sortable(gridElement, {
        animation: 250,
        delay: 400, // Toque longo de 0.4s
        delayOnTouchOnly: true, 
        touchStartThreshold: 10,
        onStart: function() {
            if (navigator.vibrate) navigator.vibrate(50);
        },
        onEnd: function() {
            const newItems = [];
            document.querySelectorAll('.card').forEach(card => {
                newItems.push(userAppData.items[card.dataset.index]);
            });
            userAppData.items = newItems;
            renderGrid();
            saveData();
        }
    });
}

function switchAuth(screen) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById(`${screen}-box`).classList.remove('hidden');
}

function handleAuth(type) {
    if(type === 'register') {
        const u = document.getElementById('user-reg').value.trim();
        const p = document.getElementById('pass-reg').value.trim();
        localStorage.setItem(`user_${u}`, JSON.stringify({ pass: p, data: userAppData }));
        switchAuth('login');
    } else {
        const u = document.getElementById('user-login').value.trim();
        const p = document.getElementById('pass-login').value.trim();
        const stored = JSON.parse(localStorage.getItem(`user_${u}`));
        if(stored && stored.pass === p) { currentUser = u; userAppData = stored.data; startApp(); }
    }
}

function startApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('list-title').value = userAppData.title || "Bl Notes";
    changeTheme(userAppData.theme || '#e2e2ff', false);
    renderGrid();
}

function changeTheme(color, save = true) {
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
    if(save) saveData();
    const customCircle = document.getElementById('customColorCircle');
    if(customCircle) customCircle.style.background = color;
}

function renderGrid() {
    const grid = document.getElementById('mangaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    userAppData.items.forEach((m, i) => {
        grid.innerHTML += `
            <div class="card" data-index="${i}" onclick="showDetails(${i})">
                <img src="${m.img}">
                <div class="card-info">
                    <span class="tag tag-cat">${m.cat}</span>
                    <span class="tag tag-status">${m.status}</span>
                    <div class="manga-name">${m.name}</div>
                    <div style="font-size:0.6rem; color:#888;">Cap: ${m.caps}</div>
                </div>
            </div>
        `;
    });
}

function showDetails(i) {
    const m = userAppData.items[i];
    document.getElementById('detailContent').innerHTML = `
        <img src="${m.img}" style="width:170px; height:250px; object-fit:cover; border-radius:20px; margin-bottom:15px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
        <h2>${m.name}</h2>
        <div style="margin: 10px 0;">
            <span class="tag tag-cat" style="font-size:0.8rem; padding: 5px 12px;">${m.cat}</span>
            <span class="tag tag-status" style="font-size:0.8rem; padding: 5px 12px;">${m.status}</span>
        </div>
        <p>Capítulo: ${m.caps}</p>
    `;
    document.getElementById('btnVerOnline').onclick = () => window.open(m.link, '_blank');
    document.getElementById('btnEdit').onclick = () => {
        editingIndex = i;
        document.getElementById('mangaName').value = m.name;
        document.getElementById('mangaCat').value = m.cat;
        document.getElementById('mangaStatus').value = m.status;
        document.getElementById('mangaCaps').value = m.caps;
        document.getElementById('mangaLink').value = m.link;
        closeModal('detailModal'); openModal('mangaModal');
    };
    document.getElementById('btnDelete').onclick = () => {
        if(confirm("Excluir?")) { userAppData.items.splice(i, 1); renderGrid(); saveData(); closeModal('detailModal'); }
    };
    openModal('detailModal');
}

function saveData() {
    if(!currentUser) return;
    userAppData.title = document.getElementById('list-title').value;
    const acc = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    acc.data = userAppData;
    localStorage.setItem(`user_${currentUser}`, JSON.stringify(acc));
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddModal() { editingIndex = -1; openModal('mangaModal'); }

function saveManga() {
    const file = document.getElementById('mangaImgInput').files[0];
    const data = {
        name: document.getElementById('mangaName').value,
        cat: document.getElementById('mangaCat').value,
        status: document.getElementById('mangaStatus').value,
        caps: document.getElementById('mangaCaps').value,
        link: document.getElementById('mangaLink').value || "#"
    };
    if(file) {
        const reader = new FileReader();
        reader.onload = () => { 
            data.img = reader.result; 
            if(editingIndex > -1) userAppData.items[editingIndex] = data;
            else userAppData.items.push(data);
            renderGrid(); saveData(); closeModal('mangaModal'); 
        };
        reader.readAsDataURL(file);
    } else if(editingIndex > -1) {
        data.img = userAppData.items[editingIndex].img;
        userAppData.items[editingIndex] = data;
        renderGrid(); saveData(); closeModal('mangaModal');
    }
}

function loadBanner(event) {
    const reader = new FileReader();
    reader.onload = () => {
        userAppData.banner = reader.result;
        document.getElementById('bannerImg').src = reader.result;
        document.getElementById('bannerImg').style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
        saveData();
    };
    reader.readAsDataURL(event.target.files[0]);
}