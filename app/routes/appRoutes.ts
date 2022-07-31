import { Express } from 'express';
('use strict');
const routes = (app: Express) => {
  const configController = require('../controller/config');
  const userController = require('../controller/user');

  // Initial Config Routing
  app.route('/copa2022/general/config/').get(configController.default);

  // Users Routing
  app.route('/copa2022/users/').get(userController.listAll);
  //   app.route("/copa2022/user/update/").post(userController.update);
  //   app.route("/copa2022/user/updatePreferences/").post(userController.updatePreferences);
  app.route('/copa2022/user/register/').post(userController.register);
  app.route('/copa2022/user/login/').post(userController.login);
  app.route('/copa2022/user/logout/').get(userController.logout);
  app.route('/copa2022/user/:id/').get(userController.listById);

  app.use(function (req, res) {
    res.sendStatus(404);
  });
};

module.exports = routes;
