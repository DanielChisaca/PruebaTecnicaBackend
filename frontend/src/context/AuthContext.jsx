import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bank_user');
    if (!savedUser || savedUser === 'null' || savedUser === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });
  
  const [token, setToken] = useState(localStorage.getItem('bank_token'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('bank_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bank_user');
    }
  }, [user]);

  const login = (jwtToken, serverResponse) => {
    if (!jwtToken) {
      console.error("No se puede iniciar sesión sin un token válido.");
      return;
    }

    localStorage.setItem('bank_token', jwtToken);
    setToken(jwtToken);

    let finalUser = null;

    if (serverResponse && typeof serverResponse === 'object') {
      if (serverResponse.user) {
        finalUser = serverResponse.user;
      } 
      else if (serverResponse.id || serverResponse.username) {
        finalUser = serverResponse;
      }
    }

    if (!finalUser || !finalUser.id || finalUser.id === 'null') {
      console.error("Error crítico: El servidor no devolvió un ID de usuario válido en 'serverResponse'.", serverResponse);
      return;
    }

    setUser(finalUser);
  };


  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);