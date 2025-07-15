// Manter showTab para alternar abas
function showTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));

  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
}

// Inicializar Firebase usando env externo
firebase.initializeApp(window.env);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;

// Login
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(user => {
            currentUser = user.user;
            showMain();
        })
        .catch(err => {
            document.getElementById('login-error').innerText = err.message;
        });
}

// Registro
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(user => {
            currentUser = user.user;
            db.ref('users/' + currentUser.uid).set({
                username: email.split('@')[0],
                canChangeUsername: true,
                profilePic: ''
            });
            showMain();
        })
        .catch(err => {
            document.getElementById('login-error').innerText = err.message;
        });
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
    });
}

// Mostrar tela principal e abrir aba fórum por padrão
function showMain() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'flex';
    showTab('forum');
    loadPosts();
    loadChat();
}

// Carregar posts (sem duplicação)
function loadPosts() {
    db.ref('posts').orderByChild('timestamp').on('value', snap => {
        const postsDiv = document.getElementById('posts');
        postsDiv.innerHTML = '';
        const postsArr = [];
        snap.forEach(child => {
            const post = child.val();
            postsArr.push({
                uid: post.uid,
                text: post.text,
                timestamp: post.timestamp
            });
        });
        postsArr.sort((a, b) => b.timestamp - a.timestamp);
        postsArr.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post';
            div.innerHTML = `
                <b>${post.uid}</b> <span style="font-size:0.8em;color:#aaffee;">${new Date(post.timestamp).toLocaleString()}</span>
                <p>${post.text}</p>
            `;
            postsDiv.appendChild(div);
        });
    });
}

// Postar comentário
function sendPost() {
    const text = document.getElementById('post-text').value;
    if (!text) return;
    const postRef = db.ref('posts').push();
    postRef.set({
        uid: currentUser.uid,
        text,
        timestamp: Date.now()
    });
    document.getElementById('post-text').value = '';
}

// Enviar mensagem chat
function sendChat() {
    const msg = document.getElementById('chat-input').value;
    if (!msg) return;
    db.ref('chat').push({
        uid: currentUser.uid,
        message: msg,
        timestamp: Date.now()
    });
    document.getElementById('chat-input').value = '';
}

// Carregar chat (sem duplicação)
function loadChat() {
    db.ref('chat').orderByChild('timestamp').limitToLast(50).on('value', snap => {
        const chatDiv = document.getElementById('chat-messages');
        chatDiv.innerHTML = '';
        const chatArr = [];
        snap.forEach(child => {
            const chat = child.val();
            chatArr.push({
                uid: chat.uid,
                message: chat.message,
                timestamp: chat.timestamp
            });
        });
        chatArr.sort((a, b) => a.timestamp - b.timestamp);
        chatArr.forEach(chat => {
            const div = document.createElement('div');
            div.innerHTML = `<b style="color:#aaffee;">${chat.uid}:</b> ${chat.message}`;
            chatDiv.appendChild(div);
        });
        chatDiv.scrollTop = chatDiv.scrollHeight;
    });
}

// Auth listener automático
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        showMain();
    }
});
