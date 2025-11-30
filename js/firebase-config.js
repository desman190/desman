// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================

// TODO: Reemplaza con TUS credenciales de Firebase
// Ve a: https://console.firebase.google.com/
// 1. Crea un proyecto
// 2. Agrega una app web
// 3. Copia estas credenciales

const firebaseConfig = {
  apiKey: "AIzaSyDSJLYEWtNVt_Qv_w_2gBM9NAaq4krvRVk",
  authDomain: "desman-4a5e6.firebaseapp.com",
  projectId: "desman-4a5e6",
  storageBucket: "desman-4a5e6.firebasestorage.app",
  messagingSenderId: "1085761087668",
  appId: "1:1085761087668:web:e1a686586d230b0c88cfe1"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistencia
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log('🔥 Firebase inicializado correctamente');