import axios from 'axios';
import fs from 'fs';
import { rabbitConnect, QUEUE_NAME } from './utils.js';

const downloadFile = async (url, folder) => {
  const path = './app/downloads';
  const lastIndex = url.lastIndexOf('/');
  const fileName = url.substr(lastIndex + 1);

  const image = await axios({
    method: 'GET',
    url: `${url}`,
    responseType: 'stream',
  });

  image.data.pipe(fs.createWriteStream(`${path}/${folder}/${fileName}`));

  return new Promise((resolve, reject) => {
    image.data.on('end', () => {
      resolve(`${path}/${fileName}`);
    });

    image.data.on('error', () => {
      reject();
    });
  });
};

const dequeue = async () => {
  const channel = await rabbitConnect();

  channel.consume(QUEUE_NAME, async msg => {
    const { url, folder } = JSON.parse(msg.content.toString());

    await downloadFile(url, folder);

    channel.ack(msg);
  });
};

setInterval(dequeue, 5000);
