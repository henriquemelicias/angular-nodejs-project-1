const express = require( 'express' );
const router = express.Router();

const photoController = require( '../controllers/photoController' );

// POST route /
router.post( '/', photoController.post_photo );

// DELETE route /photo/:_id
router.delete( '/:id', photoController.delete_photo )

// GET route /photo/:_id
router.get( '/:id', photoController.get_photo );

// GET recent photo info
router.get( '/info/recent', photoController.get_info_recent_photos );

// GET most liked photo info
router.get( '/info/liked', photoController.get_info_most_liked_photos )

// GET route /photo/:_id/thumbnail
router.get( '/:id/thumbnail', photoController.get_photo_thumbnail );

// PUT route /photo/:id
// change only likes
router.put( '/:id', photoController.change_photo_likes )

module.exports = router;
