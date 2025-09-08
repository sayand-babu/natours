/* eslint-disable prettier/prettier */
const express = require('express');
const Apperror = require('./utils/apperror');
const user = require('./router/user');
const tour = require('./router/tour');
const errorcontorl = require('./controler/errorcontorl');

const app = express();

// middleware
app.use(express.json());

// routes
app.use('/api/vs/tour', tour);
app.use('/api/vs/user', user);
app.all('*', (req, res, next) => {
  const err = new Apperror(400, 'the url is not found');
  next(err);
});

// when we pass the err to any next middle ware it will move on to the middle ware with the err in  as the parameter  skiping all between middleware

// make a middle ware for gloabal error handling with argument with  err, req, res, next
app.use(errorcontorl);

module.exports = app;
