import archiver from 'archiver';
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
  const hash = (Math.random() + 1).toString(36).substring(7);

  await fs.promises.mkdir(`./app/downloads/${hash}`);
  // DO the scraping here

  await enqueue(JSON.stringify({ url, folder: hash }));

  res.send(hash);
  // TODO:
  // 1. Scrape given url from images
  // 2. Enqueue url to the image
  // 6. Cleanup code
});

app.get('/download', async (req, res, next) => {
  const folderHash = req.query.folder;
  const isZip = req.query.zip === 'true';
  const downloadPath = `./app/downloads/${folderHash}`;
  const files = await fs.promises.readdir(downloadPath);

  if (files.length === 0) {
    throw new Error('Nothing to download');
  }

  if (isZip) {
    let output = fs.createWriteStream(`${folderHash}/images.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.pipe(output);

    files.forEach(file => {
      const readStream = fs.createReadStream(`${downloadPath}/${file}`);
      archive.append(readStream, { name: file });
    });

    archive.finalize();
    archive.pipe(res);
  } else {
    files.forEach(file => {
      res.download(`${downloadPath}/${file}`, file);
    });
  }

  setTimeout(
    () => fs.rmSync(downloadPath, { recursive: true, force: true }),
    0
  );
});

registerWorker();

app.listen(PORT, () => console.log(`App listening on port: ${PORT}`));
