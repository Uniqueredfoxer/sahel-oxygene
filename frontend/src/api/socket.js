import { io } from 'socket.io-client';

let socket = null;

function getSocketBaseUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return import.meta.env.PROD ? 'https://sahel-oxygene.onrender.com' : window.location.origin;
}

export function getSocket() {
  const token = localStorage.getItem('sahel_token');
  
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      autoConnect: Boolean(token),
      transports: ['websocket', 'polling'],
      auth: {
        token: token || null,
      },
    });

    socket.on('connect_error', (err) => {
      // Si erreur d'authentification, on déconnecte proprement sans loop de redirection
      if (err.message && err.message.includes('Authentication error')) {
        console.warn('Socket.IO non authentifié :', err.message);
      }
    });
  } else if (token && (!socket.auth || socket.auth.token !== token)) {
    // Si le token a changé (login récent), mettre à jour l'authentification et reconnecter
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function connecterSocket(token) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  } else {
    getSocket();
  }
}

export function deconnecterSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function rejoindreCanal({ userId }) {
  if (!userId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('rejoindre', { userId });
  } else {
    s.once('connect', () => {
      s.emit('rejoindre', { userId });
    });
  }
}

export default getSocket;
