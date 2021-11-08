import { Router } from 'express';

import { submit, validate } from '../../controllers/problem';
import authorization from '../../middleware/authorization';

const router = Router();

router.post('/validate', authorization, validate);
router.post('/submit', authorization, submit);

export default router;
