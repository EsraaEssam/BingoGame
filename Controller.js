function Controller(){
	
}

function existsSync(filename ,fs) {
  try {
    fs.accessSync(filename);
    return true;
  } catch(ex) {
    return false;
  }
}

Controller.prototype.get_files = function(fs)
{
  var results = [];
  var dir ='Players_Data/mail';
    fs.readdirSync(dir).forEach(function(file) {
	file = file.replace(".txt","");
        results.push(file);
    });

    return results;
};

Controller.prototype.SignUp = function(player , fs)
{
  var filename = 'Players_Data/mail/' + player.email + '.txt';
  var exist = existsSync(filename , fs);
  if (exist)
  {  
    console.log("email already exists");
    return false;
  } 
  else
  {
    console.log("Not found , Insert it");
    var file = fs.createWriteStream(filename);
    file.on('error', function(err) { console.log("error : " + err) });
    file.write(player.name + '\n');
    file.write(player.email + '\n');
    file.write(player.password + '\n');
    file.write("score: " + player.score + '\n');
    return true;
  }
};

Controller.prototype.Login = function(player , fs)
{
  var filename = 'Players_Data/mail/' + player.email + '.txt';
  var exist = existsSync(filename , fs);
  //email exists read file to validate info
  if (exist)
  {  
    console.log("email exists read file to validate info");
    var data = fs.readFileSync(filename);
    console.log("Synchronous read: " + data.toString());
    var res = data.toString().split('\n');
    if(res[2] == player.password) 
      //correct Data Login
    {
      console.log("res[0] " + res[0]);
      return res[0];
    }
    else
      // invalid password
      return null;
  } 
  //Email not found 
  else
  {
    console.log("invalid Email");
    return null;
  }
};

Controller.prototype.social_media_login = function(player ,fs, type)
{
  var filename = 'Players_Data/'+ type + '/' + player.id + '.txt';
  var exist = existsSync(filename , fs);
  //email already exists Sign in
  if (exist)
  {  
    console.log("email already exists");
  } 
  //Not exists create it
  else
  {
    console.log("Not found , Insert it");
    var file = fs.createWriteStream(filename);
    file.on('error', function(err) { console.log("error : " + err) });
    //file.write(type + '\n');
    file.write(player.name + '\n');
    file.write(player.email + '\n');
    file.write('\n');
    file.write("score: " + 10 + '\n');
  }
};

Controller.prototype.History = function(email, fs, type)
{
  var filename = 'Players_Data/' + type + '/' + email + '.txt';
  var exist = existsSync(filename , fs);
  //email exists read file to git History
  if (exist)
  {  
    console.log("email exists read file to get info");
    var data = fs.readFileSync(filename);
    console.log("Synchronous read: " + data.toString());
    var res = data.toString().split('\n');
    var history = []; 
    history[0] = res[3].replace("score: " ,"");
    console.log("Score from controller : " + history[0]);
    for (var i = 4; i < res.length; i++) {
      var game = res[i].split('-');
      history[i - 3] = { op: game[0] , winner: game[1] };
    }
    return history;
  } 
  //Error Email not found 
  else
  {
    console.log("***** Error in Profile History *****");
    return null;
  }
};

Controller.prototype.StoreWinners = function(arr_GamePlayers, array_winners, fs)
{ 
  for (var i = 0; i < arr_GamePlayers.length; i++) 
  {
    var filename = 'Players_Data/'+ arr_GamePlayers[i].type +'/' + arr_GamePlayers[i].email + '.txt';
    var exist = existsSync(filename , fs);
    if (exist)
    { 
      console.log("file found , store data of Game and winners");

      //Change score
      var data = fs.readFileSync(filename);
      var fileCont = data.toString();
      var res = fileCont.split('\n');
      var OldScore = parseInt(res[3].replace("score: " ,""));
      console.log("Old Score from controller : " + OldScore);
      var score = 0;

      //Save Game and Winner
      var player_names = "";
      var winner = "";
      var Win = false;
      for (var j = 0; j < arr_GamePlayers.length; j++) 
      {
        for (var k = 0; k< array_winners.length; k++) 
        {
          if(arr_GamePlayers[j].id == array_winners[k])
          {
            var temp = "";
            if(i == j)
              {
                temp = "Me";
                score =OldScore + 2;
                Win = true;
              }
            else
              temp = arr_GamePlayers[j].name;
            if (winner == "")
              winner = temp;
            else
              winner +=" , " + temp;
            break;
          }
        }
        if(!Win)
          score = OldScore -1;
        if(i != j)
        {
          if(player_names == "")
            player_names = arr_GamePlayers[j].name;
          else
            player_names = player_names + " , " + arr_GamePlayers.name;
        }
      }
      fileCont = fileCont.replace("score: " + OldScore,"score: " + score);
      console.log("New Score from controller : " + score);
      fs.writeFile(filename, fileCont,  function(err) {
        if (err) {
           return console.error(err);
        }
      });
      console.log("Here &&&"+filename, player_names + " - " + winner);
      fs.appendFile(filename, player_names + " - " + winner + '\n', function (err) {});
    } 
    else
    {
      console.log("**** Error In StoreWinners function ****");
    }
  } 
};

Controller.prototype.getEmail = function(mail, fs, type)
{
  var filename = 'Players_Data/' + type + '/' + mail + '.txt';
  var exist = existsSync(filename , fs);
  //email exists read file to git History
  if (exist)
  {  
    console.log("id exists read file to get email");
    var data = fs.readFileSync(filename);
    console.log("Synchronous read: " + data.toString());
    var res = data.toString().split('\n'); 
    return res[1];
  } 
  //Error Email not found 
  else
  {
    console.log("***** Error in Get Email *****");
    return null;
  }
};


module.exports = Controller;
