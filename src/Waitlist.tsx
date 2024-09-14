import React, { useState, useEffect } from 'react';
import axios from 'axios';

// todo: make better types for these
const NOT_QUEUED = 'notQueued';
const WAITING = 'waiting';
const TABLE_READY = 'tableReady';
const SEATED = 'seated';

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const [status, setStatus] = useState<string>(NOT_QUEUED);

    // this is needed so we fetch from sessionStorage on page refresh
    // at this time, we don't have websockets so we need to refresh the page
    useEffect(() => {
        const storedCustomerId = sessionStorage.getItem('customerId');
        if (storedCustomerId) {
            setCustomerId(Number(storedCustomerId));
            fetchCustomerDetails(Number(storedCustomerId));
        }
    }, []);

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
                {status === WAITING && (<p>There are {position} parties ahead of you in the queue.</p>)}
                {status === TABLE_READY && (<p>You table is ready</p>)}
                {status === TABLE_READY && (<button onClick={handleCheckIn}>Check In</button>)}
            </div>
        )
    }

    return (
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
            <button type='submit'>Join Waitlist</button>
        </form>
    )

    async function fetchCustomerDetails(id: number) {
        try {
            const res = await axios.get(`http://localhost:3001/api/customers/${id}`);
            setPosition(res.data.position);
            // this is a workaround before we implement websockets
            setStatus(res.data.status);
        } catch (err) {
            console.error(`Failed to fetch customer details!`);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:3001/api/customers', { name, partySize });
            if (res.data) {
                setCustomerId(res.data.id);
                sessionStorage.setItem('customerId', res.data.id); // currently we lose customerId on page reload. Need to implement useEffect next
                setPosition(res.data.position);
                setStatus('waiting');
            } else {
                console.error(`Did not get data back from server! No customer # was fetched`);
            }
        } catch (err) {
            console.error(`Failed to call server`);
        }
    }

    async function handleCheckIn() {
        if (customerId) {
            try {
                await axios.put(`http://localhost:3001/api/customers/${customerId}/check-in`);
                setStatus(SEATED);
            } catch (err) {
                console.error('Failed to check in');
            }
        }
    }
}

export default Waitlist;