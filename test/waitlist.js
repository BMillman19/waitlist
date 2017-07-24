const Waitlist = artifacts.require("./Waitlist.sol");

contract('Waitlist', (accounts) => {
  let waitList;
  const waitListOwner = accounts[0];
  const primaryQueueAddresses = [
    accounts[1],
    accounts[2],
    accounts[3],
    accounts[4]
  ];
  const preferredQueueAddresses = [
    accounts[5],
    accounts[6],
    accounts[7],
    accounts[8]
  ];
  const baseFee = 10000;
  const preferredRate = 1000;

  beforeEach(() => {
    return Waitlist.new(baseFee, preferredRate, {from: waitListOwner})
      .then((instance) => waitList = instance);
  });

  describe("constructor", () => {
    it("sets initial state", () => {
      return waitList.length.call()
        .then((length) => assert.equal(length.valueOf(), 0))
        .then(() => waitList.baseFee.call())
        .then((baseFee_) => assert.equal(baseFee, baseFee_))
        .then(() => waitList.preferredRate.call())
        .then((preferredRate_) => assert.equal(preferredRate, preferredRate_))
    });
  });

  describe("#joinPrimaryQueue", () => {
    const joiningAddress = accounts[1];

    it("throws when sent less than baseFee", () => {
      return waitList.joinPrimaryQueue({from: joiningAddress, value: baseFee - 1})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });

    it("throws if address is already in waitlist", () => {
      return waitList.joinPrimaryQueue({from: joiningAddress})
        .then(() => waitList.join({from: joiningAddress}))
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });

    it("publishes JoinSuccessful event with queueCode of 1 when sent value at least baseFee", () => {
      return waitList.joinPrimaryQueue({from: joiningAddress, value: baseFee})
        .then(({logs}) => {
          assert.equal(logs[0].event, 'JoinSuccessful');
          assert.equal(logs[0].args.waiter, joiningAddress);
          assert.equal(logs[0].args.queueCode, 1);
        });
    });

    it("refunds extra wei when sent more than baseFee", () => {
      const extraWei = 100;
      let initialBalance = web3.eth.getBalance(joiningAddress);

      return waitList.joinPrimaryQueue({from: joiningAddress, gasPrice: 0, value: baseFee + extraWei})
        .then(() => {
          let newBalance = web3.eth.getBalance(joiningAddress);
          assert.equal(initialBalance.minus(baseFee).toString(), newBalance.toString());
        });
    });

    it("publishes JoinError event with queueCode of 1 when adding an address to a full queue", () => assert(false));
    it("refunds sender when adding an address to a full queue", () => assert(false));
  });

  describe("#joinPreferredQueue", () => {
    const joiningAddress = preferredQueueAddresses[0];

    let currentPreferredFee;

    beforeEach(() => {
      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => waitList.preferredFee.call())
        .then((fee) => currentPreferredFee = fee);
    });

    it("throws when sent less than preferredFee", () => {
      return waitList.joinPreferredQueue({from: joiningAddress, value: currentPreferredFee - 1})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "processing transaction"));
    });

    it("throws if address is already in waitlist", () => {
      return waitList.joinPreferredQueue({from: primaryQueueAddresses[0], value: currentPreferredFee})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });

    it("publishes JoinSuccessful event with queueCode of 2 when sent value at least preferredFee", () => {
      return waitList.joinPreferredQueue({from: joiningAddress, value: currentPreferredFee})
        .then(({logs}) => {
          assert.equal(logs[0].event, 'JoinSuccessful');
          assert.equal(logs[0].args.waiter, joiningAddress);
          assert.equal(logs[0].args.queueCode, 2);
        });
    });

    it("refunds extra wei when sent more than preferredFee", () => {
      const extraWei = 100;
      let initialBalance = web3.eth.getBalance(joiningAddress);

      return waitList.joinPreferredQueue({from: joiningAddress, gasPrice: 0, value: currentPreferredFee + extraWei})
        .then(() => {
          let newBalance = web3.eth.getBalance(joiningAddress);
          assert.equal(initialBalance.minus(currentPreferredFee).toString(), newBalance.toString());
        });
    });

    it("divides fee among addresses in primary queue", () => {
      let initialBalanceByAddress = primaryQueueAddresses.reduce((map, address) => {
        map[address] = web3.eth.getBalance(address);
        return map;
      }, {});

      return waitList.joinPreferredQueue({from: joiningAddress, value: currentPreferredFee})
        .then(() => {
          let calls = primaryQueueAddresses.map((address) => {
            return waitList.withdrawFunds({from: address, gasPrice: 0})
              .then(() => assert.equal(web3.eth.getBalance(address).minus(preferredRate).toString(), initialBalanceByAddress[address].toString()));
          })
          return Promise.all(calls);
        });
    });

    it("publishes JoinError event with queueCode of 2 when adding an address to a full queue", () => assert(false));
    it("refunds sender when adding an address to a full queue", () => assert(false));
  });

  describe("#remove", () => {
    const primaryQueueAddresses = [
      accounts[1],
      accounts[2],
      accounts[3],
      accounts[4]
    ];

    it("throws if called by non-owner", () => {
      const joiningAddress = accounts[4];

      return waitList.joinPrimaryQueue({from: waitListOwner, value: baseFee})
        .then(() => waitList.remove({from: joiningAddress}))
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });

    it("publishes RemoveSuccessful event with queueCode of 1 when preferred queue is empty", () => {
      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => waitList.remove({from: waitListOwner}))
        .then(({logs}) => {
          assert.equal(logs[0].event, 'RemoveSuccessful');
          assert.equal(logs[0].args.waiter, primaryQueueAddresses[0]);
          assert.equal(logs[0].args.queueCode, 1);
        });
    });

    it("publishes RemoveSuccessful event with queueCode of 2 when preferred queue is not empty", () => {
      let preferredQueueAddress = accounts[5];
      return waitList.joinPreferredQueue({from: accounts[5], value: baseFee})
        .then(() => addAccountsToPrimaryQueue(waitList, primaryQueueAddresses))
        .then(() => waitList.remove({from: waitListOwner}))
        .then(({logs}) => {
          assert.equal(logs[0].event, 'RemoveSuccessful');
          assert.equal(logs[0].args.waiter, preferredQueueAddress);
          assert.equal(logs[0].args.queueCode, 2);
        });
    });

    it("throws when both queues are empty", () => {
      return waitList.remove({from: primaryQueueAddresses[0]})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
    });
  });

  describe("#withdrawFunds", () => {
    it("sends correct funds to waiters", () => {
      let primaryAddress = primaryQueueAddresses[0];
      let primaryAddressBalance = web3.eth.getBalance(primaryAddress);

      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => addAccountsToPreferredQueue(waitList, preferredQueueAddresses))
        .then(() => waitList.withdrawFunds({from: primaryAddress, gasPrice: 0}))
        .then(() => assert.equal(primaryAddressBalance.plus(preferredRate * preferredQueueAddresses.length - baseFee).toString(), web3.eth.getBalance(primaryAddress).toString()));
    });

    it("does not send withdrawFunds to address in preferred queue", () => {
      let preferredAddress = preferredQueueAddresses[0];
      let preferredAddressBalance;

      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => addAccountsToPreferredQueue(waitList, preferredQueueAddresses))
        .then(() => {
          preferredAddressBalance = web3.eth.getBalance(preferredAddress);
          return waitList.withdrawFunds({from: preferredAddress, gasPrice: 0});
        })
        .then(() => assert.equal(preferredAddressBalance.toString(), web3.eth.getBalance(preferredAddress).toString()));


      return waitList.join({from: accounts[0]})
        .then(() => waitList.join({from: accounts[1]}))
        .then(() => waitList.length.call())
        .then((length) => assert.equal(length.valueOf(), 2))
    });
  });

  describe("#length", () => {
    it("returns zero for an empty waitlist", () => {
      return waitList.length.call()
        .then((length) => assert.equal(length.valueOf(), 0))
    });

    it("returns correct value for partially filled waitlist", () => {
      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => addAccountsToPreferredQueue(waitList, preferredQueueAddresses))
        .then(() => waitList.length.call())
        .then((length) => assert.equal(length.valueOf(), preferredQueueAddresses.length + primaryQueueAddresses.length))
    });
  });

  describe("#placeInLine", () => {
    it("returns correct values for non-empty waitlist", () => {
      return addAccountsToPrimaryQueue(waitList, primaryQueueAddresses)
        .then(() => addAccountsToPreferredQueue(waitList, preferredQueueAddresses))
        .then(() => waitList.placeInLine.call({from: preferredQueueAddresses[0]}))
        .then((placeInLine) => assert.equal(placeInLine.valueOf(), 0))
        .then(() => waitList.placeInLine.call({from: primaryQueueAddresses[0]}))
        .then((placeInLine) => assert.equal(placeInLine.valueOf(), 4))
    });

    it("throws for an empty waitlist", () => {
      return waitList.placeInLine.call({from: accounts[2]})
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
    });
  });

  function addAccountsToPrimaryQueue(waitList, accounts) {
    return accounts.reduce((promise, account) => {
      return promise
        .then(() => waitList.baseFee.call())
        .then((fee) => waitList.joinPrimaryQueue({from: account, gasPrice: 0, value: fee}));
    }, Promise.resolve());
  }

  function addAccountsToPreferredQueue(waitList, accounts) {
    return accounts.reduce((promise, account) => {
      return promise
        .then(() => waitList.preferredFee.call())
        .then((fee) => waitList.joinPreferredQueue({from: account, gasPrice: 0, value: fee.valueOf()}));
    }, Promise.resolve());
  }

});
