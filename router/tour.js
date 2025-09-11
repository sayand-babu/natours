const express = require('express');
const tourf = require('../controler/tourcontroler.js');
const authcontroler = require('../controler/authcontroler');

const tour = express.Router();
tour.route('/stats').get(authcontroler.protect, tourf.getstats);
tour.route('/monthly/:year').get(authcontroler.protect, tourf.getmontlyreport);
tour.route('/top-5-cheap').get(authcontroler.protect, tourf.topcheap, tourf.alltour);
tour
  .route('/')
  .post(authcontroler.protect, tourf.addtour)
  .get(authcontroler.protect, tourf.alltour);
tour
  .route('/:id')
  .get(authcontroler.protect, tourf.gettourbyid)
  .patch(authcontroler.protect, tourf.updatetourbyid)
  .delete(
    authcontroler.protect,
    authcontroler.restrict('admin', 'lead-guide'),
    tourf.deletetourbyid
  );
module.exports = tour;
