// src/App.jsx
import React, { useState } from 'react';
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import DevenirFranchise from "./pages/DevenirFranchise.jsx";

function App() {
    const [currentPage, setCurrentPage] = useState('login'); // 'login' ou 'franchise'

    const renderPage = () => {
        if (currentPage === 'login') {
            return <Login />;
        }
        return <DevenirFranchise />;
    };

    return (
        <div className="App">
            <Header setCurrentPage={setCurrentPage} />
            {renderPage()}
        </div>
    );
}

export default App;