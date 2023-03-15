const config = require( "../config/auth.config" );
const User = require( "../models/user" );
const jwt = require( "jsonwebtoken" );
const bcrypt = require( "bcryptjs" );

/**
 * Registers user if he doesn't exist in the database.
 */
exports.signup = ( req, res ) =>
{
    // finds user by username
    User.findOne( {username: req.body.username} )
        .exec( ( err, user ) =>
        {
            // error occurred in finding user
            if ( err )
            {
                res.status( 500 ).send( {message: err} );
                return;
            }

            // no user with the specified info found
            if ( !user )
            {
                // verifies if the username and password are within the requirements
                // this should always be true since they are checked in the frontend
                if ( !isRegistrationParametersValid( req.body.username, req.body.password ) )
                {
                    res.status( 400 ).send( {message: "Invalid registration parameters."} );
                    return;
                }

                // creates new user
                const newUser = new User( {
                    username: req.body.username,
                    password: bcrypt.hashSync( req.body.password, 10 )
                } );

                // saves new user in database
                newUser.save( ( err ) =>
                {
                    if ( err )
                    {
                        res.status( 400 ).send( {message: "Failed to save user to database!"} );
                        return;
                    }

                    res.send( {message: "User was registered successfully!"} );
                } );

            }
            // username already exists in database
            else
            {
                res.status( 400 ).send( {message: "Username already in use"} );
            }
        } );
}

/**
 * Verifies if username and password of registration is within the requirements.
 *
 * @param username username of the user to register.
 * @param password password of the user to register
 */
function isRegistrationParametersValid( username, password )
{
    // username length needs to be equal to 3 or more
    if ( username.length < 3 )
        return false;

    // username can only contain letters and numbers
    if ( username.match( "[^0-9a-zA-Z]+" ) )
        return false;

    // password length needs to be equal to 8 or more
    if ( password.length < 8 )
        return false;

    // password must contain atleast one uppercase letter
    if ( !password.match( "[A-Z]" ) )
        return false;

    // password must contain atleast one lowercase letter
    if ( !password.match( "[a-z]" ) )
        return false;

    // password must contain atleast one number
    return password.match( "[0-9]" );
}

/**
 * Logins user if valid.
 */
exports.signin = ( req, res ) =>
{
    const errorMessage = "username or pass invalid!";

    User.findOne( {username: req.body.username} )
        .exec( ( err, user ) =>
        {
            // error occurred in finding user
            if ( err )
            {
                res.status( 500 ).send( {message: err} );
                return;
            }

            // if users does not exist in database
            if ( !user )
            {
                return res.status( 404 ).send( {message: errorMessage} );
            }

            // check if password is valid
            const passwordIsValid = bcrypt.compareSync( req.body.password, user.password );

            if ( !passwordIsValid )
            {
                return res.status( 401 ).send( {accessToken: null, message: errorMessage} );
            }

            // generates new java web token with the secret key
            const token = jwt.sign( {id: user.id}, config.TOKEN_SECRET, {expiresIn: '3d'} );

            // sends successful response to frontend
            res.status( 200 ).send( {id: user._id, username: user.username, accessToken: token} );
        } );
};

/**
 * Check if token in request is valid.
 * @return {boolean} {@code true} if token is valid; {@code false} otherwise.
 */
exports.isAccessTokenValid = ( req, res ) =>
{
    const accessToken = req.get( 'x-access-token' );
    
    if ( !accessToken ) {
        res.status( 401 ).send( "Access denied!" );
        return false;
    }

    try
    {
        jwt.verify( accessToken, config.TOKEN_SECRET );
    } catch (err)
    {
        res.status( 401 ).send( {message: "Invalid Token"} );
        return false;
    }

    return true;
}
