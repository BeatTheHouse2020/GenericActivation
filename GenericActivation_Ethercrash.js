var startingBet = 100;
var payout = 12;
var activationNumber = 35;
var discordEnabled = false;
var discordBotName = "";
var discordWebHookUrl = "";
var sound = false;
var onwinsaying = "";

console.log('Script is running..');

// The speech's priority
const LOW_PRIORITY    = 0,
      MEDIUM_PRIORITY = 1,
      HIGH_PRIORITY   = 2;

// The speech's speed
const NORMAL_RATE = 1.1,
      FAST_RATE   = 1.3;

var previousPriority = 0;
var previousTick     = 0;
var previousSpeech   = "";
var otherUsers       = [];
var gameCounter = 0;

/**
 * say() uses the Web Speech API to add speech synthesis to the script:
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
 */
const say = (speech, priority, speed = NORMAL_RATE) => {
  if (typeof speechSynthesis === 'undefined') {
    console.log("Your browser does not support speech synthesis :(")
    return;
  }

  if (speechSynthesis.speaking) {
    if (priority === LOW_PRIORITY || priority < previousPriority) {
      return;
    }
    // stop any lower priority ongoing speech
    speechSynthesis.cancel();
  }
  previousPriority = priority;

  var utterance = new SpeechSynthesisUtterance();
  utterance.lang = "en";
  utterance.rate = speed;
  utterance.text = speech;
  speechSynthesis.speak(utterance);
};



var currentBet = startingBet;
var bettingActive = false;
var gameCounter = 0;
var balanceAtStart = engine.getBalance()/100;

var i =0;
var balanceNeeded = 0;
var m = (100/(payout-1))/100 + 1;


while(balanceNeeded < balanceAtStart)
{
  balanceNeeded += (currentBet/100);
  currentBet *= m;
  i++;
}

currentBet = startingBet;

console.log('Welcome ', engine.getUsername(), ',');
console.log('You can survive a streak of ', i, ' times with the current settings and activationNumber of ', activationNumber, '. Total Streak Supported: ', (i+activationNumber), ' for Payout ', payout, 'X');
console.log('Please refer to the excel spreadsheet to make sure this is acceptable for you');
console.log('Or ask shiba what the worst streak is for that payout and make sure your total streak is 1 above');


engine.on('game_starting', function(info) {

    if(bettingActive)
    {
      console.log('Game Counter: ', gameCounter, ' Placing Bet: ', (roundBit(currentBet)/100), ' at payout: ', payout);
      sendMessage('Game Counter: ' + gameCounter + ' Placing Bet: ' + (roundBit(currentBet)/100) + ' at payout: ' + payout);
      engine.placeBet(roundBit(currentBet), payout*100);
    }
    

});




engine.on('game_crash', function(data) {
    

  gameCounter++;
  console.log('Game Status: ', engine.lastGamePlayed());
  var wagered = engine.lastGamePlayed();

  //engine.lastGamePlay() == "NOT_PLAYED";

  var bust = data.game_crash/100;
  //console.log('Game Status2: ', engine.lastGamePlay());
  var won = engine.lastGamePlay() == "WON";
  //console.log('Payout: ', payout);
  
  if (!wagered) {

    if(bust > payout)
    {
        console.log('Game Counter: ', gameCounter, 'Resetting Activation. BUST: ', bust);
        gameCounter = 0;
        bettingActive = false;
    }
    else
    {
        if(gameCounter == activationNumber)
        {
          console.log('Game Counter: ', gameCounter, 'Activation will begin. BUST: ', bust);
          sendMessage('Game Counter: ' + gameCounter + 'Activation will begin. BUST: ' + bust);

          bettingActive = true;
        }
        else
        {
          console.log('Game Counter: ', gameCounter, 'Waiting. Activation set At: ', activationNumber,' BUST: ', bust);
          sendMessage('Waiting. Game Counter: ' + gameCounter + ' of ' + activationNumber + ' BUST: ' + bust);
        }
    }


    return;
  }

  // we won..
  if (won) 
  {
    var winAmount = roundBit((currentBet * payout)/100);

    currentBet = startingBet;
    var currentBalance = engine.getBalance()/100;
    
    console.log('Game Counter: ', gameCounter, 'WON: ', winAmount, ' BUST: ', bust, ' Profit: ', (currentBalance-balanceAtStart));
    sendMessage('Game Counter: ' + gameCounter  + 'WON: ' + winAmount +' BUST: ' + bust + ' Profit: ' + (currentBalance-balanceAtStart));
    
    if(sound)
    {
      var saying = onwinsaying;
      if(saying == "")
        say("WINNER WINNER CHICKEN DINNER", MEDIUM_PRIORITY);
      else
        say(saying, MEDIUM_PRIORITY);
    }

    bettingActive = false;
    gameCounter = 0;
    console.log('Resetting Activation after Win!');

  } 
  else 
  {
    // damn, looks like we lost :(
    
    
    var currentBalance = engine.getBalance()/100;
    console.log('Game Counter: ', gameCounter, 'LOST ', roundBit(currentBet/100), ' bits', ' Profit: ', (currentBalance-balanceAtStart));
    sendMessage('Game Counter: ' + gameCounter  + 'LOST ' + roundBit(currentBet/100) + ' bits.'  + ' Profit: ' + (currentBalance-balanceAtStart));

    currentBet *= m;

  }

  if (currentBet > engine.getBalance()) {
    console.log('Was about to bet', (currentBet/100), 'which triggers the stop');
    
    engine.stop(); 
  }

});


function roundBit(bet) {
  return Math.round(bet / 100) * 100;
}



function sendMessage(logInfo) {

    //log(logInfo);

    if(!discordEnabled)
      return;

      //now log to discord
      var discordBotName = discordBotName;

      if(discordWebHookUrl != '' && discordBotName != '')
      {
          var request = new XMLHttpRequest();
          request.open("POST", discordWebHookUrl);
    
          request.setRequestHeader('Content-type', 'application/json');
    
          var params = {
            username: discordBotName,
            avatar_url: "",
            content: logInfo
          }
    
          request.send(JSON.stringify(params));
      }

}
