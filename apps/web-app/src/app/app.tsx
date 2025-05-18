// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { trpc } from '../trpc';
import { useState } from 'react';

export function App() {
  const [nameInput, setNameInput] = useState('');
  const hello = trpc.hello.useQuery(
    { name: nameInput },
    { enabled: false },
  );

  const fetchData = () => {
    if (nameInput.trim() !== '') {
      hello.refetch();
    }
  };

  return (
    <div>
      <div style={{ marginTop: 32 }}>
        <h2>tRPC Example</h2>
        <div>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter a name"
          />
          <button onClick={fetchData} style={{ marginLeft: '8px' }}>
            Greet
          </button>
        </div>
        {hello.isFetching && <p>Loading...</p>}
        {hello.error && (
          <p style={{ color: 'red' }}>Error: {hello.error.message}</p>
        )}
        {hello.data && <p>tRPC Server says: {hello.data.message}</p>}
      </div>
    </div>
  );
}

export default App;
