let currentUser = localStorage.getItem('lastUser') || null;
let userAppData = { title: "Bl Notes", banner: "", theme: "#e2e2ff", items: [] };
let editingIndex = -1;
let selectedStars = 0;

// Configuração das Estrelas no Modal
document.querySelectorAll('#starInput i').forEach(star => {
    star.onclick = () => {
        selectedStars = star.dataset.value;
        updateStarUI(selectedStars);
    };
});

function updateStarUI(val) {
    document.querySelectorAll('#starInput i').forEach(s => {
        s.classList.toggle('active', s.dataset.value <= val);
    });
}

window.onload = () => {
    if (currentUser) {
        const stored = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        if (stored) {
            userAppData = stored.data || userAppData;
            startApp();
        }
    }
};

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
            localStorage.setItem('lastUser', u);
            userAppData = stored.data; 
            startApp(); 
        } else { alert("Erro!"); }
    }
}

function startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('list-title').value = userAppData.title;
    if(userAppData.banner) {
        document.getElementById('bannerImg').src = userAppData.banner;
        document.getElementById('bannerImg').style.display = 'block';
        document.getElementById('bannerPlaceholder').style.display = 'none';
    }
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('mangaGrid');
    grid.innerHTML = '';
    userAppData.items.forEach((m, i) => {
        let starsHtml = '';
        for(let s=1; s<=5; s++) {
            starsHtml += `<i class="${s <= (m.stars || 0) ? 'fas' : 'far'} fa-star"></i>`;
        }

        grid.innerHTML += `
            <div class="card" data-index="${i}" onclick="showDetails(${i})">
                <img src="${m.img}">
                <div style="padding:5px;">
                    <div class="stars-container">${starsHtml}</div>
                    <div class="manga-name">${m.name}</div>
                    <div style="font-size:0.6rem; color:#888;">Cap: ${m.caps}</div>
                </div>
            </div>`;
    });
}

function saveManga() {
    const name = document.getElementById('mangaName').value;
    if(!name) return;

    let imgBase64 = editingIndex > -1 ? userAppData.items[editingIndex].img : "https://via.placeholder.com/150";

    const data = {
        name: name,
        cat: document.getElementById('mangaCat').value,
        status: document.getElementById('mangaStatus').value,
        caps: document.getElementById('mangaCaps').value,
        link: document.getElementById('mangaLink').value,
        stars: selectedStars,
        img: imgBase64
    };

    const file = document.getElementById('mangaImgInput').files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = () => { data.img = reader.result; finalize(data); };
        reader.readAsDataURL(file);
    } else { finalize(data); }
}

function finalize(data) {
    if(editingIndex > -1) userAppData.items[editingIndex] = data;
    else userAppData.items.push(data);
    renderGrid(); saveData(); closeModal('mangaModal');
}

function saveData() {
    const acc = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    acc.data = userAppData;
    localStorage.setItem(`user_${currentUser}`, JSON.stringify(acc));
}

function openAddModal() {
    editingIndex = -1;
    selectedStars = 0;
    updateStarUI(0);
    document.getElementById('mangaName').value = "";
    openModal('mangaModal');
}

function showDetails(i) {
    editingIndex = i;
    const m = userAppData.items[i];
    document.getElementById('detailContent').innerHTML = `
        <img src="${m.img}" style="width:150px; border-radius:15px;">
        <h2>${m.name}</h2><p>Nota: ${m.stars || 0}/5</p>`;
    
    document.getElementById('btnEdit').onclick = () => {
        document.getElementById('mangaName').value = m.name;
        document.getElementById('mangaCaps').value = m.caps;
        selectedStars = m.stars || 0;
        updateStarUI(selectedStars);
        closeModal('detailModal'); openModal('mangaModal');
    };
    openModal('detailModal');
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function logout() { localStorage.removeItem('lastUser'); location.reload(); }