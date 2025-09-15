const express = require('express');
const controler = require('../controler/usercontroler');
const authcontroler = require('../controler/authcontroler');

const router = express.Router();

router.post('/signup', authcontroler.signup);
router.post('/login', authcontroler.login);
router.post('/forgotpassword', authcontroler.forgotpassword);
router.patch('/resetpassword/:token', authcontroler.resetpassword);
router.patch('/updatepassword', authcontroler.protect, authcontroler.updatepassword);
router.patch('/updateme', authcontroler.protect, controler.updateMe);
router.delete('/deleteme', authcontroler.protect, controler.deleteMe);

router.param('id', controler.checkid);
router.route('/').get(controler.getalluser);
router.route('/:id').get(controler.getuserbyid);

module.exports = router;
