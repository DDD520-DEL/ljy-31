import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Record from './pages/Record';
import Schedule from './pages/Schedule';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<Record />} />
          <Route path="/record/:id" element={<Record />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/history" element={<History />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
