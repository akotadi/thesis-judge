import { Router } from 'express';

import { submit, test, validate } from '../../controllers/problem';
import authorization from '../../middleware/authorization';

const router = Router();

router.post('/validate', authorization, validate);
router.post('/submit', authorization, submit);
router.post('/test', authorization, test);

export default router;
