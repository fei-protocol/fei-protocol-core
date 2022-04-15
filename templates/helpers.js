// Sourced from HiFi Finance: https://github.com/hifi-finance/hifi/tree/main/templates
module.exports = {
  printParams(params) {
    const mappedParams = params.map(param => {
      if (param.name) {
        return `${param.type} ${param.name}`;
      } else {
        return param.type;
      }
    });
    return mappedParams.join(", ");
  },
};
