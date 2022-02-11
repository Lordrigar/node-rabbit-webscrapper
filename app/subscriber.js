import amqp from 'amqplib';

const QUEUE_NAME = 'jobs';

const connect = async () => {
  let channel;
  try {
    const connection = await amqp.connect('amqp://rabbitmq');

    channel = await connection.createChannel();
    channel.assertQueue(QUEUE_NAME, {
      durable: false,
    });
  } catch (error) {
    throw error;
  }

  return channel;
};

const enqueue = async job => {
  const channel = await connect();

  channel.sendToQueue(QUEUE_NAME, Buffer.from(job));
};

export { enqueue };
