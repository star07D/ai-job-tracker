import { Request } from 'express';
import { JwtPayload } from '../jwt/jwt.strategy';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
