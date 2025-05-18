// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { trpc } from '../trpc';

export function App() {
  const hello = trpc.hello.useQuery({ name: 'World' });

  return (
    <div>
      <div style={{ marginTop: 32 }}>
        <h2>tRPC Example</h2>
        {hello.isLoading && <p>Loading...</p>}
        {hello.error && (
          <p style={{ color: 'red' }}>Error: {hello.error.message}</p>
        )}
        {hello.data && <p>Server says: {hello.data.message}</p>}
      </div>
    </div>
  );
}

export default App;
