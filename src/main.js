import { mount } from "svelte";
import App from "./App.svelte";
import "./estilos.css";
import { registrarServiceWorker } from "./estado/version.svelte.js";

mount(App, { target: document.getElementById("app") });

// El service worker solo se registra en la versión compilada: en desarrollo guardaría archivos viejos en caché
if (import.meta.env.PROD) registrarServiceWorker();
