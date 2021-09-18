var config = {
  baseBet: { value: 100, type: 'balance', label: 'Starting Bet' },
  payout: { value: 1200, type: 'balance', label: 'Payout' },
  activationNumber: { value: 12, type: 'number', label: 'Activation Number' },
  survivalGames: { value: 123, type: 'number', label: '# of Survival Games' },
};

//This script will help you determine the balance needed to chase a certain cashout. 
//This script does not bet. Use this script on the simulators to play with:
//https://mtihc.github.io/bustabit-script-simulator/   or 
//https://bustabit-sim.rob.social/

var payout = config.payout.value/100;
var currentBet= config.baseBet.value/100;
var activationNumber = config.activationNumber.value;
var survivalGames = config.survivalGames.value;

log('Start Bet: ', currentBet);
log('Payout: ', payout);
log('Activation Number: ', activationNumber);
log('Survival: ', survivalGames);

var balanceNeeded = 0;
var multiplier = (100/(payout-1))/100 + 1;

var games = survivalGames - activationNumber;
log('Games: ', games);
log('Multipler: ', multiplier);

for(var i=0;i<games;i++)
{
  //log('Balance: ', balanceNeeded, ' Bet: ', currentBet);
  balanceNeeded += roundBit(currentBet);
  currentBet *= multiplier;
}


log('Balance Needed would be ', balanceNeeded, ' bits');

function roundBit(bet) {
  return Math.round(bet / 100) * 100;
}
