let currentUser = localStorage.getItem('lastUser') || null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;

// VERIFICAÇÃO DE LOGIN AUTOMÁTICO AO ABRIR O APP
window.onload = () => {
    if (currentUser) {
        const stored = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        if (stored) {
            userAppData = stored.data;
            startApp();
        }
    }
};

// CONFIGURAÇÃO DE ARRASTAR (DRAG & DROP) MELHORADA
const gridElement = document.getElementById('mangaGrid');
if (gridElement) {
    new Sortable(gridElement, {
        animation: 200,
        delay: 500, // Meio segundo segurando para não bugar o scroll
        delayOnTouchOnly: true,
        touchStartThreshold: 20,
        forceFallback: true, // Melhora o comportamento em navegadores mobile
        onStart: function() { if (navigator.vibrate) navigator.vibrate(40); },
        onEnd: function() {
            const newItems = [];
            document.querySelectorAll('.card').forEach(card => {
                const idx = card.getAttribute('data-index');
                newItems.push(userAppData.items[idx]);
            });
            userAppData.items = newItems;
            renderGrid();
            saveData();
        }
    });
}

// SISTEMA DE AUTH
function handleAuth(type) {
    if(type === 'register') {
        const u = document.getElementById('user-reg').value.trim();
        const p = document.getElementById('pass-reg').value.trim();
        const q = document.getElementById('recovery-q').value.trim();
        if(!u || !p || !q) return alert("Preencha tudo!");
        localStorage.setItem(`user_${u}`, JSON.stringify({ pass: p, recovery: q, data: userAppData }));
        alert("Conta criada!");
        switchAuth('login');
    } else {
        const u = document.getElementById('user-login').value.trim();
        const p = document.getElementById('pass-login').value.trim();
        const stored = JSON.parse(localStorage.getItem(`user_${u}`));
        if(stored && stored.pass === p) { 
            currentUser = u; 
            localStorage.setItem('lastUser', u); // Salva que você logou
            userAppData = stored.data; 
            startApp(); 
        } else { alert("Erro no login!"); }
    }
}

function logout() {
    localStorage.removeItem('lastUser');
    location.reload();
}

function startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('list-title').value = userAppData.title || "Bl Notes";
    
    if(userAppData.banner) {
        const img = document.getElementById('bannerImg');
        img.src = userAppData.banner;
        img.style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
    }
    
    changeTheme(userAppData.theme || '#e2e2ff', false);
    renderGrid();
}

function changeTheme(color, save = true) {
    if(!color.startsWith('#')) color = '#' + color; // Garante o #
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
    document.getElementById('hexColorInput').value = color.toUpperCase();
    if(save) saveData();
    const circle = document.getElementById('customColorCircle');
    if(circle) circle.style.background = color;
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

function saveData() {
    if(!currentUser) return;
    userAppData.title = document.getElementById('list-title').value;
    const acc = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    if(acc) {
        acc.data = userAppData;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(acc));
    }
}

// RESTANTE DAS FUNÇÕES (MESMA COISA)
function switchAuth(screen) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById(`${screen}-box`).classList.remove('hidden');
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
    
    const finalize = (imgData) => {
        if(imgData) data.img = imgData;
        if(editingIndex > -1) userAppData.items[editingIndex] = data;
        else userAppData.items.push(data);
        renderGrid(); saveData(); closeModal('mangaModal');
    };

    if(file) {
        const reader = new FileReader();
        reader.onload = () => finalize(reader.result);
        reader.readAsDataURL(file);
    } else {
        finalize(editingIndex > -1 ? userAppData.items[editingIndex].img : "https://via.placeholder.com/150");
    }
}

function showDetails(i) {
    const m = userAppData.items[i];
    document.getElementById('detailContent').innerHTML = `
        <img src="${m.img}" style="width:170px; height:250px; object-fit:cover; border-radius:20px; margin-bottom:15px;">
        <h2>${m.name}</h2>
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

function forgotPassword() {
    const u = prompt("Usuário:");
    const stored = JSON.parse(localStorage.getItem(`user_${u}`));
    if(!stored) return alert("Não achei!");
    const ans = prompt(`Segurança: ${stored.recovery}`);
    if(ans === stored.recovery) alert(`Senha: ${stored.pass}`);
    else alert("Errado!");
}