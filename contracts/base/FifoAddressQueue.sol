pragma solidity ^0.4.11;

/// @title FifoAddressQueue - Manages a first in first out queue of addresses
/// @author Brandon Millman - <brandon.millman@gmail.com>
contract FifoAddressQueue {

    /*
     * State variables
     */

    // @dev Append-only array of addresses
    address[] private queue;

    // @dev Mapping of address to index in the above queue, 1-indexed to properly check for existence
    mapping(address => uint) private addressIndex;

    // @dev Index of the front of the queue
    uint private cursorPosition;

    /*
     * Modifiers
     */

    /// @dev Requires queue to be non-empty
    modifier notEmpty {
        require(queue.length != 0);
        _;
    }

    /// @dev Requires cursorPosition to be in a valid state
    modifier validCursor {
        require(queue.length >= cursorPosition);
        _;
    }

    /*
     * Public functions
     */

    /// @dev Adds an address to the end of the queue
    /// @param element Address to add to the queue
    /// @return Success of addition
    function add(address element)
        returns(bool success)
    {
        // overflow, max queue capacity has been reached
        if (queue.length + 1 < queue.length) {
            return false;
        } else {
            queue.push(element);
            addressIndex[element] = queue.length;
            return true;
        }
    }

    /// @dev Removes an address from the front of the queue
    /// @return Success of addition
    function remove()
        notEmpty
        validCursor
        returns(address head)
    {
        // move cursor forward and return the previous head
        cursorPosition = cursorPosition + 1;
        return (queue[cursorPosition - 1]);
    }

    /*
     * Constant functions
     */

    /// @dev Returns the element at the front of the queue without removing it
    /// @return Address at the front of the queue
    function peek()
        constant
        notEmpty
        validCursor
        returns(address headElement)
    {
        return (queue[cursorPosition]);
    }

    /// @dev Returns the element at the end of the queue without removing it
    /// @return Address at the end of the queue
    function last()
        constant
        notEmpty
        validCursor
        returns(address lastElement)
    {
        uint index = queue.length - 1;
        return (queue[index]);
    }

    /// @dev Returns the length of the "active" area of the queue
    /// @return Length of the queue
    function length()
        constant
        validCursor
        returns(uint length)
    {
        return queue.length - cursorPosition;
    }

    /// @dev Returns the index of the item in the queue
    /// @param element Address to find the index of
    /// @return Index of element
    function indexOf(address element)
        constant
        notEmpty
        returns(uint index)
    {
        var (possibleIndex, validIndex) = internalIndexOf(element);
        if (!validIndex) throw;
        return possibleIndex;
    }

    /// @dev Returns existence of the item in the queue
    /// @param element Address to find the existence of
    /// @return Index of element
    function exists(address element)
        constant
        returns(bool exists)
    {
        var (possibleIndex, validIndex) = internalIndexOf(element);
        return validIndex;
    }

    /// @dev Returns address at a given index
    /// @param index Index of the address
    /// @return Address at index
    function elementAtIndex(uint index)
        constant
        notEmpty
        returns(address element)
    {
        uint adjustedIndex = cursorPosition + index;
        assert((adjustedIndex >= cursorPosition) && (adjustedIndex < queue.length));
        return queue[adjustedIndex];
    }

    /// @dev Returns true if active area of the queue is empty
    /// @return Empty
    function isEmpty()
        constant
        returns(bool isEmpty)
    {
        return (length() == 0);
    }

    /*
     * Private functions
     */

    /// @dev Returns the index of the item in the queue and if it the index is valid
    /// @return (Index of element, Index validity)
    function internalIndexOf(address element)
        private
        constant
        validCursor
        returns(uint index, bool validIndex)
    {
        index = addressIndex[element] - cursorPosition - 1;
        validIndex = ((index >= cursorPosition) && (index < queue.length));
    }
}