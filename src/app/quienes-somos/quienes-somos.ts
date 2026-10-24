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
descripcion= "Somos una tienda de muebles para el hogar que ofrece camas, colchones, bases, espaldares, nocheros, peinadores, salas, comedores y accesorios. Brindamos atención en Pereira,Dosquebradas,Armenia,Manizales , Risaralda, con productos de calidad, precios justos y opciones de pago según disponibilidad. También ofrecemos envíos nacionales para determinados productos. hacemos envios contra entrega"
;


tituloABeneficio="Calidad Garantizada";
subtituloABeneficio="productos seleccionados con los mejores materiales";

tituloBBeneficio="Envíos Rápidos y Seguros";
subtituloBBeneficio=" Llevamos tu pedido hasta La puerta de tu hogar.";

tituloCBeneficio="Atención Personalizada";
subtituloCBeneficio="Te asesoramos para que elijas lo mejor para ti.";

textoWhatsapp="Escríbenos por whatsApp";


tituloACaracteristica="Experiencia";
subtituloACaracteristica="Más de 5 años Ayudando a Nuestros Clientes a Descansar Mejor.";

tituloBCaracteristica="Compromiso";
subtituloBCaracteristica="Nos Comprometemos con tu bienestar y satisfacción total.";

tituloCCaracteristica="Variedad";
subtituloCCaracteristica=" Encuentra todo lo que necesitas para tu descanso en un solo lugar.";

tituloDCaracteristica="Precios Justos";
subtituloDCaracteristica="Calidad premium al mejor precio del mercado.";


tituloAEstadistica="+500";
subtituloAEstadistica="Clientes Satisfechos";

tituloBEstadistica="+1000";
subtituloBEstadistica="Productos Vendidos";

tituloCEstadistica="4.9/5";
subtituloCEstadistica="Calificación de Clientes";

tituloDEstadistica="Pereira, Risaralda";
subtituloDEstadistica="Orgullosamente locales";






numeroWhatsApp = '573137110232';

abrirWhatsApp(): void {
  const mensaje = 'Hola, estoy interesado en sus productos.';
  const url = `https://wa.me/${this.numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}
}
