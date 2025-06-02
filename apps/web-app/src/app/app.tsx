// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { trpc } from '../trpc';
import { useState } from 'react';
import { skipToken } from '@tanstack/react-query';

export function App() {
  const [nameInput, setNameInput] = useState('');
  const [supervisorTask, setSupervisorTask] = useState("what's the combined headcount of the FAANG companies in 2024??");
  const [streamName, setStreamName] = useState('');
  const [streamMessages, setStreamMessages] = useState<Array<{ message: string; step: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // New state for swarm
  const [swarmRequest, setSwarmRequest] = useState('first book a flight from BOS to JFK and then book a stay at McKittrick Hotel');
  const [swarmMessages, setSwarmMessages] = useState<Array<{ message: string; agent: string; timestamp: string }>>([]);
  const [isSwarmStreaming, setIsSwarmStreaming] = useState(false);

  const hello = trpc.hello.useQuery(
    { name: nameInput },
    { enabled: false },
  );

  const supervisorMutation = trpc.supervisor.useMutation();

  // tRPC subscription for streaming
  const helloStreamSubscription = trpc.helloStream.useSubscription(
    isStreaming && !!streamName.trim() ? { name: streamName } : skipToken,
    {
      onData: (data) => {
        setStreamMessages((prev) => [...prev, data]);
      },
      onError: (error) => {
        console.error('Stream error:', error);
        setIsStreaming(false);
      },
      onComplete: () => {
        setIsStreaming(false);
      },
    }
  );

  // tRPC subscription for swarm streaming
  const swarmStreamSubscription = trpc.swarmStream.useSubscription(
    isSwarmStreaming && !!swarmRequest.trim() ? { request: swarmRequest } : skipToken,
    {
      onData: (data) => {
        setSwarmMessages((prev) => [...prev, {
          message: data.message || '',
          agent: data.agent || '',
          timestamp: data.timestamp || '',
        }]);
      },
      onError: (error) => {
        console.error('Swarm stream error:', error);
        setIsSwarmStreaming(false);
      },
      onComplete: () => {
        setIsSwarmStreaming(false);
      },
    }
  );

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

  const startStreaming = () => {
    if (!streamName.trim()) return;

    setIsStreaming(true);
    setStreamMessages([]);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  const startSwarmStreaming = () => {
    if (!swarmRequest.trim()) return;

    setIsSwarmStreaming(true);
    setSwarmMessages([]);
  };

  const stopSwarmStreaming = () => {
    setIsSwarmStreaming(false);
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

      <div style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>Streaming Hello (tRPC SSE)</h2>
        <div>
          <input
            type="text"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            placeholder="Enter a name for streaming"
          />
          <button
            onClick={startStreaming}
            style={{ marginLeft: '8px' }}
            disabled={isStreaming || !streamName.trim()}
          >
            {isStreaming ? 'Streaming...' : 'Start Stream'}
          </button>
          {isStreaming && (
            <button
              onClick={stopStreaming}
              style={{ marginLeft: '8px', backgroundColor: '#dc3545', color: 'white' }}
            >
              Stop Stream
            </button>
          )}
        </div>
        {streamMessages.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h3>Stream Messages:</h3>
            <div style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {streamMessages.map((msg, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  <strong>Step {msg.step}:</strong> {msg.message}
                </div>
              ))}
            </div>
          </div>
        )}
        {helloStreamSubscription.error && (
          <p style={{ color: 'red' }}>
            Stream Error: {helloStreamSubscription.error.message}
          </p>
        )}
      </div>

      <div style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>Swarm Agents (Multi-Agent Coordination)</h2>
        <div>
          <input
            type="text"
            value={swarmRequest}
            onChange={(e) => setSwarmRequest(e.target.value)}
            placeholder="Enter a request for swarm agents (e.g., 'book a flight then a hotel')"
            style={{ width: '400px' }}
          />
          <button
            onClick={startSwarmStreaming}
            style={{ marginLeft: '8px' }}
            disabled={isSwarmStreaming || !swarmRequest.trim()}
          >
            {isSwarmStreaming ? 'Processing...' : 'Start Swarm'}
          </button>
          {isSwarmStreaming && (
            <button
              onClick={stopSwarmStreaming}
              style={{ marginLeft: '8px', backgroundColor: '#dc3545', color: 'white' }}
            >
              Stop Swarm
            </button>
          )}
        </div>
        {swarmMessages.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h3>Swarm Messages:</h3>
            <div style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {swarmMessages.map((msg, index) => (
                <div key={index} style={{ marginBottom: '8px', padding: '5px', borderLeft: '3px solid #007acc' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                    <strong>Agent:</strong> {msg.agent} | <strong>Time:</strong> {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {swarmStreamSubscription.error && (
          <p style={{ color: 'red' }}>
            Swarm Error: {swarmStreamSubscription.error.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
