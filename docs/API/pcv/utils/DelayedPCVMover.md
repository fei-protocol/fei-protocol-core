## `DelayedPCVMover`






### `constructor(address _core, uint256 _deadline, contract RatioPCVControllerV2 _controller, contract IPCVDeposit _deposit, address _target, uint256 _basisPoints)` (public)

DelayedPCVMover constructor




### `withdrawRatio()` (public)

PCV movement by calling withdrawRatio on the PCVController.
This will enforce the deadline check, and renounce to the
PCV_CONTROLLER_ROLE role after a successful call.






