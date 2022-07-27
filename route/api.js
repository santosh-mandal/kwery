var express = require('express');
var router = express.Router();

const apiAuth = require("../middleware/auth");

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const feedBoard = require('../controllers/feed-board.controller');


/* GET users listing. */
router.post('/sign-up', async (req, res, next) => {
    await auth.signup(req, res, next);
});
router.post('/login', async (req, res, next) => {
    await auth.login(req, res, next);
});
router.post('/forgot-password/send-otp', async (req, res, next) => {
    await auth.forgotPasswordSendOtp(req, res, next);
});
router.post('/forgot-password/validate-otp', async (req, res, next) => {
    await auth.forgotPasswordValidateOtp(req, res, next);
});
router.post('/forgot-password/reset-password', async (req, res, next) => {
    await auth.forgotPasswordResetPassword(req, res, next);
});




router.get('/users', apiAuth, async (req, res, next) => {
    await user.index(req, res, next);
});

router.get('/quotes', apiAuth, async (req, res, next) => {
    await feedBoard.quotes(req, res, next);
});

router.get('/hastags', apiAuth, async (req, res, next) => {
    await feedBoard.hastags(req, res, next);
});
router.get('/feed-board', apiAuth, async (req, res, next) => {
    await feedBoard.index(req, res, next);
});

router.get('/feed-board-post/:type/:feedBoardId', apiAuth, async (req, res, next) => {
    await feedBoard.feedBoardPost(req, res, next);
});



router.post('/feed-board-post-delete/:type/:feedBoardId', apiAuth, async (req, res, next) => {
    await feedBoard.feedBoardPostDelete(req, res, next);
});

router.get('/popular-hastags', apiAuth, async (req, res, next) => {
    await feedBoard.popularHastags(req, res, next);
});
router.post('/uplaod-image', apiAuth, async (req, res, next) => {
    await feedBoard.uplaodImage(req, res, next);
});

router.post('/ask-question', apiAuth, async (req, res, next) => {
    await feedBoard.askQuestion(req, res, next);
});
router.post('/update-question', apiAuth, async (req, res, next) => {
    await feedBoard.updateQuestion(req, res, next);
});
router.post('/share-story', apiAuth, async (req, res, next) => {
    await feedBoard.shareStory(req, res, next);
});
router.post('/update-story', apiAuth, async (req, res, next) => {
    await feedBoard.updateStory(req, res, next);
});
router.post('/post-answer', apiAuth, async (req, res, next) => {
    await feedBoard.postAnswer(req, res, next);
});
router.post('/post-comment', apiAuth, async (req, res, next) => {
    await feedBoard.postComment(req, res, next);
});

router.post('/update-answer', apiAuth, async (req, res, next) => {
    await feedBoard.updateAnswer(req, res, next);
});
router.post('/update-comment', apiAuth, async (req, res, next) => {
    await feedBoard.updateComment(req, res, next);
});

router.post('/delete-answer', apiAuth, async (req, res, next) => {
    await feedBoard.deleteAnswer(req, res, next);
});
router.post('/delete-comment', apiAuth, async (req, res, next) => {
    await feedBoard.deleteComment(req, res, next);
});

router.post('/recat/:type', apiAuth, async (req, res, next) => {
    await feedBoard.recat(req, res, next);
});
router.post('/remove-recat/:type', apiAuth, async (req, res, next) => {
    await feedBoard.removeRecat(req, res, next);
});
// router.get('/save', apiAuth, async (req, res, next) => {
//     await feedBoard.save(req, res, next);
// });



router.post('/uplaod-profile-image', apiAuth, async (req, res, next) => {
    await user.uplaodImage(req, res, next);
});
router.get('/profile-details', apiAuth, async (req, res, next) => {
    await user.profileDetails(req, res, next);
});

router.post('/update-profile-details', apiAuth, async (req, res, next) => {
    await user.updateProfileDetails(req, res, next);
});

router.post('/update-profile-password', apiAuth, async (req, res, next) => {
    await user.updateProfilePassword(req, res, next);
});
module.exports = router;
