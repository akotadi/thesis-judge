import { Router } from 'express';

import { list } from '../../controllers/judge';
import authorization from '../../middleware/authorization';

const router = Router();

router.get('/', authorization, list);

export default router;
