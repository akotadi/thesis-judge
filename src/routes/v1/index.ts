import { Router } from 'express';

import problem from './problem';
import language from './language';
import judge from './judge';

const router = Router();

router.use('/problem', problem);
router.use('/language', language);
router.use('/judge', judge);

export default router;
