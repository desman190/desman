// ========================================
// APP PRINCIPAL - DESMAN
// ========================================

console.log('🎉 DESMAN - Red Social Nocturna');
console.log('Version: 2.0.0 (Firebase)');

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Inicializando aplicación...');
    
    try {
        // Verificar que Firebase esté cargado
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está cargado');
        }
        
        console.log('✅ Firebase cargado correctamente');
        
        // Inicializar módulos
        initAuth();
        initPosts();
        initUsers();
        initUI();
        
        // Características adicionales
        // initPullToRefresh(); // Opcional
        // loadDarkModePreference(); // Opcional
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showError('Error al iniciar la aplicación. Recarga la página.');
    }
});

// ========================================
// MANEJO DE ERRORES GLOBALES
// ========================================

window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rechazada:', event.reason);
});

// ========================================
// SERVICE WORKER (PREPARADO PARA PWA)
// ========================================

/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado:', registration);
            })
            .catch(error => {
                console.log('Error al registrar SW:', error);
            });
    });
}
*/

// ========================================
// ESTADO DE LA APP
// ========================================

const AppState = {
    version: '2.0.0',
    environment: 'production', // 'development' | 'production'
    features: {
        chat: false, // Mes 2
        events: false, // Mes 3
        clubs: false, // Mes 3
        minigames: false, // Mes 4
        stories: false // Mes 5
    }
};

console.log('📊 Estado de la app:', AppState);

// ========================================
// UTILIDADES DE DESARROLLO
// ========================================

// Solo en desarrollo
if (AppState.environment === 'development') {
    window.devTools = {
        // Ver usuario actual
        getCurrentUser: () => currentUser,
        
        // Ver estado de Firebase
        getFirebaseState: () => ({
            auth: firebase.auth().currentUser,
            isSignedIn: !!firebase.auth().currentUser
        }),
        
        // Limpiar base de datos (¡CUIDADO!)
        clearAllPosts: async () => {
            if (confirm('¿ELIMINAR TODOS LOS POSTS? Esta acción no se puede deshacer')) {
                const snapshot = await db.collection('posts').get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log('✅ Posts eliminados');
            }
        },
        
        // Crear usuario de prueba
        createTestUser: async () => {
            const random = Math.random().toString(36).substring(7);
            try {
                await firebase.auth().createUserWithEmailAndPassword(
                    `test_${random}@desman.app`,
                    'password123'
                );
                console.log('✅ Usuario de prueba creado');
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };
    
    console.log('🛠️ DevTools disponibles en window.devTools');
}

// ========================================
// ANALYTICS (PREPARADO)
// ========================================

function trackEvent(eventName, params = {}) {
    if (AppState.environment === 'production') {
        // Aquí integrarías Firebase Analytics
        // firebase.analytics().logEvent(eventName, params);
        console.log('📊 Event:', eventName, params);
    }
}

// ========================================
// MANEJO DE CONEXIÓN
// ========================================

window.addEventListener('online', () => {
    showToast('✅ Conexión restaurada', 'success');
    // Recargar datos si es necesario
    if (document.getElementById('feedSection').style.display !== 'none') {
        loadPosts();
    }
});

window.addEventListener('offline', () => {
    showToast('⚠️ Sin conexión a internet', 'error', 5000);
});

// ========================================
// PREVENIR ZOOM EN iOS
// ========================================

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// ========================================
// MANEJO DE FOCUS EN INPUTS (MOBILE)
// ========================================

let lastScrollY = 0;

document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('focus', () => {
        lastScrollY = window.scrollY;
        // Prevenir que el teclado mueva la página
        setTimeout(() => {
            window.scrollTo(0, lastScrollY);
        }, 100);
    });
});

// ========================================
// LOGS DE RENDIMIENTO
// ========================================

if (AppState.environment === 'development') {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Tiempo de carga: ${pageLoadTime}ms`);
    });
}

// ========================================
// EXPORTAR PARA USO GLOBAL
// ========================================

window.DESMAN = {
    version: AppState.version,
    trackEvent: trackEvent,
    AppState: AppState
};

console.log('🚀 DESMAN lista para usar');