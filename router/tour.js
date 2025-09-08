const express = require('express');
const tourf = require('../controler/tourcontroler.js');

const tour = express.Router();
tour.route('/stats').get(tourf.getstats);
tour.route('/monthly/:year').get(tourf.getmontlyreport);
tour.route('/top-5-cheap').get(tourf.topcheap, tourf.alltour);
tour.route('/').post(tourf.addtour).get(tourf.alltour);
tour.route('/:id').get(tourf.gettourbyid).patch(tourf.updatetourbyid).delete(tourf.deletetourbyid);
module.exports = tour;
