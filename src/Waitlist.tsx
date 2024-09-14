import React, { useState } from 'react';

function Waitlist() {
    const [name, setName] = useState('');
    const [partySize, setPartySize] = useState(1);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        console.log(`We are submitting! Name: ${name}, Party size: ${partySize}`);
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