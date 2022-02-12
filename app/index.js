import archiver from 'archiver';
import axios from 'axios';
import bodyParser from 'body-parser';
import cheerio from 'cheerio';
import express from 'express';
import fs from 'fs';
import { enqueue } from './subscriber.js';
import { registerWorker, generateHash } from './utils.js';

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

app.get('/', async (req, res, next) => {
  fs.createReadStream('./app/public/index.html').pipe(res);
});

app.post('/scrape', async (req, res, next) => {
  const requestedUrl = req.body.payload;
  const hash = generateHash();
  const webPageContent = await axios.get(requestedUrl);
  const $ = cheerio.load(webPageContent.data);

  await fs.promises.mkdir(`./app/downloads/${hash}`);

  await Promise.all(
    $('img')
      .toArray()
      .map(async img => {
        const imageUrl = new URL(img.attribs.src);
        await enqueue(JSON.stringify({ url: imageUrl, folder: hash }));
      })
  );

  res.send(hash);
});

app.get('/download', async (req, res, next) => {
  const folderHash = req.query.folder;
  const isZip = req.query.zip === 'true';
  const downloadPath = `./app/downloads/${folderHash}`;
  const files = await fs.promises.readdir(downloadPath);

  if (files.length === 0) {
    throw new Error('Nothing to download');
  }

  if (isZip || files.length > 1) {
    const output = fs.createWriteStream(`${folderHash}/images.zip`);
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
    const file = files[0];
    res.download(`${downloadPath}/${file}`, file);
  }

  setTimeout(
    () => fs.rmSync(downloadPath, { recursive: true, force: true }),
    1000
  );
});

registerWorker();

app.listen(PORT, () => console.log(`App listening on port: ${PORT}`));
