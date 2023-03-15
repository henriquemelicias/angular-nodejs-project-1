const express = require( 'express' );
const router = express.Router();

const userController = require( '../controllers/userController' );

// GET route /user/:username
router.get( '/:username', userController.get_user );

// PUT route /user/
router.put( '/', userController.put_user );

module.exports = router;
