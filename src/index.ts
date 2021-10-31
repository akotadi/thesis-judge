import * as express from 'express';
import * as appconfig from './config/appconfig.json';
import routes from './routes';

const app = express();

app.use(express.json());

app.use('/', routes);

const port = appconfig.port || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
