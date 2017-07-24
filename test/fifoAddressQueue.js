const FifoAddressQueue = artifacts.require("./base/FifoAddressQueue.sol");

contract('FifoAddressQueue', (accounts) => {
  let queue;

  beforeEach(() => {
    return FifoAddressQueue.new()
      .then((instance) => queue = instance);
  });

  describe("for an empty queue", () => {
    describe("#add", () => {
      beforeEach(() => {
        return queue.add(accounts[0])
          .then(() => queue.add(accounts[1]))
          .then(() => queue.add(accounts[2]));
      });

      it("should add multiple addresses", () => {
        return queue.length()
          .then((length) => assert.equal(length.valueOf(), 3));
      });

      it("should add in correct order", () => {
        const calls = [
          queue.indexOf(accounts[0]),
          queue.indexOf(accounts[1]),
          queue.indexOf(accounts[2])
        ];
        return Promise.all(calls)
          .then((results) => {
            assert.equal(results[0].valueOf(), 0);
            assert.equal(results[1].valueOf(), 1);
            assert.equal(results[2].valueOf(), 2);
          });
      });
    });

    describe("#remove", () => {
      it("should throw", () => {
        return queue.remove()
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while processing transaction"));
      });
    });

    describe("#peek", () => {
      it("should throw", () => {
        return queue.peek()
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#last", () => {
      it("should throw", () => {
        return queue.last()
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#length", () => {
      it("should be zero", () => {
        return queue.length()
          .then((length) => assert.equal(length.valueOf(), 0));
      });
    });

    describe("#indexOf", () => {
      it("should throw", () => {
        return queue.indexOf(accounts[0])
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#exists", () => {
      it("should return false for all accounts", () => {
        const calls = accounts.map((account) => queue.exists(account))
        return Promise.all(calls)
          .then((results) => {
            results.forEach((result) => assert(!result))
          });
      });
    });

    describe("#elementAtIndex", () => {
      it("should throw", () => {
        return queue.elementAtIndex(0)
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#isEmpty", () => {
      it("should be true", () => {
        return queue.isEmpty()
          .then((isEmpty) => assert(isEmpty));
      });
    });
  });

  describe("for a partially filled queue", () => {
    let queueLength;
    let addedAccounts = [
        accounts[0],
        accounts[1],
        accounts[2],
        accounts[3]
      ];

    beforeEach(() => {
      return addedAccounts.reduce((promise, address) => {
        return promise.then(() => queue.add(address))
      }, Promise.resolve())
        .then(() => queue.length())
        .then((length) => queueLength = length.valueOf());
    });

    describe("#add", () => {
      beforeEach(() => queue.add(accounts[4]));

      it("should increase length by one", () => {
        return queue.length()
          .then((length) => assert(length.valueOf(), queueLength + 1))
      });

      it("should add to end of the list", () => {
        return queue.last()
          .then((address) => assert(address, accounts[4]))
      });
    });

    describe("#remove", () => {
      it("should successfully remove from the front of the queue", () => {
        return queue.peek()
          .then((address) => {
            assert.equal(address, accounts[0]);
            return queue.remove();
          })
          .then(() => queue.peek())
          .then((address) => {
            assert.equal(address, accounts[1]);
            return queue.remove();
          })
          .then(() => queue.peek())
          .then((address) => {
            assert.equal(address, accounts[2]);
            return queue.remove();
          })
          .then(() => queue.peek())
          .then((address) => {
            assert.equal(address, accounts[3]);
            return queue.remove();
          })
          .then(() => queue.peek())
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#peek", () => {
      it("should return the front of the queue", () => {
        return queue.peek()
          .then((address) => assert.equal(address, accounts[0]));
      });

      it("should not change the length of the queue", () => {
        return queue.peek()
          .then(() => queue.length())
          .then((length) => assert.equal(length.valueOf(), queueLength));
      });
    });

    describe("#last", () => {
      it("should equal the last address", () => {
        return queue.last()
          .then((address) => assert.equal(address, accounts[3]));
      });
    });

    describe("#length", () => {
      it("should equal the number of elements added", () => assert.equal(queueLength, 4));
    });

    describe("#indexOf", () => {
      it("should correctly return index of added accounts", () => {
        let calls = addedAccounts.map((address) => queue.indexOf(address));
        return Promise.all(calls)
          .then((results) => {
            results.forEach((result, index) => assert.equal(result.valueOf(), index));
          });
      });

      it("should throw for addresses not in the queue", () => {
        return queue.indexOf(accounts[4])
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#exists", () => {
      it("should return true for all addresses in the queue", () => {
        let calls = addedAccounts.map((address) => queue.exists(address));
        return Promise.all(calls)
          .then((results) => {
            results.forEach((result, index) => assert(result));
          });
      });

      it("should return false for addresses not in the queue", () => {
        return queue.exists(accounts[4])
          .then((result) => assert(!result));
      });
    });

    describe("#elementAtIndex", () => {
      it("should correctly return element at index", () => {
        let calls = addedAccounts.map((address, index) => queue.elementAtIndex(index));
        return Promise.all(calls)
          .then((results) => {
            results.forEach((result, index) => assert.equal(result, addedAccounts[index]));
          });
      });

      it("should throw for out of bounds index", () => {
        return queue.elementAtIndex(7)
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "VM Exception while executing eth_call"));
      });
    });

    describe("#isEmpty", () => {
      it("should return false", () => {
        return queue.isEmpty()
          .then((isEmpty) => assert(!isEmpty));
      });
    });
  });

  describe("for filled queue", () => {
    it("needs tests", () => assert(false));
  });
});
