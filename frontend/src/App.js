import "./App.css";
import "./styles/theme.css";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
    return (
        <div className="App">
            <AuthProvider>
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            </AuthProvider>
        </div>
    );
}

export default App;
