import { Express } from 'express';
('use strict');
const routes = (app: Express) => {
  const betController = require('../controller/bet');
  const cacheController = require('../controller/cache');
  const configController = require('../controller/config');
  const matchController = require('../controller/match');
  const playerController = require('../controller/player');
  const rankingController = require('../controller/ranking');
  const teamController = require('../controller/team');
  const userController = require('../controller/user');

  // Initial Config Routing
  app.route('/copa2022/general/config/').get(configController.default);

  // Cache Refresh
  app.route('/copa2022/general/cacheRefresh/').get(cacheController.refresh);

  // Mailer Routing
  //   app.route('/copa2022/user/helloAgain').get(userController.helloAgain);

  // Home Routing
  app.route('/copa2022/general/news/').get(configController.news);
  app.route('/copa2022/general/news/:key').post(configController.postNews);

  // User Routing
  app.route('/copa2022/user/').get(userController.listAll);
  app
    .route('/copa2022/user/updateIsActive/')
    .post(userController.updateIsActive);
  app.route('/copa2022/user/updateInfo/').post(userController.updateInfo);
  app
    .route('/copa2022/user/updatePassword/')
    .post(userController.updatePassword);
  app.route('/copa2022/user/register/').post(userController.register);
  app.route('/copa2022/user/login/').post(userController.login);
  app.route('/copa2022/user/logout/').get(userController.logout);
  app.route('/copa2022/user/forgotPassword').get(userController.resetPassword);
  app
    .route('/copa2022/user/recoverPassword')
    .post(userController.recoverPassword);
  app.route('/copa2022/user/:id/').get(userController.listById);

  // Bet Routing
  app.route('/copa2022/bet/').post(betController.update);
  app.route('/copa2022/extraBets/').get(betController.listAllExtras);
  app.route('/copa2022/extraBets/').post(betController.updateExtra);

  // Player Routing
  app.route('/copa2022/player/').get(playerController.listAll);
  
  // Team Routing
  app.route('/copa2022/team/').get(teamController.listAll);
  app.route('/copa2022/team/:id/').get(teamController.listById);
  app.route('/copa2022/team/:teamId/players').get(teamController.listPlayersByTeam);

  // Match Routing
  app.route('/copa2022/match/').get(matchController.listAll);
  app.route('/copa2022/match/update/').get(matchController.update);
  app.route('/copa2022/match/current/').get(matchController.listAll);

  // Ranking Routing
  app.route('/copa2022/ranking/').get(rankingController.listAll);
  app.route('/copa2022/ranking/:round').get(rankingController.listAll);

  app.use(function (req, res) {
    res.sendStatus(404);
  });
};

module.exports = routes;
