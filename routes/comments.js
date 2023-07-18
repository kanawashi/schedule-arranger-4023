'use strict';
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

router.post(
  '/:scheduleId/users/:userId/comments',
  authenticationEnsurer,
  async (req, res, next) => {
    await body('comment').isString().withMessage('コメントを入力してください。').run(req);
    await param('scheduleId').isUUID('4').withMessage('有効なスケジュールIDを入力してください。').run(req);
    await param('userId').isInt().custom( (value, {req}) => {
      return parseInt(value) === parseInt(req.user.id)
    }).withMessage('ユーザーIDが不正です。').run(req);
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({status: 'NG', errors: errors.array()});
    }

    const scheduleId = req.params.scheduleId;
    const userId = req.params.userId;
    const comment = req.body.comment;

    try {
      await Comment.upsert({
        scheduleId: scheduleId,
        userId: userId,
        comment: comment.slice(0, 255)
      });
      res.json({ status: 'OK', comment: comment });
    } catch (error) {
      console.error(error);
      res.status(500).json({status: 'NG', errors: [{ msg: 'データベースエラー'}]});
    }

  }
);

module.exports = router;
