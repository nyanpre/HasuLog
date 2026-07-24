// hasulog/src/App.tsx

import { StreamList } from "./components/StreamList";

function App() {
  return (
    <div>
      <header className="bg-gray-800 text-white p-4 text-center">
        <h1 className="text-xl font-bold">HasuLog</h1>
      </header>
      
      <main>
        <StreamList />
      </main>
    </div>
  );
}

export default App;