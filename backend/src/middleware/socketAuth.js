/**
 * Socket.IO authentication middleware
 */

import jwt from 'jsonwebtoken';

export function createSocketAuthMiddleware(jwtSecret) {
  return (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      return next(new Error('Authentication error: invalid token'));
    }
  };
}

export default createSocketAuthMiddleware;
