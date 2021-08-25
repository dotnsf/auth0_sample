//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    session = require( 'express-session' ),
    app = express();
var settings = require( './settings' );

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. env values
var settings_auth0_callback_url = 'AUTH0_CALLBACK_URL' in process.env ? process.env.AUTH0_CALLBACK_URL : settings.auth0_callback_url; 
var settings_auth0_client_id = 'AUTH0_CLIENT_ID' in process.env ? process.env.AUTH0_CLIENT_ID : settings.auth0_client_id; 
var settings_auth0_client_secret = 'AUTH0_CLIENT_SECRET' in process.env ? process.env.AUTH0_CLIENT_SECRET : settings.auth0_client_secret; 
var settings_auth0_domain = 'AUTH0_DOMAIN' in process.env ? process.env.AUTH0_DOMAIN : settings.auth0_domain; 

//. Auth0
var passport = require( 'passport' );
var Auth0Strategy = require( 'passport-auth0' );
var strategy = new Auth0Strategy({
  domain: settings_auth0_domain,
  clientID: settings_auth0_client_id,
  clientSecret: settings_auth0_client_secret,
  callbackURL: settings_auth0_callback_url
}, function( accessToken, refreshToken, extraParams, profile, done ){
  //console.log( accessToken, refreshToken, extraParams, profile );
  profile.idToken = extraParams.id_token;
  return done( null, profile );
});
passport.use( strategy );

passport.serializeUser( function( user, done ){
  done( null, user );
});
passport.deserializeUser( function( user, done ){
  done( null, user );
});

//. Session
var sess = {
  secret: 'MySecret',
  cookie: {},
  resave: false,
  saveUninitialized: true
};
app.use( session( sess ) );
app.use( passport.initialize() );
app.use( passport.session() );

app.use( function( req, res, next ){
  if( req && req.query && req.query.error ){
    console.log( req.query.error );
  }
  if( req && req.query && req.query.error_description ){
    console.log( req.query.error_description );
  }
  next();
});


app.get( '/auth0/login', passport.authenticate( 'auth0', {
  scope: settings.scope
}, function( req, res ){
  res.redirect( '/' );
}));

app.get( '/', function( req, res ){
  console.log( 'GET /' );
  if( !req.user ){ 
    res.redirect( '/auth0/login' );
  }else{
    console.log( req.user );  //. { name: {}, _json: {}, _raw: '{}' }
    res.contentType( 'application/json; charset=utf-8' );
    res.write( JSON.stringify( { status: true, path: '/' } ) );
    res.end();
  }
});

app.get( '/callback', async function( req, res, next ){
  console.log( 'GET /callback' );
  passport.authenticate( 'auth0', function( err, user ){
    if( err ) return next( err );
    if( !user ) return res.redirect( '/auth0/login' );

    console.log( 'user', user );   //. この時点で user プロファイルに何も設定されていないのがおかしい？
    req.logIn( user, function( err ){
      if( err ) return next( err );
      res.redirect( '/' );  //. ここは実行されているっぽい
    })
  })( req, res, next );
});



var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
