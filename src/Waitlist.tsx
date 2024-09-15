import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// todo: make better types for these
const NOT_QUEUED = 'notQueued';
const WAITING = 'waiting';
const TABLE_READY = 'tableReady';
const SEATED = 'seated';

let socket: Socket | null = null;

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const [status, setStatus] = useState<string>(NOT_QUEUED);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // initializes the Socket.io connection once when the component mounts, meaning once on page load
        if (!socket) {
            socket = io('http://localhost:3001');
        }

        // fetch from sessionStorage on page refresh
        const storedCustomerId = sessionStorage.getItem('customerId');
        if (storedCustomerId && !isNaN(Number(storedCustomerId))) {
            fetchCustomerDetails(Number(storedCustomerId));

            socket.on('connect', () => {
                console.log(`setting customerId ${storedCustomerId} with socket ${socket!.id} on socket reconnect`);
                socket!.emit('setCustomerId', { customerId: storedCustomerId });
            });
        }

        // clean up socket connection when the component unmounts
        return () => {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    }, []);

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
        }
    }, [customerId]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 10000);
            return () => clearTimeout(timer);
        } 
    }, [error]);

    if (status === SEATED) {
        return (
            <div>
                <h2>You are now checked in</h2>
                <p>Please present this message to our staff</p>
            </div>
        )
    }

    if (customerId) {
        return (
            <div>
                <h2>You are customer number {customerId}</h2>
                {status === WAITING && (<p>There are {position} {Number(position) <= 1 ? 'party' : 'parties'} ahead of you in the queue.</p>)}
                {status === TABLE_READY && (<p>Your table is ready</p>)}
                {(status === WAITING || status === TABLE_READY) && (<button onClick={handleLeaveWaitlist}> Leave Waitlist</button>)}
                <br />
                {status === TABLE_READY && (<button onClick={handleCheckIn}>Check In</button>)}
            </div>
        )
    }

    return (
        <div>
            {error && (<p>{error}</p>)}
            <form onSubmit={handleSubmit}>
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
                    required
                />
                <button type='submit'>{isLoading ? 'Loading...' : 'Join Waitlist'}</button>
            </form>
        </div>
    )

    async function fetchCustomerDetails(id: number) {
        try {
            const res = await axios.get(`http://localhost:3001/api/customers/${id}`);
            setPosition(res.data.position);
            setStatus(res.data.status);
            setCustomerId(id);
            // console.log(`fetchCustomerDetails: Position ${res.data.position}, Status: ${res.data.status}`);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to fetch customer details')
            }
            setError('Failed to fetch customer details')
            console.error(`Failed to fetch customer details!`);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:3001/api/customers', { name, partySize });
            if (res.data) {
                const { id, position, status } = res.data;
                setCustomerId(id);
                sessionStorage.setItem('customerId', id);
                setPosition(position);
                // we can get back 2 types of status, waiting, or tableReady
                setStatus(status);

                // Only send customerId if we are waiting. Should we close the socket if table is ready?
                if (status === WAITING) {
                    console.log(`emitting customerIdMapping with customerId ${id}`);
                    socket!.emit('setCustomerId', { customerId: id });
                }
            } else {
                console.error(`Did not get data back from server! No customerId fetched`);
            }
        } catch (err: any) {
            if (err.status === 400) {
                setError(err.response?.data?.message);
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCheckIn() {
        if (customerId) {
            try {
                await axios.put(`http://localhost:3001/api/customers/${customerId}/check-in`);
                setStatus(SEATED);
                sessionStorage.removeItem('customerId');
            } catch (err) {
                console.error('Failed to check in');
            }
        }
    }

    async function handleLeaveWaitlist() {
        if (customerId) {
            try {
                await axios.delete(`http://localhost:3001/api/customers/${customerId}`);
                
                // reset states
                setName('');
                setPartySize(1);
                setCustomerId(null);
                setPosition(null);
                setStatus(NOT_QUEUED);
                setError(null);
            } catch (err) {
                console.log(`Something went wrong in removing from the wailist`);
            }
        } else {
            console.error(`Trying to leave waitlist when no customerId exist`);
        }
    }
}

export default Waitlist;