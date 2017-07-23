pragma solidity ^0.4.11;

import "./base/FifoAddressQueue.sol";
import "./base/Ownable.sol";

/// @title Waitlist - Manages a queue of addresses for use as a waitlist
/// @author Brandon Millman - <brandon.millman@gmail.com>
contract Waitlist is Ownable {

    /*
     * State variables
     */

    /// @dev FIFO queue that manages addresses
    FifoAddressQueue private primaryAddressQueue;

    /*
     * Modifiers
     */

    /// @dev Requires msg sender to match a target address
    modifier targetAuthorized(address target) {
        require(msg.sender == target);
        _;
    }

    /// @dev Requires target address to not be in the queue
    modifier targetNotInWaitlist(address target) {
        require(!primaryAddressQueue.exists(target));
        _;
    }

    /*
     * Events
     */

    event JoinSuccessful(address indexed waiter);
    event JoinError(address indexed waiter);
    event RemoveSuccessful(address indexed waiter);

    /*
     * Public functions
     */

    /// @dev Constructor
    function Waitlist()
    {
        primaryAddressQueue = new FifoAddressQueue();
    }

    /// @dev Add sender's address to the waitlist
    /// @return Successful join
    function join()
        targetNotInWaitlist(msg.sender)
        returns(bool success)
    {
        bool result = primaryAddressQueue.add(msg.sender);
        if (result) {
            JoinSuccessful(msg.sender);
        } else {
            JoinError(msg.sender);
        }
        return result;
    }

    /// @dev Remove address at the front of the waitlist
    /// @return Address that was at the front of the waitlist
    function remove()
        onlyOwner
        returns(address waiter)
    {
        address frontOfLine = primaryAddressQueue.remove();
        RemoveSuccessful(frontOfLine);
        return frontOfLine;
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
        return primaryAddressQueue.length();
    }

    /// @dev Place in line of the provided address, 0-indexed
    /// @param waiter Address to query
    /// @return index of the address
    function placeInLine(address waiter)
        constant
        targetAuthorized(waiter)
        returns(uint index)
    {
        return primaryAddressQueue.indexOf(waiter);
    }
}
