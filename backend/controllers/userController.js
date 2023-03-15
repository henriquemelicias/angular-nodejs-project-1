const User = require( '../models/user' );
const authController = require( './authController' )

exports.get_user = function ( req, res )
{
    if ( !authController.isAccessTokenValid( req, res ) ) return;

    // we are not sending the password token
    User.findOne( {username: req.params.username}, "username photoList likedPhotoList favouritePhotoList" )
        .lean()
        .exec( ( err, user ) =>
        {
            if ( err )
            {
                res.status( 500 ).send( {message: err} );
                return;
            }

            // if users does not exist in database
            if ( !user )
            {
                res.status( 404 ).send( {message: "User Not found."} );
                return;
            }

            // sends user info to frontend
            res.status( 200 ).send( user );
        } );
}

exports.put_user = function ( req, res )
{
    if ( !authController.isAccessTokenValid( req, res ) ) return;

    const photoList = req.body.photoList;
    const likedPhotoList = req.body.likedPhotoList;
    const favouritePhotoList = req.body.favouritePhotoList;

    if ( photoList )
    {
        User.findOneAndUpdate( {_id: req.body._id}, {
            "photoList": photoList,
            "likedPhotoList": likedPhotoList,
            "favouritePhotoList": favouritePhotoList
        }, {new: true}, ( err, user ) =>
        {
            if ( err )
            {
                res.status( 404 ).send( {message: "User Not found."} );
                return;
            }

            // sends user info to frontend
            res.status( 200 ).send( user );
        } ).lean();

    }
    else
    {
        res.status( 400 ).send( {message: "Invalid parameters."} );
    }
}
