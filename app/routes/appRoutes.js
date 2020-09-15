'use strict';
module.exports = function (app) {
    const cookiesController = require('../controller/cookies');
    const matchController = require('../controller/match');
    const teamController = require('../controller/team');
    const userController = require('../controller/user');

    // Matches Routing
    app.route('/bolaonfl/matches/update/:season/:key/')
        .get(matchController.updateBySeason)

    app.route('/bolaonfl/matches/season/:season/')
        .get(matchController.listBySeason)

    app.route('/bolaonfl/matches/week/:week/')
        .get(matchController.listByWeek)

    app.route('/bolaonfl/matches/:season/:week')
        .get(matchController.list)

    // Users Routing
    app.route('/bolaonfl/users/')
        .get(userController.listAll)

    app.route('/bolaonfl/usercheck/')
        .get(userController.check)

    app.route('/bolaonfl/user/:id/')
        .get(userController.listById)

    app.route('/bolaonfl/login/')
        .get(userController.login)

    app.route('/bolaonfl/logout/')
        .get(userController.logout)

    // Teams routing
    app.route('/bolaonfl/teams/')
        .get(teamController.listAll)

    // Cookies Routing
    app.route('/bolaonfl/cookies/')
        .post(cookiesController.update)
};

