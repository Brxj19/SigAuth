const app = require('./src/app');

const port = Number(process.env.PORT || 4100);

app.listen(port, () => {
  console.log(`Logistica Delivery backend running on port ${port}`);
});

