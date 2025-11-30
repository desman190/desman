// ========================================
// FUNCIONES AUXILIARES
// ========================================

// ========================================
// TIEMPO RELATIVO
// ========================================

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Ahora';
    
    const now = new Date();
    const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return postDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
    });
}

// ========================================
// COMPRESIÓN DE IMÁGENES
// ========================================

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar si es necesario
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir imagen'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = () => reject(new Error('Error al cargar imagen'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Error al leer archivo'));
        reader.readAsDataURL(file);
    });
}

// ========================================
// SUBIR IMAGEN A FIREBASE STORAGE
// ========================================

async function uploadImage(file, path) {
    try {
        // Comprimir imagen
        const compressedBlob = await compressImage(file);
        
        // Generar nombre único
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}.jpg`;
        
        // Crear referencia en Storage
        const storageRef = storage.ref(`${path}/${fileName}`);
        
        // Subir archivo
        const uploadTask = await storageRef.put(compressedBlob, {
            contentType: 'image/jpeg'
        });
        
        // Obtener URL de descarga
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        return downloadURL;
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

// ========================================
// VALIDACIÓN DE ARCHIVOS
// ========================================

function validateImageFile(file) {
    // Verificar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Formato no válido. Usa JPG, PNG o WebP');
    }
    
    // Verificar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('La imagen es demasiado grande (máx 5MB)');
    }
    
    return true;
}

// ========================================
// SANITIZACIÓN DE TEXTO
// ========================================

function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// DEBOUNCE
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// GENERAR INICIALES
// ========================================

function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}

// ========================================
// COPIAR AL PORTAPAPELES
// ========================================

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Error al copiar:', error);
        return false;
    }
}

// ========================================
// SCROLL SUAVE
// ========================================

function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ========================================
// LOADING SPINNER
// ========================================

function showLoading(container, message = 'Cargando...') {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function hideLoading(container) {
    const loading = container.querySelector('.loading');
    if (loading) loading.remove();
}

// ========================================
// FORMATEAR NÚMEROS
// ========================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ========================================
// VALIDAR EMAIL
// ========================================

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ========================================
// GENERAR ID ÚNICO
// ========================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========================================
// PREVENIR SCROLL
// ========================================

function preventScroll(prevent) {
    if (prevent) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}