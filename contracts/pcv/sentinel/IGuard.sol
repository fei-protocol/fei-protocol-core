interface IGuard {
    event Guarded(string reason);
    function check() external returns (bool);
    function getProtecActions() external returns (address[] memory, bytes[] memory, bool allowReverts);
}