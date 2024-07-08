import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const extractUserId = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET) ;
  return decoded.email;
};