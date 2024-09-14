import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const [isTableReady, setIsTableReady] = useState(false);

    useEffect(() => {
        const storedCustomerId = sessionStorage.getItem('customerId');
        if (storedCustomerId) {
            setCustomerId(Number(storedCustomerId));
            fetchCustomerDetails(Number(storedCustomerId));
        }
    }, []);

    async function fetchCustomerDetails(id: number) {
        try {
            const res = await axios.get(`http://localhost:3001/api/customers/${id}`);
            setPosition(res.data.position);
            // this is a workaround before we implement websockets
            setIsTableReady(res.data.status === 'tableReady');
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
            } else {
                console.error(`Did not get data back from server! No customer # was fetched`);
            }
        } catch (err) {
            console.error(`Failed to call server`);
        }
    }

    if (customerId) {
        return (
            <div>
                <h2>You are customer number {customerId}</h2>
                {!isTableReady && (<p>There are {position} parties ahead of you in the queue.</p>)}
                {isTableReady && (<p>You table is ready</p>)}
                {isTableReady && (<button onClick={handleCheckIn}>Check In</button>)}
            </div>
        )
    }

    function handleCheckIn() {
        console.log('We are checking in!! Yay food!');
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
}

export default Waitlist;