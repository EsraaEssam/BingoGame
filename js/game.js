$(document).ready(function(){
//array to store numbers
var numbersArray = [];
//generating numbers
function writeNumbers(randomArray){
var numID=["#num00","#num01","#num02","#num03","#num04",
          "#num10","#num11","#num12","#num13","#num14",
          "#num20","#num21","#num22","#num23","#num24",
          "#num30","#num31","#num32","#num33","#num34",
          "#num40","#num41","#num42","#num43","#num44"];
    for (i = 0; i < numID.length; i++) { 
    $(numID[i]).text(randomArray[i]);
    }
       
}
function createArray(randomArray){    
        for (var i=1, t=26; i<t; i++) {
            randomArray.push(i);
            }
    }
    
function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }
    
    createArray(numbersArray);
    shuffle(numbersArray);
    writeNumbers(numbersArray);
//getting number that the user has clicked
    
    
});



