let currentUser = localStorage.getItem('lastUser') || null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;

// INICIALIZAÇÃO
window.onload = () => {
    if (currentUser) {
        const stored = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        if (stored) {
            userAppData = stored.data || userAppData;
            startApp();
        }
    }
};

// SISTEMA DE AUTH
function handleAuth(type) {
    if(type === 'register') {
        const u = document.getElementById('user-reg').value.trim();
        const p = document.getElementById('pass-reg').value.trim();
        const q = document.getElementById('recovery-q').value.trim();
        if(!u || !p || !q) return alert("Preencha todos os campos!");
        localStorage.setItem(`user_${u}`, JSON.stringify({ pass: p, recovery: q, data: { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] } }));
        alert("Conta criada!");
        switchAuth('login');
    } else {
        const u = document.getElementById('user-login').value.trim();
        const p = document.getElementById('pass-login').value.trim();
        const stored = JSON.parse(localStorage.getItem(`user_${u}`));
        if(stored && stored.pass === p) { 
            currentUser = u; 
            localStorage.setItem('lastUser', u);
            userAppData = stored.data; 
            startApp(); 
        } else { alert("Usuário ou senha incorretos!"); }
    }
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

function saveData() {
    if(!currentUser) return;
    userAppData.title = document.getElementById('list-title').value;
    const acc = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    if(acc) {
        acc.data = userAppData;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(acc));
    }
}

function renderGrid() {
    const grid = document.getElementById('mangaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    userAppData.items.forEach((m, i) => {
        grid.innerHTML += `
            <div class="card" data-index="${i}" onclick="showDetails(${i})">
                <img src="${m.img}">
                <div style="padding: 5px;">
                    <span class="tag tag-cat">${m.cat}</span>
                    <span class="tag tag-status">${m.status}</span>
                    <div class="manga-name">${m.name}</div>
                    <div style="font-size:0.6rem; color:#888;">Cap: ${m.caps}</div>
                </div>
            </div>`;
    });
}

// === AQUI ESTÁ A CORREÇÃO DA IMAGEM ===
function saveManga() {
    const name = document.getElementById('mangaName').value;
    if(!name) return alert("Nome obrigatório!");

    // 1. Pega a imagem que já existe se estiver editando, ou um placeholder se for novo
    let imgFinal = (editingIndex > -1) ? userAppData.items[editingIndex].img : "https://via.placeholder.com/150";

    const data = {
        name: name,
        cat: document.getElementById('mangaCat').value || "Geral",
        status: document.getElementById('mangaStatus').value || "Lendo",
        caps: document.getElementById('mangaCaps').value || "0",
        link: document.getElementById('mangaLink').value || "#",
        img: imgFinal // Mantém a imagem atual por padrão
    };

    const fileInput = document.getElementById('mangaImgInput');
    const file = fileInput.files[0];

    if(file) {
        // Se você escolheu um arquivo NOVO, aí sim ele troca a imagem
        const reader = new FileReader();
        reader.onload = () => { 
            data.img = reader.result; 
            finalizeSave(data); 
            fileInput.value = ""; 
        };
        reader.readAsDataURL(file);
    } else { 
        // Se não escolheu arquivo, finaliza com a imagem que já estava lá
        finalizeSave(data); 
    }
}

function finalizeSave(data) {
    if(editingIndex > -1) userAppData.items[editingIndex] = data;
    else userAppData.items.push(data);
    renderGrid(); saveData(); closeModal('mangaModal');
}

function showDetails(i) {
    editingIndex = i;
    const m = userAppData.items[i];
    document.getElementById('detailContent').innerHTML = `
        <img src="${m.img}" style="width:170px; height:250px; object-fit:cover; border-radius:20px; margin-bottom:10px;">
        <h2>${m.name}</h2><p>Capítulo: ${m.caps}</p>`;
    document.getElementById('btnVerOnline').onclick = () => window.open(m.link, '_blank');
    document.getElementById('btnEdit').onclick = () => {
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

function openAddModal() { 
    editingIndex = -1; 
    document.getElementById('mangaName').value = "";
    document.getElementById('mangaCat').value = "";
    document.getElementById('mangaStatus').value = "";
    document.getElementById('mangaCaps').value = "";
    document.getElementById('mangaLink').value = "";
    document.getElementById('mangaImgInput').value = "";
    openModal('mangaModal'); 
}

function changeTheme(color, save = true) {
    if(!color.startsWith('#')) color = '#' + color;
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
    if(save) saveData();
}

function logout() { localStorage.removeItem('lastUser'); location.reload(); }
function switchAuth(screen) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById(`${screen}-box`).classList.remove('hidden');
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
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