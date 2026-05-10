export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    });
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
  }
}
