import React, { useState } from 'react';
import axios from 'axios';

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        console.log(`We are submitting! Name: ${name}, Party size: ${partySize}`);

        try {
            const response = await axios.post('http://localhost:3001/api/customers', { name, partySize });
            if (response.data) {
                console.log(`Got a response from server! We are customer #${response.data.id}`);
            } else {
                console.error(`Did not get data back from server! No customer # was fetched`);
            }
        } catch (err) {
            console.error(`Failed to call server`);
        }
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