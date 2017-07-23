var Waitlist = artifacts.require("./Waitlist.sol");

module.exports = function(deployer) {
	deployer.deploy(Waitlist);
};
