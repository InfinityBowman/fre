import { h, useState, useEffect } from 'fre';
import { Counter } from './Counter';

export function App() {
  const [name, setName] = useState('Fre');

  useEffect(() => {
    console.log('[App] mounted');
    return () => console.log('[App] unmounted');
  }, []);

  return (
    <div>
      <h1>Fre HMR Demo</h1>
      <p>Welcome to {name}!</p>

      <div>
        <input
          type="text"
          value={name}
          onInput={(e) => setName(e.target.value)}
          placeholder="Enter name"
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none',
            marginRight: '10px',
          }}
        />
      </div>

      <Counter />

      <div class="instructions">
        <h3>Testing HMR</h3>
        <p>1. Increment the counter a few times</p>
        <p>
          2. Edit this file or <code>Counter.tsx</code>
        </p>
        <p>3. Save - the page should update WITHOUT losing counter state!</p>
        <p>4. The input value should also be preserved</p>
      </div>
    </div>
  );
}
