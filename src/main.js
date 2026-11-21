import { mount } from "svelte";
import App from "./App.svelte";
import "./estilos.css";
import { registrarServiceWorker } from "./estado/version.svelte.js";
import { escucharInstalacion } from "./estado/instalacion.svelte.js";

// Antes de montar: el navegador puede avisar de que se puede instalar muy pronto y el aviso solo llega una vez
escucharInstalacion();
mount(App, { target: document.getElementById("app") });

// El service worker solo se registra en la versión compilada: en desarrollo guardaría archivos viejos en caché
if (import.meta.env.PROD) registrarServiceWorker();
