import { rabbitConnect, QUEUE_NAME } from './utils.js';

const enqueue = async job => {
  const channel = await rabbitConnect();

  channel.sendToQueue(QUEUE_NAME, Buffer.from(job));
};

export { enqueue };
