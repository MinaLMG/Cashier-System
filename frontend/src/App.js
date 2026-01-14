import "./App.css";
import "./styles/theme.css";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
    return (
        <div className="App">
            <AuthProvider>
                <ProtectedRoute>
                    <ThemeProvider>
                        <Layout />
                    </ThemeProvider>
                </ProtectedRoute>
            </AuthProvider>
        </div>
    );
}

export default App;
