import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  //useLocation hooks into the router and detects whenever the URL path changes
  const { pathname } = useLocation();

  useEffect(() => {
    // Instantly reset the window scroll coordinates to the top-left corner
    window.scrollTo(0, 0);
  }, [pathname]); // This effect fires every single time a user switches pages

  return null; // This component doesn't render any visible UI element
}