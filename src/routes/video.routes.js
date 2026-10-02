import { Router } from 'express';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';

const router = Router();

router.route('/upload').post(
    verifyJWT,
    upload.fields([
        {
            name: 'video',
            maxCount: 1,
        },
        {
            name: 'thumbnail',
            maxCount: 1,
        },
    ]),
    publishAVideo,
);
router.route('/c/:videoId').get(verifyJWT, getVideoById);
router.route('/update/:videoId').patch(verifyJWT, upload.single('newThumbnail'), updateVideo);
router.route('/delete/:videoId').delete(verifyJWT, deleteVideo)

export default router;
