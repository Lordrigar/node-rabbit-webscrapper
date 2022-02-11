import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res, next) => {
  res.json('Hello World');
});

app.listen(PORT, () => console.log(`App listening on port: ${PORT}`));
