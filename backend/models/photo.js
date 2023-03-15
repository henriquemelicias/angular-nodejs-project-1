const mongoose = require( 'mongoose' );
const User = require( '../models/user' );

const Schema = mongoose.Schema;

const PhotoSchema = new Schema(
    {
        base64: {type: String, required: true}, // base64 of image
        base64Thumbnail: {type: String, required: true}, // base64 of thumbnail
        name: {type: String, max: 100, required: true},
        description: {type: String, max: 500},
        likes: {type: Number, min: 0, required: true}
    } );

/**
 * Get photo url.
 */
PhotoSchema.virtual( 'url' )
           .get( function ()
           {
               return '/photo/' + this._id;
           } );

PhotoSchema.index( {likes: -1} )

// remove references from users
PhotoSchema.pre( 'remove', function ( next )
{
    // remove references from favourite photo list
    User.updateMany(
        {favouritePhotoList: this._id},
        {$pull: {favouritePhotoList: this._id}},
        {multi: true} ) //if reference exists in multiple documents
        .exec();

    // remove references from liked photo lists
    User.updateMany(
        {likedPhotoList: this._id},
        {$pull: {likedPhotoList: this._id}},
        {multi: true} ) //if reference exists in multiple documents
        .exec();
    next();
} )

module.exports = mongoose.model( "Photo", PhotoSchema );
