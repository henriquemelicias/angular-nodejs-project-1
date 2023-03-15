const mongoose = require( 'mongoose' );

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        username: {type: String, required: true, minlength: 3, unique: true},
        password: {type: String, required: true}, // is a token
        photoList: [{type: Schema.Types.ObjectId, ref: "Photo"}], // photos owned by user
        favouritePhotoList: [{type: Schema.Types.ObjectId, ref: "Photo"}], // photos favourited by user
        likedPhotoList: [{type: Schema.Types.ObjectId, ref: "Photo"}], // photos likes by user
    } );

/**
 * Get user url.
 */
UserSchema.virtual( 'url' )
          .get( function ()
          {
              return '/user/' + this.username;
          } );

UserSchema.index( {username: 1} )

module.exports = mongoose.model( "User", UserSchema );
