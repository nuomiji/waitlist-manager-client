import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import './Waitlist.css'; // Import the CSS file

// Status types for the customer
const NOT_QUEUED = 'notQueued';
const WAITING = 'waiting';
const TABLE_READY = 'tableReady';
const SEATED = 'seated';

const SERVER_URL: string = process.env.REACT_APP_WAITLIST_SERVER_URL!;

let socket: Socket | null = null;

/**
 * Waitlist Component
 * 
 * This component allows a user to join the waitlist, view their current status
 * (waiting or table ready), and manage their spot in the waitlist. It also uses
 * Socket.IO to listen for real-time updates when the customer's table is ready.
 */
function Waitlist() {
    const [name, setName] = useState<string>(''); // Customer's name
    const [partySize, setPartySize] = useState<number>(1); // Size of the party
    const [customerId, setCustomerId] = useState<number | null>(null); // Unique ID of the customer
    const [position, setPosition] = useState<number | null>(null); // Position in the waitlist
    const [status, setStatus] = useState<string>(NOT_QUEUED); // Current status (waiting, table ready, etc.)
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for form submission
    const [error, setError] = useState<string | null>(null); // Error message for API requests

    // Initialize socket connection on component mount and fetch customer data from sessionStorage
    useEffect(() => {
        if (!socket) {
            socket = io(SERVER_URL);
        }

        const storedCustomerId = sessionStorage.getItem('customerId');
        if (storedCustomerId && !isNaN(Number(storedCustomerId))) {
            fetchCustomerDetails(Number(storedCustomerId));

            socket.on('connect', () => {
                console.log(`Reconnected with socket ID: ${socket!.id}`);
                socket!.emit('setCustomerId', { customerId: storedCustomerId });
            });
        }

        return () => {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    }, []);

    // Listen for table ready notification from the server
    useEffect(() => {
        if (socket && customerId) {
            socket.on('tableReady', () => {
                setStatus(TABLE_READY);
            });
        }

        return () => {
            if (socket) {
                socket.off('tableReady');
            }
        };
    }, [customerId]);

    // Automatically dismiss error messages after 10 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Render view for seated customers
    if (status === SEATED) {
        return (
            <div className="waitlist-container">
                <h2>You are now checked in</h2>
                <p>Please present this message to our staff</p>
                <p>Refresh the page and join again as a new customer</p>
            </div>
        );
    }

    // Render view for customers who are already in the waitlist
    if (customerId) {
        return (
            <div className="waitlist-container">
                <h2>You are customer number {customerId}</h2>
                {status === WAITING && (
                    <p>There are {position} parties ahead of you in the queue.</p>
                )}
                {status === WAITING && (
                    <p>Check In button will show up in real time.</p>
                )}
                {status === WAITING && (
                    <p>If you would like to refresh your position, you can refresh the page.</p>
                )}
                {status === TABLE_READY && <p>Your table is ready</p>}
                {(status === WAITING || status === TABLE_READY) && (
                    <button onClick={handleLeaveWaitlist}>Leave Waitlist</button>
                )}
                <br />
                <br />
                {status === TABLE_READY && <button onClick={handleCheckIn}>Check In</button>}
            </div>
        );
    }

    return (
        <div className="waitlist-container">
            {error && <p className="error-message">{error}</p>}
            <form  data-testid="waitlist-form" onSubmit={handleSubmit}>
                <input
                    type='text'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder='Name'
                    required
                />
                <input
                    type="number"
                    value={partySize}
                    onChange={e => setPartySize(Number(e.target.value))}
                    min="1"
                    placeholder='Party Size'
                    required
                />
                <button type='submit' disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Join Waitlist'}
                </button>
            </form>
        </div>
    );

    /**
     * Fetch customer details from the server using their ID
     * @param {number} id - The customer ID
     */
    async function fetchCustomerDetails(id: number) {
        try {
            const res = await axios.get(`${SERVER_URL}/api/customers/${id}`);
            setPosition(res.data.position);
            setStatus(res.data.status);
            setCustomerId(id);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                resetWaitlistState();
                setError(err.response?.data?.message || 'Failed to fetch customer details');
                sessionStorage.removeItem('customerId');
            }
            console.error('Failed to fetch customer details!');
        }
    }

    /**
     * Handles form submission to join the waitlist
     * @param {React.FormEvent} e - Form submit event
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        console.log("Form submitted!!");
        console.log(`name: ${name}, partySize: ${partySize}`);

        setIsLoading(true);

        try {
            const res = await axios.post(`${SERVER_URL}/api/customers`, { name, partySize });
            if (res.data) {
                const { id, position, status } = res.data;
                setCustomerId(id);
                sessionStorage.setItem('customerId', id);
                setPosition(position);
                setStatus(status);

                // Send customerId to server if waiting
                if (status === WAITING) {
                    socket!.emit('setCustomerId', { customerId: id });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Handles customer check-in when their table is ready
     */
    async function handleCheckIn() {
        if (customerId) {
            try {
                await axios.put(`${SERVER_URL}/api/customers/${customerId}/check-in`);
                setStatus(SEATED);
                sessionStorage.removeItem('customerId');
            } catch (err) {
                console.error('Failed to check in');
            }
        }
    }

    /**
     * Handles customer request to leave the waitlist
     */
    async function handleLeaveWaitlist() {
        if (customerId) {
            try {
                await axios.delete(`${SERVER_URL}/api/customers/${customerId}`);
                resetWaitlistState();
            } catch (err) {
                console.error('Error removing from the waitlist');
            }
        }
    }

    /**
     * Resets the state when a customer leaves the waitlist
     */
    function resetWaitlistState() {
        setName('');
        setPartySize(1);
        setCustomerId(null);
        setPosition(null);
        setStatus(NOT_QUEUED);
        setError(null);
    }
}

export default Waitlist;
