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
  cookie: {
    path: '/',
    maxAge: (1 * 24 * 60 * 60 * 1000)
  },
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


//. login
app.get( '/auth0/login', passport.authenticate( 'auth0', {
  scope: settings.auth0_scope   //. #1
}, function( req, res ){
  res.redirect( '/' );
}));

//. logout
app.get( '/auth0/logout', function( req, res ){
  req.logout();
  res.redirect('/');
});

app.get( '/', function( req, res ){
  if( !req.user ){ 
    res.redirect( '/auth0/login' );
  }else{
    /* req.user = 
    {
      "displayName":"name@abc.com",
      "id":"auth0|61xxxxx",
      "user_id":"auth0|61xxxxx",
      "provider":"auth0",
      "name":{},
      "emails":[{"value":"name@abc.com"}],
      "picture":"https://s.gravatar.com/avatar/xxxxx?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fxx.png",
      "nickname":"name",
      "_json":{
        "sub":"auth0|61xxxxx",
        "nickname":"name",
        "name":"name@abc.com",
        "picture":"https://s.gravatar.com/avatar/xxxxx?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fxx.png",
        "updated_at":"2021-08-26T01:00:20.403Z",
        "email":"name@abc.com",
        "email_verified":false
      },
      "_raw":"{\"sub\":\"auth0|61xxxxx\",\"nickname\":\"name\",\"name\":\"name@abc.com\",\"picture\":\"https://s.gravatar.com/avatar/xxxxx?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fxx.png\",\"updated_at\":\"2021-08-26T01:00:20.403Z\",\"email\":\"name@abc.com\",\"email_verified\":false}",
      "idToken":"eyXXXXX.eyXXXXX.XXXXX-XXXXX-XXXXX"
    }
    */
    res.contentType( 'application/json; charset=utf-8' );
    res.write( JSON.stringify( { status: true, user: { id: req.user.id, name: req.user.displayName, email: req.user.nickname, image_url: req.user.picture } } ) );
    res.end();
  }
});

app.get( '/auth0/callback', async function( req, res, next ){
  passport.authenticate( 'auth0', function( err, user ){
    if( err ) return next( err );
    if( !user ) return res.redirect( '/auth0/login' );

    req.logIn( user, function( err ){
      if( err ) return next( err );
      res.redirect( '/' );
    })
  })( req, res, next );
});



var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
