const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Images/fonts rarely change -> cache a month. CSS/JS keep stable file names, so revalidate after an hour.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (/\.(webp|avif|png|jpe?g|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  }
}));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
