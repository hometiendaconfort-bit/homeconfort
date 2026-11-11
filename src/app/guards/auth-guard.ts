
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);

  return new Promise<boolean | ReturnType<Router['createUrlTree']>>((resolve) => {

    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,

      (user) => {

        unsubscribe();

        if (user && user.uid === 'xNl1GFOOJYS0jnfR6jh1VQlPJxn2') {
          resolve(true);
        } else {
          resolve(router.createUrlTree(['/login']));
        }

      },

      (error) => {

        unsubscribe();

        console.error('Error verificando autenticación:', error);

        resolve(router.createUrlTree(['/login']));

      }
    );

  });

};
