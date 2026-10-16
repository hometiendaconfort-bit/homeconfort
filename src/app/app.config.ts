import { ApplicationConfig, provideBrowserGlobalErrorListeners,LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

// REGISTRO LOS DATOS REGIONALES DE COLOMBIA
registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [

    // HABILITO HTTPCLIENT PARA REALIZAR PETICIONES HTTP,
// COMO LAS QUE USO PARA COMUNICARME CON LA API DE JSON SERVER.
    provideHttpClient(withFetch()),

    //ESCUCHA ERRORES GLOBALES DEL NAVEGADOR
    provideBrowserGlobalErrorListeners(),

    // CONFIGURO EL IDIOMA DE LA APLICACION
    { provide: LOCALE_ID, useValue: 'es-CO' },

    
    provideRouter(routes), provideClientHydration(withEventReplay())
  ]
};
