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

// SISTEMA DE AUTH (VERSÃO SEGURA)
function handleAuth(type) {
    if(type === 'register') {
        const u = document.getElementById('user-reg').value.trim();
        const p = document.getElementById('pass-reg').value.trim();
        const q = document.getElementById('recovery-q').value.trim();
        
        if(!u || !p || !q) return alert("Preencha todos os campos!");

        const existingAccount = JSON.parse(localStorage.getItem(`user_${u}`));
        const dataToKeep = existingAccount ? existingAccount.data : { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };

        localStorage.setItem(`user_${u}`, JSON.stringify({ 
            pass: p, 
            recovery: q, 
            data: dataToKeep 
        }));
        
        alert("Conta atualizada/criada!");
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
        } else {
            alert("Usuário ou senha incorretos!");
        }
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

// BACKUP: SALVAR
function exportBackup() {
    if (!currentUser) return alert("Faça login primeiro!");
    const dataStr = JSON.stringify(userAppData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_blnotes_${currentUser}.json`);
    linkElement.click();
}

// BACKUP: RESTAURAR
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.items && Array.isArray(importedData.items)) {
                userAppData = importedData;
                renderGrid(); saveData(); startApp();
                alert("Backup restaurado!");
                closeModal('configModal');
            } else { alert("Arquivo inválido!"); }
        } catch (err) { alert("Erro ao ler ficheiro!"); }
    };
    reader.readAsText(file);
}

// SALVAMENTO E CORES
function saveData() {
    if(!currentUser) return;
    userAppData.title = document.getElementById('list-title').value;
    const acc = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    if(acc) {
        acc.data = userAppData;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(acc));
    }
}

function changeTheme(color, save = true) {
    if(!color.startsWith('#')) color = '#' + color;
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
    const input = document.getElementById('hexColorInput');
    if(input) input.value = color.toUpperCase();
    if(save) saveData();
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
                    <div style="font-size:0.6rem; color:#888; padding: 4px;">Cap: ${m.caps}</div>
                </div>
            </div>`;
    });
}

// MANIPULAÇÃO DE MANGÁS
function saveManga() {
    const name = document.getElementById('mangaName').value;
    if(!name) return alert("Nome obrigatório!");
    const data = {
        name: name,
        cat: document.getElementById('mangaCat').value || "Geral",
        status: document.getElementById('mangaStatus').value || "Lendo",
        caps: document.getElementById('mangaCaps').value || "0",
        link: document.getElementById('mangaLink').value || "#",
        img: (editingIndex > -1) ? userAppData.items[editingIndex].img : "https://via.placeholder.com/150"
    };
    const file = document.getElementById('mangaImgInput').files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = () => { data.img = reader.result; finalizeSave(data); };
        reader.readAsDataURL(file);
    } else { finalizeSave(data); }
}

function finalizeSave(data) {
    if(editingIndex > -1) userAppData.items[editingIndex] = data;
    else userAppData.items.push(data);
    renderGrid(); saveData(); closeModal('mangaModal');
}

// ARRASTAR CARDS
const gridElementSort = document.getElementById('mangaGrid');
if (gridElementSort) {
    new Sortable(gridElementSort, {
        animation: 200, delay: 500, delayOnTouchOnly: true,
        onEnd: () => {
            const cards = document.querySelectorAll('.card');
            const newOrder = [];
            cards.forEach(card => newOrder.push(userAppData.items[card.dataset.index]));
            userAppData.items = newOrder;
            renderGrid(); saveData();
        }
    });
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
    if(!s) return alert("Não encontrado!");
    if(prompt(`Pergunta: ${s.recovery}`) === s.recovery) alert(`Senha: ${s.pass}`);
    else alert("Errado!");
}