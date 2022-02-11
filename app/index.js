import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import { Worker } from 'worker_threads';
import { enqueue } from './subscriber.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(express.urlencoded());

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

app.get('/', async (req, res, next) => {
  fs.createReadStream('./app/public/index.html').pipe(res);
});

app.post('/scrape', async (req, res, next) => {
  const url = req.body.payload;

  const files = await fs.promises.readdir('./app/downloads');

  files.forEach(file => {
    fs.unlink(`./app/downloads/${file}`, () => {
      console.log(`${file} removed`);
    });
  });

  // DO the scraping here

  await enqueue(url);

  // TODO:
  // 1. Scrape given url from images
  // 2. Enqueue url to the image
  // 4. Add zipped option, that will zip all images together
  // 6. Cleanup code
});

app.get('/download', async (req, res, next) => {
  // This isn't even checking if there is something downloaded...#yolo
  const files = await fs.promises.readdir('./app/downloads');

  files.forEach(file => res.download(`./app/downloads/${file}`, file));
});

registerWorker();

app.listen(PORT, () => console.log(`App listening on port: ${PORT}`));
