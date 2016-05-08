import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js'
import references from './references.js';

export default app => {
  app.post('/api/references', (req, res) => {
    references.save(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });

  app.get('/api/references', (req, res) => {
    if (req.query && req.query.sourceDocument) {
      references.getByDocument(req.query.sourceDocument)
      .then((response) => {
        res.json(response);
      })
      .catch((error) => {
        res.json({error: error.json});
      });
      return;
    }

    references.getAll()
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
