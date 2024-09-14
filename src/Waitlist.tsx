import React, { useState } from 'react';
import axios from 'axios';

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:3001/api/customers', { name, partySize });
            if (res.data) {
                setCustomerId(res.data.id);
                localStorage.setItem('customerId', res.data.id); // currently we lose customerId on page reload. Need to implement useEffect next
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
                <p>There are {position} parties ahead of you in the queue.</p>
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
}

export default Waitlist;