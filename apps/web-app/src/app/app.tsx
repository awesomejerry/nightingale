// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { trpc } from '../trpc';
import { useState } from 'react';

export function App() {
  const [nameInput, setNameInput] = useState('');
  const [supervisorTask, setSupervisorTask] = useState("what's the combined headcount of the FAANG companies in 2024??");

  const hello = trpc.hello.useQuery(
    { name: nameInput },
    { enabled: false },
  );

  const supervisorMutation = trpc.supervisor.useMutation();

  const fetchData = () => {
    if (nameInput.trim() !== '') {
      hello.refetch();
    }
  };

  const runSupervisor = () => {
    if (supervisorTask.trim() !== '') {
      supervisorMutation.mutate({
        task: supervisorTask,
        context: 'Web app request'
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
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

      <div style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>Supervisor Agent</h2>
        <div>
          <input
            type="text"
            value={supervisorTask}
            onChange={(e) => setSupervisorTask(e.target.value)}
            placeholder="Enter a task for the supervisor (e.g., 'what's the combined headcount of the FAANG companies in 2024??')"
            style={{ width: '400px' }}
          />
          <button
            onClick={runSupervisor}
            style={{ marginLeft: '8px' }}
            disabled={supervisorMutation.isPending}
          >
            {supervisorMutation.isPending ? 'Running...' : 'Run Supervisor'}
          </button>
        </div>
        {supervisorMutation.isPending && <p>Running supervisor...</p>}
        {supervisorMutation.error && (
          <p style={{ color: 'red' }}>Error: {supervisorMutation.error.message}</p>
        )}
        {supervisorMutation.data && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Status:</strong> {supervisorMutation.data.status}</p>
            <p><strong>Result:</strong></p>
            <pre style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {supervisorMutation.data.result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
