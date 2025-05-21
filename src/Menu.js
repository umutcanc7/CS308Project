// // Menu.js
// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import "./Menu.css";

// function Menu() {
//   const [isOpen, setIsOpen] = useState(false);
//   const menuRef = useRef(null);

//   const toggleMenu = () => setIsOpen(!isOpen);

//   // Close menu if clicking outside of it
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen]);

//   return (
//     <>
//       {/* Hamburger icon: click to toggle the menu */}
//       <div className="hamburger-icon" onClick={toggleMenu}>
//         <span></span>
//         <span></span>
//         <span></span>
//       </div>
      
//       {/* Sliding menu */}
//       <div ref={menuRef} className={`sliding-menu ${isOpen ? "open" : ""}`}>
//         {/* Close button inside menu */}
//         <button className="close-btn" onClick={toggleMenu}>
//           &times;
//         </button>
//         <Link to="/home" className="menu-item" onClick={toggleMenu}>
//           Home
//         </Link>
//         <Link to="/shop" className="menu-item" onClick={toggleMenu}>
//           Shop
//         </Link>
//         <Link to="/magazines" className="menu-item" onClick={toggleMenu}>
//           Magazines
//         </Link>
//       </div>
//     </>
//   );
// }

// export default Menu;
