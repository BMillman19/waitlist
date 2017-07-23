const Waitlist = artifacts.require("./Waitlist.sol");

contract('Waitlist', (accounts) => {
  let waitList;
  const waitListOwner = accounts[3]

  beforeEach(() => {
    return Waitlist.new({from: waitListOwner})
      .then((instance) => waitList = instance);
  });

  describe("constructor", () => {
    it("sets initial state", () => {
      return waitList.length.call()
        .then((length) => {
          assert.equal(length.valueOf(), 0);
        });
    });
  });

  describe("#join", () => {
    it("publishes JoinSuccessful event when adding an address", () => {
      const joiningAddress = accounts[4];

      return waitList.join({from: joiningAddress})
        .then(({logs}) => {
          assert.equal(logs[0].event, 'JoinSuccessful');
          assert.equal(logs[0].args.waiter, joiningAddress);
        });
    });

    it("publishes JoinError event when adding an address to a full queue", () => assert(false));

    it("throws if address is already in waitlist", () => {
      const joiningAddress = accounts[4];
      return waitList.join({from: joiningAddress})
        .then(() => waitList.join({from: joiningAddress}))
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });
  });

  describe("#remove", () => {
    it("publishes RemoveSuccessful event when removing an address", () => {
      const joiningAddress = accounts[4];

      return waitList.join({from: joiningAddress})
        .then(() => waitList.remove({from: waitListOwner}))
        .then(({logs}) => {
          assert.equal(logs[0].event, 'RemoveSuccessful');
          assert.equal(logs[0].args.waiter, joiningAddress);
        });
    });

    it("throws when removing an address from an empty queue", () => {
      return waitList.remove({from: waitListOwner})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });

    it("throws if called by non-owner", () => {
      const joiningAddress = accounts[4];

      return waitList.join({from: joiningAddress})
        .then(() => waitList.remove({from: joiningAddress}))
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });
  });

  describe("#length", () => {
    it("returns zero for an empty waitlist", () => {
      return waitList.length.call()
        .then((length) => assert.equal(length.valueOf(), 0))
    });

    it("returns correct value for non-empty waitlist", () => {
      return waitList.join({from: accounts[0]})
        .then(() => waitList.join({from: accounts[1]}))
        .then(() => waitList.length.call())
        .then((length) => assert.equal(length.valueOf(), 2))
    });
  });

  describe("#placeInLine", () => {
    it("returns correct values for non-empty waitlist", () => {
      return waitList.join({from: accounts[0]})
        .then(() => waitList.join({from: accounts[1]}))
        .then(() => waitList.placeInLine.call(accounts[1], {from: accounts[1]}))
        .then((placeInLine) => assert.equal(placeInLine.valueOf(), 1))
        .then(() => waitList.placeInLine.call(accounts[0], {from: accounts[0]}))
        .then((placeInLine) => assert.equal(placeInLine.valueOf(), 0))
    });

    it("throws for an empty waitlist", () => {
      return waitList.placeInLine.call(accounts[0], {from: accounts[0]})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
    });

    it("returns throws when placeInLine is called a non authorized user", () => {
      return waitList.join({from: accounts[0]})
        .then(() => waitList.join({from: accounts[1]}))
        .then(() => waitList.placeInLine.call(accounts[1], {from: accounts[2]}))
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
    });
  });
});
