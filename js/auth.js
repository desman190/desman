// ========================================
// SISTEMA DE AUTENTICACIÓN
// ========================================

let currentUser = null;

function initAuth() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('regBirthdate').setAttribute('max', today);

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData(user.uid);
            showFeedPage();
        } else {
            showLoginPage();
        }
    });

    document.getElementById('loginTab').addEventListener('click', showLoginTab);
    document.getElementById('registerTab').addEventListener('click', showRegisterTab);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

async function loadUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            currentUser = {
                uid: uid,
                ...userDoc.data()
            };
            console.log('✅ Usuario cargado:', currentUser.username);
        } else {
            console.error('❌ Usuario no encontrado');
            await auth.signOut();
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showError('Error al cargar datos del usuario');
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('¡Bienvenido de vuelta!');
    } catch (error) {
        console.error('Error en login:', error);
        
        switch (error.code) {
            case 'auth/user-not-found':
                showError('No existe una cuenta con ese email');
                break;
            case 'auth/wrong-password':
                showError('Contraseña incorrecta');
                break;
            default:
                showError('Error al iniciar sesión');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const birthdate = document.getElementById('regBirthdate').value;
    const password = document.getElementById('regPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!username || !email || !birthdate || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    if (!acceptTerms) {
        showError('Debes aceptar los términos y condiciones');
        return;
    }

    if (username.length < 3) {
        showError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
    }

    if (password.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    const age = calculateAge(new Date(birthdate));
    if (age < 14) {
        showError('Debes tener al menos 14 años para usar DESMAN');
        return;
    }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';

    try {
        // 🔧 QUITADO: Check de username duplicado (causaba error de permisos)
        // Lo agregaremos después con reglas correctas
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Crear documento del usuario en Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            birthdate: firebase.firestore.Timestamp.fromDate(new Date(birthdate)),
            profilePic: null,
            bio: '',
            createdAt: firebase.firestore.Timestamp.now(),
            followers: [],
            following: []
        });

        showSuccess('¡Cuenta creada! Bienvenido a DESMAN 🎉');
        
    } catch (error) {
        console.error('Error en registro:', error);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                showError('Este email ya está registrado');
                break;
            case 'auth/invalid-email':
                showError('Email inválido');
                break;
            case 'auth/weak-password':
                showError('La contraseña es demasiado débil');
                break;
            default:
                showError('Error al crear la cuenta: ' + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
    }
}

async function handleLogout() {
    if (confirm('¿Seguro que quieres salir?')) {
        try {
            await auth.signOut();
            currentUser = null;
            showSuccess('Sesión cerrada');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}

function calculateAge(birthdate) {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    
    return age;
}

function showLoginTab() {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    hideMessages();
}

function showRegisterTab() {
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    hideMessages();
}

function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('feedPage').style.display = 'none';
}

function showFeedPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('feedPage').style.display = 'block';
    updateHeaderProfile();
    loadPosts();
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

function showSuccess(msg) {
    const el = document.getElementById('successMsg');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function hideMessages() {
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';
}