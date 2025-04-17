import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import AppRoutes from "./routes";
import { AuthProvider } from "./lib/auth";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" expand={true} richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
