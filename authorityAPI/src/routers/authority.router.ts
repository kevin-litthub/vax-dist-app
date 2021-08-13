import { Router } from 'express';
import AuthorityController from '../controllers/authority.controller';

const router = Router();
const authorityController = new AuthorityController();

router.post('/approvedShipment', authorityController.approvedShipment);
router.post('/blockShipment', authorityController.blockShipment);

export default router;
