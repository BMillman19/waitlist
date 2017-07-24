pragma solidity ^0.4.11;

import "./base/FifoAddressQueue.sol";
import "./base/Ownable.sol";

/// @title Waitlist - Manages a queue of addresses for use as a waitlist
/// @author Brandon Millman - <brandon.millman@gmail.com>
contract Waitlist is Ownable {

    /*
     * State variables
     */

    /// @dev primary FIFO queue that manages addresses
    FifoAddressQueue private primaryAddressQueue;

    /// @dev addresses that pay a fee enter this queue
    FifoAddressQueue private preferredAddressQueue;

    /// @dev the base fee (in wei) needed to enter either queue
    uint public baseFee;

    /// @dev wei / person needed to cut the line needed to enter the preferred queue
    uint public preferredRate;

    /// @dev mapping of address to wei representing the amount of ether that can be withdrawn
    mapping (address => uint) pendingWithdrawals;


    /*
     * Modifiers
     */

    /// @dev Requires target address to not be in the queue
    modifier targetNotInWaitlist(address target) {
        require(!primaryAddressQueue.exists(target) && !preferredAddressQueue.exists(target));
        _;
    }

    modifier valueMeetsFee(uint fee) {
        require(msg.value >= fee);
        _;
    }

    /*
     * Queue codes
     */

    uint constant UNKNOWN_QUEUE_CODE = 0;
    uint constant PRIMARY_QUEUE_CODE = 1;
    uint constant PREFERRED_QUEUE_CODE = 2;

    /*
     * Events
     */

    event JoinSuccessful(address indexed waiter, uint indexed queueCode);
    event JoinError(address indexed waiter, uint indexed queueCode);
    event RemoveSuccessful(address indexed waiter, uint queueCode);

    /*
     * Public functions
     */

    /// @dev Constructor
    function Waitlist(uint _baseFee, uint _preferredRate)
    {
        baseFee = _baseFee;
        preferredRate = _preferredRate;
        primaryAddressQueue = new FifoAddressQueue();
        preferredAddressQueue = new FifoAddressQueue();
    }

    /// @dev Add sender's address to the primary queue
    /// @return Successful join
    function joinPrimaryQueue()
        payable
        returns(bool success)
    {
        return internalJoin(primaryAddressQueue, baseFee);
    }

    /// @dev Add sender's address to the waitlist
    /// @return Successful join
    function joinPreferredQueue()
        payable
        returns(bool success)
    {
        success = internalJoin(preferredAddressQueue, preferredFee());
        if (success) {
            for (uint i = 0; i < primaryAddressQueue.length(); i++) {
                address waiter = primaryAddressQueue.elementAtIndex(i);
                uint currentWithdrawal = pendingWithdrawals[waiter];
                pendingWithdrawals[waiter] = currentWithdrawal + preferredRate;
            }
        }
    }

    /// @dev Remove address at the front of the waitlist
    /// @return Address that was at the front of the waitlist
    function remove()
        onlyOwner
        returns(address waiter)
    {
        bool preferredAddressQueueEmpty = preferredAddressQueue.isEmpty();
        FifoAddressQueue queue = preferredAddressQueueEmpty ? primaryAddressQueue : preferredAddressQueue;
        uint queueCode = preferredAddressQueueEmpty ? PRIMARY_QUEUE_CODE : PREFERRED_QUEUE_CODE;
        address frontOfLine = queue.remove();
        RemoveSuccessful(frontOfLine, queueCode);
        return frontOfLine;
    }

    /// @dev Payout the amount msg.sender as accrued
    function withdrawFunds()
    {
        uint amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    /*
     * Constant functions
     */

    /// @dev Current length of the waitlist
    /// @return Length of the waitlist
    function length()
        constant
        returns(uint length)
    {
        return primaryAddressQueue.length() + preferredAddressQueue.length();
    }

    /// @dev Place in line of the provided address, 0-indexed
    /// @return index of the address
    function placeInLine()
        constant
        returns(uint index)
    {
        if (preferredAddressQueue.exists(msg.sender)) {
            return preferredAddressQueue.indexOf(msg.sender);
        } else {
            return preferredAddressQueue.length() + primaryAddressQueue.indexOf(msg.sender);
        }

    }

    function preferredFee()
        constant
        returns(uint fee)
    {
        return baseFee + (preferredRate * primaryAddressQueue.length());
    }

    /*
     * Private functions
     */

    function internalJoin(FifoAddressQueue queue, uint fee)
        private
        valueMeetsFee(fee)
        targetNotInWaitlist(msg.sender)
        returns(bool success)
    {
        success = queue.add(msg.sender);
        uint queueCode = queueCodeFromQueue(queue);
        if (success) {
            if (msg.value > fee) {
                msg.sender.transfer(msg.value - fee); // should this be part of withdrawals?
            }
            JoinSuccessful(msg.sender, queueCode);
        } else {
            msg.sender.transfer(msg.value); // should this be part of withdrawals?
            JoinError(msg.sender, queueCode);
        }
    }

    function queueCodeFromQueue(FifoAddressQueue queue)
        private
        returns(uint code)
    {
        // need to check for empty addresses?
        if (queue == primaryAddressQueue) {
            return PRIMARY_QUEUE_CODE;
        } else if (queue == preferredAddressQueue) {
            return PREFERRED_QUEUE_CODE;
        } else {
            return UNKNOWN_QUEUE_CODE;
        }
    }
}
