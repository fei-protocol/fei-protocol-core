import {Core} from "../../core/Core.sol";
import {Vm} from "./Vm.sol";

struct FeiTestAddresses {
  address userAddress;
  address secondUserAddress;
  address beneficiaryAddress1;
  address beneficiaryAddress2;
  address governorAddress;
  address genesisGroup;
  address keeperAddress;
  address pcvControllerAddress;
  address minterAddress;
  address burnerAddress;
  address guardianAddress;
}


/// @notice Get a list of addresses 
// TODO: Put real addresses in here
function getAddresses() pure returns (
  FeiTestAddresses memory
) {
    FeiTestAddresses memory addresses = FeiTestAddresses({
      userAddress: address(0x0),
      secondUserAddress: address(0x0),
      beneficiaryAddress1: address(0x0),
      beneficiaryAddress2: address(0x0),
      governorAddress: address(0x1),
      genesisGroup: address(0x0),
      keeperAddress: address(0x0),
      pcvControllerAddress: address(0x0),
      minterAddress: address(0x0),
      burnerAddress: address(0x0),
      guardianAddress: address(0x0)
    });

    return addresses;
}

function getCore() returns (Core) {
    address HEVM_ADDRESS = address(bytes20(uint160(uint256(keccak256('hevm cheat code')))));
    Vm vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses memory addresses = getAddresses();

    // Deploy Core from Governor address
    vm.startPrank(addresses.governorAddress);

    Core core = new Core();
    core.init();
    core.grantMinter(addresses.minterAddress);
    core.grantBurner(addresses.burnerAddress);
    core.grantPCVController(addresses.pcvControllerAddress);
    core.grantGuardian(addresses.guardianAddress);

    vm.stopPrank();
    return core;
}

