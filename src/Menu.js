// Menu.js
import React from "react";
import "./Menu.css";

function Menu() {
  return (
    <div className="menu">
      <div className="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="menu-items">
        <a href="#shop" className="menu-item">Shop</a>
        <a href="#magazines" className="menu-item">Magazines</a>
      </div>
    </div>
  );
}

export default Menu;
