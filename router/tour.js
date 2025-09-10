const express = require('express');
const tourf = require('../controler/tourcontroler.js');
const authcontroler = require('../controler/authcontroler');

const tour = express.Router();
tour.route('/stats').get(tourf.getstats);
tour.route('/monthly/:year').get(tourf.getmontlyreport);
tour.route('/top-5-cheap').get(tourf.topcheap, tourf.alltour);
tour.route('/').post(tourf.addtour).get(authcontroler.protect, tourf.alltour);
tour.route('/:id').get(tourf.gettourbyid).patch(tourf.updatetourbyid).delete(tourf.deletetourbyid);
module.exports = tour;
