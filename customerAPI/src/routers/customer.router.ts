import { Router } from 'express';
import CustomerController from '../controllers/customer.controller';

const router = Router();
const customerController = new CustomerController();

router.post('/approvedShipment', customerController.acceptedShipment);
router.post('/blockShipment', customerController.rejectShipment);

export default router;
