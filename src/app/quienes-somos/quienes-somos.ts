import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quienes-somos.html',
  styleUrl: './quienes-somos.css',
})
export class QuienesSomos {

subtitulo="QUIENES SOMOS";
tituloA = "Más que CONFORT,";
tituloB= "Te damos descanso";
descripcion= "Somos una tienda de muebles para el hogar que ofrece camas, colchones, bases, espaldares, nocheros, peinadores, salas, comedores y accesorios. Brindamos atención en Pereira y Dosquebradas, Risaralda, con productos de calidad, precios justos y opciones de pago según disponibilidad. También ofrecemos envíos nacionales para determinados productos. hacemos envios contra entrega"
;


tituloABeneficio="Calidad Garantizada";
subtituloABeneficio="productos seleccionados con los Mejores Materiales";

tituloBBeneficio="Envíos Rápidos y Seguros";
subtituloBBeneficio=" Llevamos Tu Pedido Hasta La Puerta De Tu Hogar.";

tituloCBeneficio="Atención Personalizada";
subtituloCBeneficio="Te Asesoramos Para que Elijas Lo Mejor Para Ti.";

textoWhatsapp="Escríbenos por WhatsApp";


tituloACaracteristica="Experiencia";
subtituloACaracteristica="Más de 3 años Ayudando a Nuestros Clientes a Descansar Mejor.";

tituloBCaracteristica="Compromiso";
subtituloBCaracteristica="Nos Comprometemos con tu Bienestar y Satisfacción Total.";

tituloCCaracteristica="Variedad";
subtituloCCaracteristica=" Encuentra Todo lo que Necesitas Para tu Descanso en un solo Lugar.";

tituloDCaracteristica="Precios Justos";
subtituloDCaracteristica="Calidad Premium al Mejor Precio del Mercado.";


tituloAEstadistica="+500";
subtituloAEstadistica="Clientes Satisfechos";

tituloBEstadistica="+1000";
subtituloBEstadistica="Productos Vendidos";

tituloCEstadistica="4.9/5";
subtituloCEstadistica="Calificación de Clientes";

tituloDEstadistica="Pereira, Risaralda";
subtituloDEstadistica="Orgullosamente locales";






numeroWhatsApp = '573046637509';

abrirWhatsApp(): void {
  const mensaje = 'Hola, estoy interesado en sus productos.';
  const url = `https://wa.me/${this.numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}
}
