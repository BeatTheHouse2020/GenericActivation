var config = {
  baseBet: { value: 100, type: 'balance', label: 'Starting Bet' },
  payout: { value: 1200, type: 'balance', label: 'Payout' },
  survivalGames: { value: 123, type: 'number', label: '# of Survival Games' },
};
//HELPER SCRIPT TO HELP YOU DETERMINE WHAT YOUR ACTIVATION NUMBER SHOULD BE BASED ON YOUR BALANCE FOR YOUR PAYOUT.
//This script does not bet.
//Use this on simulators: https://bustabit-sim.rob.social/   or   https://mtihc.github.io/bustabit-script-simulator/

var payout = config.payout.value/100;
var currentBet= config.baseBet.value/100;
var balanceAtStart = userInfo.balance/100;
var survivalGames = config.survivalGames.value;

log('Start Bet: ', currentBet);
log('Payout: ', payout);
log('Survival: ', survivalGames);

var balance = 0;
var multiplier = (100/(payout-1))/100 + 1;

log('Multipler: ', multiplier);
var i = 0;

while(balance < balanceAtStart)
{
  balance += roundBit(currentBet);
  currentBet *= multiplier;
  i++;
}

var activationNumber = survivalGames - i + 1;

log('Activation Number Should be ', activationNumber, '.');

function roundBit(bet) {
  return Math.round(bet / 100) * 100;
}
