import React from 'react';
import './Header.css'; // Opcional: para estilizar o cabeçalho

export default function Header() {
  return (
    <header className="main-header">
      <div className="logo">
        <h1>Meu App</h1>
      </div>
      <nav className="navigation">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#sobre">Sobre</a></li>
          <li><a href="#contato">Contato</a></li>
        </ul>
      </nav>
    </header>
  );
}
