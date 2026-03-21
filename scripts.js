let currentUser = null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;

// 1. CONFIGURAÇÃO DE ARRASTAR (DRAG & DROP) - COM TOQUE LONGO
const gridElement = document.getElementById('mangaGrid');
if (gridElement) {
    new Sortable(gridElement, {
        animation: 250,
        delay: 400, 
        delayOnTouchOnly: true, 
        touchStartThreshold: 10,
        onStart: function() { if (navigator.vibrate) navigator.vibrate(50); },
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

// 2. SISTEMA DE LOGIN, REGISTRO E RECUPERAÇÃO
function switchAuth(screen) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById(`${screen}-box`).classList.remove('hidden');
}

function handleAuth(type) {
    if(type === 'register') {
        const u = document.getElementById('user-reg').value.trim();
        const p = document.getElementById('pass-reg').value.trim();
        const q = document.getElementById('recovery-q').value.trim(); // Pergunta de segurança
        if(!u || !p || !q) return alert("Preencha todos os campos!");
        
        localStorage.setItem(`user_${u}`, JSON.stringify({ pass: p, recovery: q, data: userAppData }));
        alert("Conta criada!");
        switchAuth('login');
    } else {
        const u = document.getElementById('user-login').value.trim();
        const p = document.getElementById('pass-login').value.trim();
        const stored = JSON.parse(localStorage.getItem(`user_${u}`));
        
        if(stored && stored.pass === p) { 
            currentUser = u; 
            userAppData = stored.data; 
            startApp(); 
        } else {
            alert("Usuário ou senha incorretos!");
        }
    }
}

// FUNÇÃO DE ESQUECI A SENHA
function forgotPassword() {
    const u = prompt("Digite seu nome de usuário:");
    const stored = JSON.parse(localStorage.getItem(`user_${u}`));
    if(!stored) return alert("Usuário não encontrado!");
    
    const ans = prompt(`Pergunta de segurança: ${stored.recovery}`);
    if(ans === stored.recovery) {
        alert(`Sua senha é: ${stored.pass}`);
    } else {
        alert("Resposta incorreta!");
    }
}

// 3. INICIALIZAÇÃO E BANNER
function startApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('list-title').value = userAppData.title || "Bl Notes";
    
    // CARREGA O BANNER SALVO
    if(userAppData.banner) {
        const img = document.getElementById('bannerImg');
        img.src = userAppData.banner;
        img.style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
    }
    
    changeTheme(userAppData.theme || '#e2e2ff', false);
    renderGrid();
}

function loadBanner(event) {
    const reader = new FileReader();
    reader.onload = () => {
        userAppData.banner = reader.result; // Salva na memória do app
        const img = document.getElementById('bannerImg');
        img.src = reader.result;
        img.style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
        saveData(); // Salva no banco
    };
    reader.readAsDataURL(event.target.files[0]);
}

// 4. RESTANTE DAS FUNÇÕES (CORES, GRID, MODAIS)
function changeTheme(color, save = true) {
    document.documentElement.style.setProperty('--primary', color);
    userAppData.theme = color;
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