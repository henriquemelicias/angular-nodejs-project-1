const createError = require( 'http-errors' );
const express = require( 'express' );
const path = require( 'path' );
const cookieParser = require( 'cookie-parser' );
const logger = require( 'morgan' );
const cors = require( 'cors' );
const bodyParser = require( 'body-parser' );

// initialize express app
const app = express();

// disable browser from preventing requests to different addresses
app.use( cors() );

// tells system that JSON will be used
app.use( bodyParser.json({ limit: '20mb' }) );

// use deep parsing algorithm that allows nested objects
app.use( bodyParser.urlencoded( {limit: '20mb', parameterLimit: 100000, extended: true} ) );

// routes
const indexRouter = require( './routes/index' );
const userRouter = require( './routes/user' );
const photoRouter = require( './routes/photo' );
require( './routes/auth' )(app)

// connection to database
const mongoose = require( 'mongoose' );
const settings = require( "./settings" );
const uri = settings.MONGO_DATABASE_URI;
mongoose.connect( uri, { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false } );
mongoose.connection.on( 'error', console.error.bind( console, 'MongoDB connection error:' ) );

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

app.use( logger( 'dev' ) );
app.use( express.json() );
app.use( express.urlencoded( {extended: false} ) );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' ) ) );

app.use( '/', indexRouter );
app.use( '/user', userRouter );
app.use( '/photo', photoRouter );

// headers
app.use(function(req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

// catch 404 and forward to error handler
app.use( function ( req, res, next )
{
    next( createError( 404 ) );
} );

// error handler
app.use( function ( err, req, res, next )
{
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get( 'env' ) === 'development' ? err : {};

    // render the error page
    res.status( err.status || 500 );
    res.render( 'error' );
} );

module.exports = app;
