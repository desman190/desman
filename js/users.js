// ========================================
// SISTEMA DE USUARIOS
// ========================================

let viewingUserId = null;
let searchDebounce = null;

// ========================================
// INICIALIZAR USUARIOS
// ========================================

function initUsers() {
    // Event listener para búsqueda
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            searchUsers(e.target.value);
        }, 300);
    });
}

// ========================================
// BUSCAR USUARIOS
// ========================================

async function searchUsers(query) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query || query.trim().length < 2) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>Escribe al menos 2 caracteres para buscar...</p>
            </div>
        `;
        return;
    }
    
    showLoading(resultsContainer, 'Buscando usuarios...');
    
    try {
        const searchTerm = query.toLowerCase().trim();
        
        // Buscar por username (Firestore no tiene búsqueda parcial nativa)
        const snapshot = await db.collection('users')
            .orderBy('username')
            .get();
        
        const results = [];
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.username.toLowerCase().includes(searchTerm) && doc.id !== currentUser.uid) {
                results.push({
                    uid: doc.id,
                    ...user
                });
            }
        });
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No se encontraron usuarios</p>
                </div>
            `;
            return;
        }
        
        // Renderizar resultados
        resultsContainer.innerHTML = '';
        
        for (const user of results) {
            const userEl = await createUserResultElement(user);
            resultsContainer.appendChild(userEl);
        }
        
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>Error al buscar usuarios</p>
            </div>
        `;
    }
}

// ========================================
// CREAR ELEMENTO DE RESULTADO DE USUARIO
// ========================================

async function createUserResultElement(user) {
    const div = document.createElement('div');
    div.className = 'user-result';
    div.onclick = () => showUserProfile(user.uid);
    
    let avatarHtml;
    if (user.profilePic) {
        avatarHtml = `<img src="${user.profilePic}" alt="${user.username}">`;
    } else {
        avatarHtml = getInitials(user.username);
    }
    
    // Contar posts del usuario
    const postsCount = await db.collection('posts')
        .where('userId', '==', user.uid)
        .get()
        .then(snapshot => snapshot.size);
    
    const followersCount = user.followers ? user.followers.length : 0;
    
    div.innerHTML = `
        <div class="user-result-avatar">${avatarHtml}</div>
        <div class="user-result-info">
            <div class="user-result-name">@${user.username}</div>
            <div class="user-result-stats">${postsCount} cotilleos • ${followersCount} seguidores</div>
        </div>
    `;
    
    return div;
}

// ========================================
// MOSTRAR PERFIL DE USUARIO
// ========================================

async function showUserProfile(userId) {
    viewingUserId = userId;
    const isOwnProfile = userId === currentUser.uid;
    
    try {
        // Cargar datos del usuario
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            showError('Usuario no encontrado');
            return;
        }
        
        const user = userDoc.data();
        
        // 🔧 ARREGLO: Recargar datos actuales del currentUser desde Firebase
        if (!isOwnProfile) {
            const currentUserDoc = await db.collection('users').doc(currentUser.uid).get();
            if (currentUserDoc.exists) {
                const freshData = currentUserDoc.data();
                currentUser.following = freshData.following || [];
                currentUser.followers = freshData.followers || [];
            }
        }
        
        // Ocultar otras secciones
        document.getElementById('feedSection').style.display = 'none';
        document.getElementById('searchSection').style.display = 'none';
        document.getElementById('profileSection').style.display = 'block';
        document.getElementById('backBtn').style.display = 'block';
        
        // Desactivar botones de navegación
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Avatar grande
        const picLarge = document.getElementById('profilePicLarge');
        if (user.profilePic) {
            picLarge.innerHTML = `<img src="${user.profilePic}" alt="Perfil">`;
        } else {
            picLarge.textContent = getInitials(user.username);
        }
        
        // Username
        document.getElementById('profileUsername').textContent = '@' + user.username;
        
        // Contar posts
        const postsCount = await db.collection('posts')
            .where('userId', '==', userId)
            .get()
            .then(snapshot => snapshot.size);
        
        document.getElementById('postsCount').textContent = postsCount;
        
        // Seguidores y siguiendo
        const followersCount = user.followers ? user.followers.length : 0;
        const followingCount = user.following ? user.following.length : 0;
        
        document.getElementById('followersCount').textContent = followersCount;
        document.getElementById('followingCount').textContent = followingCount;
        
        // Botones de acción
        const actionsDiv = document.getElementById('profileActions');
        if (isOwnProfile) {
            actionsDiv.innerHTML = `
                <input type="file" id="photoUpload" accept="image/*">
                <button class="upload-photo-btn" onclick="document.getElementById('photoUpload').click()">
                    📸 Cambiar foto de perfil
                </button>
            `;
            
            // Event listener para cambiar foto
            document.getElementById('photoUpload').addEventListener('change', uploadProfilePhoto);
        } else {
            const isFollowing = currentUser.following && currentUser.following.includes(userId);
            actionsDiv.innerHTML = `
                <button class="btn ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${userId}', this)">
                    ${isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
            `;
        }
        
        // Event listeners para modales
        document.getElementById('followersBtn').onclick = () => showFollowersModal(userId);
        document.getElementById('followingBtn').onclick = () => showFollowingModal(userId);
        
        // Cargar posts del usuario
        await loadUserPosts(userId);
        
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        showError('Error al cargar perfil');
    }
}

// ========================================
// TOGGLE FOLLOW - 🔧 ARREGLADO
// ========================================

async function toggleFollow(userId, button) {
    if (!currentUser || userId === currentUser.uid) return;
    
    if (button) button.disabled = true;
    
    try {
        const targetUserRef = db.collection('users').doc(userId);
        const currentUserRef = db.collection('users').doc(currentUser.uid);
        
        // 🔧 ARREGLO: Obtener estado actual desde Firebase
        const currentUserDoc = await currentUserRef.get();
        const currentUserData = currentUserDoc.data();
        const currentFollowing = currentUserData.following || [];
        
        const isFollowing = currentFollowing.includes(userId);
        
        if (isFollowing) {
            // Dejar de seguir
            await currentUserRef.update({
                following: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            await targetUserRef.update({
                followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
            
            // 🔧 ARREGLO: Actualizar localmente de forma correcta
            currentUser.following = currentFollowing.filter(id => id !== userId);
            
            if (button) {
                button.textContent = 'Seguir';
                button.classList.remove('following');
            }
            
            showSuccess('Has dejado de seguir a este usuario');
            
        } else {
            // Seguir
            await currentUserRef.update({
                following: firebase.firestore.FieldValue.arrayUnion(userId)
            });
            await targetUserRef.update({
                followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
            
            // 🔧 ARREGLO: Actualizar localmente de forma correcta
            currentUser.following = [...currentFollowing, userId];
            
            if (button) {
                button.textContent = 'Siguiendo';
                button.classList.add('following');
            }
            
            showSuccess('¡Ahora sigues a este usuario!');
        }
        
        // 🔧 ARREGLO: Recargar perfil para actualizar contadores
        if (viewingUserId === userId) {
            await showUserProfile(userId);
        }
        
    } catch (error) {
        console.error('Error al seguir/dejar de seguir:', error);
        showError('Error al actualizar seguidor');
    } finally {
        if (button) button.disabled = false;
    }
}

// ========================================
// SUBIR FOTO DE PERFIL
// ========================================

async function uploadProfilePhoto() {
    const file = document.getElementById('photoUpload').files[0];
    if (!file) return;
    
    try {
        validateImageFile(file);
        
        showSuccess('Subiendo foto...');
        
        // Subir a Storage
        const imageUrl = await uploadImage(file, 'profiles');
        
        // Actualizar en Firestore
        await db.collection('users').doc(currentUser.uid).update({
            profilePic: imageUrl
        });
        
        // Actualizar localmente
        currentUser.profilePic = imageUrl;
        
        // Actualizar UI
        updateHeaderProfile();
        showUserProfile(currentUser.uid);
        
        showSuccess('¡Foto actualizada! 📸');
        
    } catch (error) {
        console.error('Error al subir foto:', error);
        showError(error.message || 'Error al subir foto');
    }
}

// ========================================
// MODAL DE SEGUIDORES
// ========================================

async function showFollowersModal(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        const followers = user.followers || [];
        
        const modal = document.getElementById('followModal');
        const title = document.getElementById('modalTitle');
        const list = document.getElementById('modalUserList');
        
        title.textContent = 'Seguidores';
        
        if (followers.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>Aún no tiene seguidores</p></div>';
        } else {
            list.innerHTML = '';
            
            for (const followerId of followers) {
                const followerDoc = await db.collection('users').doc(followerId).get();
                if (followerDoc.exists) {
                    const follower = followerDoc.data();
                    const userItem = await createUserItemElement(followerId, follower);
                    list.appendChild(userItem);
                }
            }
        }
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Error al cargar seguidores:', error);
        showError('Error al cargar seguidores');
    }
}

// ========================================
// MODAL DE SIGUIENDO
// ========================================

async function showFollowingModal(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        const following = user.following || [];
        
        const modal = document.getElementById('followModal');
        const title = document.getElementById('modalTitle');
        const list = document.getElementById('modalUserList');
        
        title.textContent = 'Siguiendo';
        
        if (following.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No sigue a nadie aún</p></div>';
        } else {
            list.innerHTML = '';
            
            for (const followingId of following) {
                const followingDoc = await db.collection('users').doc(followingId).get();
                if (followingDoc.exists) {
                    const followingUser = followingDoc.data();
                    const userItem = await createUserItemElement(followingId, followingUser);
                    list.appendChild(userItem);
                }
            }
        }
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Error al cargar siguiendo:', error);
        showError('Error al cargar siguiendo');
    }
}

// ========================================
// CREAR ELEMENTO DE USUARIO (MODAL)
// ========================================

async function createUserItemElement(userId, user) {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.onclick = () => {
        closeModal();
        showUserProfile(userId);
    };
    
    let avatarHtml;
    if (user.profilePic) {
        avatarHtml = `<img src="${user.profilePic}" alt="${user.username}">`;
    } else {
        avatarHtml = getInitials(user.username);
    }
    
    div.innerHTML = `
        <div class="user-item-avatar">${avatarHtml}</div>
        <div class="user-item-info">
            <div class="user-item-name">@${user.username}</div>
        </div>
    `;
    
    return div;
}

// ========================================
// ACTUALIZAR HEADER
// ========================================

function updateHeaderProfile() {
    const headerPic = document.getElementById('headerProfilePic');
    
    if (currentUser.profilePic) {
        headerPic.innerHTML = `<img src="${currentUser.profilePic}" alt="Perfil">`;
    } else {
        headerPic.textContent = getInitials(currentUser.username);
    }
}

// ========================================
// MOSTRAR MI PERFIL
// ========================================

function showMyProfile() {
    showUserProfile(currentUser.uid);
}