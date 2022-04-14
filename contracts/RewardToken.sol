// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RWToken is ERC20 {
    constructor() ERC20("RewardToken", "RWT") public {
        _mint(msg.sender, 100000000 * 10 ** 18);
    }
}