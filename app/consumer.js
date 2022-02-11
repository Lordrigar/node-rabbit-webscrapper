import amqp from 'amqplib';
import axios from 'axios';
import fs from 'fs';
import { parentPort } from 'worker_threads';

const QUEUE_NAME = 'jobs';

const downloadFile = async url => {
  const path = './app/downloads';
  const lastIndex = url.lastIndexOf('/');
  const fileName = url.substr(lastIndex + 1);

  const image = await axios({
    method: 'GET',
    url: `${url}`,
    responseType: 'stream',
  });

  image.data.pipe(fs.createWriteStream(`${path}/${fileName}`));

  return new Promise((resolve, reject) => {
    image.data.on('end', () => {
      resolve(`${path}/${fileName}`);
    });

    image.data.on('error', () => {
      reject();
    });
  });
};

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

const dequeue = async () => {
  const channel = await connect();

  channel.consume(QUEUE_NAME, async msg => {
    const url = msg.content.toString();

    console.log({ url });

    const downloadedFilePath = await downloadFile(url);

    parentPort.postMessage(downloadedFilePath);

    channel.ack(msg);
  });
};

setInterval(dequeue, 2000);
