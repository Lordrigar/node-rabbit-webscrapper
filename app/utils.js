import amqp from 'amqplib';
import { Worker } from 'worker_threads';

const QUEUE_NAME = 'jobs';

const registerWorker = () => {
  const worker = new Worker('./app/consumer.js');

  worker.on('message', msg => {
    console.log('Message from worker: ' + msg);
  });

  worker.on('error', err => {
    console.log(`Worker error ${err}`);
  });

  worker.on('exit', code => {
    console.log(`Worker exited with code ${code}`);
  });
};

const generateHash = () => (Math.random() + 1).toString(36).substring(7);

const rabbitConnect = async () => {
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

export { QUEUE_NAME, registerWorker, generateHash, rabbitConnect };
