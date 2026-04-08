// auth.js - Firebase Authentication + Usuários Firestore
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Globals
export let currentUser = null;
export let userType = null; // 'funcionario' | 'admin'

// Mostrar/esconder UI
const mainUI = document.getElementById('main');
const loginUI = document.getElementById('loginScreen');

function showMain() { if (mainUI) mainUI.style.display = 'block'; if (loginUI) loginUI.style.display = 'none'; }
function showLogin() { if (mainUI) mainUI.style.display = 'none'; if (loginUI) loginUI.style.display = 'block'; }

// 🔐 Login
window.login = async function() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login:', userCredential.user.uid);
  } catch (error) {
    alert('Erro login: ' + error.message);
  }
};

// ➕ Register
window.register = async function() {
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const nome = document.getElementById('regNome').value;
  
  if (!email || !password || !nome) return alert('Preencha todos os campos!');
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Profile Firestore (default funcionario)
    await setDoc(doc(db, 'usuarios', user.uid), {
      nome,
      email: user.email,
      tipo: 'funcionario', // Admin precisa ser setado manualmente
      dataRegistro: new Date()
    });
    
    await updateProfile(user, { displayName: nome });
    console.log('✅ Registrado:', user.uid);
  } catch (error) {
    alert('Erro registro: ' + error.message);
  }
};

// 🚪 Logout
window.logout = async function() {
  await signOut(auth);
};

// 👤 Listener auth state (auto UI + carrega tipo)
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  
  if (user) {
    // Carrega tipo do Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (userDoc.exists()) {
      userType = userDoc.data().tipo;
      console.log(`👤 Logado: ${userDoc.data().nome} (${userType})`);
    }
    showMain();
  } else {
    userType = null;
    showLogin();
    console.log('👋 Logout');
  }
});

// Inicia em login
showLogin();

