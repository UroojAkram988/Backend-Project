import { Router } from 'express';
import { registerUser ,loginUser, logoutUser,refereshaccesstoken,changeUserpassword,getCurrentUser
,updateAccountdetails,updateavatarfile,updatecoverimagefile,getuserchannelprofile,getuserwatchhistory
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },

    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);
router.route('/login').post(loginUser)


//secured routes
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refereshaccesstoken)

router.route('/change-password').post(verifyJWT,changeUserpassword)
router.route('/current-user').get(verifyJWT,getCurrentUser)
router.route('/update-account-details').patch(verifyJWT,updateAccountdetails)
router.route('/update-avatar').patch(verifyJWT,upload.single('avatar'),updateavatarfile)
router.route('/update-cover-image').patch(verifyJWT,upload.single('coverImage'),updatecoverimagefile)
router.route('/channel-profile/:username').get(verifyJWT,getuserchannelprofile)
router.route('/watch-history').get(verifyJWT,getuserwatchhistory) 

export default router;
