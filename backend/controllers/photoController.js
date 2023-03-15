const Photo = require( '../models/photo' );
const User = require( '../models/user' );
const authController = require( './authController' );
const sharp = require( 'sharp' );

// limit of photos to send to user when requested
const PHOTO_LIMIT = 50;

// width and height of thumbnail generated when new photo is uploaded
const THUMBNAIL_WIDTH_PX = 350;
const THUMBNAIL_HEIGHT_PX = 350;

// max text size for thumbnail and description
const THUMBNAIL_MAX_NAME_SIZE = 60;
const THUMBNAIL_MAX_DESCRIPTION_SIZE = 120;

// delete photo
exports.delete_photo = function ( req, res )
{
    // token is required
    if ( !authController.isAccessTokenValid( req, res ) ) return;

    Photo.findByIdAndDelete( req.params.id )
         .exec( ( err, photo ) =>
         {
             if ( err )
             {
                 res.status( 400 ).send( {message: "Failed to delete photo from database."} );
                 return;
             }

             if ( !photo )
             {
                 res.status( 400 ).send( {message: "Photo doesn't exist in database."} );
                 return;
             }

             // delete photo references from users in database
             photo.remove();

             // success
             res.status( 200 ).send();
         } );
}

exports.post_photo = async function ( req, res )
{
    // token is required
    if ( !authController.isAccessTokenValid( req, res ) ) return;

    // username of the user to append new photo id to photo list
    const username = req.body.username;

    // new photo info
    const photoBase64 = req.body.newPhoto.base64;
    const photoName = req.body.newPhoto.name;
    const photoDescription = req.body.newPhoto.description;

    if ( photoBase64 && photoName )
    {
        // create thumbnail for new photo
        const base64Thumbnail = await createThumbnailBase64( photoBase64, THUMBNAIL_WIDTH_PX, THUMBNAIL_HEIGHT_PX );

        const newPhoto = new Photo( {
            base64: photoBase64,
            base64Thumbnail: base64Thumbnail,
            name: photoName,
            description: photoDescription,
            likes: 0
        } );

        // saves new photo in database
        newPhoto.save( ( err, photo ) =>
        {
            if ( err )
            {
                res.status( 400 ).send( {message: "Failed to save photo to database."} );
                return;
            }

            // updates user
            User.findOneAndUpdate( {username: username}, {$push: {photoList: photo._id}} )
                .lean()
                .select( "photoList" )
                .exec( ( err, user ) =>
                {
                    if ( err )
                    {
                        res.status( 400 ).send( {message: "Failed append new photo to user in database."} );
                        return;
                    }

                    // send id back
                    res.status( 200 ).send( {photoId: photo._id} );
                } );
        } );
    }
    else
    {
        res.status( 400 ).send( {message: "Invalid parameters."} );
    }
}

/**
 * Creates thumbnail from base64 with the specified width and height.
 *
 * @param originalBase64 original image base64.
 * @param width thumbnail width.
 * @param height thumbnail height.
 * @return {Promise<string>} base64 of the thumbnail created.
 */
async function createThumbnailBase64( originalBase64, width, height )
{
    const tokens = originalBase64.split( ';base64,' );
    const uri = tokens[1];
    let imgBuffer = Buffer.from( uri, 'base64' );
    let result;
    await sharp( imgBuffer )
        .resize( width, height )
        .toBuffer()
        .then( data => result = data )
        .catch( err => console.log( `thumbnail creation error ${err}` ) );
    return tokens[0] + ';base64,' + result.toString( 'base64' );
}

exports.get_photo = function ( req, res )
{
    Photo.findById( req.params.id, 'base64 name description likes' ).lean()
         .exec( ( err, photo ) =>
         {
             if ( err )
             {
                 // invalid id (aka photo not found)
                 if ( err.message.indexOf( 'Cast to ObjectId failed' ) !== -1 )
                 {
                     res.status( 404 ).send( {message: "Photo Not found."} );
                     return;
                 }

                 res.status( 500 ).send( {message: err} );
                 return;
             }

             // if photo does not exist in database
             if ( !photo )
             {
                 res.status( 400 ).send( {message: "Photo Not found."} );
                 return;
             }

             // photos sent will only needed to be revalidated if there's changes (check everytime max-age = 0)
             res.set( 'Cache-Control', 'public, max-age=0, must-revalidate' );
             res.status( 200 ).send( photo );
         } );
}

exports.get_photo_thumbnail = function ( req, res )
{
    Photo.findById( req.params.id, 'base64Thumbnail name description' )
         .lean()
         .exec( ( err, photo ) =>
         {
             if ( err )
             {
                 res.status( 500 ).send( {message: err} );
                 return;
             }

             // if photo does not exist in database
             if ( !photo )
             {
                 res.status( 404 ).send( {message: "Photo thumbnail Not found."} );
                 return;
             }

             // we only need to send part of the name for the thumbnail
             let briefName = photo.name.substring( 0, THUMBNAIL_MAX_NAME_SIZE );

             // if description couldn't fit, add ellipses
             if ( briefName.length !== photo.name.length )
                 briefName = briefName + " ...";

             // we only need to send part of the description for the thumbnail
             let briefDescription = photo.description.substring( 0, THUMBNAIL_MAX_DESCRIPTION_SIZE );

             // if description couldn't fit, add ellipses
             if ( briefDescription.length !== photo.description.length )
                 briefDescription = briefDescription + " ...";

             // thumbnails are imutable and will have a cache duration of 1000 seconds
             res.set( 'Cache-Control', 'public, max-age=1000, imutable' );

             // sends thumbnail
             res.status( 200 ).send( {
                 base64Thumbnail: photo.base64Thumbnail,
                 name: briefName,
                 description: briefDescription
             } );
         } );
}

// get the most recent photos ids and indices
exports.get_info_recent_photos = function ( req, res )
{
    Photo.find( {}, '_id' )
         .lean() // JSON objects instead of Document for better performance
         .sort( {$natural: -1} ) // sort by most recent first
         .limit( PHOTO_LIMIT )
         .exec( function ( err, photoList )
         {
             if ( err )
             {
                 res.status( 400 ).send( {message: err} );
                 return;
             }

             // send photoList
             const photoInfoList = [];
             let photoIndex = 0;

             photoList.forEach( function ( photo )
             {
                 photoInfoList.push( {_id: photo._id, index: photoIndex++} )
             } );

             res.status( 200 ).send( photoInfoList );
         } );
}

// get the most liked photos ids and indices
exports.get_info_most_liked_photos = function ( req, res )
{
    Photo.find( {}, 'likes' )
         .lean() // JSON objects instead of Document for better performance
         .sort( {likes: -1} ) // sort by most liked first
         .limit( PHOTO_LIMIT )
         .exec( function ( err, photoList )
         {
             if ( err )
             {
                 res.status( 400 ).send( {message: err} );
                 return;
             }

             const photoInfoList = [];
             let photoIndex = 0;

             photoList.forEach( function ( photo )
             {
                 photoInfoList.push( {_id: photo._id, index: photoIndex++} )
             } );

             res.status( 200 ).send( photoInfoList );
         } );
}

// change photo likes (increment or decrement by 1)
exports.change_photo_likes = function ( req, res )
{
    // needs token
    if ( !authController.isAccessTokenValid( req, res ) ) return;

    // like change: +1 to increment and -1 to decrement from photo likes
    const likeChange = req.body.likeChange;

    // userId to change likedPhotoList with the id of the photo liked
    const userId = req.body.userId;

    // new likedPhotoList to replace the older
    const likedPhotoList = req.body.likedPhotoList;

    if ( likeChange && userId )
    {
        // removes any duplicates of the photo id to remove/add to the user's liked photo list
        let updatedLikedPhotoList;

        updatedLikedPhotoList = likedPhotoList.filter( function ( e )
        {
            return e !== req.params.id;
        } )

        // increment to list if user liked photo
        if ( likeChange === 1 )
            updatedLikedPhotoList.push( req.params.id );

        // update photo
        Photo.findOneAndUpdate( {_id: req.params.id}, {$inc: {"likes": likeChange}} )
             .lean()
             .select( "likes" )
             .exec( ( err, photo ) =>
             {
                 if ( err )
                 {
                     res.status( 400 ).send( {message: err} );
                     return;
                 }

                 if ( !photo )
                 {
                     res.status( 400 ).send( {message: "Photo not found!"} )
                     return;
                 }

                 // update user
                 User.findOneAndUpdate( {_id: userId}, {'likedPhotoList': updatedLikedPhotoList} )
                     .lean()
                     .select( "likedPhotoList" )
                     .exec( ( err, user ) =>
                     {
                         if ( err )
                         {
                             res.status( 400 ).send( {message: err} );
                             return;
                         }

                         if ( !user )
                         {
                             res.status( 400 ).send( {message: "User not found!"} );
                             return;
                         }

                         res.status( 200 ).send();
                     } );
             } );
    }
}


