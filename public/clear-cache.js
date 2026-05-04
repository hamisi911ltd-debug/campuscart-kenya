// Force clear browser cache and reload
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
  });
}

// Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();

console.log('🧹 Cache cleared! Reloading...');
setTimeout(() => {
  window.location.reload(true);
}, 1000);