import { Express } from 'express';
('use strict');
const routes = (app: Express) => {
  const betController = require('../controller/bet');
  const configController = require('../controller/config');
  const teamController = require('../controller/team');
  const userController = require('../controller/user');

  // Initial Config Routing
  app.route('/copa2022/general/config/').get(configController.default);

  // User Routing
  app.route('/copa2022/user/').get(userController.listAll);
  app.route('/copa2022/user/updateInfo/').post(userController.updateInfo);
  app
    .route('/copa2022/user/updatePassword/')
    .post(userController.updatePassword);
  app.route('/copa2022/user/register/').post(userController.register);
  app.route('/copa2022/user/login/').post(userController.login);
  app.route('/copa2022/user/logout/').get(userController.logout);
  app.route('/copa2022/user/:id/').get(userController.listById);
  
  // Bet Routing
  app.route('/copa2022/bet/update/').post(betController.update);

  // Team Routing
  app.route('/copa2022/team/').get(teamController.listAll);
  app.route('/copa2022/team/:id/').get(teamController.listById);

  app.use(function (req, res) {
    res.sendStatus(404);
  });
};

module.exports = routes;
