// ========================================
// INTERFAZ DE USUARIO
// ========================================

// ========================================
// INICIALIZAR UI
// ========================================

function initUI() {
    // Event listeners para navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Event listeners para modales
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('closeImageModalBtn').addEventListener('click', closeImageModal);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('followModal').addEventListener('click', (e) => {
        if (e.target.id === 'followModal') {
            closeModal();
        }
    });
    
    document.getElementById('imageModal').addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') {
            closeImageModal();
        }
    });
    
    // Event listener para botón de volver
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // Event listener para header profile pic
    document.getElementById('headerProfilePic').addEventListener('click', showMyProfile);
}

// ========================================
// MOSTRAR SECCIÓN
// ========================================

function showSection(section) {
    // Resetear estado
    viewingUserId = null;
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Actualizar navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === section) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar sección correspondiente
    switch (section) {
        case 'feed':
            document.getElementById('feedSection').style.display = 'block';
            document.getElementById('searchSection').style.display = 'none';
            loadPosts();
            break;
            
        case 'search':
            document.getElementById('feedSection').style.display = 'none';
            document.getElementById('searchSection').style.display = 'block';
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').innerHTML = `
                <div class="empty-state">
                    <p>Escribe al menos 2 caracteres para buscar...</p>
                </div>
            `;
            document.getElementById('searchInput').focus();
            break;
            
        case 'profile':
            showMyProfile();
            break;
    }
}

// ========================================
// VOLVER
// ========================================

function goBack() {
    viewingUserId = null;
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    showSection('feed');
}

// ========================================
// MODAL DE IMAGEN
// ========================================

function openImageModal(imageUrl) {
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('imageModal').classList.add('active');
    preventScroll(true);
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    preventScroll(false);
}

// ========================================
// MODAL GENÉRICO
// ========================================

function closeModal() {
    document.getElementById('followModal').classList.remove('active');
    preventScroll(false);
}

// ========================================
// NOTIFICACIONES TOAST
// ========================================

function showToast(message, type = 'info', duration = 3000) {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Eliminar después de la duración
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Agregar animaciones CSS
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// CONFIRMAR ACCIÓN
// ========================================

function confirmAction(message, onConfirm) {
    if (confirm(message)) {
        onConfirm();
    }
}

// ========================================
// SKELETON LOADER
// ========================================

function createSkeletonLoader() {
    return `
        <div class="skeleton-loader">
            <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-text">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
            <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>
    `;
}

// Agregar estilos de skeleton loader
if (!document.getElementById('skeleton-styles')) {
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
        .skeleton-loader {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .skeleton-header {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .skeleton-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        .skeleton-text {
            flex: 1;
        }
        
        .skeleton-line {
            height: 12px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .skeleton-line.short {
            width: 60%;
        }
        
        .skeleton-content .skeleton-line {
            height: 16px;
            margin-bottom: 10px;
        }
        
        @keyframes loading {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// SCROLL AL TOP
// ========================================

function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

// ========================================
// LAZY LOADING DE IMÁGENES
// ========================================

function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========================================
// PULL TO REFRESH
// ========================================

let pullToRefreshEnabled = false;
let startY = 0;
let currentY = 0;
let pulling = false;

function initPullToRefresh() {
    const container = document.querySelector('.container');
    
    container.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
        }
    });
    
    container.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        
        if (diff > 0 && diff < 150) {
            e.preventDefault();
            // Aquí puedes añadir un indicador visual
        }
    });
    
    container.addEventListener('touchend', () => {
        if (!pulling) return;
        
        const diff = currentY - startY;
        
        if (diff > 100) {
            // Refrescar contenido
            if (document.getElementById('feedSection').style.display !== 'none') {
                loadPosts();
            }
        }
        
        pulling = false;
        startY = 0;
        currentY = 0;
    });
}

// ========================================
// VIBRACIÓN (SI ESTÁ DISPONIBLE)
// ========================================

function vibrate(duration = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// ========================================
// COMPARTIR (SI ESTÁ DISPONIBLE)
// ========================================

async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            return true;
        } catch (error) {
            console.log('Error al compartir:', error);
            return false;
        }
    }
    return false;
}

// ========================================
// MODO OSCURO (PREPARADO PARA FUTURO)
// ========================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

function loadDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}