import { Request, Response, NextFunction } from 'express';
import * as appconfig from '../config/appconfig.json';

const requireAuthentication =
  appconfig['x-auth-token'] === undefined || appconfig['x-auth-token'] === '' ? false : true;

const authorization = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['x-auth-token'];
  if (requireAuthentication && authHeader === undefined) {
    res.sendStatus(401); //Unauthorized
    res.setHeader('authorized', 'false');
    next();
    return;
  }
  if (requireAuthentication && authHeader !== appconfig['x-auth-token']) {
    res.sendStatus(403); // Forbidden
    res.setHeader('authorized', 'false');
    next();
    return;
  }
  res.setHeader('authorized', 'true');
  next();
};

export default authorization;
