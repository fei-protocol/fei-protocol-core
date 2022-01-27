interface IGuard {
    event Guarded(string reason);
    function check() external view returns (bool);
    function getProtecActions() external pure returns (address[] memory targets, bytes[] memory datas);
}