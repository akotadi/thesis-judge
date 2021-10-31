import { NextFunction, Request, Response, Router } from 'express';

const router = Router();

router.get('*', (_req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json('404 Not Found');
});

export default router;
