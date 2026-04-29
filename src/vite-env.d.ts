/// <reference types="vite/client" />

// Google Maps types
interface Window {
  google: {
    maps: {
      Map: any;
      Marker: any;
      Animation: {
        DROP: any;
      };
    };
  };
}
