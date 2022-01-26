interface IGuard {
    event Guarded(string reason);
    function checkAndProtec() external payable;
}