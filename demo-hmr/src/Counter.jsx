import { h, useState, useEffect, useCallback } from 'fre';

export function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    console.log(`[Counter] count changed to ${count}`);
  }, [count]);

  const increment = useCallback(() => {
    setCount((c) => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount((c) => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div class="counter">
      <div class="count">{count}</div>
      <div>
        <button onClick={decrement}>- {step}</button>
        <button onClick={increment}>+ {step}</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div style={{ marginTop: '15px' }}>
        <label>
          Step size:{' '}
          <select
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            style={{
              padding: '5px',
              fontSize: '14px',
              borderRadius: '3px',
              border: 'none',
            }}
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </label>
      </div>
      <p style={{ color: '#888', fontSize: '14px' }}>Edit this component and save to test HMR!</p>
    </div>
  );
}
