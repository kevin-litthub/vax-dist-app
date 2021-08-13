import Event from "../entities/event.entity";

export default function createEvent(hash: any, id: string, token: string): Event {
    const event = new Event();
    event.hash = hash;
    event.id = id;
    event.timestamp = new Date().getTime();
    event.signature = token;
    return event;
}