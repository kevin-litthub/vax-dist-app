import { Request, Response, Router } from 'express';
import { connection } from '..';
import Event from '../entities/event.entity';
import { v4 as uuid } from 'uuid';
import createEvent from '../utils/helperFunctions';
import { isNil } from 'ramda';

const router = Router();

router.post('/event', async (req: Request, res: Response) => {
  const token = await req.headers['authorization']?.split(' ')[1];
  console.log('req.body => ', req.body);
  const hash = await req.body.hash;
  console.log('hash => ', hash);
  if (hash && token) {
    const { event, savedEvent } = await createAndSaveEvent(hash, token);
    res.status(200).send({
      id: event.id,
      hash: hash,
      nonce: savedEvent?.nonce,
      timestamp: event.timestamp,
    });
  }
  if (hash === null && !isNil(token)) {
    try {
      const { event, savedEvent } = await createAndSaveEvent(hash, token);
      res.status(200).send({ id: event.id, timestamp: savedEvent?.timestamp });
    } catch (err) {
      console.log('error => ', err);
    }
  }
});

router.get('/event/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (id) {
    try {
      const event = await connection.manager.findOne(Event, { id: id });
      res.status(200).send({ id: event?.id, hash: event?.hash, nonce: event?.nonce, timestamp: event?.timestamp  });
    } catch (error) {
      console.log(`The hash ${id} was not stored ${error}`);
    }
  }
});

export default router;

async function createAndSaveEvent(hash: string | null, token: string) {
  const id = uuid();
  const event = createEvent(hash, id, token);
  await connection.manager.save(event);
  const savedEvent = await connection.manager.findOne(Event, { id: id });
  return { event, savedEvent };
}
