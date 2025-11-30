// ========================================
// SISTEMA DE POSTS
// ========================================

let tempPostPhoto = null;
let postsListener = null;

function initPosts() {
    document.getElementById('uploadPhotoBtn').addEventListener('click', () => {
        document.getElementById('postPhotoUpload').click();
    });
    
    document.getElementById('postPhotoUpload').addEventListener('change', previewPostPhoto);
    document.getElementById('removePhotoBtn').addEventListener('click', removePostPhoto);
    document.getElementById('createPostBtn').addEventListener('click', createPost);
    
    document.getElementById('postContent').addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = `${e.target.value.length}/280`;
    });
}

function loadPosts() {
    const container = document.getElementById('postsContainer');
    showLoading(container, 'Cargando cotilleos...');
    
    if (postsListener) {
        postsListener();
    }
    
    postsListener = db.collection('posts')
        .limit(50)
        .onSnapshot(async (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No hay cotilleos aún</h3>
                        <p>¡Sé el primero en compartir!</p>
                    </div>
                `;
                return;
            }
            
            // Ordenar manualmente por timestamp
            const sortedDocs = snapshot.docs.sort((a, b) => {
                const aTime = a.data().timestamp?.toMillis() || 0;
                const bTime = b.data().timestamp?.toMillis() || 0;
                return bTime - aTime;
            });
            
            const posts = [];
            sortedDocs.forEach(doc => {
                posts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            await renderPosts(posts, container);
        }, (error) => {
            console.error('Error al cargar posts:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Error al cargar cotilleos</p>
                </div>
            `;
        });
}

async function renderPosts(posts, container) {
    container.innerHTML = '';
    
    for (const post of posts) {
        const postEl = await createPostElement(post);
        container.appendChild(postEl);
    }
}

async function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    
    const isLiked = post.likedBy && post.likedBy.includes(currentUser.uid);
    const isFollowing = currentUser.following && currentUser.following.includes(post.userId);
    const isOwnPost = post.userId === currentUser.uid;
    
    const commentsSnapshot = await db.collection('comments')
        .where('postId', '==', post.id)
        .get();
    
    const comments = [];
    commentsSnapshot.forEach(doc => {
        comments.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    comments.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return aTime - bTime;
    });
    
    let avatarHtml;
    if (post.profilePic) {
        avatarHtml = `<img src="${post.profilePic}" alt="${post.username}">`;
    } else {
        avatarHtml = getInitials(post.username);
    }
    
    let followBtn = '';
    if (!isOwnPost) {
        followBtn = `
            <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                    onclick="toggleFollow('${post.userId}', this)">
                ${isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
        `;
    }
    
    let imageHtml = '';
    if (post.imageUrl) {
        imageHtml = `
            <img src="${post.imageUrl}" 
                 alt="Imagen del post" 
                 class="post-image" 
                 onclick="openImageModal('${post.imageUrl}')">
        `;
    }
    
    let commentsHtml = '';
    if (comments.length > 0) {
        commentsHtml = comments.map(comment => {
            let commentAvatar;
            if (comment.profilePic) {
                commentAvatar = `<img src="${comment.profilePic}" alt="${comment.username}">`;
            } else {
                commentAvatar = getInitials(comment.username);
            }
            
            return `
                <div class="comment">
                    <div class="comment-avatar">${commentAvatar}</div>
                    <div class="comment-content">
                        <div class="comment-username">@${comment.username}</div>
                        <div class="comment-text">${sanitizeText(comment.content)}</div>
                        <div class="comment-time">${getTimeAgo(comment.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    div.innerHTML = `
        <div class="post-header">
            <div class="post-user" onclick="showUserProfile('${post.userId}')">
                <div class="post-avatar">${avatarHtml}</div>
                <div>
                    <div class="post-username">@${post.username}</div>
                    <div class="post-time">${getTimeAgo(post.timestamp)}</div>
                </div>
            </div>
            ${followBtn}
        </div>
        ${post.content ? `<div class="post-content">${sanitizeText(post.content)}</div>` : ''}
        ${imageHtml}
        <div class="post-actions-bar">
            <button class="action-btn ${isLiked ? 'liked' : ''}" 
                    onclick="toggleLike('${post.id}', this)">
                ${isLiked ? '❤️' : '🤍'} ${post.likes || 0}
            </button>
            <button class="action-btn" onclick="toggleComments('${post.id}')">
                💬 ${comments.length}
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}">
            ${commentsHtml}
            <div class="comment-input-container">
                <input type="text" 
                       class="comment-input" 
                       id="comment-input-${post.id}" 
                       placeholder="Escribe un comentario..." 
                       maxlength="200">
                <button class="comment-btn" onclick="addComment('${post.id}')">Enviar</button>
            </div>
        </div>
    `;
    
    return div;
}

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content && !tempPostPhoto) {
        showError('Escribe algo o añade una foto');
        return;
    }
    
    const btn = document.getElementById('createPostBtn');
    btn.disabled = true;
    btn.textContent = 'Publicando...';
    
    try {
        let imageUrl = null;
        if (tempPostPhoto) {
            imageUrl = await uploadImage(tempPostPhoto, 'posts');
        }
        
        await db.collection('posts').add({
            userId: currentUser.uid,
            username: currentUser.username,
            profilePic: currentUser.profilePic || null,
            content: content,
            imageUrl: imageUrl,
            timestamp: firebase.firestore.Timestamp.now(),
            likes: 0,
            likedBy: []
        });
        
        document.getElementById('postContent').value = '';
        document.getElementById('charCount').textContent = '0/280';
        removePostPhoto();
        
        showSuccess('¡Cotilleo publicado! 🔥');
        
    } catch (error) {
        console.error('Error al crear post:', error);
        showError('Error al publicar. Inténtalo de nuevo');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publicar';
    }
}

function previewPostPhoto() {
    const file = document.getElementById('postPhotoUpload').files[0];
    if (!file) return;
    
    try {
        validateImageFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            tempPostPhoto = file;
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('photoPreview').classList.add('active');
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        showError(error.message);
        document.getElementById('postPhotoUpload').value = '';
    }
}

function removePostPhoto() {
    tempPostPhoto = null;
    document.getElementById('photoPreview').classList.remove('active');
    document.getElementById('postPhotoUpload').value = '';
}

async function toggleLike(postId, button) {
    if (!currentUser) return;
    
    button.disabled = true;
    
    try {
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();
        
        if (!postDoc.exists) {
            throw new Error('Post no encontrado');
        }
        
        const post = postDoc.data();
        const likedBy = post.likedBy || [];
        const hasLiked = likedBy.includes(currentUser.uid);
        
        if (hasLiked) {
            await postRef.update({
                likes: firebase.firestore.FieldValue.increment(-1),
                likedBy: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
        } else {
            await postRef.update({
                likes: firebase.firestore.FieldValue.increment(1),
                likedBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
        }
        
    } catch (error) {
        console.error('Error al dar like:', error);
        showError('Error al dar like');
    } finally {
        button.disabled = false;
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('active');
    
    if (commentsSection.classList.contains('active')) {
        const input = document.getElementById(`comment-input-${postId}`);
        setTimeout(() => input.focus(), 100);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    input.disabled = true;
    
    try {
        await db.collection('comments').add({
            postId: postId,
            userId: currentUser.uid,
            username: currentUser.username,
            profilePic: currentUser.profilePic || null,
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        
    } catch (error) {
        console.error('Error al añadir comentario:', error);
        showError('Error al comentar');
    } finally {
        input.disabled = false;
    }
}

async function loadUserPosts(userId) {
    const container = document.getElementById('userPostsContainer');
    showLoading(container, 'Cargando posts...');
    
    try {
        const snapshot = await db.collection('posts')
            .where('userId', '==', userId)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay publicaciones aún</p>
                </div>
            `;
            return;
        }
        
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Ordenar manualmente
        posts.sort((a, b) => {
            const aTime = a.timestamp?.toMillis() || 0;
            const bTime = b.timestamp?.toMillis() || 0;
            return bTime - aTime;
        });
        
        await renderPosts(posts, container);
        
    } catch (error) {
        console.error('Error al cargar posts del usuario:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Error al cargar posts</p>
            </div>
        `;
    }
}