//بسم الله الرحمن الرحيم

var express = require("express");
var fs = require("fs");
var http = require("http");

var app = express();
app.set('view engine', 'ejs');

var bodyParser = require("body-parser");//to get form data from request
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var cookieParser = require('cookie-parser');//to handle cookie
app.use(cookieParser());

//for Sign up / Login / passport
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var fb = require('./configuration/fb');
var twitter = require('./configuration/twitter');
var session = require('express-session');
var Controller = require('./Controller.js');
var ctrl = new Controller();

var server = http.createServer(app).listen(22445);//app is listening on port 3000
var io = require("socket.io")(server);//this socket is listening on port 3000 this is the server socket

//Game Logic
var new_play_id = 0;

var GameList = [];                                                     
var NumOfGames = 0; 

var playersList = [];
var Num_Playes = 0;                                                    
Turn = -1;
var no = playersList.length;

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
    clientID: fb.facebook_api_key,
    clientSecret:fb.facebook_api_secret ,
    callbackURL: fb.callback_url,
    profileFields: ['id', 'name', 'emails']
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      console.log("profile.id : " + profile.id);
      console.log("profile.name : " + profile.name.givenName + " " + profile.name.familyName);
      console.log("profile.emails[0].value : " + profile.emails[0].value);
      ctrl.social_media_login({id:profile.id , name:profile.name.givenName + " " +profile.name.familyName , email:profile.emails[0].value} , fs, "facebook");
      return done(null, profile);
    });
  }
));

// Use the TwitterStrategy within Passport.
passport.use(new TwitterStrategy({
    consumerKey: twitter.twitter_api_key,
    consumerSecret:twitter.twitter_api_secret ,
    callbackURL: twitter.callback_url,
    profileFields: ['id', 'name', 'email']
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      console.log("profile.id : " + profile.id);
      console.log("profile.displayName : " + profile.displayName);
      console.log("profile.username : " + profile.username);
      ctrl.social_media_login({id:profile.id, name:profile.displayName , email:profile.username} , fs, "twitter");
      return done(null, profile);
    });
  }
));

//printing requests
app.use(function(req,res,next){
    console.log(`${req.method} request for '${req.url}'`);
next();
});

//loading static files -CSS,img,js scripts-
app.use(express.static("./public"));

//for passport
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());



//************************************************************
//routing
//handling get requests
//root
app.get('/', function(req, res){
  //console.log("Cookies: ", req.cookies);
    if(req.cookies.Username){
      console.log("User "+ req.cookies.Username +" is logged in");
      res.redirect("/Home.html");
    }
    else{
      console.log("Request method: " + req.method);
      //res.writeHead(200,{"Content-Type":"text/html"});
      //fs.createReadStream("./public/SignIn.html").pipe(res);
	  //**
	  res.render('pages/SignIn',{
        errorMessage:" "
		});
    }
});

//signUp page
app.get('/signUp.html', function(req, res){
  console.log("Request method: " + req.method);
  res.writeHead(200,{"Content-Type":"text/html"});
  fs.createReadStream("./public/signUp.html").pipe(res);
});

//Home page
app.get('/Home.html', ensureAuthenticated, function(req, res){ //***************************
  console.log("Cookies: ", req.cookies);
  console.log("Request method: " + req.method);
  res.writeHead(200,{"Content-Type":"text/html"});
  fs.createReadStream("./public/Home.html").pipe(res);
});

//profile page
app.get('/profile.html', function(req, res){
  var His = ctrl.History(req.cookies.Email, fs, req.cookies.Type);
  var History = [];
  console.log(His[1].op);
  if (His[1] != null)//var ar2 = ar.slice(1, 1 + 3);
    History = His.slice(1, His.length);
  var score = His[0];
  console.log("Score from app.js : " + score);
  var pp_image='';
  if(score>=20)
	pp_image="img/pp40.jpg";
  else if(score>=15)
	pp_image="img/pp20.jpg";
  else if(score>=10)
	pp_image="img/pp13.jpg";
  else if(score>=8)
	pp_image="img/pp12.jpg";
  else 
	pp_image="img/pp11.jpg";

  res.render('pages/profile',{
        History:History,
        score:score,
		pp_img:pp_image
    });
});

//logOut
app.get('/LogOut.html', function(req, res){
  //console.log("Cookies: ", req.cookies);
  console.log("Request method: " + req.method);
  //destroy cookie
  res.clearCookie('Username');
  req.logout(); //***************************************************
  res.redirect("/");
  
});

//Facebook
app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    /*console.log("%%%%%%%%%%%%%%%%%%%%%%%%%" + req.user.id);
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%" + req.user.name.familyName);
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%" + req.user.name.givenName);
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%" + req.user.emails[0].value);*/
    var Username = req.user.name.givenName + " " + req.user.name.familyName;
    res.cookie('Username', Username);
    res.cookie('Email', req.user.id);
    res.cookie('Email2', req.user.emails[0].value);
    console.log("form app Email2 : "+req.user.emails[0].value);
    res.cookie('Type', "facebook");
    res.redirect("/Home.html");
  });

//Twitter
app.get('/auth/twitter', passport.authenticate('twitter',{scope:'email'}));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.cookie('Username', req.user.displayName);
    res.cookie('Email', req.user.id);
    res.cookie('Email2',req.user.username);
    console.log("form app Email2 : "+req.user.username);
    res.cookie('Type', "twitter");
    res.redirect("/Home.html");
  });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {return next();}
  res.redirect('/SignIn')
};
//*********************************************************************
//post requests handling

//processing sign in data 
app.post('/', function(req, res) { 
  //check on input from user and send error or go to home
  console.log("Request method: " + req.method);
  console.log("POST REQ Data : "+ req.body);
  var login = ctrl.Login({email: req.body.Email ,password: req.body.Password} , fs);
  console.log("Login : "+login);
  if(login != null)
  {
    if(req.body.rememberMe)
    {//extend cookie duration
      console.log("remember me is checked");
      res.cookie('Username', login,{ expires: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)});//cookie will expire in a day
    }
    else
    {//session cookie
      res.cookie('Username', login);
    }  
    res.cookie('Email', req.body.Email);
    res.cookie('Email2', req.body.Email);
    res.cookie('Type', "mail");
    res.redirect("/Home.html");
  }
  else 
  {
    //res.redirect("/");
	//**
	 res.render('pages/SignIn',{
        errorMessage:"Invalid Email or password"
			});
  }
  console.log(req.body);
});

//processing sign up data 
app.post('/signUp.html', function(req, res){
  console.log("Request method: " + req.method);
  var signup = ctrl.SignUp({name: req.body.Username, email: req.body.Email, password: req.body.Password, score: 10}, fs);
  if(signup){
	  res.cookie('Username', req.body.Username,{ expires: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}); 
    res.cookie('Email', req.body.Email);
    res.cookie('Email2', req.body.Email);
    res.cookie('Type', "mail"); 
	  res.redirect("/Home.html");
  }else{
	  res.redirect("/signUp.html");
  }
});

console.log("Express server running on port 22445");
//***********************************************************

//IOhandling
//when there is a client that is connected to me using socket  /handler for connection:
io.on("connection",function(socket)
{
  console.log("client connected");
  //**
  socket.on("sendEmails",function(){
	  //Esraa Mostafa:7oty el emails el metsagela fi Emails
	  var Emails = ctrl.get_files(fs);
	  socket.emit("recEmails", Emails);
	  
  });
  
   //handler for sendingMyNumber
  socket.on("sendingMyNumber",function(message , myid){
  
  // get game id of that player
  var myGameID = -1;
  for(var i = 0 ; i < NumOfGames ; i++)
  {
    for(var j = 0 ; j < GameList[i].player.length ; j++)
    {
      if(GameList[i].player[j].id == myid)
      {
        myGameID = GameList[i].player[j].game_id ;          
        
      }
    }
  }
    
    // send number to check Bingo for players in this game
    GameList[myGameID].Play(message);                                             
        console.log(message);
    });
  
    //handler for playerArray :
    socket.on("playerArray",function(playerArray, playerUsername, playerEmail , login_type){                 
    console.log("From App.js Username :" + playerUsername); 
    console.log("From App.js playerEmail :" + playerEmail); 
    playersList[Num_Playes] = new Player(new_play_id, playerUsername ,playerEmail,login_type, playerArray , socket);     //raniatarek :  socket      
    playersList[Num_Playes].setmatrix(playerArray);  
    Num_Playes++;                                                      

    //server send ids to clients
    socket.emit("yourID", new_play_id);

    // call function Test to test number of players in playersList
    Test(socket);
    
    new_play_id++;
  //This turn , server will give it to player first time only ,when he press on start button ...
  //----------Start handling Server Turn 
   var gameidPlayer = -1 ;
   var arrOfGamePlayers = [];
   var myId = Num_Playes - 1;
  //1- if player has no game yet 
  if(playersList[myId].game_id == -1 )                                                          
  {
    Turn = myId;
    arrOfGamePlayers =[];
  }
  else 
  {  
    // 2- if player has game                                                                                   
    //2.1- get game id of player
    for(var i = 0 ; i < NumOfGames ; i++)
    {
      for(var j =0 ; j < GameList[i].player.length ; j++)
      {
        if(GameList[i].player[j].id == myId)
        {
          gameidPlayer = GameList[i].player[j].game_id ;
          break;
        }
      }
    }
  
  //2.2- Turn = id of first player in game 
  Turn = GameList[gameidPlayer].player[0].id ;
  
  //2.3- arrOfGamePlayers = array of players in this game 
  arrOfGamePlayers = GameList[gameidPlayer].player ;
  console.log(" player is exist in a game "+ gameidPlayer +" , Server turn = "+ Turn );
  
  }
  
   //---- 
  //server sends variable Turn to the client 
    socket.emit("Turn",Turn ,arrOfGamePlayers ,myId);                                                                    
  
  //----------END handling Server Turn  
  
    });

  
  //handler for CheckWinPlayers                                                       
  socket.on("CheckWinPlayers",function(id_player , clicked_num , myGameID){  
   // get game id of this player 
    var myGameID =-1;
    
    for(var i =0 ; i < NumOfGames ; i++)
    {
      for(var j =0 ; j < GameList[i].player.length ; j++)
      {
        if(GameList[i].player[j].id == id_player)
        {
          myGameID = GameList[i].player[j].game_id ;              
          
        }
      }
    }
    // call function Check_win_players
    GameList[myGameID].Check_win_players(id_player,clicked_num ,myGameID);     
  });

	//raniatarek
	socket.on('disconnect', function() {
		var GamePlayers =[];
		var gameidP = -1;
		
		for(var i =0 ; i< playersList.length ; i++)
		{
			if(socket.id == playersList[i].socketid )
			{
				console.log("Player "+ playersList[i].id + " Got disconnect! ");
				//1- get game id of disconnected player
					   gameidP = playersList[i].game_id ;
			   
			   //2- get players in this game 
				 GamePlayers = GameList[gameidP].player ;
				 io.emit("disconnected_player" , playersList[i].id , GamePlayers );
			}
			
		}
      
   });
});

//--------------------------------------------------------Start Classes and function Code-------------------------------------------------

// Start Define a class Player-----------------------
function Player(id, name ,email,type, matrix ,socket)
{        //raniatarek : socket                    
	this.id = id; 
  this.name = name; 
  this.email = email;
  this.type = type;
	this.game_id = -1 ;  
  //raniatarek
  this.socketid =	socket.id;
  this.matrix = [] 
	for ( var i = 0; i < 5 ; i++)               
	{
    if(!this.matrix[i])
      this.matrix[i] = []
  }
  this.map = new Object(); //map for check if number pressed;
  this.Bingo = 0; // number of complete rows or columns
  this.setmatrix(matrix); 
}
// set matrix at a start of game
Player.prototype.setmatrix = function(matrix){
  var x = 0;
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        this.matrix[i][j] = matrix[x];
        this.map[this.matrix[i][j]] = false;
        x++;      
      }
    }
};

// check if pressed number already pressed before return true , else make it pressed and return true
Player.prototype.CheckIfNumPressed = function(number){

  if(this.map[number] == false)
  {
    this.map[number] = true;
    return false;
  }
  else return true;
};

//  count number of complete rows or columns ( _ , | , \ , /)
Player.prototype.CheckBingo = function(number){
  this.Bingo = 0;
  
  var check = true;
  
  var pressed = this.CheckIfNumPressed(number);                  

  for (var i = 0; i < 5; i++) 
  {
    check = true;
    for (var j = 0; j < 5; j++) 
    {
      if(this.map[this.matrix[i][j]] == false)
      {
        check = false;
        break;
      }
    }
    if (check)
      this.Bingo++;
  }

  //check Col ( | )
  for (var j = 0; j < 5; j++) 
  {
    check = true;
    for (var i = 0; i < 5; i++) 
    {
      if(this.map[this.matrix[i][j]] == false)
      {
        check = false;
        break;
      }
    }
    if (check)
      this.Bingo++;
  }

  // check ( \ )
  check = true;
  for (var i = 0 , j = 0; i < 5; i++ , j++) 
  {
    if(this.map[this.matrix[i][j]] == false)
    {
        check = false;
        break;
    }
  }
  if (check)
    this.Bingo++;

  // check ( / )
  check = true;
  for (var i = 0 , j = 4; i < 5; i++ , j--) 
  {
    if(this.map[this.matrix[i][j]] == false)
    {
        check = false;
        break;
    }
  }
  if (check)
    this.Bingo++;

};
// END class Player-----------------------

// Start Define a class Game-----------------------
function Game(player , numOfPlayer){
  this.numOfPlayer = numOfPlayer;
  this.player = player;
  this.turn = 0;
}

Game.prototype.set_gameid= function(socket)
{
  for(var k=0; k< this.player.length; k++ )   
  {
    this.player[k].game_id =  NumOfGames;     
  }
  NumOfGames++;                                        
}

Game.prototype.Play= function(number)
{
  for (var i = 0; i < this.numOfPlayer; i++) {
    this.player[i].CheckBingo(number);
  }
};


var array_winners = [];
var arr_GamePlayers = [];                                                        
Game.prototype.Check_win_players = function(id_player,clicked_number ,gamID)                     
{
  array_winners = [];
  arr_GamePlayers = [];   
  var count_winners = 0;
  //1- Check for winners , if exist exit game 
  for (var i = 0; i < this.numOfPlayer; i++)
  {    
    if(this.player[i].Bingo >= 5 )                   
    {
      array_winners[count_winners]=this.player[i].id;
      console.log("winners------------------------");
      console.log("id"+array_winners[count_winners]);
      console.log("count"+count_winners);
      count_winners++;
    }
  }
  //array of players in this game: 
  arr_GamePlayers = GameList[gamID].player;         
	//raniatarek                                             //RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
	io.emit("color_bingo", arr_GamePlayers);
  
  io.emit("color_num", clicked_number , arr_GamePlayers);
  
  if(count_winners > 0)
  {
    //Esraa Mostafa: es2li rania bs a3taked en hna hatla2y el winner players 
    //arr_GamePlayers di fiha kol el players bta3et el game
    //array_winners di fiha el id bta3 el winner player 
    console.log("array_winners : " + array_winners);
    console.log("arr_GamePlayers : " + arr_GamePlayers);
    io.emit("winners", array_winners , arr_GamePlayers );  
    console.log("array_winners : " + array_winners);
    console.log("arr_GamePlayers : " + arr_GamePlayers);
    ctrl.StoreWinners(arr_GamePlayers, array_winners, fs);                                 
  }
  else{
  //2- if there are no winners ,Change the Turn to another player
  if(id_player++ < arr_GamePlayers[this.numOfPlayer-1].id )             
  { 
  io.emit("Turn",id_player++ , arr_GamePlayers);  
  }                   
    else
    {                                                     
     io.emit("Turn" ,arr_GamePlayers[0].id , arr_GamePlayers , id_player);                              
    }
  }   
};

// END  class Game-----------------------
//function Test to test # in playersList: 
    var test;
    var newLength  ;
    var subsetplayersList = [];
    var count_arr;
    var sleepPlayer;
                       
  function Test(socket){
    test = false;
    newLength = 0;
    subsetplayersList = [];
    count_arr = 0;
     sleepPlayer = 0;
     
    for (var i = 0; i < playersList.length; i++)
    { 
      if(playersList[i].game_id == -1)               //Players in playersList that are not in game yet
       {
        newLength++;
            subsetplayersList[count_arr] = playersList[i];
      count_arr++;
       }
    }
 
      if (newLength >= 2)   // if there are more than or equal two players in playersList that are not in a game
      { test = true;  }
      else 
      { test = false; }
    
     //event to call showContent that shows content of game 
   socket.emit("showContent",test);
   
   if(test == true) 
   {
     sleepPlayer = subsetplayersList[0].id;
     socket.broadcast.emit("wakeUp_first_Player" , sleepPlayer); // wakeUp first Player that is waiting someone to play with hime , show his game content

     //create new game to players that are not in game 
     GameList[NumOfGames]= new Game(subsetplayersList , subsetplayersList.length);
         // set game id to these players
     GameList[NumOfGames].set_gameid(socket);                             
     
   }
  };
//---------------------------------------------------------------END Classes and function Code------------------------------------------

