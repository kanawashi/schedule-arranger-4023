'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const { param, body, validationResult } = require('express-validator');
const Availability = require('../models/availability');

router.post(
  '/:scheduleId/users/:userId/candidates/:candidateId',
  authenticationEnsurer,
  async (req, res, next) => {
    await body('availability').isInt({min:0,max:2}).withMessage('0以上2以下の数値を指定してください。').run(req);
    await param('scheduleId').isUUID('4').withMessage('有効なスケジュールIDを入力してください。').run(req);
    await param('candidateId').isInt().withMessage('有効な候補IDを指定してください。').run(req);
    await param('userId').isInt().custom( (value, {req}) => {
      return parseInt(value) === parseInt(req.user.id);
    }).withMessage('ユーザーIDが不正です。').run(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({status: 'NG', error: errors.array()});
    }

    const scheduleId = req.params.scheduleId;
    const userId = req.params.userId;
    const candidateId = req.params.candidateId;
    let availability = req.body.availability;
    availability = availability ? parseInt(availability) : 0;

    try {
      await Availability.upsert({
        scheduleId: scheduleId,
        userId: userId,
        candidateId: candidateId,
        availability: availability
      });
      res.status(200).json({ status: 'OK', availability: availability });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'NG', errors: [{msg: 'データベースエラー'}]});
    }
  }
);

module.exports = router;
