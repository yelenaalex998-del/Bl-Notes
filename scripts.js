// VARIÁVEIS GLOBAIS
let currentUser = localStorage.getItem('lastUser') || null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;

// FUNÇÃO DE INICIALIZAÇÃO (Roda assim que abre o site)
window.onload = () => {
    if (currentUser) {
        const stored = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        if (stored) {
            userAppData = stored.data || userAppData;
            startApp();
        } else {
            // Se o usuário existe mas os dados sumiram, manda pro login
            document.getElementById('auth-screen').classList.remove('hidden');
        }
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
    }
};

// LOGIN E REGISTRO
function handleAuth(type) {
    const u = document.getElementById(type === 'register' ? 'user-reg' : 'user-login').value.trim();
    const p = document.getElementById(type === 'register' ? 'pass-reg' : 'pass-login').value.trim();

    if (type === 'register') {
        const q = document.getElementById('recovery-q').value.trim();
        if (!u || !p || !q) return alert("Preencha todos os campos!");
        
        const userData = { pass: p, recovery: q, data: { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] } };
        localStorage.setItem(`user_${u}`, JSON.stringify(userData));
        alert("Conta criada com sucesso!");
        switchAuth('login');
    } else {
        const stored = JSON.parse(localStorage.getItem(`user_${u}`));
        if (stored && stored.pass === p) {
            currentUser = u;
            localStorage.setItem('lastUser', u);
            userAppData = stored.data;
            startApp();
        } else {
            alert("Usuário ou senha incorretos!");
        }
    }
}

function startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('list-title').value = userAppData.title || "Bl Notes";
    
    if (userAppData.banner) {
        const img = document.getElementById('bannerImg');
        img.src = userAppData.banner;
        img.style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
    }
    
    changeTheme(userAppData.theme || '#e2e2ff', false);
    renderGrid();
}

// SALVAMENTO E RENDERIZAÇÃO
function saveData() {
    if (!currentUser) return;
    userAppData.title = document.getElementById('list-title').value;
    const account = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    if (account) {
        account.data = userAppData;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(account));
    }
}

function renderGrid() {
    const grid = document.getElementById('mangaGrid');
    if (!grid) return;
    grid.innerHTML = '';
    userAppData.items.forEach((m, i) => {
        grid.innerHTML += `
            <div class="card" data-index="${i}" onclick="showDetails(${i})">
                <img src="${m.img}">
                <div class="card-info">
                    <span class="tag tag-cat">${m.cat}</span>
                    <span class="tag tag-status">${m.status}</span>
                    <div class="manga-name">${m.name}</div>
                    <div style="font-size:0.6rem; color:#888; padding: 4px;">Cap: ${m.caps}</div>
                </div>
            </div>`;
    });
}

// MANIPULAÇÃO DE MANGÁS
function saveManga() {
    const name = document.getElementById('mangaName').value;
    if (!name) return alert("Nome é obrigatório!");

    const data = {
        name: name,
        cat: document.getElementById('mangaCat').value || "Geral",
        status: document.getElementById('mangaStatus').value || "Lendo",
        caps: document.getElementById('mangaCaps').value || "0",
        link: document.getElementById('mangaLink').value || "#",
        img: (editingIndex > -1) ? userAppData.items[editingIndex].img : "https://via.placeholder.com/150"
    };

    const file = document.getElementById('mangaImgInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => { data.img = reader.result; finalizeMangaSave(data); };
        reader.readAsDataURL(file);
    } else {
        finalizeMangaSave(data);
    }
}

function finalizeMangaSave(data) {
    if (editingIndex > -1) userAppData.items[editingIndex] = data;
    else userAppData.items.push(data);
    renderGrid();
    saveData();
    closeModal('mangaModal');
}

// OUTRAS FUNÇÕES
function changeTheme(color, save = true) {
    if (!color.startsWith('#')) color = '#' + color;
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
    if (document.getElementById('hexColorInput')) document.getElementById('hexColorInput').value = color.toUpperCase();
    if (save) saveData();
}

function logout() { localStorage.removeItem('lastUser'); location.reload(); }
function switchAuth(screen) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById(`${screen}-box`).classList.remove('hidden');
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddModal() { editingIndex = -1; openModal('mangaModal'); }

function showDetails(i) {
    editingIndex = i;
    const m = userAppData.items[i];
    document.getElementById('detailContent').innerHTML = `
        <img src="${m.img}" style="width:170px; height:250px; object-fit:cover; border-radius:20px;">
        <h2>${m.name}</h2><p>Capítulo: ${m.caps}</p>`;
    document.getElementById('btnVerOnline').onclick = () => window.open(m.link, '_blank');
    document.getElementById('btnEdit').onclick = () => {
        document.getElementById('mangaName').value = m.name;
        document.getElementById('mangaCaps').value = m.caps;
        document.getElementById('mangaLink').value = m.link;
        closeModal('detailModal'); openModal('mangaModal');
    };
    document.getElementById('btnDelete').onclick = () => {
        if(confirm("Excluir?")) { userAppData.items.splice(i,1); renderGrid(); saveData(); closeModal('detailModal'); }
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
    const s = JSON.parse(localStorage.getItem(`user_${u}`));
    if(!s) return alert("Não achei!");
    if(prompt(`Pergunta: ${s.recovery}`) === s.recovery) alert(`Senha: ${s.pass}`);
    else alert("Errado!");
}