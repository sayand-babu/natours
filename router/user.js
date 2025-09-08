const express = require('express');
const controler = require('../controler/usercontroler');

const router = express.Router();

router.param('id', controler.checkid);
router.route('/').get(controler.getalluser);
router.route('/:id').get(controler.getuserbyid);

module.exports = router;
