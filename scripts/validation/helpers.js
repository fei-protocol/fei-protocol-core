function check(flag, message) {
  if (flag) {
    console.log(`PASS: ${message}`); 
  } else {
    throw Error(`FAIL: ${message}`);
  }
}

module.exports = {
  check,
};
