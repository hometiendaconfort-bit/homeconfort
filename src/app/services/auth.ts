
import { Injectable } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';

import { auth } from '../config/firebase';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  async login(email: string, password: string): Promise<UserCredential> {

    try {
      return await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {

    try {
      await signOut(auth);

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

}
