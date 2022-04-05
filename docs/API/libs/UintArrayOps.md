## <span id="UintArrayOps"></span> `UintArrayOps`



- [`sum(uint256[] array)`][UintArrayOps-sum-uint256---]
- [`signedDifference(uint256[] a, uint256[] b)`][UintArrayOps-signedDifference-uint256---uint256---]
- [`positiveDifference(uint256[] a, uint256[] b)`][UintArrayOps-positiveDifference-uint256---uint256---]
### <span id="UintArrayOps-sum-uint256---"></span> `sum(uint256[] array) → uint256 _sum` (internal)



### <span id="UintArrayOps-signedDifference-uint256---uint256---"></span> `signedDifference(uint256[] a, uint256[] b) → int256[] _difference` (internal)



### <span id="UintArrayOps-positiveDifference-uint256---uint256---"></span> `positiveDifference(uint256[] a, uint256[] b) → uint256[] _positiveDifference` (internal)

given two int arrays a & b, returns an array c such that c[i] = a[i] - b[i], with negative values truncated to 0

