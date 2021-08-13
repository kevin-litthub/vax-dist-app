import { Router } from 'express';
import ManufacturerController from '../controllers/manufacturer.controller';

const router = Router();
const manufacturerController = new ManufacturerController();

router.post('/createShipment', manufacturerController.createShipment);
router.post('/shipShipment', manufacturerController.shipShipment);
router.get('/shipments', manufacturerController.getAllShipments);

export default router;
