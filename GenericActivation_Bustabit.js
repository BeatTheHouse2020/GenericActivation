var config = {
  baseBet: { value: 100, type: 'balance', label: 'base bet' },
  payout: { value: 12, type: 'multiplier' },
  stop: { value: 1e8, type: 'balance', label: 'stop if bet >' },
  activationNumber: { value: 100, type: 'balance', label: 'Activation Number' },
  discordEnabled: { value: false, type: 'checkbox', label: 'Discord Enabled:' },
  discordBotName: { value: 'bot name goes here', type: 'text', label: 'Discord Bot Name:' },
  discordWebHookUrl: { value: 'webhook url goes here', type: 'text', label: 'Discord WebHook Url:' },
  sound: { value: true, type: 'checkbox', label: 'Sound Enabled:' },
  onwinsaying: { value: 'Winner Winner Chicken Dinner', type: 'text', label: 'Win Saying' },
};


log('Script is running..');

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
    log("Your browser does not support speech synthesis :(")
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


var currentBet = config.baseBet.value;
var bettingActive = false;
var gameCounter = 0;
var activationNumber = config.activationNumber.value / 100;
var balanceAtStart = userInfo.balance/100;

var i =0;
var balanceNeeded = 0;
var m = (100/(config.payout.value-1))/100 + 1;

while(balanceNeeded < balanceAtStart)
{
  balanceNeeded += (currentBet/100);
  currentBet *= m;
  i++;
}

currentBet = config.baseBet.value;

log('You can survive a streak of ', i, ' times with the current settings and activationNumber of ', activationNumber, '. Total Streak Supported: ', (i+activationNumber), ' for Payout ', config.payout.value, 'X');
log('Please refer to the excel spreadsheet to make sure this is acceptable for you');
log('Or ask shiba what the worst streak is for that payout and make sure your total streak is 1 above!');


engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() 
{
  
    if(bettingActive)
    {
      log('Game Counter: ', gameCounter, ' Placing Bet: ', (roundBit(currentBet)/100), ' at payout: ', config.payout.value);
      sendMessage('Game Counter: ' + gameCounter + ' Placing Bet: ' + (roundBit(currentBet)/100) + ' at payout: ' + config.payout.value);
      engine.bet(roundBit(currentBet), config.payout.value);
    }

}

function onGameEnded() {
  var lastGame = engine.history.first()
  gameCounter++;
  // If we wagered, it means we played
  if (!lastGame.wager) {

    
    if(lastGame.bust > config.payout.value)
    {
        log('Game Counter: ', gameCounter, 'Resetting Activation. BUST: ', lastGame.bust);
        gameCounter = 0;
        bettingActive = false;
    }
    else
    {
        if(gameCounter == activationNumber)
        {
          log('Game Counter: ', gameCounter, 'Activation will begin. BUST: ', lastGame.bust);
          sendMessage('Game Counter: ' + gameCounter + 'Activation will begin. BUST: ' + lastGame.bust);

          bettingActive = true;
        }
        else
        {
          log('Game Counter: ', gameCounter, 'Waiting. Activation set At: ', activationNumber,' BUST: ', lastGame.bust);
          sendMessage('Waiting. Game Counter: ' + gameCounter + ' of ' + activationNumber + ' BUST: ' + lastGame.bust);
        }
    }


    return;
  }

  // we won..
  if (lastGame.cashedAt) 
  {
    currentBet = config.baseBet.value;
    var currentBalance = userInfo.balance/100;
    var winAmount = (lastGame.wager * lastGame.cashedAt)/100;
    log('Game Counter: ', gameCounter, 'WON: ', winAmount, ' BUST: ', lastGame.bust, ' Profit: ', (currentBalance-balanceAtStart));
    sendMessage('Game Counter: ' + gameCounter  + 'WON: ' + winAmount +' BUST: ' + lastGame.bust + ' Profit: ' + (currentBalance-balanceAtStart));

    if(config.sound.value)
    {
      var saying = config.onwinsaying.value;
      if(saying == "")
        say("WINNER WINNER CHICKEN DINNER", MEDIUM_PRIORITY);
      else
        say(saying, MEDIUM_PRIORITY);
    }

    bettingActive = false;
    gameCounter = 0;
  } 
  else 
  {
    // damn, looks like we lost :(
    currentBet *= m;
    
    var currentBalance = userInfo.balance/100;
    log('Game Counter: ', gameCounter, 'LOST ', lastGame.wager/100, ' bits', ' Profit: ', (currentBalance-balanceAtStart));
    sendMessage('Game Counter: ' + gameCounter  + 'LOST ' + (lastGame.wager/100) + ' bits.'  + ' Profit: ' + (currentBalance-balanceAtStart));
  }

  if (currentBet > config.stop.value) {
    log('Was about to bet', currentBet, 'which triggers the stop');
    engine.removeListener('GAME_STARTING', onGameStarted);
    engine.removeListener('GAME_ENDED', onGameEnded);
  }
}

function roundBit(bet) {
  return Math.round(bet / 100) * 100;
}



function sendMessage(logInfo) {

    //log(logInfo);

    if(!config.discordEnabled.value)
      return;

      //now log to discord
      var discordWebHookUrl = '';
      var discordBotName = config.discordBotName.value;

      if(config.discordWebHookUrl.value != '')
        discordWebHookUrl = config.discordWebHookUrl.value;

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
