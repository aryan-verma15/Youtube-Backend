import { Router } from 'express';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import {
    registerUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getUserHistory,
    loginUser,
    refreshAccessToken,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
} from '../controllers/user.controller.js';

const router = Router();

//unsecured route
router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
        {
            name: 'coverImage',
            maxCount: 1,
        },
    ]),
    registerUser,
);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);

//secured route
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/chnage-password').post(verifyJWT, changeCurrentPassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/c/:username').get(verifyJWT, getUserChannelProfile);
router.route('/update-account').patch(verifyJWT, updateAccountDetails);
router
    .route('/avatar')
    .patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router
    .route('/cover-image')
    .patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage);
router.route('/history').get(verifyJWT, getUserHistory);

export default router;
