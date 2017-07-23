# Ethereum Waitlist

This is a Waitlist application running on the Ethereum platform. The Waitlist smart contract allows addresses to submit join requests in order to add their address to the end of the queue. The contract owner can then submit remove requests to pick addresses off of the front of the queue.

## Deployment

### The Contracts

The project uses [Truffle](http://truffleframework.com/) for development and deployment of the smart contracts.

1. Install Truffle by running `npm install -g truffle`.
2. Run [testrpc](https://github.com/ethereumjs/testrpc)
3. Run `truffle migrate`.
4. Use the truffle console to interact with the waitlist.
5. Run `truffle test` to run tests.

## Issues

### Known Issues

- There are a couple of failing tests being used as placeholders for missing test coverage
- The FifoAddressQueue contract has a finite number of times (2^256 - 1) the add() function can be successfully called 
- Because of the above limitation the Waitlist contract join() function has a finite number of successful calls as well

### Unknown Issues

To report bugs or request enhancements, please use GitHub issues.

## License

Copyright 2017 Brandon Millman

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

