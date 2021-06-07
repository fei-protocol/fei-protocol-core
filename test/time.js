const {
	BN
} = require('@openzeppelin/test-helpers');

async function getCurrentTime() {
  const block = await web3.eth.getBlock('latest');
  return block.timestamp
}

async function advanceBlock() {
  return new Promise((resolve, reject) => {
      web3.currentProvider.send(
          {
              jsonrpc: '2.0',
              method: 'evm_mine',
              params: []
          },
          (err) => {
              if (err) {
                  return reject(err);
              }
              const newBlock = web3.eth.getBlock('latest');
              return resolve(newBlock);
          },
      );
  });
}

async function advanceTimeStamp(time) {
  console.log('input timestamp: ', time.toNumber())
  return new Promise((resolve, reject) => {
      web3.currentProvider.send(
          {
              jsonrpc: '2.0',
              method: 'evm_setNextBlockTimestamp',
              params: [time.toNumber()],
          },
          (err, result) => {
              if (err) {
                  return reject(err);
              }
              return resolve(result);
          },
      );
  });
}

async function increaseTime(duration) {
  const currentTime = await getCurrentTime();
  console.log('current time: ', currentTime)
  console.log('time adding on: ', duration.toNumber())
  const timeToIncreaseTo = new BN(currentTime).add(duration)
  console.log('time to increase to: ', timeToIncreaseTo.toNumber())

  await advanceTimeStamp(timeToIncreaseTo)
  console.log('advanced timestamp')
  const block = await advanceBlock();
  console.log('advanced block: ', block)
  const newTime = await getCurrentTime()
  console.log('new time: ', newTime)
}

module.exports = {
  increaseTime,
  getCurrentTime
}