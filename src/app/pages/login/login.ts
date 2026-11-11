
import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email = '';
  password = '';

  cargando = false;
  errorMensaje = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  async login(): Promise<void> {

    if (this.cargando) return;

    if (!this.email.trim() || !this.password) {
      this.errorMensaje = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    try {

      await this.auth.login(this.email, this.password);

      await this.router.navigate(['/admin']);

    } catch (error) {

      console.error('Error al iniciar sesión:', error);

      this.errorMensaje = 'Correo o contraseña incorrectos.';

    } finally {

      this.cargando = false;

    }
  }
}
